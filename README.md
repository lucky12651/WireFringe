# WireFringe

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](./server)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js-000000.svg)](./web)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1.svg)](https://www.postgresql.org/)
[![Mobile](https://img.shields.io/badge/Mobile-Expo%20React%20Native-000020.svg)](./mobile)

**WireFringe** is a modern full-stack blogging / digital newsroom platform with:

- Public magazine-style website (Next.js)
- Role-based admin CMS (admin / editor / author)
- FastAPI + PostgreSQL backend
- Image uploads & DB-backed avatars
- Comments with moderation
- Optional AI news bot / newsroom workflow
- Expo mobile app

Live-oriented stack used in production-style deploys (e.g. GridWork monorepo).

---

## Features

- **Public site** — homepage, sections, search, archives, authors, RSS/sitemaps
- **Rich articles** — layouts, accent colors, SEO fields, breaking/pinned/sponsored flags
- **Admin CMS** — posts, categories, media, users, settings, newsroom
- **RBAC** — `admin`, `editor`, `author` roles
- **Comments** — likes/dislikes, reports, approval workflow
- **Assets** — uploads + DB-backed profile/brand images (survive redeploys)
- **News bot** — RSS/scrape + AI article generation (optional)
- **Mobile** — Expo app for browsing and account flows

Full feature list: [docs/FEATURES.md](./docs/FEATURES.md)

---

## Repository structure

```text
WireFringe/
├── server/          # FastAPI backend (API, auth, bots, services)
├── web/             # Next.js public site + admin UI
├── mobile/          # Expo React Native app
├── static/uploads/  # Uploaded media served by the API
├── scripts/         # Helper scripts (e.g. start-api.ps1)
├── tests/           # Backend smoke tests
└── docs/            # Architecture, API, setup, deployment
```

---

## Quick start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone & configure

```bash
git clone https://github.com/lucky12651/WireFringe.git
cd WireFringe
cp .env.example .env
# edit .env — set DATABASE_URL and secrets
```

### 2. Backend

```bash
pip install -r server/requirements.txt
python -m uvicorn server.main:app --reload --port 8000
```

API health: http://127.0.0.1:8000/api/health

### 3. Frontend

```bash
cd web
npm install
npm run dev
```

- Public site: http://127.0.0.1:3000/
- Admin: http://127.0.0.1:3000/admin

### 4. Mobile (optional)

```bash
cd mobile
npm install
npx expo start
```

Detailed setup: [docs/SETUP.md](./docs/SETUP.md)

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](./docs/ARCHITECTURE.md) | System design, layers, data flow |
| [API](./docs/API.md) | HTTP endpoints overview |
| [Setup](./docs/SETUP.md) | Local development guide |
| [Features](./docs/FEATURES.md) | Product capabilities |
| [Deployment](./docs/DEPLOYMENT.md) | Production / GridWork notes |
| [Contributing](./CONTRIBUTING.md) | How to contribute |
| [Security](./SECURITY.md) | Vulnerability reporting |
| [Code of Conduct](./CODE_OF_CONDUCT.md) | Community standards |
| [Changelog](./CHANGELOG.md) | Release history |
| [Support](./SUPPORT.md) | Getting help |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Web UI | Next.js 16, React 18, Tailwind CSS, SWR |
| API | FastAPI, SQLAlchemy, Pydantic, SlowAPI |
| DB | PostgreSQL |
| Auth | Sessions + JWT, optional TOTP |
| Mobile | Expo / React Native |
| AI bot | Google GenAI + RSS/scraper modules |

---

## Environment (summary)

Required in `.env` / `server/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/wirefringe
BLOG_SESSION_SECRET=change-me
JWT_SECRET=change-me
REVALIDATE_SECRET=change-me
```

Frontend (optional overrides):

```env
BACKEND_URL=http://127.0.0.1:8000
INTERNAL_API_URL=http://127.0.0.1:8000
```

See [.env.example](./.env.example) for the full template.

---

## License

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE).

Copyright (c) 2026 Vaibhav Srivastava

---

## Author

**Vaibhav Srivastava** ([@lucky12651](https://github.com/lucky12651))

- LinkedIn: [vaibhav-srivastava-63684477](https://www.linkedin.com/in/vaibhav-srivastava-63684477/)
- X: [@VAlBHAV_](https://twitter.com/VAlBHAV_)
