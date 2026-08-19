# Build and GTA5HOST deployment

The repository remains the development source. The host receives only the assembled `runtime/` tree.

## Release build

1. Install workspace dependencies.
2. Apply/typecheck migrations locally against a disposable MySQL database.
3. Run `pnpm typecheck`.
4. Run `pnpm runtime:build`.
5. Run `pnpm runtime:validate`.
6. Archive the contents of `runtime/`, not the repository itself.

## GTA5HOST target

The host observed for NOVERA is RAGE:MP `1.1 old`, 500 slots, Linux, FTP and MySQL/phpMyAdmin. Redis is not required. Password hashing uses Node's built-in `crypto.scrypt`, avoiding native binary modules.

No hosting upload should happen until the gameplay/content milestones are complete enough for the first integrated boot test.
