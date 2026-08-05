"""
WSGI entry point for Agent deployment on Render.
This file ensures the Agent API is properly exposed for production deployment.
"""

import os
import sys
from pathlib import Path

# Add the Agent directory to Python path
agent_dir = Path(__file__).parent.resolve()
sys.path.insert(0, str(agent_dir))

try:
    # Import the FastAPI application from the agent API
    from my_agent.api.main import app
    
    # Expose the app for WSGI servers
    application = app
    
    print("✅ Agent API application loaded successfully")
    
except ImportError as e:
    print(f"❌ Failed to import agent API: {e}")
    
    # Create a minimal fallback app
    from fastapi import FastAPI
    
    app = FastAPI(title="Agent Service (Fallback)")
    
    @app.get("/")
    async def root():
        return {"status": "Agent service running in fallback mode", "error": str(e)}
    
    @app.get("/health")
    async def health():
        return {"status": "unhealthy", "error": "Import failed"}
    
    application = app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(application, host="0.0.0.0", port=port)