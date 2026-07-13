import io
import re
import logging
import pdfplumber
import docx
from openai import AsyncOpenAI, RateLimitError, APIStatusError, APITimeoutError, APIConnectionError
from google import genai
from google.genai import types
from motor.motor_asyncio import AsyncIOMotorClient
from arq.connections import RedisSettings
from arq import Retry

from app.config import settings
from app.schemas import ResumeAnalysisOutput
from app.logger_config import setup_production_logging

logger = setup_production_logging("background_worker")

openai_client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    max_retries=1,
    timeout=30.0
)
gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None

def anonymize_resume_pii(text: str) -> str:
    """Scans and masks sensitive Personally Identifiable Information tokens cleanly using strict regex matching flags."""
    # 1. Clear Email Strings
    email_regex = r'[\w\.-]+@[\w\.-]+\.\w+'
    text = re.sub(email_regex, '[REDACTED_EMAIL]', text)
    
    # 2. Clear International and Standard Phone Number Configurations
    phone_regex = r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    text = re.sub(phone_regex, '[REDACTED_PHONE]', text)
    
    # 3. Clear Common Street/Location Signatures (Protects physical address safety)
    address_patterns = [
        r'\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Drive|Dr|Road|Rd|Boulevard|Blvd|Lane|Ln|Way)\b.*',
        r'\bP\.O\.\s+Box\s+\d+\b'
    ]
    for pattern in address_patterns:
        text = re.sub(pattern, '[REDACTED_ADDRESS]', text, flags=re.IGNORECASE)
        
    return text


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text_fragments = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            content = page.extract_text()
            if content:
                text_fragments.append(content)
    return "\n".join(text_fragments)

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([p.text for p in doc.paragraphs])

async def run_resume_analysis(ctx, task_id: str, file_bytes: bytes, job_description: str, file_type: str):
    logger.info(f"Worker tracking pickup: Task {task_id}")
    
    mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
    db = mongo_client[settings.MONGO_DB_NAME]
    collection = db["analysis_tasks"]

    try:
        await collection.update_one({"_id": task_id}, {"$set": {"status": "processing"}})
        
        if file_type == "pdf":
            resume_text = extract_text_from_pdf(file_bytes)
        elif file_type == "docx":
            resume_text = extract_text_from_docx(file_bytes)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
            
        if not resume_text.strip():
            raise ValueError("We couldn't read any text from this file. It might be empty, password-protected, or a scanned image."
                              " Please upload a clear document.")

        # Purge PII boundaries from string before AI analysis ---
        resume_text = anonymize_resume_pii(resume_text)
        logger.info(f"Successfully scrubbed sensitive tracking PII metrics from Task {task_id} text context structures.")

        analysis_payload = None

        try:
            logger.info("Attempting primary evaluation using OpenAI API...")
            response = await openai_client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an elite corporate recruiter. Evaluate the resume strictly against target criteria."},
                    {"role": "user", "content": f"Resume Text:\n{resume_text}\n\nJob Description:\n{job_description}"}
                ],
                response_format=ResumeAnalysisOutput,
                temperature=0.1 
            )
            
            analysis_payload = response.choices.message.parsed.model_dump()
            logger.info("OpenAI primary analysis successful.")

        # Catch OpenAI Quota (429) or connection drops to trigger Gemini Fallback
        except (RateLimitError, APIStatusError, APITimeoutError, APIConnectionError) as api_err:
            logger.warning(f"OpenAI Primary Tier Interrupted ({str(api_err)}). Checking for Gemini Fallback...")
            
            if not gemini_client:
                raise RuntimeError("OpenAI failed and no fallback GEMINI_API_KEY was configured.")
            
            # --- TIER 2: Secondary Fallback with Google Gemini ---
            logger.info("Executing Gemini Fallback pipeline via gemini-2.5-flash...")
            gemini_response = gemini_client.models.generate_content(
                model='gemini-3.1-flash-lite',
                contents=f"Resume Text Content:\n{resume_text}\n\nTarget Job Description Requirements:\n{job_description}",
                config=types.GenerateContentConfig(
                    system_instruction="You are an elite corporate technical recruiter. Analyze the candidate's resume strictly against the target job description details.",
                    temperature=0.1,
                    response_mime_type="application/json",
                    response_schema=ResumeAnalysisOutput, # Enforces Gemini to match your exact Pydantic format
                ),
            )
            # Parse the Gemini JSON output into your standard dictionary structure
            analysis_payload = ResumeAnalysisOutput.model_validate_json(gemini_response.text).model_dump()
            logger.info("Gemini Fallback computation successful.")
    
        # Save the finalized payload (regardless of which AI generated it)
        await collection.update_one(
            {"_id": task_id},
            {"$set": {"status": "completed", "analysis_results": analysis_payload, "updated_at": ctx.get("run_at")}}
        )
        logger.info(f"Task ID {task_id} successfully finalized.")

    except Exception as e:
        logger.error(f"Fatal execution error on Task {task_id}: {str(e)}")
        await collection.update_one(
            {"_id": task_id},
            {"$set": {"status": "failed", "error_message": str(e)}}
        )
    finally:
        mongo_client.close()

# Secure Arq Initialization class parameters utilizing standard configuration DSN strings
class WorkerSettings:
    functions = [run_resume_analysis]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL) 
    queue_name = settings.QUEUE_NAME                           
