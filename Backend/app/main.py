"""
Backend/app/main.py
FastAPI entry point for the Resume Ranking System.
"""

# ── Path setup (must be first) ───────────────────────────────────────────────
import sys
import os

# Force UTF-8 on Windows terminals
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

# Add project root to sys.path so 'database' and 'Agent' modules are found
MAIN_DIR     = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR  = os.path.dirname(MAIN_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
AGENT_DIR    = os.path.join(PROJECT_ROOT, "Agent")

for _path in (PROJECT_ROOT, AGENT_DIR):
    if _path not in sys.path:
        sys.path.insert(0, _path)

print(f"📁 Main.py   : {MAIN_DIR}")
print(f"📁 Project   : {PROJECT_ROOT}")
print(f"📁 Agent dir : {AGENT_DIR} (exists={os.path.exists(AGENT_DIR)})")

# ── Env & stdlib ─────────────────────────────────────────────────────────────
import io
import json
import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from dotenv import load_dotenv
load_dotenv()

# ── FastAPI & middleware ──────────────────────────────────────────────────────
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Gmail token bootstrap ─────────────────────────────────────────────────────
_gmail_token = os.getenv("GMAIL_TOKEN")
if _gmail_token:
    _token_path = os.path.join(AGENT_DIR, "my_agent", "token.json")
    os.makedirs(os.path.dirname(_token_path), exist_ok=True)
    with open(_token_path, "w") as _f:
        json.dump(json.loads(_gmail_token), _f)
    log.info("✅ Gmail token.json written from GMAIL_TOKEN env var")
else:
    log.info("ℹ️  No GMAIL_TOKEN env var — using local token.json")

# ── MCP initialisation ───────────────────────────────────────────────────────
mcp_app = None
try:
    from my_agent.mcp_server import app as mcp_app, init_db as mcp_init_db
    mcp_init_db()
    log.info("✅ MCP app imported & SQLite DB initialised")
except Exception as _e:
    log.warning(f"⚠️  MCP Server could not be initialised: {_e}")

# ── SSE transport ─────────────────────────────────────────────────────────────
try:
    from mcp.server.sse import SseServerTransport
    sse_transport = SseServerTransport("/api/mcp/messages/")
    _sse_available = True
except Exception as _e:
    log.warning(f"⚠️  SSE transport unavailable: {_e}")
    _sse_available = False

# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("🚀 RecruitAI backend starting up …")
    yield
    log.info("🛑 RecruitAI backend shutting down …")

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
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Validation error handler (fixes CORS on 422 + binary data crashes) ───────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(loc) for loc in error.get("loc", [])),
            "message": error.get("msg", "Validation error"),
            "type": error.get("type", ""),
        })
    log.warning(f"Validation error on {request.url.path}: {errors}")
    return JSONResponse(
        status_code=422,
        content={"detail": "Request validation failed", "errors": errors},
    )

# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error(f"Unhandled exception on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )

# ── Routers ───────────────────────────────────────────────────────────────────
from .routes.auth  import router as auth_router
from .routes.match import router as match_router

app.include_router(auth_router,  prefix="/api")
app.include_router(match_router, prefix="/api")

# ── MCP SSE endpoints ─────────────────────────────────────────────────────────
if _sse_available:
    @app.get("/api/mcp/sse", tags=["MCP"])
    async def handle_sse(request: Request):
        if mcp_app is None:
            raise HTTPException(status_code=503, detail="MCP Server not initialised.")
        log.info("🔌 New MCP SSE connection")
        async with sse_transport.connect_sse(
            request.scope, request.receive, request._send
        ) as (read_stream, write_stream):
            await mcp_app.run(
                read_stream, write_stream,
                mcp_app.create_initialization_options()
            )
    app.mount("/api/mcp/messages", sse_transport.handle_post_message)

# ── Text extraction helpers ───────────────────────────────────────────────────
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        import fitz
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        return "\n".join(page.get_text() for page in doc).strip()
    except Exception as e:
        log.error(f"PDF extraction failed: {e}")
        return ""

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs).strip()
    except Exception as e:
        log.error(f"DOCX extraction failed: {e}")
        return ""

def extract_text(filename: str, file_bytes: bytes) -> str:
    """Safely extract text from PDF, DOCX, or TXT — never crashes on binary data."""
    if not file_bytes:
        return ""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    if ext in ("docx", "doc"):
        return extract_text_from_docx(file_bytes)
    if ext == "txt":
        return file_bytes.decode("utf-8", errors="ignore")
    return ""

# ── Pydantic models ───────────────────────────────────────────────────────────
class GmailFetchRequest(BaseModel):
    subject: Optional[str] = None

class JobIn(BaseModel):
    title: str
    company: Optional[str] = None
    description: str
    requirements: str

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def read_root():
    return {"message": "RecruitAI API is running ✅", "docs": "/docs"}

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "mcp_ready": mcp_app is not None,
        "sse_ready": _sse_available,
    }

