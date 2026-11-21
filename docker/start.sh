#!/bin/sh
set -eu

cd /app
python -m uvicorn main:app --app-dir apps/ml-api --host 127.0.0.1 --port 8000 &

cd /app/apps/web
exec npx next start --hostname 0.0.0.0 --port "${PORT:-8080}"
