from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable


DEFAULT_DB_PATH = Path(os.getenv("RESUME_DB_PATH", "resumes.db"))


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


def save_ranking(job_id: str, ranked_candidates: list[dict[str, Any]], db_path: str | os.PathLike[str] | None = None) -> dict[str, Any]:
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
        return {"ranking_id": str(cursor.lastrowid), "job_id": str(job_id), "ranked_candidates": ranked_candidates}
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
