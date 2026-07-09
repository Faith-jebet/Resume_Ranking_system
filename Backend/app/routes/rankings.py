"""
app/routes/rankings.py
──────────────────────
Endpoints for reading rankings and match results from the MCP / SQLite layer.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["Rankings"])


@router.get("/rankings/{job_id}")
def get_rankings(job_id: int, limit: int = 20):
    try:
        from my_agent.mcp_server import handle_tool
        return handle_tool("get_rankings_for_job", {"job_id": job_id, "limit": limit})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches/{job_id}")
def get_matches(job_id: int, status: Optional[str] = None):
    try:
        from my_agent.mcp_server import handle_tool
        args: dict = {"job_id": job_id}
        if status:
            args["status"] = status
        return handle_tool("get_matches_for_job", args)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
