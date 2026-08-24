# Features

## Public magazine site

- Homepage with hero, clusters, breaking strip, live ticker
- Article pages with multiple layouts (magazine / split / banner / dark)
- Category sections, archives, search, author pages
- Personalized “For You” recommendations
- RSS feed, sitemap, news sitemap
- Legal / policy pages (privacy, terms, cookies, disclaimer, guidelines)
- Contact, tip-us, masthead, about
- Ad slots (AdSense / ad rails)

## Editorial CMS (`/admin`)

- Create, edit, schedule, publish, unpublish posts
- SEO fields: meta description, keywords
- Featured image / OG image
- Accent color and layout per article
- Breaking, pinned, sponsored flags
- Categories and extra category tags
- Media library with uploads
- Site settings

## Roles (RBAC)

| Role | Typical access |
|------|----------------|
| `admin` | Full CMS, users, settings, bot |
| `editor` | Editorial workflow, publish/review |
| `author` | Draft and own content |

Exact permission checks live in `server/auth.py` / `dependencies.py`.

## Comments

- Public comments on posts
- Like / dislike votes (visitor-scoped)
- Reports for moderation
- Approval required before public display

## Identity & branding

- Staff profiles: display name, bio, email, avatar
- Avatars and brand logos stored in the **database** so they survive redeploys
- Optional brand-byline (logo instead of username on public posts)
- Email verification + password reset flows (web pages)

## Security extras

- Session + JWT authentication
- Optional TOTP (2FA) on user accounts
- Rate limiting
- CORS allow-list
- HTML sanitization (Bleach)
- Upload size caps

## Newsroom & news bot (optional)

- Workflow statuses: draft → review → scheduled → published
- Per-user bot permission (`can_run_bot`)
- RSS fetch, scrape, AI generation (`google-genai`)
- Supervised background loop that restarts on failure

## Mobile app

- Home / For You / Search / Article
- Login and account screens
- Native-feel Expo UI talking to the same API
