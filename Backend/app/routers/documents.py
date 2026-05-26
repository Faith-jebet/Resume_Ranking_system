"""
app/routers/documents.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for the Document Review feature.

GET  /api/imports                       → list all import sessions
GET  /api/imports/{id}/documents        → candidates + JD for one session
GET  /api/documents/{id}/info           → mime_type / filename metadata
GET  /api/documents/{id}/content        → raw file bytes  (PDF as-is, DOCX converted → PDF)
"""

import io
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response, StreamingResponse

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Documents"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _get_db():
    """Return a connection to the shared SQLite database."""
    from database.sqlite_db import get_connection

    try:
        from my_agent.mcp_server import DB_PATH
    except Exception:
        DB_PATH = None

    return get_connection(DB_PATH)


def _docx_bytes_to_pdf(docx_bytes: bytes) -> bytes:
    """
    Convert a .docx byte blob to PDF bytes.

    Strategy (in order of availability):
    1. LibreOffice headless  – best fidelity, available on most Linux servers
    2. docx2pdf              – pip install docx2pdf  (uses Word on Windows/Mac,
                               LibreOffice on Linux)
    3. python-docx + reportlab – pure-Python fallback (plain text only,
                               no formatting)

    Returns PDF bytes, or raises RuntimeError if all methods fail.
    """
    import tempfile, subprocess, shutil, os

    # ── Method 1: LibreOffice ─────────────────────────────────────────────────
    lo = shutil.which("libreoffice") or shutil.which("soffice")
    if lo:
        try:
            with tempfile.TemporaryDirectory() as tmp:
                src = os.path.join(tmp, "input.docx")
                with open(src, "wb") as f:
                    f.write(docx_bytes)
                result = subprocess.run(
                    [lo, "--headless", "--convert-to", "pdf",
                     "--outdir", tmp, src],
                    capture_output=True, timeout=30,
                )
                pdf_path = os.path.join(tmp, "input.pdf")
                if result.returncode == 0 and os.path.exists(pdf_path):
                    with open(pdf_path, "rb") as f:
                        log.info("✅ DOCX→PDF via LibreOffice")
                        return f.read()
                log.warning(f"LibreOffice failed: {result.stderr.decode()}")
        except Exception as e:
            log.warning(f"LibreOffice conversion error: {e}")

    # ── Method 2: docx2pdf ────────────────────────────────────────────────────
    try:
        from docx2pdf import convert as docx2pdf_convert
        with tempfile.TemporaryDirectory() as tmp:
            import os
            src = os.path.join(tmp, "input.docx")
            dst = os.path.join(tmp, "output.pdf")
            with open(src, "wb") as f:
                f.write(docx_bytes)
            docx2pdf_convert(src, dst)
            with open(dst, "rb") as f:
                log.info("✅ DOCX→PDF via docx2pdf")
                return f.read()
    except ImportError:
        pass
    except Exception as e:
        log.warning(f"docx2pdf error: {e}")

    # ── Method 3: python-docx + reportlab (plain-text fallback) ───────────────
    try:
        from docx import Document as DocxDocument
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.enums import TA_LEFT

        doc = DocxDocument(io.BytesIO(docx_bytes))
        paragraphs_text = [p.text for p in doc.paragraphs if p.text.strip()]

        buf = io.BytesIO()
        pdf_doc = SimpleDocTemplate(
            buf, pagesize=A4,
            leftMargin=2*cm, rightMargin=2*cm,
            topMargin=2*cm, bottomMargin=2*cm,
        )
        styles = getSampleStyleSheet()
        normal = ParagraphStyle("body", parent=styles["Normal"],
                                fontName="Helvetica", fontSize=10,
                                leading=14, spaceAfter=4)
        heading = ParagraphStyle("head", parent=styles["Normal"],
                                 fontName="Helvetica-Bold", fontSize=12,
                                 leading=16, spaceAfter=6)

        story = []
        for i, text in enumerate(paragraphs_text):
            style = heading if i == 0 else normal
            # escape XML special chars for reportlab
            safe = (text.replace("&", "&amp;")
                        .replace("<", "&lt;")
                        .replace(">", "&gt;"))
            try:
                story.append(Paragraph(safe, style))
            except Exception:
                story.append(Paragraph("", normal))
            story.append(Spacer(1, 2))

        pdf_doc.build(story)
        log.info("✅ DOCX→PDF via reportlab (plain-text fallback)")
        return buf.getvalue()

    except ImportError as e:
        log.warning(f"reportlab/python-docx not available: {e}")
    except Exception as e:
        log.warning(f"reportlab conversion error: {e}")

    raise RuntimeError(
        "DOCX→PDF conversion failed: install LibreOffice, docx2pdf, or reportlab."
    )


def _mime_is_word(mime: str) -> bool:
    return mime in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/octet-stream",  # sometimes stored this way
    ) or mime.startswith("application/vnd.openxmlformats")


def _filename_is_word(filename: str) -> bool:
    return filename.lower().endswith((".docx", ".doc"))


# ── routes ────────────────────────────────────────────────────────────────────

