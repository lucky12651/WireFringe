import asyncio
import logging

import httpx

from ...core.config import settings

logger = logging.getLogger(__name__)


class XAIClient:
    def __init__(self):
        self.api_key = settings.xai_api_key
        self.base_url = "https://api.x.ai/v1/responses"
        self.model = settings.xai_model

    async def _generate(self, prompt: str, system_prompt: str) -> str:
        payload = {
            "model": self.model,
            "input": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,
            "max_output_tokens": 8192,
            "store": False,
        }
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json=payload,
                )
                if response.status_code == 429:
                    logger.warning("xAI rate limit (429). retry-after=%s", response.headers.get("retry-after"))
                    return "ERROR_429"
                response.raise_for_status()
                data = response.json()
                if data.get("status") != "completed":
                    logger.warning("xAI response was not completed (status=%s).", data.get("status"))
                    return ""
                return "".join(
                    part.get("text", "")
                    for item in data.get("output", [])
                    if item.get("type") == "message" and item.get("role") == "assistant"
                    for part in item.get("content", [])
                    if part.get("type") == "output_text"
                ).strip()
        except Exception as exc:
            logger.error("Error calling xAI: %s", exc)
            return ""

    async def generate_content(self, prompt: str, system_prompt: str = "You are a helpful assistant.") -> str:
        rate_limited = False
        if self.api_key:
            delays = (0, 12, 25, 45)
            for attempt, delay in enumerate(delays, start=1):
                if delay:
                    logger.info("Waiting %ss before xAI retry %s/%s", delay, attempt, len(delays))
                    await asyncio.sleep(delay)
                result = await self._generate(prompt, system_prompt)
                if result == "ERROR_429":
                    rate_limited = True
                    continue
                if result:
                    return result
                rate_limited = False
                break
        else:
            logger.warning("XAI_API_KEY is not set.")

        return "ERROR_429" if rate_limited else ""


xai_client = XAIClient()
