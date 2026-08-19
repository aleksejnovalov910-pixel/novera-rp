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
await writeFile(resolve(runtime,'packages/novera/package.json'),JSON.stringify({name:'novera-runtime',version:'0.14.2-alpha',private:true,main:'index.js'},null,2));
await writeFile(resolve(runtime,'client_packages/index.js'),"require('./novera/client/index.js');\n");
await writeFile(resolve(runtime,'START_HERE.txt'),[
  'NOVERA RP v0.14.2 Alpha — GTA5HOST / legacy MariaDB compatibility',
  '',
  '1. The target database must be empty before importing this build. If a previous import failed, DROP all partially-created tables first.',
  '2. Open novera.config.json and replace CHANGE_ME_USER, CHANGE_ME_PASSWORD and CHANGE_ME_DATABASE with the MySQL data from GTA5HOST.',
  '3. Keep MySQL host as 127.0.0.1 when the game server and MySQL are on the same GTA5HOST service.',
  '4. Import migrations/ALL_MIGRATIONS.sql once into the empty NOVERA database using phpMyAdmin.',
  '5. Upload conf.json, novera.config.json, packages/, client_packages/ and migrations/ to the RAGE:MP server root.',
  '6. Do not upload GitHub source folders, pnpm files or development node_modules.',
  '7. Start the server and copy the first console output/error into ChatGPT for runtime debugging.',
  '',
  'JSON payloads are stored as LONGTEXT for compatibility with the legacy MariaDB version used by GTA5HOST; JSON validation/parsing stays in the application layer.',
  'Redis is optional in this Alpha. If REDIS_URL is empty, NOVERA uses its in-memory fallback.',
  `Included migrations: ${migrationFiles.length} (${migrationFiles[0]} ... ${migrationFiles.at(-1)})`,
  ''
].join('\n'),'utf8');
console.log(`NOVERA runtime assembled: ${runtime}`);
