# --- Stage 1: Build dependencies and wheels ---
FROM python:3.11-slim AS builder

WORKDIR /build

# Install system compilation prerequisites safely
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and copy dependencies file
RUN pip install --no-cache-dir --upgrade pip
COPY requirements.txt .

# Compile wheels to a localized temporary directory caching layer
RUN pip wheel --no-cache-dir --wheel-dir /build/wheels -r requirements.txt


# --- Stage 2: Final minimal execution image runtime ---
FROM python:3.11-slim

WORKDIR /app

# Crucial Production Requirement: Install libmagic system binary hooks 
# to allow python-magic to sniff true binary MIME files securely
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-compiled python wheels from builder stage 
COPY --from=builder /build/wheels /wheels
COPY --from=builder /build/requirements.txt .

# Install dependencies from wheel cache instantly without hitting web networks
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels requirements.txt

# Copy backend application package source arrays code into workspace
COPY . .

# Expose FastAPI core gateway port map boundary limits
EXPOSE 8000


#  native uvicorn multiprocessing worker loops with robust Gunicorn process orchestration handles
CMD ["gunicorn", "app.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--timeout", "120"]

