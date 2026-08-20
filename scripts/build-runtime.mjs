import { build } from 'esbuild';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const VERSION = '0.18.0-alpha';
const root = resolve(import.meta.dirname, '..');
const runtime = resolve(root, 'runtime');
const serverBundlePath = resolve(runtime, 'packages/novera/index.js');
const migrationsSource = resolve(root, 'packages/database/migrations');

await rm(runtime, { recursive: true, force: true });
await mkdir(resolve(runtime, 'packages/novera'), { recursive: true });
await mkdir(resolve(runtime, 'client_packages/novera/client'), { recursive: true });
await mkdir(resolve(runtime, 'client_packages/novera/cef'), { recursive: true });
await mkdir(resolve(runtime, 'migrations'), { recursive: true });

// GTA5HOST legacy Node compatibility: bundle for Node 14 and remove node: prefixes.
await build({
  entryPoints: [resolve(root, 'apps/server/src/index.ts')],
  outfile: serverBundlePath,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node14',
  sourcemap: false,
  minify: false,
  logLevel: 'info'
});
let serverBundle = await readFile(serverBundlePath, 'utf8');
serverBundle = serverBundle.replace(/(["'])node:([^"']+)\1/g, '$1$2$1');
await writeFile(serverBundlePath, serverBundle, 'utf8');

await build({
  entryPoints: [resolve(root, 'apps/client/src/index.ts')],
  outfile: resolve(runtime, 'client_packages/novera/client/index.js'),
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2020',
  sourcemap: false,
  minify: false,
  logLevel: 'info'
});

await cp(resolve(root, 'apps/cef/public'), resolve(runtime, 'client_packages/novera/cef'), { recursive: true });
await cp(migrationsSource, resolve(runtime, 'migrations'), { recursive: true });
await cp(resolve(root, 'deploy/gta5host/conf.json'), resolve(runtime, 'conf.json'));
await cp(resolve(root, 'deploy/gta5host/novera.config.json'), resolve(runtime, 'novera.config.json'));

const migrationFiles = (await readdir(migrationsSource)).filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
const combined = [];
for (const file of migrationFiles) {
  combined.push(`-- ============================================================\n-- ${file}\n-- ============================================================\n`);
  combined.push(await readFile(resolve(migrationsSource, file), 'utf8'));
  combined.push('\n\n');
}
await writeFile(resolve(runtime, 'migrations/ALL_MIGRATIONS.sql'), combined.join(''), 'utf8');
await writeFile(resolve(runtime, 'packages/novera/package.json'), JSON.stringify({ name: 'novera-runtime', version: VERSION, private: true, main: 'index.js' }, null, 2));
await writeFile(resolve(runtime, 'client_packages/index.js'), "require('./novera/client/index.js');\n");
await writeFile(resolve(runtime, 'VERSION'), `NOVERA RP ${VERSION}\n`, 'utf8');
await writeFile(resolve(runtime, 'START_HERE.txt'), [
  `NOVERA RP v${VERSION} — PLAYABLE ALPHA`,
  '',
  'Goal: registration -> character -> Los Santos -> tutorial -> job -> economy -> inventory -> vehicle -> property -> reconnect.',
  '',
  'UPLOAD:',
  '1. Back up the current server and database.',
  '2. Apply migrations/ALL_MIGRATIONS.sql in phpMyAdmin.',
  '3. Upload packages/, client_packages/, conf.json and novera.config.json to the RAGE:MP server root.',
  '4. Keep the real DATABASE_URL/credentials from the working host configuration; never commit passwords to GitHub.',
  '5. Restart the server and check the console for NOVERA startup/database errors.',
  '',
  'GTA5HOST compatibility: server bundle targets Node 14 and node:* builtin prefixes are normalized.',
  'Redis remains optional; the project may use its fallback when REDIS_URL is empty.',
  `Included migrations: ${migrationFiles.length}${migrationFiles.length ? ` (${migrationFiles[0]} ... ${migrationFiles.at(-1)})` : ''}`,
  '',
  'Do not call this production-ready until persistence and the full player path pass on the real host.',
  ''
].join('\n'), 'utf8');

console.log(`NOVERA RP ${VERSION} runtime assembled: ${runtime}`);
