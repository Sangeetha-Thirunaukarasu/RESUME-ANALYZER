# AI Resume Matcher Ecosystem

An enterprise-grade, privacy-first asynchronous web application designed to evaluate resumes against corporate job descriptions. The platform parses modern document formats (.pdf, .docx), cleanses candidate files of sensitive metadata via an automated Personally Identifiable Information (PII) masking engine, and evaluates skills compatibility utilizing a high-availability dual-LLM fallback architecture.

---

##  Key Architectural Strengths

###  1. Asynchronous Producer-Consumer Pipeline
Instead of forcing users to freeze on a loading layout screen during heavy text analysis, the platform decouples the pipeline:
- **FastAPI API Gateway (Producer)**: Accepts incoming files, performs validation checks, immediately registers a unique tracking token (`Task ID`), and offloads work to the broker in under 50ms.
- **Arq Worker Pool (Consumer)**: A specialized, background processing cluster process node that pulls tasks from Redis, executes parsing scripts, and saves completion payloads to MongoDB.

###  2. Comprehensive Security and Multi-Stage Validation
- **True Magic Byte Verification**: Intercepts files using native Linux `libmagic1` system binaries to analyze real binary file headers—preventing hackers from renaming malicious execution scripts to `.pdf` or `.docx`.
- **Pre-Ingestion Ceiling Enforcement**: Hard-coded constraints reject payloads exceeding a strict 5MB limit before file buffers can compromise the host machine's RAM footprint.

###  3. Enterprise Privacy and PII Anonymization
To ensure total compliance with strict global data privacy regulations (**GDPR** & **CCPA**), candidates' sensitive private tracking elements are automatically intercepted and sanitized inside the sandbox layer *before* data streams touch any third-party AI endpoints:
- Automatically replaces real email text blocks with `[REDACTED_EMAIL]`.
- Automatically strips international/standard contact digits to `[REDACTED_PHONE]`.
- Strips localized street addresses to `[REDACTED_ADDRESS]`.

###  4. Resilient Dual-LLM High Availability Fallback
If the application hits a credit exhaustion block, rate limit boundary, or API timeout window while processing a resume, the worker automatically intercepts the exception and handles it:
- **Primary Tier**: Queries OpenAI `gpt-4o-mini` utilizing native **Structured Outputs** parsing to ensure pristine JSON mapping conformances.
- **Failover Tier**: On an OpenAI `429 Quota Error`, the worker instantly redirects the exact payload to **Google Gemini 2.5 Flash** using matching schema matrices. The frontend never stalls or notices the switch.

###  5. Fault-Tolerant Multi-Container Orchestration
- **Production Server Class Management**: Leverages an enterprise **Gunicorn master-worker supervisor layout** inside Docker instead of native Uvicorn. Gunicorn maintains socket connection stability during dense multi-part data stream handshakes, avoiding unexpected browser dropouts (`net::ERR_EMPTY_RESPONSE`).
- **100% Dynamic Environment Interpolation**: Leverages single-point-of-truth configuration mappings via the root `.env` file. Infrastructure hosts, database parameters, and security CORS headers (`ALLOWED_ORIGINS`) map dynamically into container execution contexts on system boot.
- **Out-Of-Memory (OOM) Protection**: Strict Docker memory limits (`limits: 512M`) constrain the Python parsing threads, while `restart: always` guarantees automatic system recovery if an unexpectedly complex document breaches allocation limits.

---
##  Step-by-Step Production Launch Sequence

### 1. Configure the Environmental Blueprint Variables
Duplicate the template structure inside the main directory and input your personal credential hashes:
```bash
cp .env.example .env
```
Open your newly created `.env` file and insert your active API tokens. Ensure the host addresses map directly to the matching container labels:
```text
ENV=production
PROJECT_NAME="AI Resume Matcher"
MAX_FILE_SIZE_MB=5

# Dynamic Infrastructure Connections (Clean Host URIs only)
MONGO_URI=mongodb://production_mongodb_datastore:27017
MONGO_DB_NAME=resume_analyzer
REDIS_URL=redis://production_redis_broker:6379
QUEUE_NAME=resume_analyzer_jobs

# Dynamic Allowed Client Origins for Security Handshakes
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Provider Keys (If OpenAI is out of funds, Gemini takes over automatically!)
OPENAI_API_KEY=sk-proj-your_openai_secret_developer_token_here
GEMINI_API_KEY=AIzaSy_your_google_studio_free_token_here
```

### 2. Build and Launch the Application Infrastructure
Run this command from your root directory to instruct Docker to clear any old cache, pull down package dependencies, compile wheels, and boot the stack in background detached mode:
```bash
docker-compose down -v && docker-compose up --build -d
```

### 3. Review Running Telemetry Log Pipes
Verify that all processes across your custom nodes booted up smoothly with zero path errors:
```bash
# Check your Gunicorn Web Server connection structures
docker logs -f production_fastapi_gateway

# Monitor your Background Processing Consumer pickup queues
docker logs -f production_arq_worker_node
```

##  Shared Application Networking Interfaces
- **User Interface Panel (React/Vite App)**: `http://localhost:3000`
- **API Core Gateway Entry (FastAPI Docs)**: `http://localhost:8000/docs`
- **MongoDB Compass Local Connection string**: `mongodb://localhost:27017`

---

##  Security Compliance and Audit Logging
All system failures are written to rolling, auto-rotating log files inside the container context to guarantee absolute observability. To monitor background file masking actions or review external network timeout statuses live, review the streaming records inside your terminal window using standard docker commands.
