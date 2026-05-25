"""
documents.py — Document Review API router
==========================================

Mount this in main.py:

    from app.routers.documents import router as documents_router
    app.include_router(documents_router)

Endpoints
---------
GET  /api/imports/{import_id}/documents
    Returns the candidate list + JD metadata for a given import session.
    Response: { candidates: [...], jd: {id, filename} | null }

GET  /api/documents/{doc_id}/content
    Streams the raw PDF bytes for a given document id.
    Requires the document to belong to an import session.
    Content-Type: application/pdf  (or whatever mime_type was stored)
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

# Resolve the database helpers regardless of where uvicorn is launched from.
# Adjust the import path if your project layout differs.
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))  # repo root

from database.sqlite_db import (
    get_import_documents,
    get_document_content,
    get_connection,
)

router = APIRouter(prefix="/api", tags=["documents"])

DB_PATH = os.getenv("RESUME_DB_PATH", "resumes.db")


# ── helpers ─────────────────────────────────────────────────────────────────

def _import_exists(import_id: int) -> bool:
    conn = get_connection(DB_PATH)
    try:
        row = conn.execute(
            "SELECT id FROM import_sessions WHERE id = ?", (import_id,)
        ).fetchone()
        return row is not None
    finally:
        conn.close()


def _doc_belongs_to_import(doc_id: int, import_id: int) -> bool:
    """Ownership check: doc must belong to the given import session."""
    conn = get_connection(DB_PATH)
    try:
        row = conn.execute(
            "SELECT id FROM documents WHERE id = ? AND import_session_id = ?",
            (doc_id, import_id),
        ).fetchone()
        return row is not None
    finally:
        conn.close()


def _get_import_id_for_doc(doc_id: int) -> int | None:
    conn = get_connection(DB_PATH)
    try:
        row = conn.execute(
            "SELECT import_session_id FROM documents WHERE id = ?", (doc_id,)
        ).fetchone()
        return row["import_session_id"] if row else None
    finally:
        conn.close()


# ── endpoints ────────────────────────────────────────────────────────────────

@router.get("/imports")
def list_import_sessions():
    """
    List all import sessions (most recent first).

    Returns:
        { "sessions": [ { id, subject_filter, fetched_count, created_at }, ... ] }
    """
    conn = get_connection(DB_PATH)
    try:
        rows = conn.execute(
            """
            SELECT id, subject_filter, fetched_count, created_at
            FROM import_sessions
            ORDER BY id DESC
            """
        ).fetchall()
        return {"sessions": [dict(r) for r in rows]}
    finally:
        conn.close()


@router.get("/imports/{import_id}/documents")
def list_import_documents(import_id: int):
    """
    List candidates and JD metadata for an import session.

    Returns:
        {
          "import_id": 3,
          "candidates": [
            { "id": 1, "name": "Jane Doe", "email": "jane@example.com",
              "resume_doc_id": 7, "resume_filename": "jane_cv.pdf" },
            ...
          ],
          "jd": { "id": 8, "filename": "senior_dev_jd.pdf" } | null
        }
    """
    if not _import_exists(import_id):
        raise HTTPException(status_code=404, detail=f"Import session {import_id} not found")

    data = get_import_documents(import_id, DB_PATH)
    return {"import_id": import_id, **data}


@router.get("/documents/{doc_id}/content")
def get_doc_content(doc_id: int):
    """
    Stream the raw PDF (or other MIME) bytes for a document.

    The frontend calls this with the auth token in the Authorization header.
    The browser / react-pdf will render the bytes inline.
    """
    doc = get_document_content(doc_id, DB_PATH)
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")

    return Response(
        content=doc["file_data"],
        media_type=doc["mime_type"],
        headers={
            # Inline so the browser / PDF viewer renders it, not downloads it.
            "Content-Disposition": f'inline; filename="{doc["filename"]}"',
            "Content-Length": str(len(doc["file_data"])),
            # Allow the frontend (different origin in dev) to read the response.
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )