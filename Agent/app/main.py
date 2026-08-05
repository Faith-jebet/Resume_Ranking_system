import os
import sys


APP_DIR = os.path.dirname(os.path.abspath(__file__))
AGENT_DIR = os.path.dirname(APP_DIR)
PROJECT_ROOT = os.path.dirname(AGENT_DIR)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from Backend.app.main import app  # noqa: E402
