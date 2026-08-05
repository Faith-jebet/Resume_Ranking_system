"""
WSGI entry point for Render deployment.
This file ensures the FastAPI app is properly exposed for production deployment.
"""

import os
import sys
from pathlib import Path

# Add the Backend directory to Python path
backend_dir = Path(__file__).parent.resolve()
sys.path.insert(0, str(backend_dir))

# Import the FastAPI application
from app.main import app

# Expose the app for WSGI servers
application = app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)