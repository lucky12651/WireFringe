# Coffee n Blog (FastAPI + PostgreSQL)

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
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/coffeenblog
```

## 3) Start the backend

```powershell
python -m uvicorn server.main:app --reload --port 8003
```

Troubleshooting:

- If the Next.js homepage shows `TypeError: Failed to fetch`, it usually means the FastAPI backend is not reachable from the Next.js dev server.
	- Confirm FastAPI is running on `http://127.0.0.1:8003`.
	- If your backend is on a different host/port, set `BACKEND_URL` before `npm run dev`:
		- PowerShell: `$env:BACKEND_URL = "http://127.0.0.1:8001"`

Open:
- http://127.0.0.1:8003/

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
python -m uvicorn server.main:app --reload --port 8003
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
- http://127.0.0.1:8003/api/health

The Next.js dev server proxies these paths to FastAPI (see `web/next.config.js`):
- `/api/*` → `http://127.0.0.1:8003/api/*`
- `/static/*` → `http://127.0.0.1:8003/static/*`

If your backend runs on a different port, set:

```powershell
$env:BACKEND_URL = "http://127.0.0.1:8003"
npm run dev
```

### Build

From the project root:

```powershell
cd .\web
npm install
npm run build
```

## Admin panel

Open:
- http://127.0.0.1:3000/admin

### Create the first admin user (one-time)

Run this from the project root:

```powershell
python -m server.create_admin --username admin --password "change-me" --role admin
```

Then log in at `/admin`.

### Roles

- `admin`: can manage posts + users
- `editor`: can manage posts only
- `author`: can manage only their own posts (and see comments/trends for their posts)
