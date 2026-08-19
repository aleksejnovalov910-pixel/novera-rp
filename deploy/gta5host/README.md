# GTA5HOST deployment target

This directory documents the production layout for the current NOVERA RP shared-hosting target.

## Target

- RAGE:MP 1.1 old
- 500 slots
- Linux shared hosting
- FTP file deployment
- MySQL provided by GTA5HOST
- no Docker/root requirement
- Redis optional; the server falls back to an in-memory auth rate-limit store

## Runtime layout

```text
server-root/
├── conf.json
├── packages/
│   └── novera/
│       └── index.js
├── client_packages/
│   ├── index.js
│   └── novera/
│       └── cef/
│           ├── index.html
│           ├── style.css
│           └── app.js
└── node_modules/
```

The GitHub repository remains the TypeScript source workspace. Deployment must contain compiled/runtime files only.

## Database

Use the MySQL host/database/user supplied by GTA5HOST. Never commit credentials. The production `DATABASE_URL` is injected during deployment or written only to a server-local environment/config file that is ignored by Git.

## RAGE:MP config

`conf.example.json` is a template. Keep the port assigned by the hosting panel. Do not blindly replace the hosting port with a development port.

## Build pipeline planned for v0.5

1. install dependencies in a build environment;
2. run migrations validation and TypeScript typecheck;
3. compile server and client bundles;
4. copy CEF static assets;
5. assemble a `runtime/` directory matching the layout above;
6. produce a ZIP suitable for FTP upload.
