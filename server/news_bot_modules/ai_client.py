import asyncio
import logging

import httpx

from ..config import settings

logger = logging.getLogger(__name__)


async def _chat_completions(
    *,
    url: str,
    api_key: str,
    model: str,
    prompt: str,
    system_prompt: str,
    label: str,
) -> str:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 4096,
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 429:
                retry_after = response.headers.get("retry-after")
                logger.warning("%s rate limit (429). retry-after=%s", label, retry_after)
                return "ERROR_429"
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error("Error calling %s: %s", label, e)
        return ""


class GroqClient:
    def __init__(self):
        self.api_key = settings.groq_api_key
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = settings.groq_model

    async def generate_content(self, prompt: str, system_prompt: str = "You are a helpful assistant.") -> str:
        if self.api_key:
            delays = (0, 12, 25, 45)
            for attempt, delay in enumerate(delays, start=1):
                if delay:
                    logger.info("Waiting %ss before Groq retry %s/%s", delay, attempt, len(delays))
                    await asyncio.sleep(delay)
                result = await _chat_completions(
                    url=self.base_url,
                    api_key=self.api_key,
                    model=self.model,
                    prompt=prompt,
                    system_prompt=system_prompt,
                    label="Groq",
                )
                if result == "ERROR_429":
                    continue
                if result:
                    return result
        else:
            logger.warning("GROQ_API_KEY is not set.")

        ollama_key = settings.ollama_api_key
        ollama_url = (settings.ollama_api_url or "").rstrip("/")
        if ollama_key and ollama_url:
            if not ollama_url.endswith("/chat/completions"):
                ollama_url = f"{ollama_url}/chat/completions"
            logger.info("Groq unavailable; trying Ollama fallback.")
            result = await _chat_completions(
                url=ollama_url,
                api_key=ollama_key,
                model="gpt-oss:20b",
                prompt=prompt,
                system_prompt=system_prompt,
                label="Ollama",
            )
            if result and result != "ERROR_429":
                return result

        return "ERROR_429" if self.api_key else ""


groq_client = GroqClient()
