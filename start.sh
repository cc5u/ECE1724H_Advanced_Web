#!/bin/sh
set -e

echo "Setting up SSH authorized_keys..."
mkdir -p /root/.ssh
chmod 700 /root/.ssh

if [ -n "$SSH_PUBLIC_KEY" ]; then
    echo "$SSH_PUBLIC_KEY" > /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
    echo "SSH public key installed."
else
    echo "WARNING: SSH_PUBLIC_KEY is not set. SSH login will not work."
fi

echo "Generating SSH host keys if missing..."
ssh-keygen -A

echo "Starting SSH daemon..."
/usr/sbin/sshd

echo "Starting Redis..."
redis-server --daemonize yes

echo "Checking Redis..."
redis-cli ping

echo "Starting FastAPI..."
exec uvicorn api.main:app --host 0.0.0.0 --port 8000