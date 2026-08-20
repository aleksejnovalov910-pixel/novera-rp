# NOVERA server modules

This directory is the v0.18 playable-first baseline. Modules are deliberately isolated so a failure in a secondary feature is logged instead of preventing the whole package from loading.

Persistence schema is in `schema.sql`. The current JS fallbacks use process memory until the existing project MySQL adapter is connected. That integration is a release blocker.
