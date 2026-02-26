#!/bin/bash

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Get the public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Create coturn configuration
mkdir -p /etc/coturn
cat > /etc/coturn/turnserver.conf <<EOF
# TURN server configuration
listening-port=3478
tls-listening-port=5349

# External IP (for AWS)
external-ip=$PUBLIC_IP

# Relay ports range
min-port=49152
max-port=65535

# Authentication
lt-cred-mech
user=${turn_username}:${turn_password}

# Realm
realm=turn.example.com

# Logging
verbose
log-file=/var/log/coturn/turnserver.log

# Security
fingerprint
no-multicast-peers
no-cli
EOF

# Create log directory
mkdir -p /var/log/coturn

# Run COTURN container
docker run -d \
  --name coturn \
  --restart unless-stopped \
  --network host \
  -v /etc/coturn/turnserver.conf:/etc/coturn/turnserver.conf:ro \
  -v /var/log/coturn:/var/log/coturn \
  coturn/coturn:latest \
  -c /etc/coturn/turnserver.conf
