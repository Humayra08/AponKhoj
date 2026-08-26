# ai-embeddings

Small FastAPI microservice used by the AponKhoj chatbot for text embeddings (and, from Phase 2 onward, face embeddings for photo-based missing-person matching). Runs entirely on open-source models, CPU-only, $0 per-request cost.

## Endpoints

- `GET /health` — liveness check.
- `POST /embed-text` — `{"text": "..."}` → `{"embedding": [384 floats]}` (sentence-transformers/all-MiniLM-L6-v2).

## Local development (Docker Compose)

Already wired into the repo's root `docker-compose.yml` as the `ai-embeddings` service, reachable from the Laravel `app` container at `http://ai-embeddings:8000`.

```
docker compose up --build ai-embeddings
```

## Free production hosting: Hugging Face Spaces

This directory is a standalone Docker Space — push it directly to a new Space on huggingface.co (SDK: Docker) for free hosting (2 vCPU / 16GB RAM on the free CPU tier, enough headroom for Phase 2's face-recognition model too). Point `AI_EMBEDDINGS_URL` in the Laravel app's environment at the Space's public URL.
