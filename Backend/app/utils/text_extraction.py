"""
app/utils/text_extraction.py
────────────────────────────
Single source of truth for extracting plain text from PDF, DOCX and TXT files.
Import extract_text() wherever file parsing is needed instead of duplicating
the logic across main.py, routes/match.py, etc.
"""

import io
import logging
import re

log = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        import fitz  # PyMuPDF
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
    """Dispatch to the correct extractor based on file extension."""
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


# ── Name extraction helper ────────────────────────────────────────────────────

_SKIP_KEYWORDS = {
    "resume", "curriculum", "cv", "objective", "summary", "experience",
    "education", "skills", "profile", "references", "http", "www",
    "linkedin", "github", "vitae", "portfolio", "contact",
}


def _clean_filename(filename: str) -> str:
    return filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").strip()


def extract_name_from_resume(resume_text: str, fallback_filename: str) -> str:
    """
    Heuristically extract a candidate's name from the first lines of their resume.
    Falls back to cleaning the filename if no name can be found.
    """
    if not resume_text:
        return _clean_filename(fallback_filename)
    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    for line in lines[:8]:
        if any(kw in line.lower() for kw in _SKIP_KEYWORDS):
            continue
        if re.search(r"[@/\\|]", line):
            continue
        if re.search(r"\d{3,}", line):
            continue
        words = line.split()
        if 2 <= len(words) <= 5:
            if all(w[0].isupper() for w in words if w.isalpha()):
                return line
    return _clean_filename(fallback_filename)
