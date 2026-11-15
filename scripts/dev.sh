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

cd "$ROOT"
npx expo start "$@"
