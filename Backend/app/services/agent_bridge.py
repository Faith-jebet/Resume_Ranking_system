import os
import sys
import json
import asyncio
import re
import time
from pathlib import Path
from dotenv import load_dotenv

# Load .env from Agent or Backend if present
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AGENT_PATH = os.path.abspath(os.path.join(BASE_DIR, "../../../Agent"))
agent_env = Path(AGENT_PATH) / "my_agent" / ".env"
backend_env = Path(BASE_DIR).parents[1] / ".env"

if agent_env.exists():
    load_dotenv(dotenv_path=agent_env, override=True)
elif backend_env.exists():
    load_dotenv(dotenv_path=backend_env, override=True)

# Feature gate: use real Google ADK only when enabled
_USE_ADK = os.getenv("USE_ADK", "false").lower() == "true"


def _get_adk():
    # Lazy import ADK components when needed
    Runner = None
    InMemorySessionService = None

    for runner_path in [("google.adk.runners", "Runner"), ("google.adk", "Runner"), ("google.adk.runner", "Runner")]:
        try:
            mod = __import__(runner_path[0], fromlist=[runner_path[1]])
            Runner = getattr(mod, runner_path[1])
            break
        except (ImportError, AttributeError):
            continue

    for session_path in [("google.adk.sessions", "InMemorySessionService"), ("google.adk.memory", "InMemorySessionService"), ("google.adk", "InMemorySessionService")]:
        try:
            mod = __import__(session_path[0], fromlist=[session_path[1]])
            InMemorySessionService = getattr(mod, session_path[1])
            break
        except (ImportError, AttributeError):
            continue

    if Runner is None or InMemorySessionService is None:
        raise ImportError("Could not import ADK Runner or InMemorySessionService.")

    from google.genai import types as genai_types

    return Runner, InMemorySessionService, genai_types


def parse_json_response(text: str) -> dict:
    if not text:
        return {}
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return {}


# --- Local deterministic fallbacks used when ADK is disabled ---
def _local_job_requirements(prompt: str) -> str:
    # Return a minimal realistic job requirements JSON
    out = {
        "title": "Generated Role",
        "required_skills": ["python", "data analysis"],
        "preferred_skills": [],
        "experience_years": 2,
        "education": {"degree": "Bachelor", "field": "Computer Science"},
        "responsibilities": ["Analyze resumes", "Match candidates to jobs"]
    }
    return json.dumps(out)


def _local_resume_parser(prompt: str) -> str:
    # Extract a couple of deterministic fields from the resume text
    # (prompt contains resume text; for simplicity return a template)
    out = {
        "candidate_name": "Parsed Candidate",
        "email": "candidate@example.com",
        "years_experience": 3,
        "education": {"degree": "BSc", "university": "Example U"},
        "skills": ["python", "sql"],
        "tools": [],
        "projects": [],
        "soft_skills": ["communication"]
    }
    return json.dumps(out)


def _local_matcher(prompt: str) -> str:
    # Return a simple match score and justification
    out = {"match_score": 75, "justification": "Solid skill overlap with job requirements."}
    return json.dumps(out)


def _local_ranker(prompt: str) -> str:
    # Given a list of names, return them in the same order
    try:
        data = json.loads(prompt.partition('\n\n')[-1])
        names = [c.get("candidate_name") for c in data]
    except Exception:
        names = []
    return json.dumps({"ranked_names": names})


def _local_reporter(prompt: str) -> str:
    out = {"factors": [], "summary": "Top candidate selected by heuristic."}
    return json.dumps(out)


def _local_agent_response(agent, prompt: str) -> str:
    name = getattr(agent, "name", str(agent))
    if "job_requirements" in name:
        return _local_job_requirements(prompt)
    if "resume_parser" in name:
        return _local_resume_parser(prompt)
    if "job_matcher" in name or "matcher" in name:
        return _local_matcher(prompt)
    if "rank" in name or "ranker" in name:
        return _local_ranker(prompt)
    if "reporter" in name:
        return _local_reporter(prompt)
    return json.dumps({})


async def call_agent_async(agent, prompt: str, retries: int = 3) -> str:
    if not _USE_ADK:
        return _local_agent_response(agent, prompt)

    Runner, InMemorySessionService, genai_types = _get_adk()

    for attempt in range(retries):
        try:
            session_service = InMemorySessionService()
            app_name = f"bridge_{getattr(agent, 'name', 'agent')}"
            user_id = "system"
            session_id = f"sess_{getattr(agent, 'name', 'agent')}_{abs(hash(prompt)) % 1_000_000}_{attempt}"

            await session_service.create_session(app_name=app_name, user_id=user_id, session_id=session_id)

            runner = Runner(agent=agent, app_name=app_name, session_service=session_service)

            message = genai_types.Content(role="user", parts=[genai_types.Part(text=prompt)])

            full_text = ""
            async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=message):
                if event.is_final_response() and event.content and event.content.parts:
                    full_text = "".join(part.text for part in event.content.parts if hasattr(part, "text") and part.text is not None)

            return full_text.strip()
        except Exception as e:
            err_str = str(e)
            is_rate_limit = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str
            if is_rate_limit and attempt < retries - 1:
                await asyncio.sleep(65)
                continue
            raise

    return ""


def call_agent(agent, prompt: str) -> str:
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(asyncio.run, call_agent_async(agent, prompt))
                return future.result(timeout=600)
        return loop.run_until_complete(call_agent_async(agent, prompt))
    except RuntimeError:
        return asyncio.run(call_agent_async(agent, prompt))


# Minimal default ranking criteria
DEFAULT_RANKING_CRITERIA = {"factors": [], "summary": ""}


def _throttle():
    time.sleep(0.01)


def run_matching_pipeline(job_title: str, candidates: list, job_description_text: str = "") -> dict:
    # A simplified pipeline that uses `call_agent` which will use local fallbacks when ADK is off
    print(f"Starting pipeline: {job_title} — candidates: {len(candidates)}")

    if job_description_text:
        prompt = f"Job Title: {job_title}\n\nJob Description:\n{job_description_text}\n"
    else:
        prompt = f"Job Title: {job_title}\n\nGenerate job requirements.\n"

    job_req_raw = call_agent(type("A", (), {"name": "job_requirements_agent"}), prompt)
    job_req = parse_json_response(job_req_raw) or {"title": job_title}

    parsed = []
    for c in candidates:
        parsed_raw = call_agent(type("A", (), {"name": "resume_parser_agent"}), c.get("resume_text", ""))
        parsed_obj = parse_json_response(parsed_raw) or c
        parsed.append({**c, **parsed_obj})

    matched = []
    for c in parsed:
        score_raw = call_agent(type("A", (), {"name": "job_matcher_agent"}), json.dumps({"job": job_req, "candidate": c}))
        score_obj = parse_json_response(score_raw)
        matched.append({**c, "match_score": int(score_obj.get("match_score", 0)) if score_obj else 0})

    # Simple ranking by score
    matched.sort(key=lambda x: x.get("match_score", 0), reverse=True)

    report_raw = call_agent(type("A", (), {"name": "reporter_agent"}), json.dumps({"ranked": matched}))
    report = parse_json_response(report_raw) or DEFAULT_RANKING_CRITERIA

    return {"candidates": matched, "ranking_criteria": report}