# ── Resumes ───────────────────────────────────────────────────────────────────
@app.get("/api/resumes", tags=["Resumes"])
def list_resumes():
    try:
        from my_agent.mcp_server import handle_tool
        return handle_tool("get_all_resumes", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resumes/{resume_id}", tags=["Resumes"])
def get_resume(resume_id: int):
    try:
        from my_agent.mcp_server import handle_tool
        result = handle_tool("get_resume", {"resume_id": resume_id})
        if not result:
            raise HTTPException(status_code=404, detail="Resume not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Jobs ──────────────────────────────────────────────────────────────────────
@app.get("/api/jobs", tags=["Jobs"])
def list_jobs():
    try:
        from my_agent.mcp_server import handle_tool
        return handle_tool("get_all_jobs", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/jobs", tags=["Jobs"])
def create_job(job: JobIn):
    try:
        from my_agent.mcp_server import handle_tool
        return handle_tool("save_job", job.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Rankings ──────────────────────────────────────────────────────────────────
@app.get("/api/rankings/{job_id}", tags=["Rankings"])
def get_rankings(job_id: int, limit: int = 20):
    try:
        from my_agent.mcp_server import handle_tool
        return handle_tool("get_rankings_for_job", {"job_id": job_id, "limit": limit})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/matches/{job_id}", tags=["Rankings"])
def get_matches(job_id: int, status: Optional[str] = None):
    try:
        from my_agent.mcp_server import handle_tool
        args = {"job_id": job_id}
        if status:
            args["status"] = status
        return handle_tool("get_matches_for_job", args)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Gmail ─────────────────────────────────────────────────────────────────────
@app.post("/api/gmail/fetch", tags=["Gmail"])
def fetch_gmail_resumes(request: GmailFetchRequest):
    """Fetch resumes from Gmail filtered by subject."""
    try:
        from my_agent.tools.gmail_tool import fetch_resumes_from_gmail

        if not request.subject or not request.subject.strip():
            raise HTTPException(
                status_code=400,
                detail="Please provide an email subject to filter by."
            )

        subject = request.subject.strip()
        resumes = fetch_resumes_from_gmail(subject=subject)
        log.info(f"📧 Fetched {len(resumes)} resumes for subject: '{subject}'")

        if not resumes:
            return {
                "success": False,
                "count": 0,
                "candidates": [],
                "message": f"No resumes found for subject: '{subject}'"
            }

        candidates = [
            {
                "candidate_name": r.get("filename", "Unknown")
                    .rsplit(".", 1)[0].replace("_", " ").replace("-", " ").strip(),
                "email": "",
                "resume_text": r.get("resume_text", ""),
                "source": "gmail",
                "years_experience": 0,
                "education": {"degree": "Not specified", "university": "Not specified"},
                "skills": [], "tools": [], "projects": [], "soft_skills": [],
            }
            for r in resumes
        ]
        return {
            "success": True,
            "count": len(candidates),
            "subject": subject,
            "candidates": candidates,
        }

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Gmail fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Match / ranking pipeline ──────────────────────────────────────────────────
@app.post("/api/match", tags=["Match"])
async def match_candidates(
    job_title: str = Form(...),
    job_description: Optional[UploadFile] = File(None),
    resumes: List[UploadFile] = File(default=[]),
    gmail_candidates: Optional[str] = Form(None),
):
    """Match candidates against a job description."""
    try:
        from .services.agent_bridge import run_matching_pipeline

        # 1. Extract JD text safely
        jd_text = ""
        if job_description and job_description.filename:
            try:
                jd_bytes = await job_description.read()
                jd_text = extract_text(job_description.filename, jd_bytes)
                log.info(f"📄 JD extracted ({len(jd_text)} chars): {job_description.filename}")
            except Exception as e:
                log.warning(f"Could not extract JD text: {e}")

        # 2. Extract uploaded resumes safely
        uploaded = []
        for f in resumes:
            if not f.filename:
                continue
            try:
                raw = await f.read()
                text = extract_text(f.filename, raw)
                uploaded.append({
                    "candidate_name": f.filename.rsplit(".", 1)[0]
                        .replace("_", " ").replace("-", " ").strip(),
                    "email": "",
                    "resume_text": text,
                    "source": "upload",
                    "years_experience": 0,
                    "education": {"degree": "Not specified", "university": "Not specified"},
                    "skills": [], "tools": [], "projects": [], "soft_skills": [],
                })
                log.info(f"📝 Resume extracted ({len(text)} chars): {f.filename}")
            except Exception as e:
                log.warning(f"Skipping {f.filename}: {e}")
                continue

        # 3. Parse Gmail candidates safely
        gmail_list = []
        if gmail_candidates:
            try:
                gmail_list = json.loads(gmail_candidates)
                log.info(f"📧 Gmail candidates: {len(gmail_list)}")
            except json.JSONDecodeError as e:
                log.warning(f"Could not parse gmail_candidates JSON: {e}")

        # 4. Combine & validate
        all_candidates = uploaded + gmail_list
        log.info(f"🚀 Total candidates: {len(all_candidates)}")

        if not all_candidates:
            raise HTTPException(status_code=400, detail="No candidates provided.")

        # 5. Run pipeline
        return run_matching_pipeline(
            job_title=job_title,
            candidates=all_candidates,
            job_description_text=jd_text,
        )

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Match pipeline error: {e}")
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ── Dev runner ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)