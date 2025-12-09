FROM python:3.11-slim

# Prevent Python from writing .pyc files to disc and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install minimal build deps for some Python packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential gcc libpq-dev curl netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r /app/requirements.txt

# Copy backend code
COPY backend /app/backend
COPY backend/manage.py /app/manage.py
COPY backend/entrypoint.sh /app/entrypoint.sh

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Ensure the inner Django package (backend/backend) is importable.
# Set PYTHONPATH to /app/backend so `import backend` resolves to /app/backend/backend
ENV PYTHONPATH=/app/backend

# Default broker (can be overridden via env)
ENV CELERY_BROKER_URL=redis://redis:6379/0
ENV CELERY_RESULT_BACKEND=${CELERY_BROKER_URL}

WORKDIR /app

# Default command: run celery worker. Override in docker-compose if desired.
CMD ["celery", "-A", "backend.celery:app", "worker", "-l", "info"]
