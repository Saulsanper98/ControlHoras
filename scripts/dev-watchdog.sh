#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/workspace}"
TARGET_URL="${TARGET_URL:-http://localhost:3000/}"
CHECK_INTERVAL_SECONDS="${CHECK_INTERVAL_SECONDS:-5}"
FAILURES_BEFORE_RESTART="${FAILURES_BEFORE_RESTART:-3}"

is_up() {
  curl -fsS -I --max-time 3 "${TARGET_URL}" >/dev/null 2>&1
}

failures=0

while true; do
  if is_up; then
    failures=0
  else
    failures=$((failures + 1))
    echo "[watchdog] Fallo de salud ${failures}/${FAILURES_BEFORE_RESTART} en $(date -u +%H:%M:%S) UTC"
    if [ "${failures}" -ge "${FAILURES_BEFORE_RESTART}" ]; then
      echo "[watchdog] Reiniciando servidor por fallos consecutivos"
      bash "${PROJECT_DIR}/scripts/dev-stable.sh" || true
      failures=0
    fi
  fi
  sleep "${CHECK_INTERVAL_SECONDS}"
done
