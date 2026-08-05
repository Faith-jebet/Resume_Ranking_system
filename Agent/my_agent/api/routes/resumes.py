from fastapi import APIRouter, HTTPException
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
def get_all_resumes():
    """Get all resumes from the database."""
    try:
        # Try to import the database function
        from database.sqlite_db import get_all_resumes as load_all_resumes
        resumes = load_all_resumes()
        return {
            "count": len(resumes),
            "data": resumes,
        }
    except ImportError as e:
        logger.error(f"Database import failed: {e}")
        # Return mock data for now
        return {
            "count": 0,
            "data": [],
            "message": "Database connection unavailable"
        }
    except Exception as e:
        logger.error(f"Error fetching resumes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def resumes_health():
    """Health check for resumes service."""
    return {"status": "healthy", "service": "resumes"}