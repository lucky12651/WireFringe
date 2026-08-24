# Contributing

Thanks for considering a contribution to **WireFringe**.

## How to contribute

1. Fork the repository
2. Create a branch: `git checkout -b feature/short-name`
3. Make focused changes (docs, backend, web, or mobile — prefer one area per PR)
4. Test locally (API + `pytest tests/` when you touch Python)
5. Open a pull request with a clear description

## Development setup

See [docs/SETUP.md](./docs/SETUP.md).

## Guidelines

- Do not commit `.env`, keys, or real credentials
- Match existing code style in each package (`server/`, `web/`, `mobile/`)
- Keep PRs small and reviewable
- Update docs when you change architecture, env vars, or public APIs
- Do not add unused dependencies

## Reporting bugs

Open a GitHub issue with:

- What you expected
- What happened
- Steps to reproduce
- OS, Python/Node versions, and whether it is web/API/mobile

Security issues: **do not** file a public issue — see [SECURITY.md](./SECURITY.md).

## Code of conduct

By participating you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md).
