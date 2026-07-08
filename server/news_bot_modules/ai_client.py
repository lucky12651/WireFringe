import logging
import httpx
from ..config import settings

logger = logging.getLogger(__name__)

class GroqClient:
    def __init__(self):
        self.api_key = settings.groq_api_key
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = settings.groq_model

    async def generate_content(self, prompt: str, system_prompt: str = "You are a helpful assistant.") -> str:
        if not self.api_key:
            logger.warning("GROQ_API_KEY is not set. Skipping AI generation.")
            return ""

        logger.info(f"GROQ REQUEST: model={self.model}, prompt_len={len(prompt)}, system_prompt_len={len(system_prompt)}, api_key_prefix={self.api_key[:10] if self.api_key else 'None'}")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = { 
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 4096
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.base_url, headers=headers, json=payload)
                if response.status_code == 429:
                    logger.warning("Groq API Rate Limit (429) hit.")
                    return "ERROR_429"
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Error calling Groq API: {e}")
            return ""

groq_client = GroqClient()
