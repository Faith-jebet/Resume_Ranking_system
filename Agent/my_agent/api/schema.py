from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: List[str]
    experience: Optional[int] = None
    
class JobResponse(BaseModel):
    job_id: str
    title: str
    description: str
    required_skills: List[str]
    experience: Optional[int] = None
    created_at: datetime
    
class ResumeResponse(BaseModel):
    resume_id: str
    name: str
    email: Optional[str] = None
    skills: List[str]
    experience: Optional[int] = None
    source: str
        
class RankingRequest(BaseModel):
    job_id: str
    
class RankedCandidate(BaseModel):
    resume_id: str
    name: str
    score: float
    matched_skills: List[str]
        
class RankingResponse(BaseModel):
    job_id: str
    ranked_candidates: List[RankedCandidate]   