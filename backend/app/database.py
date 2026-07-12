from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging
    

logger = logging.getLogger("uvicorn.error")

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db = None

# Single shared instance across the lifecycle of the FastAPI server process
db_instance = Database()

async def connect_to_mongo():
    """Initializes the persistent asynchronous connection pool to MongoDB."""
    try:
        db_instance.client = AsyncIOMotorClient(settings.MONGO_URI)
        db_instance.db = db_instance.client[settings.MONGO_DB_NAME]
        logger.info("Successfully established connection pool to MongoDB.")
    except Exception as e:
        logger.error(f"Critical Failure while connecting to MongoDB instance: {str(e)}")
        raise e

async def close_mongo_connection():
    """Closes all active open connections in the pool gracefully."""
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection pool cleanly shut down.")

def get_collection(name: str):
    """Utility helper to fetch a specific database collection cursor handler."""
    return db_instance.db[name]