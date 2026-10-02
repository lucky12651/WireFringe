# RushDeploy (and any single-container host): Next.js and FastAPI together.
# The site proxies /api to FastAPI on 127.0.0.1:8000. Without that process,
# https://wirefringe.com/login returns 500.
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 \
      python3-pip \
      python3-venv \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}" \
    INTERNAL_API_URL=http://127.0.0.1:8000 \
    BACKEND_URL=http://127.0.0.1:8000 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=3000

COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir -r /app/server/requirements.txt

COPY web/package.json web/package-lock.json /app/web/
RUN npm ci --prefix /app/web

COPY . /app
RUN sed -i 's/\r$//' /app/scripts/start.sh && chmod +x /app/scripts/start.sh \
    && npm run build --prefix /app/web

EXPOSE 3000
CMD ["/app/scripts/start.sh"]
