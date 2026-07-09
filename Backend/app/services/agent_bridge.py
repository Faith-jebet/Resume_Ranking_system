import os
import re
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# Load .env
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
AGENT_PATH = os.path.abspath(os.path.join(BASE_DIR, "../../../Agent"))
agent_env  = Path(AGENT_PATH) / "my_agent" / ".env"
backend_env = Path(BASE_DIR).parents[1] / ".env"

if agent_env.exists():
    load_dotenv(dotenv_path=agent_env, override=True)
elif backend_env.exists():
    load_dotenv(dotenv_path=backend_env, override=True)


# ── Domain classification ────────────────────────────────────────────────────

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
    "database"        : "Database Administration",
    "dba"             : "Database Administration",
    "db admin"        : "Database Administration",
}


def _classify_domain(text: str) -> str:
    lowered = text.lower()
    for keyword, domain in DOMAIN_KEYWORDS.items():
        if keyword in lowered:
            return domain
    return "General"


def _domains_are_compatible(job_domain: str, candidate_domain: str) -> bool:
    if job_domain == candidate_domain:
        return True
    compatible_groups = [
        {"Software Engineering", "Data Science", "Data Analytics", "DevOps", "Database Administration"},
        {"Finance", "Business Analysis"},
        {"Human Resources", "Business Analysis"},
    ]
    for group in compatible_groups:
        if job_domain in group and candidate_domain in group:
            return True
    return False


# ── Skill extraction (used by fallbacks only) ────────────────────────────────

