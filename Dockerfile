# Use Python 3.11 slim image for smaller footprint
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OCR, image processing, and authentication
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libglib2.0-0 \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir psycopg2-binary bcrypt

# Copy backend code and authentication files
COPY backend/ ./backend/
COPY *.sql ./
COPY sample_invoices/ ./sample_invoices/

# Create uploads directory
RUN mkdir -p backend/uploads/invoices

# Set environment variables for authentication and system
ENV PYTHONPATH="/app/backend"
ENV TESSERACT_CMD="tesseract"
ENV POSTGRES_HOST="postgres"
ENV POSTGRES_DB="inventory_management"
ENV POSTGRES_USER="postgres"
ENV POSTGRES_PASSWORD="gugan@2022"
ENV POSTGRES_PORT="5432"
ENV JWT_SECRET_KEY="inventory-college-system-super-secret-key-2025"
ENV JWT_ALGORITHM="HS256"
ENV ACCESS_TOKEN_EXPIRE_MINUTES=60
ENV REFRESH_TOKEN_EXPIRE_DAYS=7
ENV ADMIN_USERNAME="admin"
ENV ADMIN_PASSWORD="College@2025"
ENV ADMIN_EMAIL="admin@college.edu"

# Expose port
EXPOSE 8000

# Health check for authentication endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || curl -f http://localhost:8000/api/auth/me || exit 1

# Start command using the correct main.py entry point
CMD ["python", "backend/main.py"]
