# Dragon Keeper backend (FastAPI + uvicorn).
# Build context = repository root:  podman build -f deploy/backend.Containerfile .
FROM docker.io/library/python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# build-essential kept for safety in case a wheel is unavailable for the arch.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY deploy/requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt

# Application code (backend/.env is excluded via .containerignore - secrets are
# injected at runtime with --env-file so they are never baked into the image).
COPY backend /app

# Runs with --network=host so it can reach the host MongoDB on 127.0.0.1:27017
# and is only exposed on the loopback interface (nginx proxies to it).
CMD ["uvicorn", "server:app", "--host", "127.0.0.1", "--port", "8011"]
