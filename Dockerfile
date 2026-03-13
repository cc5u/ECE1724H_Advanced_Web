FROM python:3.11-slim

WORKDIR /app

# Install Redis + SSH server
RUN apt-get update && apt-get install -y --no-install-recommends \
    redis-server \
    openssh-server \
    && rm -rf /var/lib/apt/lists/*

# Prepare sshd runtime dir
RUN mkdir -p /var/run/sshd /root/.ssh

# Safer sshd config for key-based login
RUN sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config && \
    grep -q '^PubkeyAuthentication yes' /etc/ssh/sshd_config || echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config && \
    grep -q '^PasswordAuthentication no' /etc/ssh/sshd_config || echo 'PasswordAuthentication no' >> /etc/ssh/sshd_config && \
    grep -q '^PermitRootLogin prohibit-password' /etc/ssh/sshd_config || echo 'PermitRootLogin prohibit-password' >> /etc/ssh/sshd_config

RUN pip install --no-cache-dir uv
COPY requirements-frozen.txt .
RUN uv pip install --system -r requirements-frozen.txt

COPY . .
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8000
EXPOSE 22

CMD ["/start.sh"]