from my_agent.sub_agents.resume_parser import resume_parser_agent

resume_text = """
John Doe
john.doe@gmail.com

Software Engineer with 4 years of experience.

Skills:
Python
FastAPI
React
PostgreSQL

Bachelor of Science in Computer Science
University of Nairobi
"""

result = resume_parser_agent.run(
    {
        "resume_text": resume_text
    }
)

print(result)