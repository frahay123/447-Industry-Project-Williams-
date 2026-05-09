#!/usr/bin/env bash
# Quick Bedrock check (Amazon Nova or Titan Text InvokeModel).
# Usage:
#   REGION=us-east-1 MODEL_ID=amazon.nova-pro-v1:0 ./bedrock-invoke-smoke-test.sh
# Requires: AWS CLI v2, credentials with bedrock:InvokeModel on the chosen model/profile.
set -euo pipefail

REGION="${REGION:-us-east-1}"
MODEL_ID="${MODEL_ID:-amazon.nova-pro-v1:0}"

BODY=$(mktemp)
trap 'rm -f "$BODY"' EXIT

if [[ "$MODEL_ID" == amazon.titan-text* ]]; then
  cat >"$BODY" <<EOF
{
  "inputText": "User: Reply with exactly: ok\\nBot:",
  "textGenerationConfig": { "maxTokenCount": 64, "temperature": 0 }
}
EOF
else
  # Amazon Nova (messages-v1)
  cat >"$BODY" <<EOF
{
  "schemaVersion": "messages-v1",
  "messages": [{"role": "user", "content": [{"text": "Reply with exactly: ok"}]}],
  "inferenceConfig": { "maxTokens": 64, "temperature": 0 }
}
EOF
fi

echo "Region:   $REGION"
echo "ModelId:  $MODEL_ID"
echo "Invoking..."

aws bedrock-runtime invoke-model \
  --region "$REGION" \
  --model-id "$MODEL_ID" \
  --content-type application/json \
  --body "file://$BODY" \
  /dev/stdout

echo ""
echo "If you see JSON with a completion, Bedrock invoke works for this principal."
echo "If AccessDenied: attach IAM bedrock:InvokeModel on this model or inference profile."
echo "If validation error: pick a model ID from Bedrock console → Model catalog for this region."
