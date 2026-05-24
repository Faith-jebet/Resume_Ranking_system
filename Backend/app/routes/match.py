from fastapi import APIRouter, UploadFile, File, Form
from typing import List, Optional
import json
from ..services.agent_bridge import run_matching_pipeline

router = APIRouter()

@router.post("/match")
async def match_candidates(
    job_title: str = Form(...),
    job_description: Optional[UploadFile] = File(None),
    resumes: List[UploadFile] = File(default=[]),
    gmail_candidates: Optional[str] = Form(None),
):
    import io

    def extract_text(filename, file_bytes):
        if not file_bytes:
            return ""
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
        if ext == "pdf":
            try:
                import fitz
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                return "\n".join(page.get_text() for page in doc).strip()
            except Exception:
                return ""
        if ext in ("docx", "doc"):
            try:
                from docx import Document
                doc = Document(io.BytesIO(file_bytes))
                return "\n".join(p.text for p in doc.paragraphs).strip()
            except Exception:
                return ""
        if ext == "txt":
            return file_bytes.decode("utf-8", errors="ignore")
        return ""

    # Extract JD text
    jd_text = ""
    if job_description and job_description.filename:
        jd_bytes = await job_description.read()
        jd_text = extract_text(job_description.filename, jd_bytes)

    # Extract uploaded resumes
    uploaded = []
    for f in resumes:
        if not f.filename:
            continue
        raw = await f.read()
        text = extract_text(f.filename, raw)
        uploaded.append({
            "candidate_name": f.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").strip(),
            "email": "", "resume_text": text, "source": "upload",
            "years_experience": 0,
            "education": {"degree": "Not specified", "university": "Not specified"},
            "skills": [], "tools": [], "projects": [], "soft_skills": [],
        })

    # Parse Gmail candidates
    gmail_list = []
    if gmail_candidates:
        try:
            gmail_list = json.loads(gmail_candidates)
        except json.JSONDecodeError:
            pass

    all_candidates = uploaded + gmail_list

    return run_matching_pipeline(
        job_title=job_title,
        candidates=all_candidates,
        job_description_text=jd_text,
    )