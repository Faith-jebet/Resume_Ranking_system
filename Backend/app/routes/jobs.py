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
# ── Categories & Specializations endpoints ─────────────────────────────────

class CategoryIn(BaseModel):
    title: str
    description: str
    open_roles: int = 0
    icon: str = "Briefcase"
    style: str = "light"

class SpecializationIn(BaseModel):
    title: str
    description: str
    positions: int = 0
    icon: str = "Briefcase"
    style: str = "light"

@router.get("/categories")
def get_categories():
    try:
        from database.sqlite_db import get_all_categories
        categories = get_all_categories()
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories")
def create_category(category: CategoryIn):
    try:
        from database.sqlite_db import insert_category
        result = insert_category(category.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/categories/{category_id}")
def update_category(category_id: str, category: CategoryIn):
    try:
        from database.sqlite_db import update_category
        if not update_category(category_id, category.model_dump()):
            raise HTTPException(status_code=404, detail="Category not found")
        return {"status": "success", "message": f"Category {category_id} updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/categories/{category_id}")
def delete_category_api(category_id: str):
    try:
        from database.sqlite_db import delete_category
        if not delete_category(category_id):
            raise HTTPException(status_code=404, detail="Category not found")
        return {"status": "success", "message": f"Category {category_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/specializations")
def get_specializations():
    try:
        from database.sqlite_db import get_all_specializations
        specializations = get_all_specializations()
        return specializations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/specializations")
def create_specialization(specialization: SpecializationIn):
    try:
        from database.sqlite_db import insert_specialization
        result = insert_specialization(specialization.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/specializations/{specialization_id}")
def update_specialization(specialization_id: str, specialization: SpecializationIn):
    try:
        from database.sqlite_db import update_specialization
        if not update_specialization(specialization_id, specialization.model_dump()):
            raise HTTPException(status_code=404, detail="Specialization not found")
        return {"status": "success", "message": f"Specialization {specialization_id} updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/specializations/{specialization_id}")
def delete_specialization_api(specialization_id: str):
    try:
        from database.sqlite_db import delete_specialization
        if not delete_specialization(specialization_id):
            raise HTTPException(status_code=404, detail="Specialization not found")
        return {"status": "success", "message": f"Specialization {specialization_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
