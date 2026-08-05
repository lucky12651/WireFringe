# Wirefringe (FastAPI + PostgreSQL)

This project uses Next.js (React) for the UI and FastAPI + PostgreSQL for the backend.

## Project layout (read this first)

- `server/` — FastAPI backend (PostgreSQL + admin API + image uploads)
- `web/` — Next.js frontend (React). Use `npm run dev` (development) or `npm run build` + `npm run start` (production).
- `static/` — Backend-served uploads (`uploads/`)

## 1) Install dependencies

```powershell
pip install -r requirements.txt
```

## 2) Configure the database (required)

Put your PostgreSQL connection string in `server/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/wirefringe
```

## 3) Start the backend

Default API port is **8000** (matches GridWork monorepo deploys). Override with `--port` if needed.

```powershell
python -m uvicorn server.main:app --reload --port 8000
```

Troubleshooting:

- If the Next.js homepage shows `TypeError: Failed to fetch`, FastAPI is not reachable from Next.js.
	- Confirm FastAPI is running on `http://127.0.0.1:8000`.
	- Override: `$env:BACKEND_URL = "http://127.0.0.1:8000"` and `$env:INTERNAL_API_URL = "http://127.0.0.1:8000"` before `npm run dev` / build.

Open:
- http://127.0.0.1:8000/

## Reading a post

- The homepage links open posts on a dedicated page: `/post?id=...`
- The post page loads content via `GET /api/post?id=...`

## Notes

- Images: if posts reference external image URLs (e.g. OpenGraph), the UI will still use those URLs. Images are not downloaded into the DB in this version.

## Next.js frontend (public site)

### Two-server mode (requested)

Run Next.js and FastAPI as two different servers:

Terminal 1 (backend):

```powershell
python -m uvicorn server.main:app --reload --port 8000
```

Terminal 2 (frontend):

```powershell
cd .\web
npm install
npm run dev
```

Open:
- Public site: http://127.0.0.1:3000/
- Admin: http://127.0.0.1:3000/admin

FastAPI is backend-only (API + `/static/*` for CSS/uploads):
- http://127.0.0.1:8000/api/health

The Next.js server proxies these paths to FastAPI (see `web/next.config.js`):
- `/api/*` → `BACKEND_URL` or `http://127.0.0.1:8000/api/*`
- `/static/*` → same backend

SSR uses `INTERNAL_API_URL` or `BACKEND_URL` (default `http://127.0.0.1:8000`).

If your backend runs on a different port, set:

```powershell
$env:BACKEND_URL = "http://127.0.0.1:8000"
$env:INTERNAL_API_URL = "http://127.0.0.1:8000"
npm run dev
```

### GridWork deploy

Use monorepo deploy (Next + FastAPI). Prefer project env:

```env
BACKEND_URL=http://127.0.0.1:8000
INTERNAL_API_URL=http://127.0.0.1:8000
```
