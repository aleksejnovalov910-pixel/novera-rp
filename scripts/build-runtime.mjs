import { build } from 'esbuild';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const runtime = resolve(root, 'runtime');
await rm(runtime, { recursive: true, force: true });
await mkdir(resolve(runtime, 'packages/novera'), { recursive: true });
await mkdir(resolve(runtime, 'client_packages/novera/client'), { recursive: true });
await mkdir(resolve(runtime, 'client_packages/novera/cef'), { recursive: true });
await mkdir(resolve(runtime, 'migrations'), { recursive: true });

await build({ entryPoints:[resolve(root,'apps/server/src/index.ts')], outfile:resolve(runtime,'packages/novera/index.js'), bundle:true, platform:'node', format:'cjs', target:'node18', sourcemap:false, minify:false, logLevel:'info' });
await build({ entryPoints:[resolve(root,'apps/client/src/index.ts')], outfile:resolve(runtime,'client_packages/novera/client/index.js'), bundle:true, platform:'browser', format:'iife', target:'es2020', sourcemap:false, minify:false, logLevel:'info' });
await cp(resolve(root,'apps/cef/public'),resolve(runtime,'client_packages/novera/cef'),{recursive:true});
await cp(resolve(root,'packages/database/migrations'),resolve(runtime,'migrations'),{recursive:true});
await cp(resolve(root,'deploy/gta5host/conf.json'),resolve(runtime,'conf.json'));
await writeFile(resolve(runtime,'packages/novera/package.json'),JSON.stringify({name:'novera-runtime',version:'0.14.0-alpha',private:true,main:'index.js'},null,2));
await writeFile(resolve(runtime,'client_packages/index.js'),"require('./novera/client/index.js');\n");
await writeFile(resolve(runtime,'DEPLOY.txt'),'NOVERA RP GTA5HOST runtime v0.14.0 Alpha. Apply SQL migrations in order. Configure the database connection before launch. Upload the contents of this directory to the RAGE:MP server root.\n');
console.log(`NOVERA runtime assembled: ${runtime}`);
