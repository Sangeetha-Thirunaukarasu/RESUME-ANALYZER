from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Resume Analyzer"
    ENV: str = "production"
    
    # Infrastructure Connections
    MONGO_URI: str = Field(..., validation_alias="MONGO_URI")
    MONGO_DB_NAME: str = "resume_analyzer"
    REDIS_URL: str = Field(..., validation_alias="REDIS_URL")
    
    # Security & API
    OPENAI_API_KEY: str = Field(..., validation_alias="OPENAI_API_KEY")
    MAX_FILE_SIZE_MB: int = 5
    ALLOWED_EXTENSIONS: set = {"pdf", "docx"}

    class Config:
        # Check for .env first in backend package, fallback to root folder if needed
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
