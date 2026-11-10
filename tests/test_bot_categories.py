import asyncio
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

from server.bots import news
from server.bots.pipeline import article_generator, image_ops
from server.bots.pipeline.categories import category_is_selected, compatible_section, resolve_category
from server.models import NewsQueue, Post
from server.schemas import PostUpsert


CATALOG = {
    "categories": [
        {"name": name, "enabled": True}
        for name in ["Tech", "AI & Future Tech", "Business & Markets", "Sports", "World"]
    ],
    "sections": [
        {"id": "nav-sports", "enabled": True, "categories": ["Sports"]},
        {"id": "nav-ai", "enabled": True, "categories": ["AI & Future Tech"]},
        {"id": "all-stories", "enabled": True, "categories": []},
        {"id": "disabled-ai", "enabled": False, "categories": ["AI & Future Tech"]},
    ],
}


def test_category_must_be_a_canonical_site_category():
    names = [c["name"] for c in CATALOG["categories"]]
    assert resolve_category(" ai & future tech ", names) == "AI & Future Tech"
    assert resolve_category("Artificial intelligence", names) is None
    assert resolve_category(None, names) is None


def test_selected_sections_do_not_force_unrelated_content_into_tech():
    assert category_is_selected("AI & Future Tech", ["Tech", "AI & Future Tech"])
    assert category_is_selected("Gadgets", ["Tech"])
    assert not category_is_selected("Sports", ["Tech", "AI & Future Tech"])


@pytest.mark.parametrize("section, expected", [
    ("nav-sports", None), ("nav-ai", "nav-ai"), ("all-stories", "all-stories"),
    ("disabled-ai", None), ("deleted-section", None), (None, None),
])
def test_section_placement_must_match_category(section, expected):
    assert compatible_section(section, "AI & Future Tech", CATALOG) == expected


def test_article_classification_replaces_wrong_queue_category(monkeypatch):
    generate = AsyncMock(return_value=json.dumps({
        "title": "DeepMind verifies the Signal protocol with AI",
        "content": "<p>AI-assisted formal verification protects secure messaging.</p>",
        "category": "AI & Future Tech",
    }))
    monkeypatch.setattr(article_generator.xai_client, "generate_content", generate)
    article = asyncio.run(article_generator.generate_article(
        "Google DeepMind used AI to formally verify the Signal protocol.",
        "https://example.com/deepmind", "Sports", "AI verification",
        allowed_categories=[c["name"] for c in CATALOG["categories"]],
    ))
    assert article.bucket == "AI & Future Tech"
    prompt = generate.call_args.args[1]
    assert "primary subject" in prompt
    assert "unverified hint" in prompt
    assert "'category'" in prompt


@pytest.mark.parametrize("category", [None, "Not a site category", "Sports"])
def test_generated_category_must_be_enabled(monkeypatch, category):
    generate = AsyncMock(return_value=json.dumps({
        "title": "Story", "content": "<p>Content</p>", "category": category,
    }))
    monkeypatch.setattr(article_generator.xai_client, "generate_content", generate)
    article = asyncio.run(article_generator.generate_article(
        "Source", "https://example.com/story", "Tech", "Story",
        allowed_categories=["Tech", "AI & Future Tech"],
    ))
    assert article is None


@pytest.mark.parametrize("classified, requested_section, accepted_section", [
    ("AI & Future Tech", "nav-sports", None),
    ("AI & Future Tech", "nav-ai", "nav-ai"),
    ("Sports", "nav-sports", None),
])
def test_publisher_uses_classification_and_validates_placement(
    monkeypatch, classified, requested_section, accepted_section
):
    db = Mock()
    db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
    db.query.return_value.filter.return_value.first.return_value = None
    cfg = {"sections": ["Tech", "AI & Future Tech"], "autoPublish": True}
    monkeypatch.setattr(news, "SettingsService", lambda _: SimpleNamespace(get_bot=lambda _: cfg))
    monkeypatch.setattr(news, "CatalogService", lambda _: SimpleNamespace(get=lambda **_: CATALOG))
    monkeypatch.setattr(news, "ping_session", lambda _: None)
    monkeypatch.setattr(news, "is_duplicate", lambda *_, **__: False)
    monkeypatch.setattr(news, "add_to_recent_cache", Mock())
    monkeypatch.setattr(news, "bot_byline", lambda _: "WireFringe")
    monkeypatch.setattr(news, "scrape_article", AsyncMock(return_value=(
        "A detailed story about AI research.", None, "DeepMind research", "https://example.com/research", [],
    )))
    generate = AsyncMock(return_value=PostUpsert(
        title="DeepMind research", content="<p>AI research.</p>", bucket=classified,
    ))
    monkeypatch.setattr(news, "generate_article", generate)
    monkeypatch.setattr(image_ops, "resolve_story_image", AsyncMock(return_value="/static/uploads/review.jpg"))
    item = NewsQueue(id=10, link="https://example.com/research", title="DeepMind research",
                     category="Sports", dest_section=requested_section, user_id=7)

    async def process():
        bot = news.NewsBot()
        bot._mark_queue = Mock()
        bot.trigger_revalidation = AsyncMock()
        try:
            result = await bot.process_item(db, item, SimpleNamespace(id=7))
            if classified == "Sports":
                assert not result
                db.add.assert_not_called()
                bot._mark_queue.assert_called_once_with(db, item.link, "skipped_category", user_id=7)
                return
            assert result
            post = db.add.call_args.args[0]
            assert isinstance(post, Post)
            assert post.bucket == "AI & Future Tech"
            assert post.status == "published"
            assert post.featured_in == (json.dumps([accepted_section]) if accepted_section else None)
            assert item.category == "AI & Future Tech"
            assert item.dest_section == accepted_section
            assert "Sports" in generate.call_args.kwargs["allowed_categories"]
        finally:
            await bot.http_client.aclose()

    asyncio.run(process())
