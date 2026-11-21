# Cloud Run / Developer Connect. The public process listens on $PORT.
# Next.js serves the site. FastAPI stays on 127.0.0.1:8000 and is reached through /ml.
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY apps/ml-api/requirements.txt apps/ml-api/requirements.txt
RUN python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir -r apps/ml-api/requirements.txt

COPY . .

WORKDIR /app/apps/web
RUN npm ci && npm run build

ENV PATH="/opt/venv/bin:${PATH}" \
    PYTHONUNBUFFERED=1 \
    PORT=8080

EXPOSE 8080
WORKDIR /app
RUN chmod +x /app/docker/start.sh
CMD ["/app/docker/start.sh"]
