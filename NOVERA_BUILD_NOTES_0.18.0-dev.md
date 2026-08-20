# NOVERA RP 0.18.0-dev build notes

This development line changes the priority from onboarding-only work to an end-to-end playable server.

Added baseline server modules for spawn, economy, jobs, inventory, vehicles, property, organizations/families, V-Market, tutorial and runtime logging. Added client key entry points for phone/tablet/settings and a MySQL persistence schema.

Important: temporary in-memory state and command-based controls are scaffolding. The release is not considered ready for public players until these are wired to the existing account/character DB adapter and verified through the GTA5HOST acceptance path.
