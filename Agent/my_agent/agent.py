from google.adk.agents.llm_agent import Agent
from my_agent.sub_agents.resume_parser import resume_parser_agent
from my_agent.sub_agents.job_matcher import job_matcher_agent
from my_agent.sub_agents.ranker import rank_candidates
from my_agent.sub_agents.reporter import reporter_agent
from my_agent.sub_agents.job_requirements import job_requirements_agent
from my_agent.tools.email_tool import email_ingestion_tool


class RecruitmentOrchestrator:
    def __init__(self):
        self.resume_parser = resume_parser_agent
        self.job_requirements = job_requirements_agent
        self.job_matcher = job_matcher_agent
        self.reporter = reporter_agent

    def process_recruitment(self, job_title, job_description, email_subject="Resume Analyzing"):
        job_requirements = self.job_requirements.run({
            "job_title": job_title,
            "job_description": job_description
        })
        if job_requirements.get("error"):
            return job_requirements

        ingestion_result = email_ingestion_tool(subject=email_subject)
        resumes = ingestion_result.get("data", [])
        candidates = []
        for resume in resumes:
            candidate = self.resume_parser.run({
                "resume_text": resume.get("resume_text", "")
            })

            match_result = self.job_matcher.run({
                "job_requirements": job_requirements,
                "candidate_profile": candidate
            })

            candidate.update(match_result)
            candidates.append(candidate)

        ranking = rank_candidates(candidates)

        report = self.reporter.run({
            "job_title": job_title,
            "ranking": ranking,
            "candidates": candidates
        })

        return {
            "job_requirements": job_requirements,
            "ranking": ranking,
            "report": report,
            "candidates": candidates
        }