"""
AponKhoj ai-embeddings microservice.

Computes text embeddings (BAAI/bge-m3 — multilingual, handles
Bangla/English/Banglish mixed text) via /embed-text. The actual vector
store/search lives in Supabase Postgres + pgvector, queried directly from
Laravel's VectorIndexService — this service only produces the vectors.

Phase 2 will add a /embed-face endpoint (insightface/ArcFace) in this same
service, per the RAG chatbot plan — kept here rather than a second service
so only one free Hugging Face Space / Docker container is needed.
"""

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI(title="AponKhoj AI Embeddings Service")

# Loaded once at startup; baked into the Docker image at build time (see Dockerfile)
# so there is no runtime download dependency on free hosting.
_text_model = SentenceTransformer("BAAI/bge-m3")


class EmbedTextRequest(BaseModel):
    text: str


class EmbedTextResponse(BaseModel):
    embedding: list[float]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/embed-text", response_model=EmbedTextResponse)
def embed_text(payload: EmbedTextRequest):
    text = (payload.text or "").strip()
    if not text:
        return EmbedTextResponse(embedding=[0.0] * 1024)

    vector = _text_model.encode(text, normalize_embeddings=True)
    return EmbedTextResponse(embedding=vector.tolist())
