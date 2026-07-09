"""
app/routes/jobs.py
──────────────────
Endpoints for job descriptions (MCP layer) and recruiter job management
(SQLite layer via database.sqlite_db).
"""

import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api", tags=["Jobs"])


class JobIn(BaseModel):
    title: str
    company: Optional[str] = None
    description: str
    requirements: str


# ── MCP-backed endpoints ──────────────────────────────────────────────────────

@router.get("/jobs")
def list_jobs():
    try:
        from my_agent.mcp_server import handle_tool
        return handle_tool("get_all_jobs", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs")
def create_job(job: JobIn):
    try:
        from my_agent.mcp_server import handle_tool
        return handle_tool("save_job", job.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Recruiter-facing endpoints (sqlite_db layer) ──────────────────────────────

@router.get("/recruiter/jobs")
def get_recruiter_jobs():
    try:
        from database.sqlite_db import get_all_jobs
        return get_all_jobs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recruiter/rankings/{job_id}")
def get_recruiter_rankings(job_id: int):
    try:
        from database.sqlite_db import _connect
        conn = _connect()
        try:
            row = conn.execute(
                "SELECT * FROM rankings WHERE job_id = ? ORDER BY id DESC LIMIT 1",
                (job_id,),
            ).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Rankings not found for this job")
            res = dict(row)
            res["ranked_candidates"] = json.loads(res["ranked_candidates"])
            return res
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/recruiter/jobs/{job_id}")
def delete_recruiter_job(job_id: int):
    try:
        from database.sqlite_db import _connect
        conn = _connect()
        try:
            conn.execute("PRAGMA foreign_keys = ON")
            cursor = conn.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
            conn.commit()
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Job not found")
            return {"status": "success", "message": f"Job {job_id} deleted successfully"}
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
