# NOVERA RP Architecture

## Core principles

1. Server authoritative for money, inventory, ownership, progression and security-sensitive state.
2. Domain-oriented modules instead of a single game-mode file.
3. Shared event names/contracts to reduce server/client protocol drift.
4. MySQL as durable state, Redis only for ephemeral state/rate limits/caches.
5. Structured logs for auditability and production diagnostics.
6. Migrations are ordered, immutable deployment artifacts.

## Workspace

- `apps/server` — RAGE:MP server runtime.
- `apps/client` — RAGE:MP client runtime.
- `apps/cef` — browser UI.
- `packages/shared` — protocol contracts and shared types.
- `packages/database` — schema, pool, ORM and migrations.
- `packages/config` — validated runtime configuration.
- `packages/logging` — structured logging primitives.
- `infra` — local infrastructure.

## Authentication flow

CEF -> client event -> remote server event -> validation -> Redis rate-limit -> MySQL/Argon2 -> server result -> client -> CEF.

Passwords never leave the server-side auth module after transport processing and are stored only as Argon2id hashes.
