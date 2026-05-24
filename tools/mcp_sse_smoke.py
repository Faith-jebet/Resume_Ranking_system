#!/usr/bin/env python3
"""
tools/mcp_sse_smoke.py
A smoke test for the MCP SSE transport server hosted inside the FastAPI app.

To run:
1. Start your FastAPI server:
   python Backend/app/main.py

2. In another terminal, run this test:
   python tools/mcp_sse_smoke.py
"""

import asyncio
import sys

# Force stdout/stderr to use UTF-8 encoding on Windows
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

from mcp import ClientSession
from mcp.client.sse import sse_client

async def main():
    url = "http://localhost:8000/api/mcp/sse"
    print(f"🔄 Connecting to MCP SSE Server at: {url}")
    
    try:
        async with sse_client(url) as (read_stream, write_stream):
            print("✅ SSE Connection established! Initializing ClientSession...")
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                print("🎉 Session initialized successfully!")
                
                # 1. List tools
                print("\n📋 Fetching registered tools...")
                response = await session.list_tools()
                tools = response.tools
                print(f"✅ Found {len(tools)} tools:")
                for tool in tools:
                    print(f"  - {tool.name}: {tool.description}")
                
                # 2. Call a simple test tool (e.g. get_all_jobs)
                test_tool = "get_all_jobs"
                if any(t.name == test_tool for t in tools):
                    print(f"\n🚀 Invoking tool '{test_tool}'...")
                    result = await session.call_tool(test_tool, {})
                    print(f"✅ Result from '{test_tool}':")
                    
                    # Output tool content
                    for block in result.content:
                        if getattr(block, "type", None) == "text":
                            print(block.text[:1000])
                else:
                    print(f"\n⚠️ '{test_tool}' tool not found in list.")
                    
    except Exception as e:
        print(f"\n❌ Error during smoke test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
