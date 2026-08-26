FROM python:3.11-slim

WORKDIR /app

# System deps for torch/sentence-transformers wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Bake the model into the image at build time (no runtime internet dependency,
# fast/reliable cold starts on free hosting — see plan's architecture decision).
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3')"

# ChromaDB persists here — mount a volume at this path in production,
# otherwise stored vectors are lost when the container restarts.
VOLUME ["/data/chroma"]

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
