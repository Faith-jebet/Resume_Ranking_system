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


# ── Domain classification ────────────────────────────────────────────────────
# Maps keywords found in a job title or resume text → canonical domain label.
# Add more entries as your system supports more roles.

DOMAIN_KEYWORDS = {
    "software"        : "Software Engineering",
    "developer"       : "Software Engineering",
    "engineer"        : "Software Engineering",
    "backend"         : "Software Engineering",
    "frontend"        : "Software Engineering",
    "fullstack"       : "Software Engineering",
    "devops"          : "Software Engineering",
    "sre"             : "Software Engineering",
    "mobile"          : "Software Engineering",
    "android"         : "Software Engineering",
    "ios"             : "Software Engineering",
    "data scientist"  : "Data Science",
    "data science"    : "Data Science",
    "machine learning": "Data Science",
    "ml engineer"     : "Data Science",
    "ai engineer"     : "Data Science",
    "data analyst"    : "Data Analytics",
    "business analyst": "Business Analysis",
    "teacher"         : "Education",
    "lecturer"        : "Education",
    "instructor"      : "Education",
    "educator"        : "Education",
    "tutor"           : "Education",
    "curriculum"      : "Education",
    "classroom"       : "Education",
    "nurse"           : "Healthcare",
    "doctor"          : "Healthcare",
    "physician"       : "Healthcare",
    "pharmacist"      : "Healthcare",
    "clinical"        : "Healthcare",
    "accountant"      : "Finance",
    "finance"         : "Finance",
    "auditor"         : "Finance",
    "banker"          : "Finance",
    "lawyer"          : "Law",
    "attorney"        : "Law",
    "paralegal"       : "Law",
    "legal"           : "Law",
    "marketing"       : "Marketing",
    "designer"        : "Design",
    "ux"              : "Design",
    "ui"              : "Design",
    "product manager" : "Product Management",
    "project manager" : "Project Management",
    "hr"              : "Human Resources",
    "recruiter"       : "Human Resources",
    "human resources" : "Human Resources",
}


def _classify_domain(text: str) -> str:
    """Return the most likely professional domain from a block of text."""
    lowered = text.lower()
    for keyword, domain in DOMAIN_KEYWORDS.items():
        if keyword in lowered:
            return domain
    return "General"


def _domains_are_compatible(job_domain: str, candidate_domain: str) -> bool:
    """
    Returns True if the candidate's domain is compatible with the job domain.
    Allows related domains (e.g. Data Science ↔ Data Analytics).
    """
    if job_domain == candidate_domain:
        return True

    compatible_groups = [
        {"Software Engineering", "Data Science", "Data Analytics", "DevOps"},
        {"Finance", "Business Analysis"},
        {"Human Resources", "Business Analysis"},
    ]
    for group in compatible_groups:
        if job_domain in group and candidate_domain in group:
            return True

    return False


# ── Local fallbacks (used when USE_ADK=false) ────────────────────────────────

def _local_job_requirements(prompt: str) -> str:
    """Extract job title and domain from prompt and return realistic requirements."""
    # Pull job title from prompt
    title = "Generated Role"
    for line in prompt.splitlines():
        if line.lower().startswith("job title:"):
            title = line.split(":", 1)[1].strip()
            break

    domain = _classify_domain(prompt)

    # Check if JD text is present and if it mismatches the title
    has_jd = "job description" in prompt.lower()
    if has_jd:
        # Classify the JD body separately from the title line
        jd_body = prompt.lower().split("job description", 1)[-1]
        jd_domain = _classify_domain(jd_body)
        title_domain = _classify_domain(title)

        if title_domain != "General" and jd_domain != "General" and not _domains_are_compatible(title_domain, jd_domain):
            return json.dumps({
                "error": "JD_TITLE_MISMATCH",
                "message": (
                    f"The provided job description does not match the job title '{title}'. "
                    f"The JD appears to be for a '{jd_domain}' role, not a '{title_domain}' role. "
                    f"Please provide a JD that matches the job title."
                )
            })

    out = {
        "title": title,
        "domain": domain,
        "required_skills": [],
        "preferred_skills": [],
        "experience_years": 2,
        "education": "Bachelor's degree in a relevant field",
        "responsibilities": [
            f"Perform core duties of a {title}",
            "Collaborate with team members",
            "Report to senior management"
        ]
    }
    return json.dumps(out)


