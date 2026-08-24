# Project overview

WireFringe is an open-source **digital newsroom / magazine CMS**.

It is not a static blog generator. It is a live product stack:

1. **Readers** browse a Next.js magazine site (or the Expo app).
2. **Staff** (admin / editor / author) operate a web CMS at `/admin`.
3. **FastAPI** owns auth, content, media, comments, and an optional AI news bot.
4. **PostgreSQL** is the source of truth.

## Why the repo looks like this

| Folder | Product surface |
|--------|-----------------|
| `web/` | What readers and editors see in a browser |
| `server/` | The API, database, and background bot |
| `mobile/` | Native-feeling client for the same content |
| `static/` | Uploaded files served by the API |
| `docs/` | Design and operator documentation |

## Design choices (short)

- **Two servers, not one:** Next.js can SSR and still call FastAPI; images/API stay on the backend.
- **RBAC instead of a single “admin” user:** matches a newsroom.
- **Avatars in the database:** disk-only uploads disappear on many PaaS redeploys.
- **News bot is optional:** core CMS works without Google GenAI keys.

## Start here

1. [README](../README.md)
2. [Architecture](./ARCHITECTURE.md)
3. [Setup](./SETUP.md)
