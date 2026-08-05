"""
app/routes/resumes.py
─────────────────────
Endpoints for reading stored resume records from the MCP / SQLite layer.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["Resumes"])


@router.get("/resumes")
def list_resumes():
    try:
        from my_agent.mcp_server import handle_tool
        return handle_tool("get_all_resumes", {})
    except ImportError:
        return {"error": "MCP server not available", "resumes": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/resumes/{resume_id}")
def get_resume(resume_id: int):
    try:
        from my_agent.mcp_server import handle_tool
        result = handle_tool("get_resume", {"resume_id": resume_id})
        if not result:
            raise HTTPException(status_code=404, detail="Resume not found")
        return result
    except ImportError:
        raise HTTPException(status_code=503, detail="MCP server not available")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
