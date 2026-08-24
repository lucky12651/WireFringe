# Local setup

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ recommended |
| Node.js | 18+ (20 LTS ideal) |
| PostgreSQL | 14+ |
| Git | latest |
| Expo CLI (optional) | via `npx expo` |

## 1. Clone

```bash
git clone https://github.com/lucky12651/WireFringe.git
cd WireFringe
```

## 2. Environment

```bash
cp .env.example .env
cp server/.env.example server/.env   # optional duplicate for server-only runs
```

Set at minimum:

```env
DATABASE_URL=postgresql://USER:PASSWORD@127.0.0.1:5432/wirefringe
BLOG_SESSION_SECRET=long-random-string
JWT_SECRET=long-random-string
REVALIDATE_SECRET=long-random-string
```

Create the database:

```sql
CREATE DATABASE wirefringe;
```

## 3. Backend

```bash
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate

pip install -r server/requirements.txt
python -m uvicorn server.main:app --reload --port 8000
```

Verify: http://127.0.0.1:8000/api/health

On first boot the app creates tables and seeds default categories.

### Create an admin user

```bash
python -m server.create_admin
```

(Follow the script prompts / args as implemented in `server/create_admin.py`.)

## 4. Frontend (Next.js)

```bash
cd web
npm install
npm run dev
```

Open:

- Site: http://127.0.0.1:3000/
- Admin: http://127.0.0.1:3000/admin

If the API is not on port 8000:

```powershell
$env:BACKEND_URL = "http://127.0.0.1:8000"
$env:INTERNAL_API_URL = "http://127.0.0.1:8000"
npm run dev
```

### Production build (local)

```bash
npm run build
npm run start
```

## 5. Mobile (optional)

```bash
cd mobile
npm install
npx expo start
```

Point the mobile API base URL at your machine LAN IP / tunnel as configured in `mobile/src/api.js`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Next.js `Failed to fetch` | Ensure FastAPI is on `:8000` and `BACKEND_URL` is correct |
| DB connection errors | Check `DATABASE_URL`, Postgres running, user privileges |
| Admin login fails | Create admin via `create_admin`; check session secret |
| Uploads fail | Ensure `static/uploads` is writable; check size limit |
| Default secret warnings | Change `BLOG_SESSION_SECRET`, `JWT_SECRET`, `REVALIDATE_SECRET` |

## Tests

```bash
pytest tests/
```

## Helper scripts

- `scripts/start-api.ps1` — Windows helper to start the API