def _local_resume_parser(prompt: str) -> str:
    """Parse resume text and classify its domain."""
    domain = _classify_domain(prompt)

    # Try to extract a name (first non-empty line is often the name)
    candidate_name = "Unknown Candidate"
    for line in prompt.splitlines():
        line = line.strip()
        if line and not "@" in line and len(line.split()) <= 5:
            candidate_name = line
            break

    # Try to extract email
    email_match = re.search(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", prompt, re.IGNORECASE)
    email = email_match.group(0) if email_match else None

    # Try to extract years of experience
    exp_match = re.search(r"(\d+)\s*\+?\s*years?\s*(of\s*)?experience", prompt, re.IGNORECASE)
    years_experience = int(exp_match.group(1)) if exp_match else 0

    out = {
        "candidate_name": candidate_name,
        "email": email,
        "domain": domain,
        "skills": [],
        "tools": [],
        "years_experience": years_experience,
        "education": {"degree": "", "university": ""},
        "certifications": [],
        "projects": [],
        "soft_skills": []
    }
    return json.dumps(out)


def _local_matcher(job_req: dict, candidate: dict) -> str:
    """
    Score candidate vs job requirements using domain validation + skill overlap.
    This replaces the old hardcoded 75% fallback.
    """
    job_domain       = job_req.get("domain", _classify_domain(job_req.get("title", "")))
    candidate_domain = candidate.get("domain", _classify_domain(
        " ".join(candidate.get("skills", [])) + " " + candidate.get("candidate_name", "")
    ))

    # Hard reject if domains are incompatible
    if not _domains_are_compatible(job_domain, candidate_domain):
        return json.dumps({
            "error": "DOMAIN_MISMATCH",
            "match_score": 0,
            "justification": (
                f"Candidate's background is in '{candidate_domain}', "
                f"which is incompatible with the job domain '{job_domain}'."
            ),
            "strengths": [],
            "gaps": [
                f"Professional domain mismatch: candidate is from '{candidate_domain}', "
                f"job requires '{job_domain}'"
            ]
        })

    # Skill overlap scoring
    required_skills  = [s.lower() for s in job_req.get("required_skills", [])]
    candidate_skills = [s.lower() for s in candidate.get("skills", [])]
    candidate_tools  = [s.lower() for s in candidate.get("tools", [])]
    all_candidate    = set(candidate_skills + candidate_tools)

    if required_skills:
        matched_skills = [s for s in required_skills if any(s in cs or cs in s for cs in all_candidate)]
        skill_score = int((len(matched_skills) / len(required_skills)) * 50)  # 50% weight
    else:
        skill_score = 25  # neutral if no required skills defined

    # Experience scoring (30% weight)
    required_exp  = int(job_req.get("experience_years", 0))
    candidate_exp = int(candidate.get("years_experience", 0))
    if required_exp == 0:
        exp_score = 30
    elif candidate_exp >= required_exp:
        exp_score = 30
    elif candidate_exp >= required_exp * 0.7:
        exp_score = 20
    elif candidate_exp > 0:
        exp_score = 10
    else:
        exp_score = 0

    # Education scoring (20% weight)
    edu_score = 10  # default partial credit
    req_edu   = job_req.get("education", "").lower()
    cand_edu  = (candidate.get("education") or {})
    cand_degree = (cand_edu.get("degree") or "").lower()
    if req_edu and cand_degree:
        if "phd" in cand_degree or "doctorate" in cand_degree:
            edu_score = 20
        elif "master" in cand_degree:
            edu_score = 18
        elif "bachelor" in cand_degree or "bsc" in cand_degree or "ba" in cand_degree:
            edu_score = 15
        else:
            edu_score = 8

    match_score = min(100, skill_score + exp_score + edu_score)

    strengths = matched_skills if required_skills else ["Domain match"]
    gaps = [s for s in required_skills if s not in [m for m in matched_skills]] if required_skills else []

    return json.dumps({
        "match_score": match_score,
        "justification": (
            f"Skill overlap: {skill_score}/50pts | "
            f"Experience: {exp_score}/30pts | "
            f"Education: {edu_score}/20pts"
        ),
        "strengths": strengths,
        "gaps": gaps
    })


def _local_ranker(candidates: list) -> str:
    """Rank candidates: eligible first (by score desc), disqualified last."""
    eligible     = [c for c in candidates if c.get("error") != "DOMAIN_MISMATCH"]
    disqualified = [c for c in candidates if c.get("error") == "DOMAIN_MISMATCH"]

    eligible.sort(key=lambda x: x.get("match_score", 0), reverse=True)

    ranked_names = (
        [c.get("candidate_name", "Unknown") for c in eligible] +
        [c.get("candidate_name", "Unknown") for c in disqualified]
    )

    disqualified_info = [
        {
            "name": c.get("candidate_name", "Unknown"),
            "reason": (
                f"Domain mismatch — resume is for a '{c.get('domain', 'unknown')}' role, "
                f"not suitable for this position."
            )
        }
        for c in disqualified
    ]

    return json.dumps({
        "ranked_names": ranked_names,
        "disqualified": disqualified_info
    })


def _local_reporter(job_title: str, ranked_candidates: list, disqualified: list) -> str:
    eligible = [c for c in ranked_candidates if c.get("error") != "DOMAIN_MISMATCH"]
    top      = eligible[0] if eligible else None

    if top:
        summary = (
            f"{top.get('candidate_name', 'The top candidate')} ranked first for '{job_title}' "
            f"with a match score of {top.get('match_score', 0)}%."
        )
    else:
        summary = (
            f"No suitable candidates found for '{job_title}'. "
            f"All submitted resumes were for a different professional domain."
        )

    warnings = [
        {
            "candidate": d.get("name", "Unknown"),
            "issue": d.get("reason", "Domain mismatch")
        }
        for d in disqualified
    ]

    return json.dumps({
        "factors": [
            {"name": "Skill match",         "weight": 50, "description": f"Overlap of candidate skills with {job_title} requirements"},
            {"name": "Years of experience", "weight": 30, "description": f"Candidate experience vs minimum required for {job_title}"},
            {"name": "Education",           "weight": 20, "description": "Highest degree attained vs job education requirement"},
        ],
        "summary": summary,
        "warnings": warnings
    })


def _local_agent_response(agent_name: str, prompt: str, **kwargs) -> str:
    if "job_requirements" in agent_name:
        return _local_job_requirements(prompt)
    if "resume_parser" in agent_name:
        return _local_resume_parser(prompt)
    if "job_matcher" in agent_name or "matcher" in agent_name:
        # Expect kwargs: job_req=dict, candidate=dict
        return _local_matcher(kwargs.get("job_req", {}), kwargs.get("candidate", {}))
    if "rank" in agent_name or "ranker" in agent_name:
        return _local_ranker(kwargs.get("candidates", []))
    if "reporter" in agent_name:
        return _local_reporter(
            kwargs.get("job_title", ""),
            kwargs.get("ranked_candidates", []),
            kwargs.get("disqualified", [])
        )
    return json.dumps({})


# ── ADK async call ───────────────────────────────────────────────────────────

async def call_agent_async(agent, prompt: str, retries: int = 3) -> str:
    if not _USE_ADK:
        return _local_agent_response(getattr(agent, "name", str(agent)), prompt)

    Runner, InMemorySessionService, genai_types = _get_adk()

    for attempt in range(retries):
        try:
            session_service = InMemorySessionService()
            app_name   = f"bridge_{getattr(agent, 'name', 'agent')}"
            user_id    = "system"
            session_id = f"sess_{getattr(agent, 'name', 'agent')}_{abs(hash(prompt)) % 1_000_000}_{attempt}"

            await session_service.create_session(app_name=app_name, user_id=user_id, session_id=session_id)
            runner  = Runner(agent=agent, app_name=app_name, session_service=session_service)
            message = genai_types.Content(role="user", parts=[genai_types.Part(text=prompt)])

            full_text = ""
            async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=message):
                if event.is_final_response() and event.content and event.content.parts:
                    full_text = "".join(
                        part.text for part in event.content.parts
                        if hasattr(part, "text") and part.text is not None
                    )
            return full_text.strip()
        except Exception as e:
            err_str = str(e)
            if ("429" in err_str or "RESOURCE_EXHAUSTED" in err_str) and attempt < retries - 1:
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


