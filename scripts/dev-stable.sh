#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/workspace}"
SESSION_NAME="${SESSION_NAME:-portal-dev}"
TMUX_BIN="${TMUX_BIN:-tmux}"
TMUX_ARGS=(-f /exec-daemon/tmux.portal.conf)
TARGET_URL="${TARGET_URL:-http://localhost:3000/}"

if ! "$TMUX_BIN" "${TMUX_ARGS[@]}" ls >/dev/null 2>&1; then
  TMUX_ARGS=()
fi

ensure_session() {
  "$TMUX_BIN" "${TMUX_ARGS[@]}" has-session -t "=${SESSION_NAME}" 2>/dev/null || \
    "$TMUX_BIN" "${TMUX_ARGS[@]}" new-session -d -s "${SESSION_NAME}" -c "${PROJECT_DIR}" -- "${SHELL:-bash}" -l
}

is_up() {
  curl -fsS -I --max-time 3 "${TARGET_URL}" >/dev/null 2>&1
}

has_next_process() {
  pgrep -f '/workspace/node_modules/.bin/next dev|next-server' >/dev/null 2>&1
}

ensure_session

if is_up; then
  echo "Servidor Next.js ya activo en http://localhost:3000"
  exit 0
fi

# Si el proceso existe, damos margen a que termine de arrancar/compilar
# antes de matarlo para evitar reinicios en bucle.
if has_next_process; then
  for _ in {1..20}; do
    if is_up; then
      echo "Servidor Next.js recuperado en http://localhost:3000"
      exit 0
    fi
    sleep 1
  done
  pkill -f '/workspace/node_modules/.bin/next dev|next-server' >/dev/null 2>&1 || true
fi

"$TMUX_BIN" "${TMUX_ARGS[@]}" send-keys -t "${SESSION_NAME}:0.0" C-c
"$TMUX_BIN" "${TMUX_ARGS[@]}" send-keys -t "${SESSION_NAME}:0.0" "cd \"${PROJECT_DIR}\" && npm run dev" C-m

for _ in {1..30}; do
  if is_up; then
    echo "Servidor Next.js iniciado en http://localhost:3000 (sesión tmux: ${SESSION_NAME})"
    exit 0
  fi
  sleep 1
done

echo "No se pudo confirmar Next.js en el puerto 3000. Revisa la sesión tmux: ${SESSION_NAME}" >&2
exit 1
