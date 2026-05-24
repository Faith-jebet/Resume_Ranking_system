"""SQLite compatibility helpers for legacy imports.

This module keeps the existing `get_connection()` / `get_cursor()` API alive,
but routes everything through the SQLite database implementation.
"""

from __future__ import annotations

import os
import sqlite3

from .sqlite_db import get_connection as _sqlite_get_connection


def get_connection():
    db_path = os.getenv("RESUME_DB_PATH", "resumes.db")
    return _sqlite_get_connection(db_path)


def get_cursor(conn: sqlite3.Connection):
    return conn.cursor()


def test_connection():
    try:
        conn = get_connection()
        cursor = get_cursor(conn)
        cursor.execute("SELECT sqlite_version() AS version;")
        row = cursor.fetchone()
        print("Database connection successful. SQLite version:", row[0] if row else "unknown")
        conn.close()
        return True
    except Exception as exc:
        print(f"Database connection failed: {exc}")
        return False


if __name__ == "__main__":
    test_connection()