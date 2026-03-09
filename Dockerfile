# Use Python 3.11 slim for smaller image (adjust if you need 3.12)
FROM python:3.11-slim

WORKDIR /app

# Install uv, then use it to install dependencies from frozen requirements
RUN pip install --no-cache-dir uv
COPY requirements-frozen.txt .
RUN uv pip install --system -r requirements-frozen.txt

# Copy application code
COPY . .

# Expose port for uvicorn
EXPOSE 8000

# Run FastAPI with uvicorn (--reload only works when code is mounted as a volume)
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
