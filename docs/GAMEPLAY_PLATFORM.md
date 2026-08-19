# NOVERA Gameplay Platform

This milestone establishes server-authoritative domain foundations for economy, inventory, vehicles, properties, jobs, factions, families, marketplace and audit logging.

## Security rules

- The client never chooses money balances or rewards.
- Money changes that cross entities use SQL transactions.
- Property purchases lock the row before charging the buyer.
- Marketplace purchases lock the listing and transfer funds atomically.
- Owned vehicle operations validate character ownership.
- Job completion requires a server-issued session token; later milestones will additionally validate route/checkpoint progress and elapsed time.
- Inventory slots have a unique character/slot constraint to prevent duplication through concurrent moves.

## Status

These are production-oriented domain cores, not the finished gameplay/content layer. UI, world placement, catalogs, organization-specific workflows and balancing are developed on top of these services before the first hosting upload.
