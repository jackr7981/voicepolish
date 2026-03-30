import httpx
import os
import json
import logging
from typing import AsyncGenerator
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "anthropic/claude-3.5-haiku")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Validate at import time so the app fails fast
if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == "your-openrouter-api-key-here":
    logger.warning("OPENROUTER_API_KEY is not set — LLM calls will fail")

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://voicepolish.app",
    "X-Title": "VoicePolish"
}

# Reuse a single httpx client for connection pooling
_client: httpx.AsyncClient | None = None


async def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=60.0)
    return _client


async def close_client():
    global _client
    if _client and not _client.is_closed:
        await _client.close()
        _client = None


async def call_llm(prompt: str) -> str:
    client = await _get_client()
    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4096,
        "temperature": 0.3,
    }
    response = await client.post(OPENROUTER_URL, json=payload, headers=HEADERS)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()


async def call_llm_stream(prompt: str) -> AsyncGenerator[str, None]:
    """Stream LLM response token-by-token via SSE."""
    client = await _get_client()
    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4096,
        "temperature": 0.3,
        "stream": True,
    }
    async with client.stream("POST", OPENROUTER_URL, json=payload, headers=HEADERS) as response:
        response.raise_for_status()
        async for line in response.aiter_lines():
            if not line.startswith("data: "):
                continue
            data_str = line[6:]
            if data_str.strip() == "[DONE]":
                break
            try:
                chunk = json.loads(data_str)
                delta = chunk.get("choices", [{}])[0].get("delta", {})
                content = delta.get("content", "")
                if content:
                    yield content
            except json.JSONDecodeError:
                continue
