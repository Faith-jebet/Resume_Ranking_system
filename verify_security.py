#!/usr/bin/env python3
"""
Security Verification Script
Checks if sensitive files are properly protected by .gitignore
"""

import os
import subprocess
from pathlib import Path

# ANSI color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def check_mark(status):
    return f"{GREEN}✓{RESET}" if status else f"{RED}✗{RESET}"

def print_header(text):
    print(f"\n{BLUE}{'='*70}{RESET}")
    print(f"{BLUE}{text.center(70)}{RESET}")
    print(f"{BLUE}{'='*70}{RESET}\n")

def check_file_exists(filepath):
    """Check if a file exists"""
    return Path(filepath).exists()

def check_gitignore():
    """Verify .gitignore files exist and contain required entries"""
    print_header("CHECKING .GITIGNORE FILES")
    
    gitignore_checks = [
        (".gitignore", [".env", "credentials.json", "*.db"]),
        ("Agent/.gitignore", [".env", "credentials.json", "token.pickle"]),
        ("Backend/.gitignore", [".env", "*.db"]),
        ("frontend/.gitignore", [".env", ".env.local"]),
    ]
    
    all_good = True
    for gitignore_path, required_entries in gitignore_checks:
        exists = check_file_exists(gitignore_path)
        status = check_mark(exists)
        print(f"{status} {gitignore_path}")
        
        if exists:
            with open(gitignore_path, 'r') as f:
                content = f.read()
                for entry in required_entries:
                    if entry in content:
                        print(f"  {GREEN}✓{RESET} Contains: {entry}")
                    else:
                        print(f"  {RED}✗{RESET} Missing: {entry}")
                        all_good = False
        else:
            print(f"  {RED}File not found!{RESET}")
            all_good = False
    
    return all_good

def check_env_examples():
    """Check if .env.example files exist"""
    print_header("CHECKING .ENV.EXAMPLE FILES")
    
    example_files = [
        "Agent/.env.example",
        "Backend/.env.example",
        "frontend/.env.example",
    ]
    
    all_good = True
    for example_file in example_files:
        exists = check_file_exists(example_file)
        status = check_mark(exists)
        print(f"{status} {example_file}")
        if not exists:
            all_good = False
    
    return all_good

def check_sensitive_files():
    """Check if sensitive files exist (they should not be committed)"""
    print_header("CHECKING FOR SENSITIVE FILES")
    
    sensitive_files = [
        ("Agent/.env", "Contains Groq API key"),
        ("Backend/.env", "Contains secrets and OAuth credentials"),
        ("frontend/.env", "Contains OAuth credentials"),
        ("Agent/my_agent/config/credentials.json", "Gmail API OAuth credentials"),
        ("Agent/my_agent/tools/token.pickle", "Gmail API token"),
    ]
    
    for filepath, description in sensitive_files:
        exists = check_file_exists(filepath)
        if exists:
            print(f"{YELLOW}⚠{RESET}  {filepath} exists")
            print(f"   → {description}")
            print(f"   → {RED}MUST be in .gitignore{RESET}")
        else:
            print(f"{GREEN}✓{RESET} {filepath} not found (or not yet created)")

def check_git_status():
    """Check if any sensitive files are tracked by git"""
    print_header("CHECKING GIT STATUS")
    
    try:
        # Check if we're in a git repository
        result = subprocess.run(
            ['git', 'rev-parse', '--git-dir'],
            capture_output=True,
            text=True,
            check=False
        )
        
        if result.returncode != 0:
            print(f"{YELLOW}⚠{RESET}  Not a git repository (this is OK if you haven't initialized git yet)")
            return True
        
        # Check for tracked sensitive files
        sensitive_patterns = ['.env', 'credentials.json', '*.db', 'token.pickle']
        
        result = subprocess.run(
            ['git', 'ls-files'],
            capture_output=True,
            text=True,
            check=False
        )
        
        tracked_files = result.stdout.split('\n')
        found_sensitive = []
        
        for pattern in sensitive_patterns:
            matching = [f for f in tracked_files if pattern.replace('*', '') in f]
            if matching:
                found_sensitive.extend(matching)
        
        if found_sensitive:
            print(f"{RED}✗ CRITICAL: Sensitive files are tracked by git:{RESET}")
            for f in found_sensitive:
                print(f"  {RED}→{RESET} {f}")
            print(f"\n{RED}ACTION REQUIRED: Remove these from git history!{RESET}")
            return False
        else:
            print(f"{GREEN}✓{RESET} No sensitive files tracked by git")
            return True
            
    except FileNotFoundError:
        print(f"{YELLOW}⚠{RESET}  Git not found in PATH (install git to run this check)")
        return True

