#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/workspace}"
TARGET_URL="${TARGET_URL:-http://localhost:3000/login}"

while true; do
  if ! curl -fsS -I --max-time 2 "${TARGET_URL}" >/dev/null 2>&1; then
    echo "[watchdog] Servidor caído. Reiniciando en $(date -u +%H:%M:%S) UTC"
    bash "${PROJECT_DIR}/scripts/dev-stable.sh" || true
  fi
  sleep 5
done
