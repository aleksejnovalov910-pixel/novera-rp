# NOVERA RP

NOVERA RP is a from-scratch GTA V Role Play project for RAGE:MP. The goal is a server-authoritative, modular platform designed for 500+ concurrent players with deep RP systems, a controlled economy and modern CEF UI.

## Status

**v0.3.0 — Character System Core**

Implemented so far:

- pnpm monorepo split into server, client, CEF and shared packages;
- RAGE:MP TypeScript server/client bootstrap;
- validated environment configuration;
- structured JSON logging;
- MySQL connection pool + Drizzle ORM schema;
- versioned SQL migrations;
- Redis connection and login rate limiting;
- Argon2id password hashing;
- account registration/login service;
- three server-authoritative character slots per account;
- character create/select/soft-delete flow;
- birth date, gender and GTA heritage/appearance persistence;
- private creator dimensions;
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

RAGE:MP runtime packaging is the next integration milestone: compiled server output will be deployed into `packages/novera`, client output into `client_packages/novera`, and the CEF build into the client package.

See `docs/ARCHITECTURE.md`, `docs/CHARACTERS.md` and `docs/ROADMAP.md`.