def check_env_variables():
    """Check if required environment variables can be loaded"""
    print_header("CHECKING ENVIRONMENT VARIABLES")
    
    checks = []
    
    # Check Agent .env
    agent_env_path = Path("Agent/.env")
    if agent_env_path.exists():
        try:
            from dotenv import dotenv_values
            agent_env = dotenv_values("Agent/.env")
            has_groq = bool(agent_env.get("GROQ_API_KEY"))
            status = check_mark(has_groq)
            print(f"{status} Agent GROQ_API_KEY {'configured' if has_groq else 'missing'}")
            checks.append(has_groq)
        except ImportError:
            print(f"{YELLOW}⚠{RESET}  python-dotenv not installed (run: pip install python-dotenv)")
    else:
        print(f"{RED}✗{RESET} Agent/.env not found")
        checks.append(False)
    
    # Check Backend .env
    backend_env_path = Path("Backend/.env")
    if backend_env_path.exists():
        try:
            from dotenv import dotenv_values
            backend_env = dotenv_values("Backend/.env")
            has_auth = bool(backend_env.get("AUTH_SECRET_KEY"))
            has_groq = bool(backend_env.get("GROQ_API_KEY"))
            
            print(f"{check_mark(has_auth)} Backend AUTH_SECRET_KEY {'configured' if has_auth else 'missing'}")
            print(f"{check_mark(has_groq)} Backend GROQ_API_KEY {'configured' if has_groq else 'missing'}")
            checks.extend([has_auth, has_groq])
        except ImportError:
            pass
    else:
        print(f"{RED}✗{RESET} Backend/.env not found")
        checks.append(False)
    
    return all(checks) if checks else False

def main():
    print(f"\n{BLUE}{'='*70}{RESET}")
    print(f"{BLUE}Resume Ranking System - Security Verification{RESET}".center(70))
    print(f"{BLUE}{'='*70}{RESET}")
    
    results = []
    
    results.append(("GitIgnore Files", check_gitignore()))
    results.append(("Example Files", check_env_examples()))
    check_sensitive_files()  # Informational only
    results.append(("Git Tracking", check_git_status()))
    results.append(("Environment Variables", check_env_variables()))
    
    print_header("SUMMARY")
    
    all_passed = all(result for _, result in results)
    
    for check_name, passed in results:
        status = check_mark(passed)
        print(f"{status} {check_name}")
    
    print()
    if all_passed:
        print(f"{GREEN}{'✓ ALL CHECKS PASSED':^70}{RESET}")
        print(f"{GREEN}{'Your configuration is secure!':^70}{RESET}")
    else:
        print(f"{RED}{'✗ SOME CHECKS FAILED':^70}{RESET}")
        print(f"{YELLOW}{'Review the issues above and fix them':^70}{RESET}")
    
    print(f"\n{BLUE}{'='*70}{RESET}\n")
    
    # Additional recommendations
    print(f"{BLUE}NEXT STEPS:{RESET}")
    print(f"1. Review {YELLOW}SECURITY_NOTICE.md{RESET} for credential rotation instructions")
    print(f"2. Follow {YELLOW}GMAIL_SETUP_GUIDE.md{RESET} to configure Gmail API")
    print(f"3. Check {YELLOW}ENVIRONMENT_SETUP.md{RESET} for full configuration details")
    print()

if __name__ == "__main__":
    main()
