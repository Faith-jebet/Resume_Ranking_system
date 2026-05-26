from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional


router = APIRouter()

class GmailFetchRequest(BaseModel):
    subject: Optional[str] = "Resume Analyzing"
    
@router.post("/gmail/fetch")
def fetch_gmail_resumes(request: GmailFetchRequest):
    """Fetch resumes from Gmail and persist the import for document review."""
    try: 
        from database.sqlite_db import (
            create_import_session,
            link_candidate_document,
            store_document,
        )
        from my_agent.tools.gmail_tool import fetch_resumes_from_gmail
        
        # Fetch resumes from Gmail.
        resumes = fetch_resumes_from_gmail(subject=request.subject)

        import_id = create_import_session(
            subject_filter=request.subject or "",
            fetched_count=len(resumes),
        )
        
        # Transform to the candidate shape used by the frontend and persist.
        candidates = []
        for resume in resumes:
            filename = resume.get("filename") or "resume.pdf"
            raw_bytes = resume.get("raw_bytes")
            mime_type = resume.get("mime_type") or "application/octet-stream"
            candidate_name = (
                filename.replace(".pdf", "")
                .replace(".txt", "")
                .replace(".docx", "")
                .replace("_", " ")
                .strip()
            )

            resume_doc_id = None
            if raw_bytes:
                resume_doc_id = store_document(
                    import_session_id=import_id,
                    doc_type="resume",
                    filename=filename,
                    file_data=raw_bytes,
                    mime_type=mime_type,
                )

            link_candidate_document(
                import_session_id=import_id,
                candidate_name=candidate_name,
                candidate_email="",
                resume_doc_id=resume_doc_id,
            )

            candidate = {
                "candidate_name": candidate_name,
                "resume_text": resume.get("resume_text", ""),
                "source": "gmail",
                "years_experience": 0,
                "education": {},
                "skills": [],
                "tools": [],
                "projects": [],
                "soft_skills": []
            }
            candidates.append(candidate)
        
        return {
            "success": True,
            "import_id": import_id,
            "count": len(candidates),
            "candidates": candidates
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))