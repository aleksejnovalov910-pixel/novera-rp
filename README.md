# NOVERA RP

NOVERA RP is a from-scratch GTA V Role Play project for RAGE:MP. The goal is a server-authoritative, modular platform designed for 500+ concurrent players with deep RP systems, a controlled economy and modern CEF UI.

## Status

**v0.4.0 — Character Creator + GTA5HOST target**

Implemented so far:

- pnpm monorepo split into server, client, CEF and shared packages;
- RAGE:MP TypeScript server/client bootstrap;
- validated environment configuration;
- structured JSON logging;
- MySQL connection pool + Drizzle ORM schema;
- versioned SQL migrations;
- optional Redis with shared-hosting in-memory rate-limit fallback;
- Argon2id password hashing;
- account registration/login service;
- three server-authoritative character slots per account;
- character create/select/soft-delete flow;
- birth date, gender and GTA heritage/appearance persistence;
- private creator dimensions;
- live GTA freemode appearance preview;
- mother/father blend, hair, colors, eyebrows, beard and eyes;
- scripted creator camera with LMB rotation and mouse-wheel zoom;
- cohesive CEF auth/slots/creator interface;
- GTA5HOST RAGE:MP 1.1 old deployment target and config template;
- ownership validation and stored spawn restoration;
- server-authoritative shared event contracts.

## Local infrastructure

```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d
corepack enable
pnpm install
pnpm db:migrate
pnpm typecheck
pnpm build
```

Redis is optional. On a shared host without Redis, NOVERA falls back to an in-memory authentication rate-limit store. Durable state remains in MySQL.

The next milestone is the production build/packaging pipeline that assembles `packages/novera`, `client_packages/novera` and CEF assets into an FTP-ready runtime ZIP.

See `docs/ARCHITECTURE.md`, `docs/CHARACTERS.md`, `docs/CHARACTER_CREATOR.md`, `docs/ROADMAP.md` and `deploy/gta5host/README.md`.
