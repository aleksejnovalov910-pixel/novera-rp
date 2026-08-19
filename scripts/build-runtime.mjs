import { build } from 'esbuild';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const runtime = resolve(root, 'runtime');
const migrationsSource = resolve(root, 'packages/database/migrations');
await rm(runtime, { recursive: true, force: true });
await mkdir(resolve(runtime, 'packages/novera'), { recursive: true });
await mkdir(resolve(runtime, 'client_packages/novera/client'), { recursive: true });
await mkdir(resolve(runtime, 'client_packages/novera/cef'), { recursive: true });
await mkdir(resolve(runtime, 'migrations'), { recursive: true });

await build({ entryPoints:[resolve(root,'apps/server/src/index.ts')], outfile:resolve(runtime,'packages/novera/index.js'), bundle:true, platform:'node', format:'cjs', target:'node18', sourcemap:false, minify:false, logLevel:'info' });
await build({ entryPoints:[resolve(root,'apps/client/src/index.ts')], outfile:resolve(runtime,'client_packages/novera/client/index.js'), bundle:true, platform:'browser', format:'iife', target:'es2020', sourcemap:false, minify:false, logLevel:'info' });
await cp(resolve(root,'apps/cef/public'),resolve(runtime,'client_packages/novera/cef'),{recursive:true});
await cp(migrationsSource,resolve(runtime,'migrations'),{recursive:true});
await cp(resolve(root,'deploy/gta5host/conf.json'),resolve(runtime,'conf.json'));
await cp(resolve(root,'deploy/gta5host/novera.config.json'),resolve(runtime,'novera.config.json'));

const migrationFiles = (await readdir(migrationsSource)).filter((name)=>/^\d{4}_.+\.sql$/.test(name)).sort();
const combined = [];
for (const file of migrationFiles) {
  combined.push(`-- ============================================================\n-- ${file}\n-- ============================================================\n`);
  combined.push(await readFile(resolve(migrationsSource,file),'utf8'));
  combined.push('\n\n');
}
await writeFile(resolve(runtime,'migrations/ALL_MIGRATIONS.sql'),combined.join(''),'utf8');
await writeFile(resolve(runtime,'packages/novera/package.json'),JSON.stringify({name:'novera-runtime',version:'0.15.1-alpha',private:true,main:'index.js'},null,2));
await writeFile(resolve(runtime,'client_packages/index.js'),"require('./novera/client/index.js');\n");
await writeFile(resolve(runtime,'START_HERE.txt'),[
  'NOVERA RP v0.15.1 Alpha — GTA5HOST auth hotfix',
  '',
  'This build includes the cinematic authentication UI plus the v0.15.1 cursor, transparent-background and auth-submit fixes.',
  'Existing v0.14.2+ databases do not require a new migration for this hotfix.',
  'Upload conf.json, novera.config.json, packages/ and client_packages/ to the RAGE:MP server root and overwrite matching NOVERA files.',
  'Keep the real DATABASE_URL from your existing working novera.config.json; the distributed template intentionally contains CHANGE_ME placeholders.',
  'If authentication fails, the form now reports whether the request reached the RAGE CEF bridge and whether the server returned a response.',
  '',
  'JSON payloads are stored as LONGTEXT for compatibility with the legacy MariaDB version used by GTA5HOST.',
  'Redis is optional in this Alpha. If REDIS_URL is empty, NOVERA uses its in-memory fallback.',
  `Included migrations: ${migrationFiles.length} (${migrationFiles[0]} ... ${migrationFiles.at(-1)})`,
  ''
].join('\n'),'utf8');
console.log(`NOVERA runtime assembled: ${runtime}`);
