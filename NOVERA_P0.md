# P0 blockers before players are invited

1. Main branch is older than the runtime ZIP currently being tested; reconcile exact v0.17.1 runtime content into this development branch.
2. DB adapter must be connected to character/economy/inventory/ownership state.
3. Full auth/creator/world path must run on GTA5HOST without native or CEF exceptions.
4. Reconnect persistence must pass.

Everything else can iterate after players can reliably enter and play.
