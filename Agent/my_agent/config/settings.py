"""
my_agent/config/settings.py
────────────────────────────
Central settings module for the Agent.  All other modules should import
constants from here rather than reading os.getenv() in multiple places.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the Agent directory
_AGENT_DIR = Path(__file__).resolve().parents[2]
_env_file = _AGENT_DIR / ".env"
if _env_file.exists():
    load_dotenv(dotenv_path=_env_file, override=True)

# ── Database ──────────────────────────────────────────────────────────────────
# Path to the shared SQLite DB used by both the Backend and the Agent.
DB_PATH: str = os.getenv(
    "DB_PATH",
    str(_AGENT_DIR.parents[0] / "Backend" / "resumes.db"),
)

# ── Groq LLM ─────────────────────────────────────────────────────────────────
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
GROQ_TIMEOUT: float = 60.0
GROQ_MAX_RETRIES: int = 2

# ── Gmail ─────────────────────────────────────────────────────────────────────
GMAIL_CREDENTIALS_PATH: str = str(_AGENT_DIR / "my_agent" / "config" / "credentials.json")
GMAIL_TOKEN_PATH: str = str(_AGENT_DIR / "my_agent" / "tools" / "token.pickle")

# ── Pipeline ──────────────────────────────────────────────────────────────────
# Seconds to sleep between Groq calls to respect rate limits.
PIPELINE_SLEEP_SECONDS: float = float(os.getenv("PIPELINE_SLEEP_SECONDS", "0.5"))
