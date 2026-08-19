# NOVERA RP

From-scratch GTA V Role Play server for RAGE:MP with a server-authoritative TypeScript architecture, MySQL persistence and unified CEF interface.

## v0.14.1 Alpha — GTA5HOST deployment hardening

The Alpha source now includes account/auth security, three character slots, GTA freemode creator, first-spawn onboarding, HUD/devices, cash/bank, inventory, Vehicle System 2.0, Property & Housing 2.0, Jobs & Career 2.0, factions, families, businesses, V-Market foundations, phone contacts/messages, government fines/licenses, Police wanted/cases/evidence, EMS injuries/medical records, progression, reports/admin foundations and anti-abuse event guards.

The GTA5HOST release pipeline produces an FTP-ready runtime for RAGE:MP 1.1 old / 500 slots. v0.14.1 adds a host-friendly `novera.config.json`, so MySQL credentials can be configured without relying on panel environment-variable support. Environment variables still override the file when available. Redis remains optional and falls back to an in-memory rate-limit store.

The runtime contains `START_HERE.txt`, `conf.json`, the server package, client package, CEF files, all numbered SQL migrations and a generated `migrations/ALL_MIGRATIONS.sql` for one-import phpMyAdmin setup. Distribution validation rejects embedded real database credentials and checks the expected GTA5HOST port, slot count, Alpha version and migration set.

**Runtime/CI status:** IMPLEMENTED + INTEGRATED + BUILD-VALIDATED. It is not yet RAGE:MP runtime-tested on GTA5HOST; the first host launch is the next compatibility milestone, and host-console output will be the source of truth for any remaining runtime fixes.
