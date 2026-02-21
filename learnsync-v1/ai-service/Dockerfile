# LearnSync AI v1.0 - AI Service Dockerfile
# Production-ready Python FastAPI + ML Models
# Multi-stage build for optimization

# ============================================
# STAGE 1: Builder
# ============================================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ============================================
# STAGE 2: Production
# ============================================
FROM python:3.11-slim AS production

# Security: Create non-root user
RUN groupadd -r aiuser && useradd -r -g aiuser aiuser

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /home/aiuser/.local

# Copy application code
COPY --chown=aiuser:aiuser . .

# Create necessary directories
RUN mkdir -p models data logs && \
    chown -R aiuser:aiuser /app /home/aiuser

# Set environment variables
ENV PATH=/home/aiuser/.local/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_PATH=/app/models \
    DATA_PATH=/app/data \
    LOG_PATH=/app/logs \
    WORKERS=4

# Switch to non-root user
USER aiuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application with Uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port 8000 --workers $WORKERS --proxy-headers --forwarded-allow-ips='*'"]