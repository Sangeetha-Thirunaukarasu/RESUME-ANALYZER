from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Resume Analyzer"
    ENV: str = "production"
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash"
    
    # Swapped validation_alias out for explicit env field properties to guarantee Docker safety
    MONGO_URI: str = Field("mongodb://production_mongodb_datastore:27017", env="MONGO_URI")
    MONGO_DB_NAME: str = Field("resume_analyzer", env="MONGO_DB_NAME")
    REDIS_URL: str = Field("redis://production_redis_broker:6379", env="REDIS_URL")
    QUEUE_NAME: str = Field("arq:queue", env="QUEUE_NAME") 
    
    OPENAI_API_KEY: str = Field(..., env="OPENAI_API_KEY")
    GEMINI_API_KEY: str = Field("", env="GEMINI_API_KEY")
    MAX_FILE_SIZE_MB: int = 5
    ALLOWED_EXTENSIONS: set = {"pdf", "docx"}

    LOG_DIR: str = "/app/logs"

    # Read the comma-separated string from the environment variable
    ALLOWED_ORIGINS: str = Field("http://localhost:3000", env="ALLOWED_ORIGINS")

    # Fixed path math: Points directly to /app/.env inside the container, falling back gracefully
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