@router.get("/imports")
def list_import_sessions():
    """Return all import sessions ordered newest-first."""
    try:
        con = _get_db()
        cur = con.execute(
            """
            SELECT id, subject_filter, fetched_count, created_at
            FROM   import_sessions
            ORDER  BY id DESC
            """
        )
        rows = cur.fetchall()
        con.close()
        sessions = [
            {
                "id":             r[0],
                "subject_filter": r[1],
                "fetched_count":  r[2],
                "created_at":     r[3],
            }
            for r in rows
        ]
        return {"sessions": sessions}
    except Exception as e:
        log.error(f"list_import_sessions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/imports/{import_id}/documents")
def get_import_documents(import_id: int):
    """
    Return candidate list + JD reference for one import session.
    Each candidate includes: id, name, email, resume_doc_id.
    """
    try:
        con = _get_db()

        # ── import session exists? ────────────────────────────────────────────
        row = con.execute(
            "SELECT id, subject_filter FROM import_sessions WHERE id = ?",
            (import_id,),
        ).fetchone()
        if not row:
            con.close()
            raise HTTPException(status_code=404, detail="Import session not found")

        # ── candidates ────────────────────────────────────────────────────────
        cands = con.execute(
            """
            SELECT id, candidate_name, candidate_email, resume_doc_id
            FROM   candidate_documents
            WHERE  import_session_id = ?
            ORDER  BY id
            """,
            (import_id,),
        ).fetchall()

        # ── JD (first jd-type document for this session, if any) ─────────────
        jd_row = con.execute(
            """
            SELECT id, filename, mime_type
            FROM   documents
            WHERE  import_session_id = ? AND doc_type = 'jd'
            LIMIT  1
            """,
            (import_id,),
        ).fetchone()
        con.close()

        candidates = [
            {
                "id":            c[0],
                "name":          c[1] or "Unknown",
                # ── Fix: surface email even when stored as empty string ───────
                "email":         c[2] if c[2] and c[2].strip() else None,
                "resume_doc_id": c[3],
            }
            for c in cands
        ]

        jd = (
            {"id": jd_row[0], "filename": jd_row[1], "mime_type": jd_row[2]}
            if jd_row else None
        )

        return {
            "import_id":  import_id,
            "candidates": candidates,
            "jd":         jd,
        }

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"get_import_documents error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{doc_id}/info")
def get_document_info(doc_id: int):
    """
    Return metadata for a document without sending its bytes.
    Frontend uses this to decide how to render: pdf | word | unknown
    """
    try:
        con = _get_db()
        row = con.execute(
            "SELECT id, filename, mime_type, doc_type FROM documents WHERE id = ?",
            (doc_id,),
        ).fetchone()
        con.close()

        if not row:
            raise HTTPException(status_code=404, detail="Document not found")

        filename  = row[1] or ""
        mime_type = row[2] or "application/octet-stream"

        # Determine render type
        if mime_type == "application/pdf" or filename.lower().endswith(".pdf"):
            render_as = "pdf"
        elif _mime_is_word(mime_type) or _filename_is_word(filename):
            render_as = "word"
        else:
            render_as = "unknown"

        return {
            "id":        row[0],
            "filename":  filename,
            "mime_type": mime_type,
            "doc_type":  row[3],
            "render_as": render_as,   # "pdf" | "word" | "unknown"
        }

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"get_document_info error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{doc_id}/content")
def get_document_content(
    doc_id: int,
    token: Optional[str] = Query(None),       # JWT passed by react-pdf
    as_pdf: bool = Query(False),               # ?as_pdf=true → always return PDF
):
    """
    Stream document bytes to the client.

    • PDFs  → served as-is (application/pdf)
    • DOCX  → converted to PDF on the fly when ?as_pdf=true OR served as-is
              with the correct Word MIME type so the browser / frontend can
              handle it.
    """
    try:
        con = _get_db()
        row = con.execute(
            "SELECT filename, mime_type, file_data FROM documents WHERE id = ?",
            (doc_id,),
        ).fetchone()
        con.close()

        if not row:
            raise HTTPException(status_code=404, detail="Document not found")

        filename: str  = row[0] or f"document_{doc_id}"
        mime_type: str = row[1] or "application/octet-stream"
        file_data: bytes = row[2]

        if not file_data:
            raise HTTPException(status_code=404, detail="Document has no content")

        is_word = _mime_is_word(mime_type) or _filename_is_word(filename)

        # ── DOCX → convert to PDF ─────────────────────────────────────────────
        if is_word and as_pdf:
            try:
                pdf_bytes = _docx_bytes_to_pdf(file_data)
                return Response(
                    content=pdf_bytes,
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": f'inline; filename="{filename}.pdf"',
                        "Cache-Control": "private, max-age=300",
                    },
                )
            except RuntimeError as conv_err:
                log.warning(f"Conversion failed for doc {doc_id}: {conv_err}. Serving raw.")
                # Fall through to serve raw bytes

        # ── Serve raw bytes (PDF, DOCX as-is, or anything else) ──────────────
        # Correct the MIME for Word files that were stored as octet-stream
        if is_word and mime_type == "application/octet-stream":
            if filename.lower().endswith(".docx"):
                mime_type = ("application/vnd.openxmlformats-officedocument"
                             ".wordprocessingml.document")
            else:
                mime_type = "application/msword"

        return Response(
            content=file_data,
            media_type=mime_type,
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Cache-Control": "private, max-age=300",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"get_document_content error: {e}")
        raise HTTPException(status_code=500, detail=str(e))