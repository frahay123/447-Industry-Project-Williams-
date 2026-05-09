#!/usr/bin/env bash
# Run on the EC2 host (as root or with sudo) if the API was bootstrapped before
# nginx-on-80 was added. Fixes phones that cannot reach :3000 (blocked on many networks).
set -euo pipefail

dnf install -y nginx
rm -f /etc/nginx/conf.d/default.conf
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
systemctl enable nginx
systemctl restart nginx
# IMDSv2 (default on newer instances; plain meta-data curl returns empty)
PUB=""
if T=$(curl -sf -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"); then
  PUB=$(curl -sf -H "X-aws-ec2-metadata-token: $T" "http://169.254.169.254/latest/meta-data/public-ipv4" || true)
fi
[[ -z "$PUB" ]] && PUB=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "OK: nginx → :3000. From the internet use http://${PUB}/health (install Node API if you see 502)."
