#!/bin/bash
set -euo pipefail
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

dnf update -y

useradd -m -s /bin/bash deployer || true
mkdir -p /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
cat >> /home/deployer/.ssh/authorized_keys << 'PUBEOF'
${ssh_public_key}
PUBEOF
chmod 600 /home/deployer/.ssh/authorized_keys
chown -R deployer:deployer /home/deployer/.ssh

echo 'deployer ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/90-deployer
chmod 440 /etc/sudoers.d/90-deployer

dnf install -y git awscli unzip curl-minimal || dnf install -y curl

dnf install -y amazon-ssm-agent || true
systemctl enable amazon-ssm-agent --now 2>/dev/null || true

# Open port 80 immediately (IPv4 only — [::]:80 breaks nginx -t on many default-VPC subnets).
dnf install -y nginx
rm -f /etc/nginx/conf.d/default.conf
cat > /etc/nginx/conf.d/mec2-api.conf <<'NGXSTUB'
server {
    listen 80 default_server;
    location = /health {
        default_type text/plain;
        return 200 'bootstrap\n';
    }
    location / {
        default_type text/plain;
        return 503 'backend starting — see /var/log/user-data.log on the server\n';
    }
}
NGXSTUB
nginx -t
systemctl enable nginx
systemctl restart nginx

NODE_VER="v20.18.3"
ARCH="linux-x64"
curl -fsSL "https://nodejs.org/dist/$${NODE_VER}/node-$${NODE_VER}-$${ARCH}.tar.xz" -o /tmp/node.tar.xz
tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1
rm -f /tmp/node.tar.xz

# Backend from S3 (zip keeps user_data small). Root does unpack + .env so we avoid nested heredocs.
export AWS_DEFAULT_REGION="${aws_region}"
rm -rf /home/deployer/backend
sudo -u deployer mkdir -p /home/deployer/backend
aws s3 cp "s3://${s3_bucket}/bootstrap/mec2-api.zip" /tmp/mec2-api.zip
unzip -oq /tmp/mec2-api.zip -d /home/deployer/backend
rm -f /tmp/mec2-api.zip
chown -R deployer:deployer /home/deployer/backend

ENVF=/home/deployer/backend/.env
{
  echo "DB_HOST=${db_host}"
  echo "DB_PORT=${db_port}"
  echo "DB_NAME=${db_name}"
  echo "DB_USER=${db_user}"
  echo "DB_PASSWORD=${db_password}"
  echo "S3_BUCKET=${s3_bucket}"
  echo "AWS_REGION=${aws_region}"
  echo "ENABLE_LLM_NORMALIZE=true"
  echo "BEDROCK_MODEL_ID=${bedrock_model_id}"
  echo "PORT=3000"
} >"$ENVF"
chown deployer:deployer "$ENVF"
chmod 600 "$ENVF"

sudo -iu deployer bash -lc '
  set -euo pipefail
  export PATH="/usr/local/bin:$PATH"
  cd ~/backend
  npm install --no-fund --no-audit
  # Do not block the API forever if RDS is slow or credentials are wrong; PM2 still serves /health errors.
  for _ in $(seq 1 30); do
    npm run init-db && break || true
    sleep 5
  done
  npx pm2 delete mec2-api >/dev/null 2>&1 || true
  npx pm2 start server.js --name mec2-api
  npx pm2 save
'

set +e
PM2_STARTUP_LINE=$(sudo -iu deployer bash -lc 'cd ~/backend && export PATH="/usr/local/bin:$PATH" && npx pm2 startup systemd -u deployer --hp /home/deployer' 2>&1 | sed -n '/^sudo /p' | tail -1)
set -e
if [[ -n "$${PM2_STARTUP_LINE:-}" ]]; then
  set +e
  eval "$PM2_STARTUP_LINE"
  set -e
fi

cat > /etc/nginx/conf.d/mec2-api.conf <<'NGXEOF'
server {
    listen 80 default_server;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
        client_max_body_size 20M;
    }
}
NGXEOF
nginx -t
systemctl reload nginx

echo "Bootstrap complete: backend from S3 bootstrap/mec2-api.zip" >> /var/log/user-data.log
