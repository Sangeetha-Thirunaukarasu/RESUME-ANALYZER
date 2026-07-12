from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Sub-schema for Keyword Analysis
class KeywordSchema(BaseModel):
    found: List[str] = Field(..., description="Crucial skills, frameworks, and tools detected in both documents.")
    missing: List[str] = Field(..., description="High-priority keywords from the job description missing on the resume.")

# Sub-schema for Individual Feedback Items
class FeedbackItem(BaseModel):
    section: str = Field(..., description="Name of the target resume section (e.g., Summary, Experience, Skills).")
    issue: str = Field(..., description="Detailed explanation of what makes this section weak or misaligned.")
    suggestion: str = Field(..., description="An actionable example or rewrite showing exactly how to fix the issue.")

# Master JSON Output Scheme parsed directly from OpenAI
class ResumeAnalysisOutput(BaseModel):
    match_score: int = Field(..., description="Strict compatibility percentage between 0 and 100 based on core requirements.", ge=0, le=100)
    formatting_issues: List[str] = Field(..., description="List of structural flags like complex tables, unreadable headers, or long layouts.")
    keywords: KeywordSchema
    structural_feedback: List[FeedbackItem]

# Standard API Gateway Handshake Response
class TaskResponse(BaseModel):
    task_id: str = Field(..., description="Unique UUID tracking identifier for the background analysis job.")
    status: str = Field(..., description="Current status of the asynchronous task lifecycle (pending, processing, completed, failed).")
    created_at: datetime = Field(..., description="ISO timestamp marking when the transaction job began.")
    error_message: Optional[str] = Field(None, description="Detailed system message populated only if the task fails.")