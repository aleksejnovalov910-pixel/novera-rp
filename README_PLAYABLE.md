# NOVERA RP v0.18.0-dev

Development policy: playable first, polish second.

The current branch contains the first server-wide baseline for economy, inventory, jobs, vehicles, property, organizations/families, V-Market, tutorial and client key entry points.

## Test path
1. Register/login with the existing auth flow.
2. Select/create a character.
3. Enter the world; if the existing flow does not spawn, use `/spawn`.
4. `/tutorial`
5. `/startercar` then `/garage`
6. `/job courier` then `/work`
7. `/starterhome` then `/home` and `/leavehome`
8. Test Up Arrow, Down Arrow and F2.
9. `/org family` and `/vmarket`.

These commands are temporary baseline controls, not the final UX. They let runtime/gameplay be verified while the CEF modules are built.

## Production warning
This is not yet production-ready because DB persistence and the full GTA5HOST runtime gate have not passed. Do not advertise it as a finished public server until `NOVERA_RELEASE_CHECKLIST.md` passes.
