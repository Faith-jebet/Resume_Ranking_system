"""
Backend/app/main.py
────────────────────
FastAPI entry point for the Resume Ranking System.
This file is responsible for app setup only — no route logic lives here.
All endpoints are registered via routers in app/routes/.
"""

# ── Path setup (must be first) ────────────────────────────────────────────────
import sys
import os
import httpx

from pathlib import Path
from dotenv import load_dotenv

# 1. Get the directory where main.py actually lives
current_dir = Path(__file__).resolve().parent

# 2. Point specifically to the .env file in that same directory
env_path = current_dir / '.env'

# 3. Load it explicitly
load_dotenv(dotenv_path=env_path)

print("--- DEBUGGING GOOGLE CONFIG ---")
print("Target Env Path:", env_path)
print("File Exists?:", env_path.exists())
print("Loaded Client ID:", os.getenv("GOOGLE_CLIENT_ID"))
print("-------------------------------")

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

MAIN_DIR     = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR  = os.path.dirname(MAIN_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
AGENT_DIR    = os.path.join(PROJECT_ROOT, "Agent")

# Debug path information for deployment
print("======================================================================")
print(f"Current working directory: {os.getcwd()}")
print(f"PROJECT_ROOT: {PROJECT_ROOT}")
print(f"AGENT_PATH: {AGENT_DIR}")
print(f"Agent exists: {os.path.exists(AGENT_DIR)}")
if os.path.exists(AGENT_DIR):
    try:
        print(f"Agent contents: {os.listdir(AGENT_DIR)}")
    except PermissionError:
        print("Agent contents: Permission denied")
print("sys.path:")
for path in sys.path[:5]:  # Only show first 5 paths to avoid spam
    print(f"  {path}")

for _path in (PROJECT_ROOT, AGENT_DIR):
    if _path not in sys.path:
        sys.path.insert(0, _path)
        print(f"Added to sys.path: {_path}")

# Test agent import
try:
    import my_agent
    print("SUCCESS: my_agent imported successfully")
except ImportError as e:
    print(f"FAILED: {e}")
except Exception as e:
    print(f"UNEXPECTED ERROR: {e}")

print("======================================================================")

AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL")  # e.g. https://your-agent.onrender.com

async def call_agent(payload: dict) -> dict:
    if not AGENT_SERVICE_URL:
        raise ValueError("AGENT_SERVICE_URL not configured")
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{AGENT_SERVICE_URL}/your-endpoint", json=payload, timeout=60)
        resp.raise_for_status()
        return resp.json()

# ── Env ───────────────────────────────────────────────────────────────────────
import json
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, "Agent", ".env"))

# ── FastAPI ───────────────────────────────────────────────────────────────────
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

log.info(f"Project root : {PROJECT_ROOT}")
log.info(f"Agent dir    : {AGENT_DIR} (exists={os.path.exists(AGENT_DIR)})")

# ── Gmail token bootstrap (Cloud Run / Render env var) ────────────────────────
_gmail_token = os.getenv("GMAIL_TOKEN")
if _gmail_token:
    _token_path = os.path.join(AGENT_DIR, "my_agent", "token.json")
    os.makedirs(os.path.dirname(_token_path), exist_ok=True)
    with open(_token_path, "w") as _f:
        json.dump(json.loads(_gmail_token), _f)
    log.info("Gmail token.json written from GMAIL_TOKEN env var")
else:
    log.info("No GMAIL_TOKEN env var — using local token.json")

# ── MCP initialisation ────────────────────────────────────────────────────────
mcp_app = None
sse_transport = None
_sse_available = False

try:
    from my_agent.mcp_server import app as mcp_app, init_db as mcp_init_db
    mcp_init_db()
    log.info("MCP app imported & SQLite DB initialised")
except ImportError as _e:
    log.warning(f"Agent module not available: {_e}")
    log.warning("MCP features will be disabled")
except Exception as _e:
    log.error(f"MCP initialisation failed: {_e}")
    log.warning("MCP features will be disabled")

# ── SSE transport setup ────────────────────────────────────────────────────────
try:
    from mcp.server.sse import SseServerTransport
    if mcp_app is not None:
        sse_transport = SseServerTransport("/api/mcp/messages/")
        _sse_available = True
        log.info("SSE transport initialised")
    else:
        log.info("SSE transport skipped (MCP not available)")
except ImportError as _e:
    log.warning(f"SSE transport not available: {_e}")
except Exception as _e:
    log.error(f"SSE transport failed: {_e}")

# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("RecruitAI backend starting up …")
    yield
    log.info("RecruitAI backend shutting down …")


# ── App instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="RecruitAI API",
    description="Resume Ranking System — FastAPI + SQLite + MCP",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "https://resume-ranking-system-vh6i-git-main-faith-jebets-projects.vercel.app",
        "https://resume-ranking-systemz.onrender.com",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$|https://.*\.vercel\.app$|https://.*\.netlify\.app$|https://.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Error handlers ────────────────────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        {
            "field": " -> ".join(str(loc) for loc in e.get("loc", [])),
            "message": e.get("msg", "Validation error"),
            "type": e.get("type", ""),
        }
        for e in exc.errors()
    ]
    log.warning(f"Validation error on {request.url.path}: {errors}")
    return JSONResponse(status_code=422, content={"detail": "Request validation failed", "errors": errors})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error(f"Unhandled exception on {request.url}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "error": str(exc)})


# ── Routers ───────────────────────────────────────────────────────────────────
from .routes.health    import router as health_router
from .routes.auth      import router as auth_router
from .routes.documents import router as documents_router
from .routes.resumes   import router as resumes_router
from .routes.jobs      import router as jobs_router
from .routes.rankings  import router as rankings_router
from .routes.gmail     import router as gmail_router
from .routes.match     import router as match_router

app.include_router(health_router)
app.include_router(auth_router,      prefix="/api")
app.include_router(documents_router)   # prefix="/api" is set inside the router
app.include_router(resumes_router)
app.include_router(jobs_router)
app.include_router(rankings_router)
app.include_router(gmail_router)
app.include_router(match_router)

# ── MCP SSE endpoints ─────────────────────────────────────────────────────────
if _sse_available and sse_transport is not None:
    @app.get("/api/mcp/sse", tags=["MCP"])
    async def handle_sse(request: Request):
        if mcp_app is None:
            raise HTTPException(status_code=503, detail="MCP Server not initialised.")
        log.info("New MCP SSE connection")
        async with sse_transport.connect_sse(
            request.scope, request.receive, request._send
        ) as (read_stream, write_stream):
            await mcp_app.run(read_stream, write_stream, mcp_app.create_initialization_options())

    app.mount("/api/mcp/messages", sse_transport.handle_post_message)

# ── Dev runner ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

# ── Expose app for deployment ─────────────────────────────────────────────────
# This ensures the app is available as a module-level variable for deployment
__all__ = ["app"]
