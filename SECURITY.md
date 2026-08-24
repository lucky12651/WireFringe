# Security policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` (latest) | Yes |

## Reporting a vulnerability

**Do not** open a public GitHub issue for security problems.

Email: **vkluckymgs@gmail.com**

Please include:

- Description of the issue
- Steps to reproduce
- Impact (data leak, auth bypass, RCE, etc.)
- Suggested fix if you have one

You should receive an acknowledgement within a few days. Please give us reasonable time to patch before public disclosure.

## Hardening notes for operators

- Rotate `BLOG_SESSION_SECRET`, `JWT_SECRET`, and `REVALIDATE_SECRET`
- Never commit `.env` files
- Enable HTTPS and `HTTPS_ONLY` in production
- Restrict CORS origins
- Keep PostgreSQL off the public internet
- Use strong admin passwords and TOTP
