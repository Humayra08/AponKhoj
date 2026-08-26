FROM python:3.11-slim

WORKDIR /app

# System deps for torch/sentence-transformers wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# --timeout/--retries: this environment's network to PyPI/pytorch.org has been
# flaky (read timeouts on large wheels like torch) — pip's 15s default read
# timeout is too short for that, and a single retry-less attempt keeps failing
# build after build on transient drops rather than a real dependency problem.
RUN pip install --no-cache-dir --timeout=180 --retries=10 -r requirements.txt

# Bake the model into the image at build time (no runtime internet dependency,
# fast/reliable cold starts on free hosting — see plan's architecture decision).
# Ordered before COPY main.py so editing application code never invalidates
# this ~2GB download layer.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3')"

COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
