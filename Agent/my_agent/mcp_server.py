"""
mcp_server.py
MCP server that exposes database operations as tools for your agents.


Run with: python mcp_server.py
"""

import asyncio
import json
import os
import sqlite3
from pathlib import Path
from dotenv import load_dotenv
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

load_dotenv()

# ─────────────────────────────────────────
# Database connection (SQLite)
# ─────────────────────────────────────────

# Path to the shared SQLite DB file — sourced from central settings.
try:
    from my_agent.config.settings import DB_PATH
except Exception:
    DB_PATH = os.getenv("DB_PATH", str(Path(__file__).resolve().parents[2] / "Backend" / "resumes.db"))

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # lets us access columns by name like dicts
    conn.execute("PRAGMA journal_mode=WAL")  # safer concurrent writes
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def query(sql, params=(), fetch="all"):
    """Run a SQL query and return results as plain dicts."""
    with get_conn() as conn:
        cur = conn.execute(sql, params)
        conn.commit()
        if fetch == "one":
            row = cur.fetchone()
            return dict(row) if row else None
        elif fetch == "all":
            rows = cur.fetchall()
            return [dict(r) for r in rows]
        elif fetch == "lastrowid":
            conn.commit()
            return cur.lastrowid
        else:
            conn.commit()
            return None

