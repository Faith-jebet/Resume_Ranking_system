-- Resume Ranking System SQLite Schema

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

CREATE INDEX IF NOT EXISTS idx_rankings_job_id ON rankings(job_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
