"""
app/routes/gmail.py
────────────────────
POST /api/gmail/fetch — pull resumes from Gmail and persist them.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from my_agent.tools.gmail_tool import fetch_resumes_from_gmail
from app.utils.text_extraction import extract_name_from_resume

router = APIRouter(prefix="/api", tags=["Gmail"])
log = logging.getLogger(__name__)


class GmailFetchRequest(BaseModel):
    subject: Optional[str] = None
    start_date: Optional[str] = None #'YYYY-MM-DD'
    end_date: Optional[str] = None #'YYYY-MM-DD'


@router.post("/gmail/fetch")
def fetch_gmail_resumes(request: GmailFetchRequest):
    """Fetch resumes from Gmail filtered by subject, store raw bytes, and return candidates."""
    try:
        from my_agent.tools.gmail_tool import fetch_resumes_from_gmail
        from database.sqlite_db import (
            create_import_session,
            store_document,
            link_candidate_document,
        )

        if not request.subject or not request.subject.strip():
            raise HTTPException(
                status_code=400,
                detail="Please provide an email subject to filter by.",
            )

        subject = request.subject.strip()

        # validate date range if both provided
        if request.start_date and request.end_date and request.start_date > request.end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date must be before or equal to end date"
            )

        resumes = fetch_resumes_from_gmail(
            subject=subject,
            start_date=request.start_date,
            end_date=request.end_date,
        )

        log.info(
            f"Fetched {len(resumes)} resumes for subject: '{subject}'"
            f"(range: {request.start_date or 'any'} -> {request.end_date or 'any'})"
            )

        if not resumes:
            return {
                "success": False,
                "count": 0,
                "candidates": [],
                "message": f"No resumes found for subject: '{subject}'",
            }

        import_id = create_import_session(
            subject_filter=subject,
            fetched_count=len(resumes),
        )
        log.info(f"Created import session #{import_id}")

        candidates = []
        for r in resumes:
            resume_text = r.get("resume_text", "")
            raw_filename = r.get("filename", "Unknown")
            name = extract_name_from_resume(resume_text, raw_filename)
            email = r.get("email", "")
            log.info(f"Candidate parsed: '{name}' <{email or 'no email'}>")

            resume_doc_id = None
            raw_bytes = r.get("raw_bytes")
            if raw_bytes:
                try:
                    resume_doc_id = store_document(
                        import_session_id=import_id,
                        doc_type="resume",
                        filename=raw_filename,
                        file_data=raw_bytes,
                        mime_type=r.get("mime_type", "application/pdf"),
                    )
                    log.info(f"Stored document #{resume_doc_id} for '{name}'")
                except Exception as store_err:
                    log.warning(f"Could not store document for '{name}': {store_err}")

            link_candidate_document(
                import_session_id=import_id,
                candidate_name=name,
                candidate_email=email,
                resume_doc_id=resume_doc_id,
            )

            candidates.append({
                "candidate_name": name,
                "email": email,
                "resume_text": resume_text,
                "source": "gmail",
                "years_experience": 0,
                "education": {"degree": "Not specified", "university": "Not specified"},
                "skills": [], "tools": [], "projects": [], "soft_skills": [],
            })

        return {
            "success": True,
            "count": len(candidates),
            "subject": subject,
            "import_id": import_id,
            "candidates": candidates,
        }

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Gmail fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
