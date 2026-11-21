#!/bin/sh
set -eu

cd /app/apps/web
npx next start --hostname 0.0.0.0 --port "${PORT:-8080}" &
web_pid=$!

cd /app
python -m uvicorn main:app --app-dir apps/ml-api --host 127.0.0.1 --port 8000 &
api_pid=$!

trap 'kill "$web_pid" "$api_pid" 2>/dev/null || true' TERM INT
wait "$web_pid"
