# Deployment

WireFringe is designed to run as **two processes**: FastAPI + Next.js, sharing one PostgreSQL database. The mobile app consumes the public API.

## Recommended topology

```text
Internet → reverse proxy (TLS)
            ├─ /        → Next.js :3000
            ├─ /api/*   → FastAPI :8000  (or Next.js proxy)
            └─ /static/*→ FastAPI :8000
```

## Environment (production)

Set strong secrets (never use the `dev-*-change-me` defaults):

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/wirefringe
BLOG_SESSION_SECRET=<random>
JWT_SECRET=<random>
REVALIDATE_SECRET=<random>
HTTPS_ONLY=true
BACKEND_URL=https://your-domain.example
INTERNAL_API_URL=http://127.0.0.1:8000
```

Update CORS origins in `server/config.py` (or via env if you extend settings) to only your real domains.

## Backend

```bash
pip install -r server/requirements.txt
python -m uvicorn server.main:app --host 0.0.0.0 --port 8000
```

Use a process manager (systemd, Docker, GridWork, etc.). Run **one** instance for the news-bot loop unless you add a lock.

## Frontend

```bash
cd web
npm ci
npm run build
npm run start
```

Ensure `BACKEND_URL` / `INTERNAL_API_URL` point at the API (internal URL for SSR, public URL for the browser if not using the Next proxy).

## GridWork / monorepo deploys

Default API port is **8000** to match GridWork-style deploys:

```env
BACKEND_URL=http://127.0.0.1:8000
INTERNAL_API_URL=http://127.0.0.1:8000
```

## Database

- Take regular backups (`server/backup_db.py` exists for this)
- Schema is created/upgraded on API startup (`create_all` + lightweight column migrations)
- Do **not** delete `static/uploads` without a backup; avatars/logos in DB are safer than disk-only files

## Health checks

- `GET /api/health` for the API
- Next.js homepage for the web process

## Security checklist

- [ ] Unique secrets, not the defaults
- [ ] `HTTPS_ONLY=true` behind TLS
- [ ] CORS limited to production origins
- [ ] Postgres not exposed publicly
- [ ] Uploads directory not world-writable beyond the app user
- [ ] Admin accounts use strong passwords + TOTP
