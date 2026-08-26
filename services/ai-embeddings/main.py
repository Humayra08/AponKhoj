"""
AponKhoj ai-embeddings microservice.

Phase 1: text embeddings only (BAAI/bge-m3 — multilingual, handles
Bangla/English/Banglish mixed text), stored/searched via a local ChromaDB
collection (persisted under /data/chroma).
Phase 2 will add a /embed-face endpoint (insightface/ArcFace) in this same
service, per the RAG chatbot plan — kept here rather than a second service
so only one free Hugging Face Space / Docker container is needed.
"""

import chromadb
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI(title="AponKhoj AI Embeddings Service")

# Loaded once at startup; baked into the Docker image at build time (see Dockerfile)
# so there is no runtime download dependency on free hosting.
_text_model = SentenceTransformer("BAAI/bge-m3")

_chroma_client = chromadb.PersistentClient(path="/data/chroma")
_collection = _chroma_client.get_or_create_collection("aponkhoj_text")


class EmbedTextRequest(BaseModel):
    text: str


class EmbedTextResponse(BaseModel):
    embedding: list[float]


class UpsertRequest(BaseModel):
    id: str
    text: str
    metadata: dict | None = None


class SearchRequest(BaseModel):
    text: str
    top_k: int = 5


class SearchResult(BaseModel):
    id: str
    text: str
    metadata: dict | None
    distance: float


class SearchResponse(BaseModel):
    results: list[SearchResult]


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


@app.post("/upsert")
def upsert(payload: UpsertRequest):
    text = (payload.text or "").strip()
    vector = _text_model.encode(text, normalize_embeddings=True)
    _collection.upsert(
        ids=[payload.id],
        embeddings=[vector.tolist()],
        documents=[text],
        metadatas=[payload.metadata or {}],
    )
    return {"status": "ok"}


@app.post("/search", response_model=SearchResponse)
def search(payload: SearchRequest):
    text = (payload.text or "").strip()
    if not text:
        return SearchResponse(results=[])

    vector = _text_model.encode(text, normalize_embeddings=True)
    result = _collection.query(query_embeddings=[vector.tolist()], n_results=payload.top_k)

    results = [
        SearchResult(
            id=result["ids"][0][i],
            text=result["documents"][0][i],
            metadata=result["metadatas"][0][i],
            distance=result["distances"][0][i],
        )
        for i in range(len(result["ids"][0]))
    ]
    return SearchResponse(results=results)
