from typing import List, Optional
from pydantic import BaseModel


class EmailRequest(BaseModel):
    company: str
    country: str = ""
    market: str = ""
    business: str = ""
    pain_points: List[str] = []
    match_score: Optional[float] = None
    priority: str = ""
    service_positioning: str = ""
    purpose: str = ""
    extra_requirements: str = ""
    language: str = "en"


class ProposalRequest(BaseModel):
    company: str
    country: str = ""
    market: str = ""
    business: str = ""
    needs: List[str] = []
    problems: List[str] = []
    goal: str = ""
    scope: List[str] = []
    summary: str = ""
    extra_requirements: str = ""
    language: str = "zh"
