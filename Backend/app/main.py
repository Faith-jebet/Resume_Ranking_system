import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
AGENT_PATH = PROJECT_ROOT / "Agent"

sys.path.insert(0, str(AGENT_PATH))

print("=" * 70)
print("Current working directory:", os.getcwd())
print("PROJECT_ROOT:", PROJECT_ROOT)
print("AGENT_PATH:", AGENT_PATH)
print("Agent exists:", AGENT_PATH.exists())

if AGENT_PATH.exists():
    print("Agent contents:", os.listdir(AGENT_PATH))

print("sys.path:")
for p in sys.path[:5]:
    print(" ", p)

try:
    import my_agent
    print("SUCCESS: my_agent imported")
except Exception as e:
    print("FAILED:", repr(e))

print("=" * 70)