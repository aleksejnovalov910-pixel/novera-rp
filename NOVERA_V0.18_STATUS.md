# NOVERA RP v0.18.0-dev status

This branch is the playable-first rebuild track.

Implemented in repository baseline:
- resilient package entry point
- runtime fallback spawn
- starter economy variables
- starter jobs/events
- bank event validation
- baseline commands for end-to-end testing
- MySQL schema for characters/inventory/vehicles/properties
- release gate and feature roadmap

Still required before declaring ready-to-play:
- connect baseline to the project's actual MySQL adapter/account IDs
- wire existing auth/character CEF to DB-backed character lifecycle
- replace in-memory economy with DB persistence
- implement inventory UI/use persistence
- implement actual starter job checkpoints/routes
- vehicle/dealership/garage gameplay
- property gameplay
- phone/tablet/settings CEF modules
- full GTA5HOST runtime pass

Do not label a ZIP production-ready until the release checklist passes on the actual host.
