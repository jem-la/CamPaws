#!/usr/bin/env bash
# Starts the Spring Boot backend in the background and Expo in the foreground.
# Backend output goes to backend/bootRun.log. Stopping Expo (Ctrl+C) also stops the backend.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/backend/bootRun.log"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Stopping backend..."
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting backend (logs: backend/bootRun.log)..."
(cd "$ROOT/backend" && ./gradlew bootRun) >"$LOG" 2>&1 &
BACKEND_PID=$!

# Optional: CAMPAWS_TUNNEL=1 ./scripts/dev.sh
# Publishes the backend at a public https URL (needs `brew install cloudflared`) so any phone
# can reach it from any network, e.g. when campus Wi-Fi blocks phone-to-laptop traffic or a
# friend wants to start a walk that you can watch. Pair it with `npx expo start --tunnel`.
if [[ "${CAMPAWS_TUNNEL:-}" == "1" ]]; then
  command -v cloudflared >/dev/null || { echo "Install cloudflared first: brew install cloudflared"; exit 1; }
  TLOG="$ROOT/backend/tunnel.log"
  cloudflared tunnel --url http://localhost:8080 >"$TLOG" 2>&1 &
  TUNNEL_PID=$!
  trap 'kill "$TUNNEL_PID" 2>/dev/null || true; cleanup' EXIT INT TERM
  for _ in $(seq 1 30); do
    URL="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TLOG" | head -1 || true)"
    [[ -n "$URL" ]] && break
    sleep 1
  done
  [[ -n "${URL:-}" ]] || { echo "Tunnel didn't start; see $TLOG"; exit 1; }
  export EXPO_PUBLIC_API_URL="$URL"
  echo "Backend public URL: $URL"
fi

cd "$ROOT"
npx expo start "$@"
