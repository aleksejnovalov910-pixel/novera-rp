# Runtime smoke test

On GTA5HOST after deployment:

1. Confirm console prints `[NOVERA] core loaded` and every baseline module line.
2. Join with a test account and complete auth/character flow.
3. Run `/health` then `/tutorial`.
4. Verify `/startercar`, `/garage`, `/job courier`, `/work`, `/starterhome`, `/home`, `/leavehome`.
5. Verify Up Arrow, Down Arrow, F2 client handlers.
6. Reconnect and verify DB-backed state once persistence adapter is enabled.

Any native/CEF exception in the auth -> world path is P0.
