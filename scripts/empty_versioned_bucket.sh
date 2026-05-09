#!/usr/bin/env bash
# Remove every object version and delete marker so a versioned bucket can be deleted.
# Used from Terraform destroy-time provisioner when force_destroy is not enough.
set -euo pipefail
bucket="${1:?bucket name}"
region="${2:?region}"
export AWS_DEFAULT_REGION="$region"
python3 - "$bucket" "$region" <<'PY'
import json, subprocess, sys

bucket, region = sys.argv[1], sys.argv[2]


def aws_json(*args: str) -> dict:
    out = subprocess.check_output(["aws", *args, "--output", "json"], text=True)
    return json.loads(out) if out.strip() else {}


while True:
    try:
        d = aws_json(
            "s3api",
            "list-object-versions",
            "--bucket",
            bucket,
            "--region",
            region,
            "--max-keys",
            "1000",
        )
    except subprocess.CalledProcessError:
        sys.exit(0)

    objs = []
    for x in d.get("Versions") or []:
        objs.append({"Key": x["Key"], "VersionId": x["VersionId"]})
    for x in d.get("DeleteMarkers") or []:
        objs.append({"Key": x["Key"], "VersionId": x["VersionId"]})
    if not objs:
        break

    payload = json.dumps({"Objects": objs[:1000], "Quiet": True})
    subprocess.run(
        [
            "aws",
            "s3api",
            "delete-objects",
            "--bucket",
            bucket,
            "--region",
            region,
            "--delete",
            payload,
        ],
        check=True,
    )
PY
