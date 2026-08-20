# Implementation order after v0.18 baseline scaffold

1. Reconcile branch with the exact v0.17.1 runtime files used on host.
2. Connect MySQL adapter and migrate schema.
3. Make auth -> character -> world persistence transactional.
4. Replace baseline command controls with CEF/HUD interactions.
5. Turn starter job into real checkpoints/routes.
6. Persist inventory/vehicles/property/org/market.
7. Run full GTA5HOST smoke test and fix P0/P1 blockers.
8. Package NOVERA RP v0.18.0 playable alpha.
9. Only then expand toward the full Majestic/GTA5RP-scale feature set.
