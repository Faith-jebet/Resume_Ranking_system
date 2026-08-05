"""
mcp_client.py
MCP stdio client utilities for the resume-ranking DB server.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from mcp.client.session import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client


def _agent_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _server_parameters() -> StdioServerParameters:
    command = os.getenv("MCP_SERVER_COMMAND", sys.executable)
    module_name = os.getenv("MCP_SERVER_MODULE", "my_agent.mcp_server")

    # Pass DB settings through when running as a spawned process.
    env = {k: v for k, v in os.environ.items() if k.startswith("DB_")}

    return StdioServerParameters(
        command=command,
        args=["-m", module_name],
        cwd=str(_agent_root()),
        env=env,
    )


@asynccontextmanager
async def open_session():
    """Open and initialize an MCP client session over stdio."""
    async with stdio_client(_server_parameters()) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            yield session


async def list_tools_async() -> list[str]:
    """List available tool names from the MCP server."""
    async with open_session() as session:
        result = await session.list_tools()
        return [tool.name for tool in result.tools]


async def call_tool_async(name: str, arguments: dict[str, Any] | None = None) -> Any:
    """Call an MCP tool and return parsed content when possible."""
    async with open_session() as session:
        result = await session.call_tool(name=name, arguments=arguments or {})

        if result.structuredContent is not None:
            return result.structuredContent

        texts: list[str] = []
        for block in result.content:
            if getattr(block, "type", None) == "text":
                texts.append(block.text)

        if texts:
            raw = "\n".join(texts)
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                return {"raw": raw, "is_error": result.isError}

        return {
            "content": [block.model_dump() for block in result.content],
            "is_error": result.isError,
        }


def _run(coro):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)

    if not loop.is_running():
        return loop.run_until_complete(coro)

    import concurrent.futures

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(asyncio.run, coro)
        return future.result(timeout=120)


def list_tools() -> list[str]:
    return _run(list_tools_async())


def call_tool(name: str, arguments: dict[str, Any] | None = None) -> Any:
    return _run(call_tool_async(name=name, arguments=arguments))
