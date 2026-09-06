FROM python:3.11-slim

# Install system dependencies including FFmpeg and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root application user
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application source code
COPY . .

# Ensure storage directories exist and assign ownership to appuser
RUN mkdir -p data/uploads data/extracted data/models && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Default environment variables for Render
ENV PORT=8000
ENV HOST=0.0.0.0
ENV WHISPER_MODEL=base
ENV WHISPER_DEVICE=cpu
ENV WHISPER_COMPUTE_TYPE=int8
ENV MAX_UPLOAD_SIZE_MB=500
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Start Uvicorn using the dynamic PORT provided by Render
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
