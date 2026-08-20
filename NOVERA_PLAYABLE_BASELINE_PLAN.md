# NOVERA RP — Playable Baseline

Priority changed: stop polishing onboarding in isolation and make the whole server playable end-to-end first.

## Definition of playable baseline
1. Account registration/login works.
2. Character slot selection and character creation work without native/CEF errors.
3. Character data persists in MySQL.
4. Player spawns into Los Santos and can reconnect to the same character.
5. Basic HUD, money/bank, inventory and interaction layer are available.
6. Starter tutorial and first job provide a working gameplay loop.
7. Basic vehicle ownership/garage flow works.
8. Basic property/home flow works.
9. Phone opens with the configured key; tablet and F2 settings/keybind entry points exist.
10. Core organizations/families scaffolding is present.
11. V-Market scaffolding exists for later expansion.
12. Server-side validation, persistence, logging and recovery paths are in place.

## Current order of work
P0 Runtime stability and persistence
P1 Spawn + HUD + interaction
P2 Economy + inventory + starter job
P3 Vehicles + garage
P4 Property
P5 Phone/tablet/settings
P6 Organizations/families/V-Market baseline
P7 Content expansion and visual polish

Do not block the playable baseline on perfect character-editor visuals. Character editor only needs to be stable, save valid GTA values, and let the player enter the game.
