# API overview

Base URL (local): `http://127.0.0.1:8000`

Health check: `GET /api/health`

Most public/admin JSON routes live under `/api`. The Next.js app proxies `/api/*` and `/static/*` to the backend.

> Exact paths can evolve — treat this as a map of the router modules in `server/api/`. Prefer OpenAPI at `/docs` (Swagger) when the server is running.

## Public modules

| Module | Router file | Typical concerns |
|--------|-------------|------------------|
| Posts | `posts.py` | List/read posts, public article payloads |
| Comments | `comments.py` | Create comments, votes, reports |
| Categories | `categories.py` | Public category listing |
| Views | `views.py` | View counters |
| Settings | `settings.py` | Public site settings |
| Assets | `assets.py` | Avatars / brand logos (DB-backed) |
| Contact | `contact.py` | Contact / tip forms |
| Newsroom | `newsroom.py` | Editorial/newsroom public or shared endpoints |

## Admin modules (`/api/admin…`)

| Module | Router file | Typical concerns |
|--------|-------------|------------------|
| Admin | `admin.py` | CMS operations, dashboards, bot controls |
| Users | `users.py` | Staff user management |
| Media | `media.py` | Uploads / media library |
| Categories | `categories.py` (admin prefix) | Category CRUD |

## Auth

- **Web admin:** session cookie (`blog_session` by default)
- **API / mobile:** JWT (`Authorization: Bearer …`)
- Roles: `admin`, `editor`, `author`
- Optional TOTP on user accounts

Create an initial admin with `server/create_admin.py` (see [SETUP.md](./SETUP.md)).

## Content types

- JSON for most endpoints
- `multipart/form-data` for media uploads (max size configured in settings, default 5MB)

## Rate limiting

SlowAPI limiter is attached at the app level. Exceeding limits returns HTTP 429.

## Interactive docs

With the API running:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