# ── Main pipeline ────────────────────────────────────────────────────────────

DEFAULT_RANKING_CRITERIA = {"factors": [], "summary": "", "warnings": []}


def _throttle():
    time.sleep(0.01)


def run_matching_pipeline(job_title: str, candidates: list, job_description_text: str = "") -> dict:
    print(f"Starting pipeline: '{job_title}' — candidates: {len(candidates)}")

    # ── STEP 1: Extract & validate job requirements ──────────────────────────
    if job_description_text:
        jd_prompt = f"Job Title: {job_title}\n\nJob Description:\n{job_description_text}\n"
    else:
        jd_prompt = f"Job Title: {job_title}\n\nGenerate job requirements.\n"

    if _USE_ADK:
        from my_agent.sub_agents.job_requirements import job_requirements_agent
        job_req_raw = call_agent(job_requirements_agent, jd_prompt)
    else:
        job_req_raw = _local_job_requirements(jd_prompt)

    job_req = parse_json_response(job_req_raw) or {"title": job_title}

    # Hard stop: JD does not match job title
    if job_req.get("error") == "JD_TITLE_MISMATCH":
        print(f"[Pipeline] JD_TITLE_MISMATCH: {job_req.get('message')}")
        return {
            "error": "JD_TITLE_MISMATCH",
            "message": job_req["message"],
            "candidates": [],
            "ranking_criteria": DEFAULT_RANKING_CRITERIA
        }

    job_domain = job_req.get("domain") or _classify_domain(job_title)
    print(f"[Pipeline] Job domain resolved: '{job_domain}'")

    # ── STEP 2: Parse resumes ────────────────────────────────────────────────
    parsed_candidates = []
    for c in candidates:
        resume_text = c.get("resume_text", "")
        if _USE_ADK:
            from my_agent.sub_agents.resume_parser import resume_parser_agent
            parsed_raw = call_agent(resume_parser_agent, resume_text)
        else:
            parsed_raw = _local_resume_parser(resume_text)

        parsed_obj = parse_json_response(parsed_raw) or {}
        # Merge original candidate data with parsed fields
        merged = {**c, **parsed_obj}
        # Ensure domain is set — fall back to classifying raw resume text
        if not merged.get("domain"):
            merged["domain"] = _classify_domain(resume_text)
        parsed_candidates.append(merged)
        _throttle()

    # ── STEP 3: Match each candidate ────────────────────────────────────────
    matched_candidates = []
    for candidate in parsed_candidates:
        candidate_domain = candidate.get("domain", "General")
        print(f"[Pipeline] Matching '{candidate.get('candidate_name')}' "
              f"(domain: {candidate_domain}) vs job domain: {job_domain}")

        if _USE_ADK:
            from my_agent.sub_agents.job_matcher import job_matcher_agent
            match_prompt = json.dumps({"job_requirements": job_req, "candidate_profile": candidate})
            match_raw    = call_agent(job_matcher_agent, match_prompt)
            match_obj    = parse_json_response(match_raw) or {}
        else:
            match_raw = _local_matcher(job_req, candidate)
            match_obj = parse_json_response(match_raw) or {}

        matched_candidates.append({
            **candidate,
            "match_score" : int(match_obj.get("match_score", 0)),
            "justification": match_obj.get("justification", ""),
            "strengths"   : match_obj.get("strengths", []),
            "gaps"        : match_obj.get("gaps", []),
            "error"       : match_obj.get("error"),   # "DOMAIN_MISMATCH" or None
        })
        _throttle()

    # ── STEP 4: Rank candidates ──────────────────────────────────────────────
    if _USE_ADK:
        from my_agent.sub_agents.ranker import ranking_agent
        rank_prompt = json.dumps({"job_title": job_title, "candidates": matched_candidates})
        rank_raw    = call_agent(ranking_agent, rank_prompt)
        ranking     = parse_json_response(rank_raw) or {}
    else:
        rank_raw = _local_ranker(matched_candidates)
        ranking  = parse_json_response(rank_raw) or {}

    disqualified = ranking.get("disqualified", [])

    # Apply the ranking order to matched_candidates list
    name_order = {name: idx for idx, name in enumerate(ranking.get("ranked_names", []))}
    matched_candidates.sort(key=lambda c: name_order.get(c.get("candidate_name", ""), 999))

    # ── STEP 5: Generate report ──────────────────────────────────────────────
    if _USE_ADK:
        from my_agent.sub_agents.reporter import reporter_agent
        report_prompt = json.dumps({
            "job_title"         : job_title,
            "ranked_candidates" : matched_candidates,
            "disqualified"      : disqualified
        })
        report_raw = call_agent(reporter_agent, report_prompt)
        report     = parse_json_response(report_raw) or DEFAULT_RANKING_CRITERIA
    else:
        report_raw = _local_reporter(job_title, matched_candidates, disqualified)
        report     = parse_json_response(report_raw) or DEFAULT_RANKING_CRITERIA

    print(f"[Pipeline] Done. {len(matched_candidates)} candidates processed, "
          f"{len(disqualified)} disqualified.")

    return {
        "job_title"        : job_title,
        "job_domain"       : job_domain,
        "candidates"       : matched_candidates,
        "disqualified"     : disqualified,
        "ranking_criteria" : report
    }