"""MCP-backed helpers for database operations."""

from __future__ import annotations

from typing import Any


def _client():
    from my_agent.mcp_client import call_tool

    return call_tool


def get_all_jobs() -> list[dict[str, Any]]:
    result = _client()("get_all_jobs", {})
    return result if isinstance(result, list) else []


def get_all_resumes() -> list[dict[str, Any]]:
    result = _client()("get_all_resumes", {})
    return result if isinstance(result, list) else []


def get_rankings_for_job(job_id: int, limit: int = 20) -> list[dict[str, Any]]:
    result = _client()("get_rankings_for_job", {"job_id": job_id, "limit": limit})
    return result if isinstance(result, list) else []


def save_job(title: str, description: str, requirements: str, company: str | None = None) -> dict[str, Any]:
    payload = {
        "title": title,
        "company": company,
        "description": description,
        "requirements": requirements,
    }
    result = _client()("save_job", payload)
    return result if isinstance(result, dict) else {"error": "Unexpected MCP response"}
