from contextlib import asynccontextmanager
from datetime import datetime, timezone
from uuid import uuid4
import magic

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from arq import create_pool
from arq.connections import RedisSettings

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection, get_collection
from app.schemas import TaskResponse
from app.logger_config import setup_production_logging

logger = setup_production_logging("api_gateway")

ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx"
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing API application gateway...")
    await connect_to_mongo()
    
    # Pre-optimize database indexing keys
    collection = get_collection("analysis_tasks")
    await collection.create_index([("_id", 1), ("status", 1)])
    
    # Establish direct DSN connection configurations to target containers
    app.state.redis_pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    yield
    logger.info("De-allocating infrastructure connections...")
    await close_mongo_connection()
    await app.state.redis_pool.close()

app = FastAPI(title=settings.PROJECT_NAME, default_response_class=ORJSONResponse, lifespan=lifespan)

origins_list = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.post("/api/v1/analyze/submit", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def submit_analysis(file: UploadFile = File(...), job_description: str = Form(...)):
    head_bytes = await file.read(2048)
    mime_type = magic.from_buffer(head_bytes, mime=True)
    
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type signature.")
    
    remaining_bytes = await file.read()
    complete_bytes = head_bytes + remaining_bytes
    
    if len(complete_bytes) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Payload size limits exceeded.")

    task_id = str(uuid4())
    created_now = datetime.now(timezone.utc)
    
    task_document = {
        "_id": task_id,
        "status": "pending",
        "created_at": created_now,
        "error_message": None,
        "analysis_results": None
    }
    
    await get_collection("analysis_tasks").insert_one(task_document)
    
    # Enqueue work payload directly into the shared queue channel name parameter matching your settings
    await app.state.redis_pool.enqueue_job(
        "run_resume_analysis", 
        task_id, 
        complete_bytes, 
        job_description, 
        ALLOWED_MIME_TYPES[mime_type],
        _queue_name=settings.QUEUE_NAME # <-- Connected via clean environment parameters
    )
    
    return TaskResponse(task_id=task_id, status="pending", created_at=created_now)

@app.get("/api/v1/analyze/status/{task_id}", response_model=TaskResponse)
async def get_task_status(task_id: str):
    task = await get_collection("analysis_tasks").find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    return TaskResponse(
        task_id=task["_id"],
        status=task["status"],
        created_at=task["created_at"].replace(tzinfo=timezone.utc),
        error_message=task.get("error_message")
    )

@app.get("/api/v1/analyze/results/{task_id}")
async def get_task_results(task_id: str):
    task = await get_collection("analysis_tasks").find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Results not found.")
    return task["analysis_results"]
