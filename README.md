# Coffee n Blog (FastAPI + SQLite)

This project serves your existing HTML UI and loads blog posts from a local SQLite database (`blog.db`).

## 1) Put your WordPress XML in the right place

Copy your export file next to `index.html`:

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

The public UI can be built/exported using Next.js and then served by the same FastAPI server.

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
- Admin (stays on backend): http://127.0.0.1:8000/admin

The Next.js dev server proxies these paths to FastAPI (see `web/next.config.js`):
- `/api/*` → `http://127.0.0.1:8000/api/*`
- `/static/*` → `http://127.0.0.1:8000/static/*`

If your backend runs on a different port, set:

```powershell
$env:BACKEND_URL = "http://127.0.0.1:8001"
npm run dev
```

### Build + export (one-time / when UI changes)

From the project root:

```powershell
cd .\web
npm install
npm run build
cd ..
```

This creates `web\out\...`.

### Serving

- If `web\out\index.html` exists, FastAPI serves it at `/`.
- If `web\out\post\index.html` exists, FastAPI serves it at `/post`.
- Next static assets are served from `web\out\_next` via `/_next`.
- Admin stays as-is: `/admin` and `/admin/post` are still FastAPI-served HTML.

## Admin panel

Open:
- http://127.0.0.1:8000/admin

### Create the first admin user (one-time)

Run this from the project root:

```powershell
python -m server.create_admin --username admin --password "change-me" --role admin
```

Then log in at `/admin`.

### Roles

- `admin`: can manage posts + users
- `editor`: can manage posts only
