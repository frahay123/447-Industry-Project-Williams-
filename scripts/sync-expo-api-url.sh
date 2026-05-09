#!/usr/bin/env bash
# After terraform apply, set app.json expo.extra.apiUrl from ec2_public_ip (Elastic IP).
# Run from anywhere; resolves paths relative to this script.
set -euo pipefail

TF_DIR=$(cd "$(dirname "$0")/.." && pwd)
ROOT=$(cd "$TF_DIR/.." && pwd)
APP_JSON="$ROOT/app.json"

TF_BIN="${TERRAFORM:-}"
if [[ -z "$TF_BIN" || ! -x "$TF_BIN" ]] && command -v terraform >/dev/null 2>&1; then
  TF_BIN=$(command -v terraform)
fi
if [[ -z "$TF_BIN" || ! -x "$TF_BIN" ]]; then
  for p in /opt/homebrew/bin/terraform /usr/local/bin/terraform; do
    [[ -x "$p" ]] && TF_BIN="$p" && break
  done
fi
[[ -z "${TF_BIN:-}" ]] && { echo "terraform not found"; exit 1; }

IP=$("$TF_BIN" -chdir="$TF_DIR" output -raw ec2_public_ip 2>/dev/null) || true
if [[ -z "$IP" || "$IP" == "null" ]]; then
  echo "ec2_public_ip is empty (enable_ec2 = true and apply first)." >&2
  exit 1
fi

URL="http://${IP}"
if [[ ! -f "$APP_JSON" ]]; then
  echo "Not found: $APP_JSON" >&2
  exit 1
fi

if [[ "$(uname -s)" == Darwin ]]; then
  sed -i '' "s|\"apiUrl\":[[:space:]]*\"[^\"]*\"|\"apiUrl\": \"${URL}\"|" "$APP_JSON"
else
  sed -i "s|\"apiUrl\":[[:space:]]*\"[^\"]*\"|\"apiUrl\": \"${URL}\"|" "$APP_JSON"
fi

echo "Updated $APP_JSON → extra.apiUrl = $URL"