def init_db():
    """Create tables if they don't exist yet (replaces init.sql)."""
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS resumes (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_name   TEXT NOT NULL,
                email            TEXT NOT NULL,
                phone            TEXT,
                raw_text         TEXT NOT NULL,
                skills           TEXT,          -- stored as JSON array string
                experience_years INTEGER,
                education        TEXT,
                file_path        TEXT,
                uploaded_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS job_descriptions (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                title        TEXT NOT NULL,
                company      TEXT,
                description  TEXT NOT NULL,
                requirements TEXT NOT NULL,
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS rankings (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                resume_id INTEGER NOT NULL REFERENCES resumes(id),
                job_id    INTEGER NOT NULL REFERENCES job_descriptions(id),
                score     REAL NOT NULL,
                reasoning TEXT,
                ranked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(resume_id, job_id)
            );

            CREATE TABLE IF NOT EXISTS matches (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                resume_id      INTEGER NOT NULL REFERENCES resumes(id),
                job_id         INTEGER NOT NULL REFERENCES job_descriptions(id),
                match_score    REAL NOT NULL,
                matched_skills TEXT,           -- stored as JSON array string
                missing_skills TEXT,           -- stored as JSON array string
                status         TEXT DEFAULT 'pending' CHECK(status IN ('pending','shortlisted','rejected')),
                matched_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(resume_id, job_id)
            );
        """)
        conn.commit()

# ─────────────────────────────────────────
# MCP Server
# ─────────────────────────────────────────

app = Server("resume-ranking-db")

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="save_resume",
            description="Save a parsed resume to the database. Returns the new resume ID.",
            inputSchema={
                "type": "object",
                "properties": {
                    "candidate_name":   {"type": "string"},
                    "email":            {"type": "string"},
                    "phone":            {"type": "string"},
                    "raw_text":         {"type": "string", "description": "Full extracted text from PDF"},
                    "skills":           {"type": "array", "items": {"type": "string"}},
                    "experience_years": {"type": "integer"},
                    "education":        {"type": "string"},
                    "file_path":        {"type": "string"}
                },
                "required": ["candidate_name", "email", "raw_text", "skills"]
            }
        ),
        types.Tool(
            name="get_all_resumes",
            description="Retrieve all resumes from the database (without raw text).",
            inputSchema={"type": "object", "properties": {}}
        ),
        types.Tool(
            name="get_resume",
            description="Get a single resume by its ID.",
            inputSchema={
                "type": "object",
                "properties": {
                    "resume_id": {"type": "integer"}
                },
                "required": ["resume_id"]
            }
        ),
        types.Tool(
            name="save_job",
            description="Save a job description to the database. Returns the new job ID.",
            inputSchema={
                "type": "object",
                "properties": {
                    "title":        {"type": "string"},
                    "company":      {"type": "string"},
                    "description":  {"type": "string"},
                    "requirements": {"type": "string"}
                },
                "required": ["title", "description", "requirements"]
            }
        ),
        types.Tool(
            name="get_all_jobs",
            description="Retrieve all job descriptions from the database.",
            inputSchema={"type": "object", "properties": {}}
        ),
        types.Tool(
            name="save_ranking",
            description="Save a ranking score for a resume against a job. Upserts if already exists.",
            inputSchema={
                "type": "object",
                "properties": {
                    "resume_id": {"type": "integer"},
                    "job_id":    {"type": "integer"},
                    "score":     {"type": "number", "description": "Score from 0 to 100"},
                    "reasoning": {"type": "string", "description": "Why this score was given"}
                },
                "required": ["resume_id", "job_id", "score", "reasoning"]
            }
        ),
        types.Tool(
            name="get_rankings_for_job",
            description="Get top-ranked resumes for a specific job, ordered by score.",
            inputSchema={
                "type": "object",
                "properties": {
                    "job_id": {"type": "integer"},
                    "limit":  {"type": "integer", "default": 20}
                },
                "required": ["job_id"]
            }
        ),
        types.Tool(
            name="save_match",
            description="Save a match result between a resume and a job.",
            inputSchema={
                "type": "object",
                "properties": {
                    "resume_id":      {"type": "integer"},
                    "job_id":         {"type": "integer"},
                    "match_score":    {"type": "number"},
                    "matched_skills": {"type": "array", "items": {"type": "string"}},
                    "missing_skills": {"type": "array", "items": {"type": "string"}},
                    "status":         {"type": "string", "enum": ["pending", "shortlisted", "rejected"]}
                },
                "required": ["resume_id", "job_id", "match_score", "matched_skills", "missing_skills"]
            }
        ),
        types.Tool(
            name="get_matches_for_job",
            description="Get all matches for a job, optionally filtered by status.",
            inputSchema={
                "type": "object",
                "properties": {
                    "job_id": {"type": "integer"},
                    "status": {"type": "string", "enum": ["pending", "shortlisted", "rejected"]}
                },
                "required": ["job_id"]
            }
        ),
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    try:
        result = handle_tool(name, arguments)
        return [types.TextContent(type="text", text=json.dumps(result, default=str))]
    except Exception as e:
        return [types.TextContent(type="text", text=json.dumps({"error": str(e)}))]

def handle_tool(name: str, args: dict):

    # ── Resumes ──────────────────────────────
    if name == "save_resume":
        skills_json = json.dumps(args.get("skills", []))
        with get_conn() as conn:
            cur = conn.execute("""
                INSERT INTO resumes
                    (candidate_name, email, phone, raw_text, skills, experience_years, education, file_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                args.get("candidate_name"),
                args.get("email"),
                args.get("phone"),
                args.get("raw_text"),
                skills_json,
                args.get("experience_years"),
                args.get("education"),
                args.get("file_path"),
            ))
            conn.commit()
            return {"resume_id": cur.lastrowid, "status": "saved"}

    elif name == "get_all_resumes":
        rows = query("""
            SELECT id, candidate_name, email, skills, experience_years, education, uploaded_at
            FROM resumes ORDER BY uploaded_at DESC
        """)
        # Parse skills JSON string back to list
        for r in rows:
            r["skills"] = json.loads(r["skills"]) if r.get("skills") else []
        return rows

    elif name == "get_resume":
        row = query("SELECT * FROM resumes WHERE id = ?", (args["resume_id"],), fetch="one")
        if row and row.get("skills"):
            row["skills"] = json.loads(row["skills"])
        return row

    # ── Jobs ─────────────────────────────────
    elif name == "save_job":
        with get_conn() as conn:
            cur = conn.execute("""
                INSERT INTO job_descriptions (title, company, description, requirements)
                VALUES (?, ?, ?, ?)
            """, (args["title"], args.get("company"), args["description"], args["requirements"]))
            conn.commit()
            return {"job_id": cur.lastrowid, "status": "saved"}

    elif name == "get_all_jobs":
        return query("SELECT * FROM job_descriptions ORDER BY created_at DESC")

    # ── Rankings ─────────────────────────────
    elif name == "save_ranking":
        with get_conn() as conn:
            cur = conn.execute("""
                INSERT INTO rankings (resume_id, job_id, score, reasoning)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(resume_id, job_id)
                DO UPDATE SET score = excluded.score,
                              reasoning = excluded.reasoning,
                              ranked_at = CURRENT_TIMESTAMP
            """, (args["resume_id"], args["job_id"], args["score"], args["reasoning"]))
            conn.commit()
            return {"ranking_id": cur.lastrowid, "status": "saved"}

    elif name == "get_rankings_for_job":
        rows = query("""
            SELECT r.score, r.reasoning, r.ranked_at,
                   res.candidate_name, res.email, res.skills, res.experience_years
            FROM rankings r
            JOIN resumes res ON res.id = r.resume_id
            WHERE r.job_id = ?
            ORDER BY r.score DESC LIMIT ?
        """, (args["job_id"], args.get("limit", 20)))
        for r in rows:
            r["skills"] = json.loads(r["skills"]) if r.get("skills") else []
        return rows

    # ── Matches ──────────────────────────────
    elif name == "save_match":
        with get_conn() as conn:
            cur = conn.execute("""
                INSERT INTO matches (resume_id, job_id, match_score, matched_skills, missing_skills, status)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(resume_id, job_id)
                DO UPDATE SET match_score    = excluded.match_score,
                              matched_skills = excluded.matched_skills,
                              missing_skills = excluded.missing_skills,
                              status         = excluded.status,
                              matched_at     = CURRENT_TIMESTAMP
            """, (
                args["resume_id"], args["job_id"], args["match_score"],
                json.dumps(args["matched_skills"]),
                json.dumps(args["missing_skills"]),
                args.get("status", "pending")
            ))
            conn.commit()
            return {"match_id": cur.lastrowid, "status": "saved"}

    elif name == "get_matches_for_job":
        sql = """
            SELECT m.*, res.candidate_name, res.email
            FROM matches m JOIN resumes res ON res.id = m.resume_id
            WHERE m.job_id = ?
        """
        params = [args["job_id"]]
        if "status" in args:
            sql += " AND m.status = ?"
            params.append(args["status"])
        sql += " ORDER BY m.match_score DESC"
        rows = query(sql, params)
        for r in rows:
            r["matched_skills"] = json.loads(r["matched_skills"]) if r.get("matched_skills") else []
            r["missing_skills"]  = json.loads(r["missing_skills"])  if r.get("missing_skills")  else []
        return rows

    else:
        raise ValueError(f"Unknown tool: {name}")

# ─────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────

async def main():
    init_db()  # create tables if they don't exist
    print("✅ SQLite DB initialised at:", os.path.abspath(DB_PATH))
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    print("MCP server starting...")
    asyncio.run(main())