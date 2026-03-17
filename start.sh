#!/bin/sh
set -e

echo "Starting Redis..."
redis-server --daemonize yes

echo "Checking Redis..."
redis-cli ping

echo "Starting FastAPI..."
exec uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir /app