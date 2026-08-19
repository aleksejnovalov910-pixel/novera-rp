# NOVERA RP

NOVERA RP is a from-scratch GTA V Role Play project for RAGE:MP, designed around server-authoritative systems, a modular TypeScript codebase, MySQL persistence and a unified CEF interface.

## Current milestone

**v0.8.0 — Closed-alpha platform foundation**

Implemented/integrated in source:

- account registration/login with built-in `crypto.scrypt` password hashing;
- three character slots and GTA freemode character creator;
- persistent character position and gameplay bootstrap;
- cash/bank transactions and audit-friendly money history;
- inventory persistence and transactional slot moves;
- owned vehicles, VIN/plates, spawn/storage foundation;
- properties, ownership, purchase and private dimensions;
- eight career foundations with progression/rewards;
- factions, families and business ownership/employees;
- V-Market transaction foundation with fees;
- phone contacts/messages persistence;
- licenses, fines and government data;
- police wanted records, cases and evidence;
- EMS medical records/injuries/treatment foundation;
- quests and achievements persistence;
- reports/punishments and admin-level account support;
- event rate guards and server-side permission checks;
- HUD plus phone/tablet/inventory/settings CEF shell;
- GTA5HOST-oriented bundled runtime builder for RAGE:MP 1.1 old / 500 slots.

## Important status

This is **IMPLEMENTED + INTEGRATED SOURCE**, not yet `TESTED` or `PRODUCTION READY`. Per the project plan, the host is intentionally untouched until the feature/content pass and local build validation are complete. The first host upload will be a single assembled runtime, after which real RAGE:MP compatibility errors will be fixed against console logs.

See `docs/` for architecture, character creator, gameplay platform, extended systems, roleplay systems and deployment notes.
