#!/bin/sh
# One container: FastAPI on 127.0.0.1:8000, Next.js on $PORT.
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v python >/dev/null 2>&1; then
  PY=python
elif command -v python3 >/dev/null 2>&1; then
  PY=python3
else
  echo "Python is required so sign-in can reach the API." >&2
  exit 1
fi

API_PORT="${API_PORT:-8000}"
WEB_PORT="${PORT:-3000}"

"$PY" -m uvicorn server.main:app --host 127.0.0.1 --port "$API_PORT" &
api_pid=$!

cleanup() {
  kill "$api_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

i=0
while [ "$i" -lt 40 ]; do
  if "$PY" -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:${API_PORT}/api/health', timeout=2)" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$api_pid" 2>/dev/null; then
    echo "API exited before it was ready. Check DATABASE_URL and the secrets in the RushDeploy environment." >&2
    wait "$api_pid" || true
    exit 1
  fi
  i=$((i + 1))
  sleep 1
done

cd "$ROOT/web"
exec npx next start -H 0.0.0.0 -p "$WEB_PORT"
