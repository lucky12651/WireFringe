import asyncio
import json
from unittest.mock import AsyncMock

import httpx
import pytest

from server.bots.pipeline import ai_client, article_generator


def completed(text):
    return {
        "status": "completed",
        "output": [
            {"type": "reasoning", "encrypted_content": "ignored"},
            {
                "type": "message",
                "role": "assistant",
                "content": [{"type": "output_text", "text": text}],
            },
        ],
    }


@pytest.fixture
def xai(monkeypatch):
    monkeypatch.setattr(ai_client.settings, "xai_api_key", "test-xai-key")
    monkeypatch.setattr(ai_client.settings, "xai_model", "test-grok-model")
    requests = []
    responses = []
    original_client = httpx.AsyncClient

    def handle(request):
        requests.append(request)
        assert str(request.url) == "https://api.x.ai/v1/responses"
        return responses.pop(0)

    transport = httpx.MockTransport(handle)
    monkeypatch.setattr(
        ai_client.httpx,
        "AsyncClient",
        lambda **kwargs: original_client(transport=transport, **kwargs),
    )
    sleep = AsyncMock()
    monkeypatch.setattr(ai_client.asyncio, "sleep", sleep)
    return ai_client.XAIClient(), requests, responses, sleep


def test_xai_request_and_response(xai):
    client, requests, responses, _ = xai
    responses.append(httpx.Response(200, json=completed('{"title":"A new story"}')))
    result = asyncio.run(client.generate_content("Source text", "Return article JSON"))
    assert json.loads(result)["title"] == "A new story"
    request = requests[0]
    assert request.headers["Authorization"] == "Bearer test-xai-key"
    body = json.loads(request.content)
    assert body["model"] == "test-grok-model"
    assert body["input"] == [
        {"role": "system", "content": "Return article JSON"},
        {"role": "user", "content": "Source text"},
    ]
    assert body["store"] is False
    assert body["max_output_tokens"] == 8192


def test_xai_retries_rate_limit(xai):
    client, requests, responses, sleep = xai
    responses.extend([
        httpx.Response(429),
        httpx.Response(200, json=completed("Recovered")),
    ])
    assert asyncio.run(client.generate_content("Source")) == "Recovered"
    assert len(requests) == 2
    sleep.assert_awaited_once_with(12)


def test_rate_limit_exhaustion_never_calls_another_provider(xai):
    client, requests, responses, sleep = xai
    responses.extend(httpx.Response(429) for _ in range(4))
    assert asyncio.run(client.generate_content("Source")) == "ERROR_429"
    assert len(requests) == 4
    assert sleep.await_count == 3


@pytest.mark.parametrize("status", [401, 403, 500])
def test_http_errors_do_not_retry_or_switch_providers(xai, status):
    client, requests, responses, sleep = xai
    responses.append(httpx.Response(status))
    assert asyncio.run(client.generate_content("Source")) == ""
    assert len(requests) == 1
    sleep.assert_not_awaited()


@pytest.mark.parametrize("response", [
    {"status": "incomplete", "output": completed("partial JSON")["output"]},
    {"status": "completed", "output": []},
    {"status": "failed"},
])
def test_incomplete_or_missing_text_is_not_used(xai, response):
    client, _, responses, _ = xai
    responses.append(httpx.Response(200, json=response))
    assert asyncio.run(client.generate_content("Source")) == ""


def test_missing_key_makes_no_requests(xai):
    client, requests, _, _ = xai
    client.api_key = ""
    assert asyncio.run(client.generate_content("Source")) == ""
    assert not requests


def test_article_generation_uses_xai(xai, monkeypatch):
    client, _, responses, _ = xai
    responses.append(httpx.Response(200, json=completed(json.dumps({
        "title": "Generated headline",
        "content": "<!-- wp:paragraph --><p>Original xAI article.</p><!-- /wp:paragraph -->",
        "meta_description": "The generated description.",
        "keywords": ["tech", "news"],
    }))))
    monkeypatch.setattr(article_generator, "xai_client", client)
    article = asyncio.run(article_generator.generate_article(
        "Source copy", "https://example.com/story", "Tech", "Source headline"
    ))
    assert article.title == "Generated headline"
    assert "Original xAI article." in article.content
    assert article.metaDescription == "The generated description."
    assert article.keywords == "tech, news"


@pytest.mark.parametrize("response", ["", "ERROR_429", "not JSON", '{"content":""}'])
def test_failed_generation_does_not_publish_source_copy(monkeypatch, response):
    monkeypatch.setattr(
        article_generator.xai_client, "generate_content", AsyncMock(return_value=response)
    )
    article = asyncio.run(article_generator.generate_article(
        "Source copy", "https://example.com/story", "Tech", "Source headline"
    ))
    assert article is None
