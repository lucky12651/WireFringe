# Coffee n Blog (FastAPI + SQLite)

This project uses Next.js (React) for the UI and FastAPI + SQLite for the backend.

## Project layout (read this first)

- `server/` — FastAPI backend (SQLite + admin API + image uploads)
- `web/` — Next.js frontend (React). Use `npm run dev` (development) or `npm run build` + `npm run start` (production).
- `static/` — Backend-served uploads (`uploads/`)

## 1) Put your WordPress XML in the right place

Copy your export file into the project root (next to `server/`):

- `C:\Users\lucky\Documents\blog\coffeenblog.WordPress.2026-03-02.xml`

## 2) Install dependencies

```powershell
pip install -r requirements.txt
```

## 3) Start the backend

```powershell
python -m uvicorn server.main:app --reload --port 8000
```

Open:
- http://127.0.0.1:8000/

## 4) Import XML into SQLite (one-time)

If the database is empty and the XML exists, the server will auto-import on startup.

If you want to force an import (or you started the server before adding the XML), run:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:8000/api/import/wordpress
```

Then confirm posts exist:

```powershell
(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/api/posts).Content
```

## 5) After import: you can delete the XML

Once posts are in `blog.db`, the website reads from SQLite via `GET /api/posts`.
That means you can delete `coffeenblog.WordPress.2026-03-02.xml` and the site will still work.

## Reading a post

- The homepage links open posts on a dedicated page: `/post?id=...`
- The post page loads content from SQLite via `GET /api/post?id=...`

## Notes

- Images: if the XML references external image URLs (Yoast OpenGraph), the UI will still use those URLs. Images are not downloaded into the DB in this version.

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

The Next.js dev server proxies these paths to FastAPI (see `web/next.config.js`):
- `/api/*` → `http://127.0.0.1:8000/api/*`
- `/static/*` → `http://127.0.0.1:8000/static/*`

If your backend runs on a different port, set:

```powershell
$env:BACKEND_URL = "http://127.0.0.1:8001"
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
