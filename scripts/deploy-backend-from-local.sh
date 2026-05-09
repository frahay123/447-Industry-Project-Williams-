#!/usr/bin/env bash
# Run on your Mac (repo root context). Pushes backend/, writes .env from Terraform outputs, npm + pm2 on EC2.
#
# Usage:
#   ./terraform/scripts/deploy-backend-from-local.sh deployer@YOUR_EC2_PUBLIC_IP
#
# Same Elastic IP after a new EC2 instance → SSH host key changes. Either:
#   ssh-keygen -R YOUR_EC2_PUBLIC_IP
# or one-shot:
#   MEC2_REFRESH_KNOWN_HOSTS=1 ./terraform/scripts/deploy-backend-from-local.sh deployer@YOUR_EC2_PUBLIC_IP
#
# If RDS password was set in terraform.tfvars (not auto-generated), set:
#   export MEC2_DB_PASSWORD='your-db-password'
#
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/../.." && pwd)
TF_DIR="$REPO_ROOT/terraform"
KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
TARGET="${1:?Usage: $0 deployer@EC2_PUBLIC_IP}"
HOST_ONLY=$(echo "$TARGET" | sed 's/.*@//')

if [[ "${MEC2_REFRESH_KNOWN_HOSTS:-}" == "1" ]]; then
  echo "Removing stale SSH known_hosts entry for $HOST_ONLY"
  ssh-keygen -R "$HOST_ONLY" 2>/dev/null || true
fi

if [[ ! -f "$KEY" ]]; then
  echo "SSH key not found: $KEY (set SSH_KEY=...)" >&2
  exit 1
fi

# First connect after terraform replace: add new host key without a TTY prompt.
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
SCP_OPTS=(-o StrictHostKeyChecking=accept-new)

TF_BIN="${TERRAFORM:-}"
if [[ -z "$TF_BIN" || ! -x "$TF_BIN" ]]; then
  if command -v terraform >/dev/null 2>&1; then
    TF_BIN=$(command -v terraform)
  fi
fi
if [[ -z "$TF_BIN" || ! -x "$TF_BIN" ]]; then
  for p in /opt/homebrew/bin/terraform /usr/local/Homebrew/bin/terraform /usr/local/bin/terraform; do
    if [[ -x "$p" ]]; then
      TF_BIN="$p"
      break
    fi
  done
fi
if [[ -z "$TF_BIN" || ! -x "$TF_BIN" ]]; then
  echo "terraform not found in PATH. Install: brew install terraform" >&2
  echo "Or point to the binary: TERRAFORM=/path/to/terraform $0 ..." >&2
  exit 1
fi

cd "$TF_DIR"
RDS_ADDR=$("$TF_BIN" output -raw rds_address)
RDS_PORT=$("$TF_BIN" output -raw rds_port)
RDS_USER=$("$TF_BIN" output -raw rds_master_username)
S3_BUCKET=$("$TF_BIN" output -raw s3_bucket_name)
REGION=$(grep -E '^[[:space:]]*aws_region[[:space:]]*=' terraform.tfvars 2>/dev/null | head -1 | sed -E 's/.*=[[:space:]]*"([^"]*)".*/\1/' || echo "us-east-1")

DB_PASS=""
if TF_PASS=$("$TF_BIN" output -raw rds_master_password 2>/dev/null); then
  if [[ -n "$TF_PASS" && "$TF_PASS" != "null" ]]; then
    DB_PASS="$TF_PASS"
  fi
fi
if [[ -z "$DB_PASS" ]]; then
  DB_PASS="${MEC2_DB_PASSWORD:-}"
fi
if [[ -z "$DB_PASS" ]]; then
  echo "No DB password. Either Terraform auto-generated RDS (terraform output rds_master_password) or export MEC2_DB_PASSWORD=..." >&2
  exit 1
fi

TMP_ENV=$(mktemp)
chmod 600 "$TMP_ENV"
trap 'rm -f "$TMP_ENV"' EXIT
JWT_SECRET_VAL="${JWT_SECRET:-}"
if [[ -z "$JWT_SECRET_VAL" ]]; then
  JWT_SECRET_VAL=$(openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | head -c 64)
  echo "[WARN] JWT_SECRET not set — generated a random one for this deploy: $JWT_SECRET_VAL"
  echo "[WARN] Set export JWT_SECRET=... before re-deploying to keep sessions valid across redeploys."
fi

{
  echo "DB_HOST=$RDS_ADDR"
  echo "DB_PORT=$RDS_PORT"
  echo "DB_NAME=mec2tracker"
  echo "DB_USER=$RDS_USER"
  echo "DB_PASSWORD=$DB_PASS"
  echo "S3_BUCKET=$S3_BUCKET"
  echo "AWS_REGION=$REGION"
  echo "ENABLE_LLM_NORMALIZE=true"
  echo "BEDROCK_MODEL_ID=${BEDROCK_MODEL_ID:-amazon.nova-pro-v1:0}"
  echo "PORT=3000"
  echo "JWT_SECRET=$JWT_SECRET_VAL"
  echo "ADMIN_EMAIL=${ADMIN_EMAIL:-admin@mec2.local}"
  echo "ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin}"
} >"$TMP_ENV"

echo "Uploading backend → $TARGET (tar over ssh; EC2 does not need rsync) ..."
ssh "${SSH_OPTS[@]}" -i "$KEY" "$TARGET" 'rm -rf ~/backend && mkdir -p ~/backend'
( cd "$REPO_ROOT/backend" && tar czf - --exclude=node_modules . ) | ssh "${SSH_OPTS[@]}" -i "$KEY" "$TARGET" 'tar xzf - -C ~/backend'

scp -q "${SCP_OPTS[@]}" -i "$KEY" "$TMP_ENV" "$TARGET:backend/.env"

echo "Installing deps and starting API on server ..."
ssh "${SSH_OPTS[@]}" -i "$KEY" "$TARGET" bash -s <<'REMOTE'
set -euo pipefail
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found; installing Node 20 LTS (official tarball — avoids dnf curl/curl-minimal conflict)..." >&2
  NODE_VER="v20.18.3"
  ARCH="linux-x64"
  TMP="/tmp/node-${NODE_VER}-${ARCH}.tar.xz"
  curl -fsSL "https://nodejs.org/dist/${NODE_VER}/node-${NODE_VER}-${ARCH}.tar.xz" -o "$TMP"
  sudo tar -xJf "$TMP" -C /usr/local --strip-components=1
  rm -f "$TMP"
fi
command -v node >/dev/null 2>&1 || { echo "Node.js install failed." >&2; exit 1; }
cd ~/backend
npm install --no-fund --no-audit
npm run init-db
npm run migrate
node migrate_lifecycle.js
npx pm2 delete mec2-api >/dev/null 2>&1 || true
npx pm2 start server.js --name mec2-api
npx pm2 save
echo "---"
npx pm2 status
curl -sS http://127.0.0.1:3000/health | head -c 200 || true
echo ""
curl -sS -o /dev/null -w "nginx /health HTTP %{http_code}\n" http://127.0.0.1/health || true
REMOTE

echo "Done. Health: http://${HOST_ONLY}/health"
echo "After a full terraform destroy/apply, run: ./scripts/sync-expo-api-url.sh  (then npx expo start --clear)"
