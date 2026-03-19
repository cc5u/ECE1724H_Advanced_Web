FROM python:3.11-slim

WORKDIR /app

# Install Redis
RUN apt-get update && apt-get install -y --no-install-recommends \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv
COPY requirements-frozen.txt .
RUN uv pip install --system -r requirements-frozen.txt

COPY . .
COPY start.sh /start.sh
RUN sed -i 's/\r$//' /start.sh && chmod +x /start.sh

EXPOSE 8000

CMD ["/start.sh"]