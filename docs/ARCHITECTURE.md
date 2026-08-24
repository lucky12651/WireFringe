# Architecture

WireFringe is a **three-client, one-API** system: a Next.js web app, an Expo mobile app, and a FastAPI backend backed by PostgreSQL.

## High-level diagram

```text
┌─────────────────┐   ┌─────────────────┐
│  Next.js (web)  │   │  Expo (mobile)  │
│  :3000 public   │   │  iOS / Android  │
│  + /admin CMS   │   │                 │
└────────┬────────┘   └────────┬────────┘
         │  /api/*  /static/*  │  REST + JWT
         └──────────┬──────────┘
                    ▼
         ┌──────────────────────┐
         │   FastAPI (server)   │
         │   :8000              │
         │  routers → services  │
         │  → repositories      │
         └──────────┬───────────┘
                    ▼
         ┌──────────────────────┐
         │     PostgreSQL       │
         └──────────────────────┘
                    ▲
         ┌──────────┴───────────┐
         │  News Bot (async)    │
         │  RSS / scrape / AI   │
         └──────────────────────┘
```

## Backend layers (`server/`)

| Layer | Path | Responsibility |
|-------|------|----------------|
| HTTP API | `server/api/` | Route handlers (posts, comments, admin, newsroom, …) |
| Auth | `server/auth.py`, `dependencies.py` | Sessions, JWT, role checks |
| Services | `server/services/` | Business logic |
| Repositories | `server/repositories/` | DB access helpers |
| Models | `server/models.py` | SQLAlchemy ORM entities |
| Schemas | `server/schemas.py` | Pydantic request/response models |
| Config | `server/config.py` | Env-driven settings (`pydantic-settings`) |
| News bot | `server/news_bot*.py`, `news_bot_modules/` | Background publishing pipeline |

Request flow:

```text
Client → APIRouter → dependency (DB session / auth)
       → Service → Repository / Model → PostgreSQL
       → Pydantic schema → JSON response
```

## Frontend (`web/`)

- **Framework:** Next.js (Pages Router)
- **UI:** React components under `web/components/`
- **Data:** SWR + proxied `/api/*` to FastAPI (`web/next.config.js`)
- **SSR:** uses `INTERNAL_API_URL` / `BACKEND_URL` to call the API from the Node server
- **Admin:** `/admin` and nested admin pages for CMS workflows
- **Public:** homepage, post pages, sections, search, legal pages, feeds/sitemaps

## Mobile (`mobile/`)

- Expo React Native app
- Screens: Home, For You, Search, Article, Login, Account
- Talks to the same FastAPI backend (`mobile/src/api.js`)

## Core domain models

| Entity | Purpose |
|--------|---------|
| `Post` | Articles with SEO, status workflow, bot flags, accents/layouts |
| `User` | Staff accounts with RBAC, avatars, brand byline, TOTP |
| `Comment` | Moderated reader comments + votes/reports |
| Categories / settings / contact / newsroom | Supporting CMS & editorial features |

Post lifecycle (newsroom):

```text
draft → review → scheduled → published
                      ↘ unpublished
```

## Security architecture

- Secrets via environment variables (never commit `.env`)
- Session cookies for web admin; JWT for mobile/API clients
- CORS allow-list in `settings.cors_origins`
- Rate limiting via SlowAPI
- Upload size limits; HTML sanitization (Bleach) where content is rendered
- Role-gated `/api/admin/*` routes

## Static assets

- Disk: `static/uploads/` for general media
- DB-backed: user avatars / brand logos (`LargeBinary`) so redeploys do not wipe identity assets
- Served under `/static/*` and asset API routes

## Background work

On app lifespan start, FastAPI:

1. Creates/verifies tables and runs lightweight schema upgrades
2. Seeds default categories / catalog
3. Starts a **supervised news-bot loop** (restarts on crash)

## Related docs

- [API overview](./API.md)
- [Setup](./SETUP.md)
- [Deployment](./DEPLOYMENT.md)
