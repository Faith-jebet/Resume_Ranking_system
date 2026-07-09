"""
app/routes/match.py
────────────────────
POST /api/match — runs the full AI ranking pipeline against uploaded resumes.
"""

import json
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.utils.text_extraction import extract_text, extract_name_from_resume

router = APIRouter(prefix="/api", tags=["Match"])
log = logging.getLogger(__name__)

MAX_UPLOAD_SIZE_MB = 20
MAX_FILE_COUNT = 50


@router.post("/match")
async def match_candidates(
    job_title: str = Form(...),
    job_description: Optional[UploadFile] = File(None),
    resumes: List[UploadFile] = File(default=[]),
    gmail_candidates: Optional[str] = Form(None),
    category_id: Optional[str] = Form(None),
    category_title: Optional[str] = Form(None),
):
    """Match candidates against a job description and persist the results."""
    if len(resumes) > MAX_FILE_COUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Maximum is {MAX_FILE_COUNT}.",
        )

    MAX_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

    # ── Extract JD text ───────────────────────────────────────────────────────
    jd_text = ""
    if job_description and job_description.filename:
        try:
            jd_bytes = await job_description.read()
            if len(jd_bytes) > MAX_BYTES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Job description too large. Maximum is {MAX_UPLOAD_SIZE_MB} MB.",
                )
            jd_text = extract_text(job_description.filename, jd_bytes)
            log.info(f"JD extracted ({len(jd_text)} chars): {job_description.filename}")
        except HTTPException:
            raise
        except Exception as e:
            log.warning(f"Could not extract JD text: {e}")

    # ── Extract resume texts ──────────────────────────────────────────────────
    uploaded = []
    for f in resumes:
        if not f.filename:
            continue
        try:
            raw = await f.read()
            if len(raw) > MAX_BYTES:
                log.warning(f"Skipping {f.filename}: file too large")
                continue
            text = extract_text(f.filename, raw)
            name = extract_name_from_resume(text, f.filename)
            uploaded.append({
                "candidate_name": name,
                "email": "",
                "resume_text": text,
                "source": "upload",
                "years_experience": 0,
                "education": {"degree": "Not specified", "university": "Not specified"},
                "skills": [], "tools": [], "projects": [], "soft_skills": [],
            })
            log.info(f"Resume extracted ({len(text)} chars): '{name}' from {f.filename}")
        except Exception as e:
            log.warning(f"Skipping {f.filename}: {e}")

    # ── Parse Gmail candidates ────────────────────────────────────────────────
    gmail_list = []
    if gmail_candidates:
        try:
            gmail_list = json.loads(gmail_candidates)
            log.info(f"Gmail candidates: {len(gmail_list)}")
        except json.JSONDecodeError as e:
            log.warning(f"Could not parse gmail_candidates JSON: {e}")

    all_candidates = uploaded + gmail_list
    if not all_candidates:
        raise HTTPException(status_code=400, detail="No candidates provided.")

    log.info(f"Total candidates: {len(all_candidates)}")

    # ── Run pipeline ──────────────────────────────────────────────────────────
    from app.services.agent_bridge import run_matching_pipeline

    result = run_matching_pipeline(
        job_title=job_title,
        candidates=all_candidates,
        job_description_text=jd_text,
    )

    if not result or result.get("error"):
        return result

    # ── Persist job + rankings ────────────────────────────────────────────────
    from database.sqlite_db import insert_job, save_ranking

    saved_job = insert_job({
        "title": job_title,
        "description": jd_text or "No description provided",
        "required_skills": result.get("ranking_criteria", {}).get("factors", []),
        "experience": 0,
        "category_id": category_id or "general",
        "category_title": category_title or "General",
        "created_at": datetime.utcnow().isoformat(),
    })
    job_db_id = saved_job["job_id"]

    ranked_candidates = [
        {
            "name": c.get("candidate_name") or c.get("name") or "Unknown Candidate",
            "email": c.get("email") or "",
            "score": c.get("match_score") or 0,
            "justification": c.get("justification") or "",
            "strengths": c.get("strengths") or [],
            "gaps": c.get("gaps") or [],
            "domain": c.get("domain") or "General",
            "skills": c.get("skills") or [],
            "experience_years": c.get("years_experience") or 0,
            "education": c.get("education") or {},
        }
        for c in result.get("candidates", [])
    ]
    save_ranking(job_id=job_db_id, ranked_candidates=ranked_candidates)
    result["job_id"] = job_db_id

    return result
