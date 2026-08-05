"""
my_agent/services/groq_client.py
─────────────────────────────────
Shared Groq LLM client. All settings come from my_agent/config/settings.py.
"""

from my_agent.config.settings import (
    GROQ_API_KEY,
    GROQ_BASE_URL,
    GROQ_MAX_RETRIES,
    GROQ_TIMEOUT,
)
from openai import OpenAI

if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY not found. Set it in Agent/.env or as an environment variable."
    )

client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url=GROQ_BASE_URL,
    timeout=GROQ_TIMEOUT,
    max_retries=GROQ_MAX_RETRIES,
)
