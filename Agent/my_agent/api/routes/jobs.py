from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Define schemas inline to avoid import issues
class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: List[str] = []
    experience: str = ""

class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    required_skills: List[str] = []
    experience: str = ""
    created_at: str

@router.post("/", response_model=JobResponse)
def create_job(job: JobCreate):
    """Create a new job posting."""
    try:
        from database.sqlite_db import insert_job
        
        job_data = {
            "title": job.title,
            "description": job.description,
            "required_skills": job.required_skills,
            "experience": job.experience,
            "created_at": datetime.utcnow().isoformat(),
        }
        return insert_job(job_data)
    except ImportError as e:
        logger.error(f"Database import failed: {e}")
        raise HTTPException(status_code=503, detail="Database service unavailable")
    except Exception as e:
        logger.error(f"Error creating job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[JobResponse])
def get_all_jobs_endpoint():
    """Get all job postings."""
    try:
        from database.sqlite_db import get_all_jobs
        return get_all_jobs()
    except ImportError as e:
        logger.error(f"Database import failed: {e}")
        return []
    except Exception as e:
        logger.error(f"Error fetching jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int):
    """Get a specific job by ID."""
    try:
        from database.sqlite_db import get_job as load_job
        
        job = load_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except ImportError as e:
        logger.error(f"Database import failed: {e}")
        raise HTTPException(status_code=503, detail="Database service unavailable")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def jobs_health():
    """Health check for jobs service."""
    return {"status": "healthy", "service": "jobs"}