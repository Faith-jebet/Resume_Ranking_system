#!/usr/bin/env python3
"""Simple MCP database smoke test.

Run after the backend service is up:

    python tools/mcp_smoke.py

This imports the agent MCP server module and calls the `get_all_jobs` tool
using the server-side handler (no stdio transport). It's a quick live check
to confirm DB connectivity from the MCP codepath.
"""
import sys
import os
import json
import traceback

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
AGENT_PATH = os.path.join(BASE, "Agent")
if AGENT_PATH not in sys.path:
    sys.path.insert(0, AGENT_PATH)

def main():
    try:
        import my_agent.mcp_server as mcp_server
        print("Imported my_agent.mcp_server")
    except Exception as e:
        print("Failed to import my_agent.mcp_server:", e)
        traceback.print_exc()
        return

    try:
        res = mcp_server.handle_tool('get_all_jobs', {})
        print("get_all_jobs returned (len):", len(res) if isinstance(res, list) else type(res))
        print(json.dumps(res, default=str, indent=2)[:4000])
    except Exception as e:
        print("Error calling handle_tool('get_all_jobs'):", e)
        traceback.print_exc()

if __name__ == '__main__':
    main()
