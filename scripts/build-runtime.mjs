import { build } from 'esbuild';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const runtime = resolve(root, 'runtime');
const serverBundlePath = resolve(runtime, 'packages/novera/index.js');
const migrationsSource = resolve(root, 'packages/database/migrations');
await rm(runtime, { recursive: true, force: true });
await mkdir(resolve(runtime, 'packages/novera'), { recursive: true });
await mkdir(resolve(runtime, 'client_packages/novera/client'), { recursive: true });
await mkdir(resolve(runtime, 'client_packages/novera/cef'), { recursive: true });
await mkdir(resolve(runtime, 'migrations'), { recursive: true });

// RAGE:MP/GTA5HOST runs the server package on legacy Node 14.
await build({ entryPoints:[resolve(root,'apps/server/src/index.ts')], outfile:serverBundlePath, bundle:true, platform:'node', format:'cjs', target:'node14', sourcemap:false, minify:false, logLevel:'info' });
let serverBundle = await readFile(serverBundlePath, 'utf8');
serverBundle = serverBundle.replace(/(["'])node:([^"']+)\1/g, '$1$2$1');
await writeFile(serverBundlePath, serverBundle, 'utf8');

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
await writeFile(resolve(runtime,'packages/novera/package.json'),JSON.stringify({name:'novera-runtime',version:'0.15.3-alpha',private:true,main:'index.js'},null,2));
await writeFile(resolve(runtime,'client_packages/index.js'),"require('./novera/client/index.js');\n");
await writeFile(resolve(runtime,'START_HERE.txt'),[
  'NOVERA RP v0.15.3 Alpha — GTA5HOST auth compatibility hotfix',
  '',
  'Server bundle targets Node 14 and contains no node:* runtime specifiers.',
  'Auth password hashing uses legacy-compatible crypto/util builtin imports.',
  'The LOS SANTOS | ALPHA status keeps a thin outline without an opaque black fill.',
  'No database migration is required for this hotfix.',
  'Upload packages/ and client_packages/ and overwrite matching NOVERA files.',
  'Keep your existing working novera.config.json with the real DATABASE_URL.',
  'After restart look for: NOVERA RP bootstrap ready.',
  '',
  `Included migrations: ${migrationFiles.length} (${migrationFiles[0]} ... ${migrationFiles.at(-1)})`,
  ''
].join('\n'),'utf8');
console.log(`NOVERA runtime assembled: ${runtime}`);
