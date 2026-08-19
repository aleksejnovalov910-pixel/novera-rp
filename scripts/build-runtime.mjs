import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const runtime = resolve(root, 'runtime');
const mustExist = (path) => { if (!existsSync(path)) throw new Error(`Missing build output: ${path}`); };

await rm(runtime, { recursive: true, force: true });
await mkdir(resolve(runtime, 'packages/novera'), { recursive: true });
await mkdir(resolve(runtime, 'client_packages/novera'), { recursive: true });
await mkdir(resolve(runtime, 'migrations'), { recursive: true });

const serverDist = resolve(root, 'apps/server/dist');
const clientDist = resolve(root, 'apps/client/dist');
const cefDist = resolve(root, 'apps/cef/dist');
for (const path of [serverDist, clientDist, cefDist]) mustExist(path);

await cp(serverDist, resolve(runtime, 'packages/novera'), { recursive: true });
await cp(clientDist, resolve(runtime, 'client_packages/novera/client'), { recursive: true });
await cp(cefDist, resolve(runtime, 'client_packages/novera/cef'), { recursive: true });
await cp(resolve(root, 'packages/database/migrations'), resolve(runtime, 'migrations'), { recursive: true });
await cp(resolve(root, 'deploy/gta5host/conf.json'), resolve(runtime, 'conf.json'));

await writeFile(resolve(runtime, 'packages/novera/package.json'), JSON.stringify({ name: 'novera-runtime', version: '0.6.0', private: true, main: 'index.js' }, null, 2));
await writeFile(resolve(runtime, 'client_packages/index.js'), "require('./novera/client/index.js');\n");
await writeFile(resolve(runtime, 'DEPLOY.txt'), 'NOVERA RP GTA5HOST runtime. Apply SQL migrations in order, configure DATABASE_URL/environment, then upload runtime contents to the RAGE:MP server root.\n');
console.log(`NOVERA runtime assembled at ${runtime}`);
