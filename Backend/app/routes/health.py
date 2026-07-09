"""
app/routes/health.py
────────────────────
Health-check endpoints.
"""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/")
def read_root():
    return {"message": "RecruitAI API is running ✅", "docs": "/docs"}


@router.get("/api/health")
def health_check():
    # Import lazily so startup errors don't block the health endpoint.
    mcp_ready = False
    sse_ready = False
    try:
        from my_agent.mcp_server import app as _mcp_app
        mcp_ready = _mcp_app is not None
    except Exception:
        pass
    try:
        from mcp.server.sse import SseServerTransport  # noqa: F401
        sse_ready = True
    except Exception:
        pass
    return {"status": "ok", "mcp_ready": mcp_ready, "sse_ready": sse_ready}
