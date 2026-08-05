"""
Agent API main entry point for deployment.
This provides a web API interface for the recruitment agent functionality.
"""

import os
import sys
from pathlib import Path

# Ensure proper path setup for imports
current_dir = Path(__file__).resolve().parent
agent_root = current_dir.parent
sys.path.insert(0, str(agent_root))
sys.path.insert(0, str(agent_root.parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Resume Ranking Agent API",
    description="AI-powered resume ranking and job matching service",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.onrender.com",
        "https://*.netlify.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "resume-ranking-agent"}

# Import and include routers
try:
    from .routes import resumes, rankings, jobs
    
    app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])
    app.include_router(rankings.router, prefix="/api/rankings", tags=["Rankings"])  
    app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
    
    logger.info("Successfully loaded all API routes")
except ImportError as e:
    logger.error(f"Failed to import routes: {e}")
    # Fallback route if imports fail
    @app.get("/api/status")
    async def status():
        return {"status": "Agent service running but routes unavailable", "error": str(e)}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Resume Ranking Agent API",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)


