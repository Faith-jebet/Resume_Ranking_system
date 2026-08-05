"""
Main entry point for the Resume Ranking Agent service.
This can run in different modes: web API server or standalone agent.
"""

import os
import sys
import argparse
from pathlib import Path

# Ensure proper path setup
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir))
sys.path.insert(0, str(current_dir.parent))

def run_api_server():
    """Run the agent as a web API server."""
    import uvicorn
    from my_agent.api.main import app
    
    port = int(os.environ.get("PORT", 8001))
    host = "0.0.0.0"
    
    print(f"Starting Resume Ranking Agent API server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)

def run_agent_demo():
    """Run a demo of the agent functionality."""
    try:
        from my_agent.agent import RecruitmentOrchestrator
        
        orchestrator = RecruitmentOrchestrator()
        result = orchestrator.process_recruitment(
            job_title="Software Engineer",
            job_description="Looking for a skilled software engineer with Python and React experience."
        )
        print("Agent demo result:", result)
    except ImportError as e:
        print(f"Could not run agent demo: {e}")
        print("Agent functionality may not be fully configured")

def main():
    parser = argparse.ArgumentParser(description="Resume Ranking Agent")
    parser.add_argument(
        "--mode",
        choices=["api", "demo"],
        default="api",
        help="Run mode: 'api' for web server (default), 'demo' for demonstration"
    )
    
    args = parser.parse_args()
    
    if args.mode == "api":
        run_api_server()
    elif args.mode == "demo":
        run_agent_demo()

if __name__ == "__main__":
    # For deployment, default to API mode if no arguments provided
    if len(sys.argv) == 1:
        run_api_server()
    else:
        main()