# NOVERA RP

From-scratch GTA V Role Play server for RAGE:MP with a server-authoritative TypeScript architecture, MySQL persistence and unified CEF interface.

## v0.10.0 — economy & inventory hardening

The source contains account/auth security, three character slots, GTA freemode creator, first-spawn onboarding, HUD/devices, cash/bank, inventory, vehicles, properties, jobs, factions, families, businesses, V-Market, phone persistence, government fines/licenses, Police wanted/cases/evidence, EMS injuries/medical records, progression, reports/admin foundations and anti-abuse event guards.

v0.10.0 strengthens the player economy and item runtime: every character receives a unique NOVERA Bank account number, bank-to-bank transfers are transactional and auditable, frozen accounts are supported, money overflow is guarded, inventory stacks can be split server-side, usable items are validated and consumed server-side, and item usage is written to an audit log. The CEF bank and inventory shells expose these actions without trusting client balances or item state.

A GTA5HOST-oriented release pipeline bundles the server/client code and uploads an FTP-ready runtime artifact from GitHub Actions. The target remains RAGE:MP 1.1 old with 500 slots.

**The host is intentionally untouched.** Source status is IMPLEMENTED/INTEGRATED, not TESTED/PRODUCTION READY. We continue feature/content and CI correction before the first upload; after that, host-console errors become the source of truth for compatibility fixes.
