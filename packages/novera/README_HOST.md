# GTA5HOST deployment notes

The repository branch is development source. Before deployment, reconcile it with the exact v0.17.1 host runtime tree, apply `schema.sql` to the configured MySQL database, and connect the existing DB module to NOVERA core state.

Do not upload only the new `packages/novera` folder over an unknown host tree and call it production-ready; the auth/CEF/client runtime must match the tested build.