def _extract_skills_from_text(text: str, candidate_name: str = "") -> list:
    extracted = []

    skill_section = re.search(
        r'(skills|competencies|expertise|proficiencies|technical skills|'
        r'core competencies|key skills|areas of expertise)'
        r'[\s:]*\n(.*?)(\n{2,}|\Z)',
        text, re.IGNORECASE | re.DOTALL
    )
    if skill_section:
        raw_items = re.split(r'[•\-,|;\n]+', skill_section.group(2))
        extracted = [i.strip() for i in raw_items if 2 < len(i.strip()) < 60]

    if not extracted:
        NOISE = {
            "university", "college", "institute", "january", "february", "march",
            "april", "august", "september", "october", "november", "december",
            "present", "references", "page", "email", "phone",
        }
        seen = set()
        for p in re.findall(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b', text):
            pl = p.lower()
            if 2 < len(p) < 50 and p not in (candidate_name or "") \
                    and pl not in NOISE and not any(n in pl for n in NOISE) \
                    and pl not in seen:
                extracted.append(p)
                seen.add(pl)
                if len(extracted) >= 20:
                    break

    return extracted


# ── Regex fallbacks (used only when GroqAgent raises an exception) ───────────

def _fallback_job_requirements(job_title: str, job_description_text: str) -> dict:
    print("[Bridge] ⚠️  Using regex fallback for job requirements")
    source = job_description_text or job_title
    exp_match = re.search(r"(\d+)\s*\+?\s*years?\s*(of\s*)?experience", source, re.IGNORECASE)
    return {
        "title"           : job_title,
        "domain"          : _classify_domain(source),
        "required_skills" : _extract_skills_from_text(source)[:10],
        "preferred_skills": [],
        "experience_years": int(exp_match.group(1)) if exp_match else 2,
        "education"       : "Bachelor's degree in a relevant field",
        "responsibilities": [f"Perform core duties of a {job_title}"],
    }


def _fallback_resume_parser(resume_text: str) -> dict:
    print("[Bridge] ⚠️  Using regex fallback for resume parsing")
    candidate_name = "Unknown Candidate"
    for line in resume_text.splitlines():
        line = line.strip()
        if line and "@" not in line and len(line.split()) <= 5 and len(line) > 2:
            candidate_name = line
            break

    email_match = re.search(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", resume_text, re.IGNORECASE)
    exp_match   = re.search(r"(\d+)\s*\+?\s*years?\s*(of\s*)?experience", resume_text, re.IGNORECASE)

    degree = ""
    for line in resume_text.splitlines():
        if any(k in line.lower() for k in [
            "bachelor", "master", "phd", "bsc", "msc", "degree",
            "diploma", "certificate", "llb", "mba",
        ]):
            degree = line.strip()
            break

    return {
        "candidate_name"  : candidate_name,
        "email"           : email_match.group(0) if email_match else None,
        "domain"          : _classify_domain(resume_text),
        "skills"          : _extract_skills_from_text(resume_text, candidate_name),
        "tools"           : [],
        "years_experience": int(exp_match.group(1)) if exp_match else 0,
        "education"       : {"degree": degree, "university": ""},
        "certifications"  : [],
        "projects"        : [],
        "soft_skills"     : [],
    }


def _fallback_matcher(job_req: dict, candidate: dict) -> dict:
    print(f"[Bridge] ⚠️  Using regex fallback for matching '{candidate.get('candidate_name')}'")
    job_domain       = job_req.get("domain", _classify_domain(job_req.get("title", "")))
    candidate_domain = candidate.get("domain", "General")

    if not _domains_are_compatible(job_domain, candidate_domain):
        return {
            "error"        : "DOMAIN_MISMATCH",
            "match_score"  : 0,
            "justification": f"Domain mismatch: '{candidate_domain}' vs '{job_domain}'",
            "strengths"    : [],
            "gaps"         : [f"Candidate is from '{candidate_domain}', job requires '{job_domain}'"],
        }

    required   = [s.lower() for s in job_req.get("required_skills", [])]
    all_cand   = set(s.lower() for s in candidate.get("skills", []) + candidate.get("tools", []))
    matched    = [s for s in required if any(s in cs or cs in s for cs in all_cand)]
    skill_score = int((len(matched) / len(required)) * 50) if required else 25

    req_exp  = int(job_req.get("experience_years", 0))
    cand_exp = int(candidate.get("years_experience", 0))
    exp_score = 30 if (req_exp == 0 or cand_exp >= req_exp) else (20 if cand_exp >= req_exp * 0.7 else (10 if cand_exp > 0 else 0))

    degree = (candidate.get("education") or {}).get("degree", "").lower()
    edu_score = (20 if "phd" in degree or "doctorate" in degree
                 else 18 if any(k in degree for k in ["master", "msc", "mba"])
                 else 15 if any(k in degree for k in ["bachelor", "bsc", "llb"])
                 else 10 if any(k in degree for k in ["diploma", "certificate"])
                 else 10)

    score = min(100, skill_score + exp_score + edu_score)
    return {
        "match_score"  : score,
        "justification": f"Skill: {skill_score}/50 | Exp: {exp_score}/30 | Edu: {edu_score}/20",
        "strengths"    : matched or (["Domain match"] if not required else []),
        "gaps"         : [s for s in required if s not in matched],
    }


# ── Main pipeline ────────────────────────────────────────────────────────────

DEFAULT_RANKING_CRITERIA = {"factors": [], "summary": "", "warnings": []}


def run_matching_pipeline(job_title: str, candidates: list, job_description_text: str = "") -> dict:
    print(f"\n[Pipeline] Starting: '{job_title}' — {len(candidates)} candidates")

    # Import real GroqAgents
    from my_agent.sub_agents.job_requirements import job_requirements_agent
    from my_agent.sub_agents.resume_parser    import resume_parser_agent
    from my_agent.sub_agents.job_matcher      import job_matcher_agent
    from my_agent.sub_agents.ranker           import rank_candidates
    from my_agent.sub_agents.reporter         import reporter_agent

    # ── STEP 1: Job requirements ─────────────────────────────────────────────
    try:
        job_req = job_requirements_agent.run({
            "job_title"      : job_title,
            "job_description": job_description_text or "",
        })
        print(f"[Pipeline] ✅ Job requirements extracted — domain: {job_req.get('domain')}")
        print(f"[Pipeline]    Required skills: {job_req.get('required_skills', [])}")
    except Exception as e:
        print(f"[Pipeline] ❌ job_requirements_agent failed: {e}")
        job_req = _fallback_job_requirements(job_title, job_description_text)

    if job_req.get("error") == "JD_TITLE_MISMATCH":
        print(f"[Pipeline] JD_TITLE_MISMATCH: {job_req.get('message')}")
        return {
            "error"           : "JD_TITLE_MISMATCH",
            "message"         : job_req["message"],
            "candidates"      : [],
            "ranking_criteria": DEFAULT_RANKING_CRITERIA,
        }

    job_domain = job_req.get("domain") or _classify_domain(job_title)

    # ── STEP 2: Parse resumes ────────────────────────────────────────────────
    parsed_candidates = []
    for c in candidates:
        resume_text = c.get("resume_text", "")
        try:
            parsed = resume_parser_agent.run({"resume_text": resume_text})
            print(f"[Pipeline] ✅ Parsed '{parsed.get('candidate_name')}' — skills: {parsed.get('skills', [])[:5]}")
        except Exception as e:
            print(f"[Pipeline] ❌ resume_parser_agent failed: {e}")
            parsed = _fallback_resume_parser(resume_text)

        merged = {**c, **parsed}
        if not merged.get("domain"):
            merged["domain"] = _classify_domain(resume_text)
        parsed_candidates.append(merged)
        time.sleep(0.5)  # respect Groq rate limits

    # ── STEP 3: Match candidates ─────────────────────────────────────────────
    matched_candidates = []
    for candidate in parsed_candidates:
        try:
            match = job_matcher_agent.run({
                "job_requirements" : job_req,
                "candidate_profile": candidate,
            })
            print(f"[Pipeline] ✅ Matched '{candidate.get('candidate_name')}' — {match.get('match_score')}%")
        except Exception as e:
            print(f"[Pipeline] ❌ job_matcher_agent failed: {e}")
            match = _fallback_matcher(job_req, candidate)

        matched_candidates.append({
            **candidate,
            "match_score"  : int(match.get("match_score", 0)),
            "justification": match.get("justification", ""),
            "strengths"    : match.get("strengths", []),
            "gaps"         : match.get("gaps", []),
            "error"        : match.get("error"),
        })
        time.sleep(0.5)

    # ── STEP 4: Rank ─────────────────────────────────────────────────────────
    try:
        ranking = rank_candidates(matched_candidates)
        print(f"[Pipeline] ✅ Ranked {len(matched_candidates)} candidates")
    except Exception as e:
        print(f"[Pipeline] ❌ ranking failed: {e}")
        eligible     = [c for c in matched_candidates if c.get("error") != "DOMAIN_MISMATCH"]
        disqualified = [c for c in matched_candidates if c.get("error") == "DOMAIN_MISMATCH"]
        eligible.sort(key=lambda x: x.get("match_score", 0), reverse=True)
        ranking = {
            "ranked_names": [c.get("candidate_name") for c in eligible + disqualified],
            "disqualified": [{"name": c.get("candidate_name"), "reason": "Domain mismatch"} for c in disqualified],
        }

    disqualified = ranking.get("disqualified", [])
    name_order   = {name: idx for idx, name in enumerate(ranking.get("ranked_names", []))}
    matched_candidates.sort(key=lambda c: name_order.get(c.get("candidate_name", ""), 999))

    # ── STEP 5: Report ───────────────────────────────────────────────────────
    try:
        report = reporter_agent.run({
            "job_title"        : job_title,
            "ranked_candidates": matched_candidates,
            "disqualified"     : disqualified,
        })
        print(f"[Pipeline] ✅ Report generated")
    except Exception as e:
        print(f"[Pipeline] ❌ reporter_agent failed: {e}")
        eligible = [c for c in matched_candidates if c.get("error") != "DOMAIN_MISMATCH"]
        top      = eligible[0] if eligible else None
        report   = {
            "factors": [
                {"name": "Skill match",         "weight": 50, "description": f"Overlap of candidate skills with {job_title} requirements"},
                {"name": "Years of experience", "weight": 30, "description": f"Experience vs minimum required for {job_title}"},
                {"name": "Education",           "weight": 20, "description": "Highest degree attained vs job requirement"},
            ],
            "summary": (
                f"{top.get('candidate_name')} ranked first with {top.get('match_score')}%."
                if top else f"No suitable candidates found for '{job_title}'."
            ),
            "warnings": [{"candidate": d.get("name"), "issue": d.get("reason")} for d in disqualified],
        }

    print(f"[Pipeline] Done. {len(matched_candidates)} processed, {len(disqualified)} disqualified.\n")

    return {
        "job_title"       : job_title,
        "job_domain"      : job_domain,
        "candidates"      : matched_candidates,
        "disqualified"    : disqualified,
        "ranking_criteria": report,
    }