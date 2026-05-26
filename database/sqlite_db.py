from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable


DEFAULT_DB_PATH = Path(os.getenv("RESUME_DB_PATH", Path(__file__).resolve().parents[1] / "Backend" / "resumes.db"))


def _connect(db_path: str | os.PathLike[str] | None = None) -> sqlite3.Connection:
    path = Path(db_path) if db_path is not None else DEFAULT_DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str | os.PathLike[str] | None = None) -> None:
    conn = _connect(db_path)
    try:
        conn.executescript(
            """
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                required_skills TEXT NOT NULL,
                experience INTEGER,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS rankings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                ranked_candidates TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS resumes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_name TEXT,
                email TEXT,
                raw_text TEXT,
                skills TEXT,
                experience_years INTEGER,
                source TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS import_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                subject_filter TEXT,
                fetched_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                import_session_id INTEGER,
                doc_type TEXT NOT NULL CHECK(doc_type IN ('resume', 'jd')),
                filename TEXT NOT NULL,
                mime_type TEXT NOT NULL DEFAULT 'application/pdf',
                file_data BLOB NOT NULL,
                file_size_bytes INTEGER,
                created_at TEXT NOT NULL,
                FOREIGN KEY(import_session_id) REFERENCES import_sessions(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS candidate_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_name TEXT,
                candidate_email TEXT,
                resume_doc_id INTEGER,
                import_session_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(resume_doc_id) REFERENCES documents(id) ON DELETE SET NULL,
                FOREIGN KEY(import_session_id) REFERENCES import_sessions(id) ON DELETE CASCADE
            );
            """
        )
        conn.commit()
    finally:
        conn.close()


def get_connection(db_path: str | os.PathLike[str] | None = None) -> sqlite3.Connection:
    init_db(db_path)
    return _connect(db_path)


def get_cursor(conn: sqlite3.Connection) -> sqlite3.Cursor:
    return conn.cursor()


