from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class RankingRequest(BaseModel):
    job_description: str
    job_id: int = None

@router.post("/rank")
def rank_resumes(request: RankingRequest):
    """Rank resumes against a job description."""
    try:
        # Placeholder ranking logic
        return {
            "job_description": request.job_description,
            "shortlisted": [],
            "message": "Ranking functionality in development"
        }
    except Exception as e:
        logger.error(f"Error in ranking: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def rankings_health():
    """Health check for rankings service."""
    return {"status": "healthy", "service": "rankings"}

def save_ranking_record(job_id: str, ranked_candidates: list):
    """Save ranking record to database."""
    try:
        from database.sqlite_db import save_ranking
        stamped_candidates = []
        for candidate in ranked_candidates:
            stamped_candidates.append({**candidate, "created_at": datetime.utcnow().isoformat()})
        return save_ranking(job_id, stamped_candidates)
    except ImportError as e:
        logger.error(f"Database import failed: {e}")
        return {"error": "Database unavailable"}
    except Exception as e:
        logger.error(f"Error saving ranking: {e}")
        raise
    