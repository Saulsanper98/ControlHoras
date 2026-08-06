#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/workspace}"
# /login debe responder 200; / redirige (307) y curl -f -I puede fallar según entorno.
TARGET_URL="${TARGET_URL:-http://127.0.0.1:3000/login}"
CHECK_INTERVAL_SECONDS="${CHECK_INTERVAL_SECONDS:-5}"
FAILURES_BEFORE_RESTART="${FAILURES_BEFORE_RESTART:-3}"

is_up() {
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "${TARGET_URL}" 2>/dev/null || true)"
  [ "${code}" = "200" ]
}

failures=0

while true; do
  if is_up; then
    failures=0
  else
    failures=$((failures + 1))
    echo "[watchdog] Fallo de salud ${failures}/${FAILURES_BEFORE_RESTART} en $(date -u +%H:%M:%S) UTC (url=${TARGET_URL})"
    if [ "${failures}" -ge "${FAILURES_BEFORE_RESTART}" ]; then
      echo "[watchdog] Reiniciando servidor por fallos consecutivos"
      bash "${PROJECT_DIR}/scripts/dev-stable.sh" || true
      failures=0
    fi
  fi
  sleep "${CHECK_INTERVAL_SECONDS}"
done