def _rows_to_dicts(rows: Iterable[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(row) for row in rows]


# ── Existing helpers ─────────────────────────────────────────────────────────

def insert_job(job_data: dict[str, Any], db_path: str | os.PathLike[str] | None = None) -> dict[str, Any]:
    conn = _connect(db_path)
    try:
        cursor = conn.execute(
            """
            INSERT INTO jobs (title, description, required_skills, experience, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                job_data.get("title", ""),
                job_data.get("description", ""),
                json.dumps(job_data.get("required_skills", [])),
                job_data.get("experience"),
                job_data.get("created_at") or "",
            ),
        )
        conn.commit()
        return {"job_id": str(cursor.lastrowid), **job_data}
    finally:
        conn.close()


def get_all_jobs(db_path: str | os.PathLike[str] | None = None) -> list[dict[str, Any]]:
    conn = _connect(db_path)
    try:
        rows = conn.execute("SELECT * FROM jobs ORDER BY id DESC").fetchall()
        jobs = _rows_to_dicts(rows)
        for job in jobs:
            job["job_id"] = str(job.pop("id"))
            job["required_skills"] = json.loads(job.get("required_skills") or "[]")
        return jobs
    finally:
        conn.close()


def get_job(job_id: str, db_path: str | os.PathLike[str] | None = None) -> dict[str, Any] | None:
    conn = _connect(db_path)
    try:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if row is None:
            return None
        job = dict(row)
        job["job_id"] = str(job.pop("id"))
        job["required_skills"] = json.loads(job.get("required_skills") or "[]")
        return job
    finally:
        conn.close()


def save_ranking(
    job_id: str,
    ranked_candidates: list[dict[str, Any]],
    db_path: str | os.PathLike[str] | None = None,
) -> dict[str, Any]:
    conn = _connect(db_path)
    try:
        cursor = conn.execute(
            """
            INSERT INTO rankings (job_id, ranked_candidates, created_at)
            VALUES (?, ?, ?)
            """,
            (job_id, json.dumps(ranked_candidates), datetime.utcnow().isoformat()),
        )
        conn.commit()
        return {
            "ranking_id": str(cursor.lastrowid),
            "job_id": str(job_id),
            "ranked_candidates": ranked_candidates,
        }
    finally:
        conn.close()


def get_all_resumes(db_path: str | os.PathLike[str] | None = None) -> list[dict[str, Any]]:
    conn = _connect(db_path)
    try:
        rows = conn.execute("SELECT * FROM resumes ORDER BY id DESC").fetchall()
        resumes = _rows_to_dicts(rows)
        for resume in resumes:
            resume["resume_id"] = str(resume.pop("id"))
            resume["skills"] = json.loads(resume.get("skills") or "[]")
        return resumes
    finally:
        conn.close()


# ── Document Review helpers ──────────────────────────────────────────────────

def create_import_session(
    subject_filter: str,
    fetched_count: int,
    user_id: int | None = None,
    db_path: str | os.PathLike[str] | None = None,
) -> int:
    """Insert a new import_session row and return its id."""
    conn = _connect(db_path)
    try:
        cursor = conn.execute(
            """
            INSERT INTO import_sessions (user_id, subject_filter, fetched_count, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, subject_filter, fetched_count, datetime.utcnow().isoformat()),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def store_document(
    import_session_id: int,
    doc_type: str,
    filename: str,
    file_data: bytes,
    mime_type: str = "application/pdf",
    db_path: str | os.PathLike[str] | None = None,
) -> int:
    """Store a PDF blob and return the document id."""
    conn = _connect(db_path)
    try:
        cursor = conn.execute(
            """
            INSERT INTO documents
                (import_session_id, doc_type, filename, mime_type, file_data, file_size_bytes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                import_session_id,
                doc_type,
                filename,
                mime_type,
                file_data,
                len(file_data),
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def link_candidate_document(
    import_session_id: int,
    candidate_name: str,
    candidate_email: str,
    resume_doc_id: int | None,
    db_path: str | os.PathLike[str] | None = None,
) -> int:
    """Create a candidate_documents row and return its id."""
    conn = _connect(db_path)
    try:
        cursor = conn.execute(
            """
            INSERT INTO candidate_documents
                (candidate_name, candidate_email, resume_doc_id, import_session_id, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                candidate_name,
                candidate_email,
                resume_doc_id,
                import_session_id,
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_import_documents(
    import_session_id: int,
    db_path: str | os.PathLike[str] | None = None,
) -> dict[str, Any]:
    """Return candidates list and JD metadata for an import session."""
    conn = _connect(db_path)
    try:
        candidate_rows = conn.execute(
            """
            SELECT cd.id, cd.candidate_name, cd.candidate_email, cd.resume_doc_id,
                   d.filename AS resume_filename
            FROM candidate_documents cd
            LEFT JOIN documents d ON d.id = cd.resume_doc_id
            WHERE cd.import_session_id = ?
            ORDER BY cd.id
            """,
            (import_session_id,),
        ).fetchall()

        jd_row = conn.execute(
            """
            SELECT id, filename
            FROM documents
            WHERE import_session_id = ? AND doc_type = 'jd'
            ORDER BY id DESC
            LIMIT 1
            """,
            (import_session_id,),
        ).fetchone()

        return {
            "candidates": [
                {
                    "id": r["id"],
                    "name": r["candidate_name"],
                    "email": r["candidate_email"],
                    "resume_doc_id": r["resume_doc_id"],
                    "resume_filename": r["resume_filename"],
                }
                for r in candidate_rows
            ],
            "jd": dict(jd_row) if jd_row else None,
        }
    finally:
        conn.close()


def get_document_content(
    doc_id: int,
    db_path: str | os.PathLike[str] | None = None,
) -> dict[str, Any] | None:
    """Return {filename, mime_type, file_data} or None if not found."""
    conn = _connect(db_path)
    try:
        row = conn.execute(
            "SELECT filename, mime_type, file_data FROM documents WHERE id = ?",
            (doc_id,),
        ).fetchone()
        if row is None:
            return None
        return {
            "filename": row["filename"],
            "mime_type": row["mime_type"],
            "file_data": bytes(row["file_data"]),
        }
    finally:
        conn.close()