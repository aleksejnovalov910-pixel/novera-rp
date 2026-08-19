import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const runtime = resolve(root, 'runtime');
const required = [
  'conf.json','novera.config.json','START_HERE.txt','packages/novera/index.js','packages/novera/package.json','client_packages/index.js','client_packages/novera/client/index.js','client_packages/novera/cef/index.html','client_packages/novera/cef/app.js','client_packages/novera/cef/device.js','client_packages/novera/cef/auth-hotfix.css','client_packages/novera/cef/auth-hotfix.js','migrations/ALL_MIGRATIONS.sql',
  'migrations/0001_accounts_characters.sql','migrations/0002_character_creator.sql','migrations/0003_gameplay_core.sql','migrations/0004_extended_core.sql','migrations/0005_roleplay_core.sql','migrations/0006_onboarding_seed.sql','migrations/0007_economy_inventory_hardening.sql','migrations/0008_vehicle_system_2.sql','migrations/0009_property_housing_2.sql','migrations/0010_jobs_career_2.sql'
];
for (const file of required) await access(resolve(runtime, file));

const conf = JSON.parse(await readFile(resolve(runtime, 'conf.json'), 'utf8'));
if (conf.name !== 'NOVERA RP') throw new Error('runtime conf.json has wrong server name');
if (Number(conf.maxplayers) !== 500) throw new Error('runtime conf.json must use 500 slots');
if (Number(conf.port) !== 22620) throw new Error('runtime conf.json must target GTA5HOST port 22620');

const config = JSON.parse(await readFile(resolve(runtime,'novera.config.json'),'utf8'));
if (!String(config.DATABASE_URL ?? '').includes('CHANGE_ME')) throw new Error('distribution config must not contain real database credentials');
if (Number(config.SERVER_PORT) !== 22620 || Number(config.SERVER_MAX_PLAYERS) !== 500) throw new Error('novera.config.json does not match hosting target');

const pkg = JSON.parse(await readFile(resolve(runtime,'packages/novera/package.json'),'utf8'));
if (pkg.version !== '0.15.3-alpha') throw new Error('runtime package version mismatch');
const start = await readFile(resolve(runtime,'START_HERE.txt'),'utf8');
if (!start.includes('v0.15.3 Alpha')) throw new Error('START_HERE version mismatch');
const authHtml = await readFile(resolve(runtime,'client_packages/novera/cef/index.html'),'utf8');
if (!authHtml.includes('auth-hotfix.css') || !authHtml.includes('auth-hotfix.js')) throw new Error('auth hotfix assets are not loaded');
const authHotfix = await readFile(resolve(runtime,'client_packages/novera/cef/auth-hotfix.js'),'utf8');
if (!authHotfix.includes('novera:cef:ready') || !authHotfix.includes('минимум 8')) throw new Error('auth hotfix validation/ready bridge missing');
if (/CEF подключ|GTA5HOST|RAGE CEF bridge|Проверь консоль/i.test(authHotfix)) throw new Error('player-facing auth script still contains technical diagnostics');
const authCss = await readFile(resolve(runtime,'client_packages/novera/cef/auth-hotfix.css'),'utf8');
if (!authCss.includes('backdrop-filter:none') || !authCss.includes('.server-meta')) throw new Error('legacy CEF black-rectangle hotfix missing');

const serverRuntime = await readFile(resolve(runtime,'packages/novera/index.js'),'utf8');
if (/["']node:[^"']+["']/.test(serverRuntime)) throw new Error('GTA5HOST runtime still contains unsupported node:* builtin imports');

const migrations = (await readdir(resolve(runtime,'migrations'))).filter((n)=>/^\d{4}_.+\.sql$/.test(n)).sort();
if (migrations.length !== 10) throw new Error(`expected 10 migrations, got ${migrations.length}`);
const combined = await readFile(resolve(runtime,'migrations/ALL_MIGRATIONS.sql'),'utf8');
for (const migration of migrations) if (!combined.includes(`-- ${migration}`)) throw new Error(`combined migration missing ${migration}`);
if (/\bJSON\s+(?:NOT\s+)?NULL\b/i.test(combined)) throw new Error('legacy GTA5HOST MariaDB build must not declare JSON columns');
if (/JSON_OBJECT\s*\(/i.test(combined)) throw new Error('legacy GTA5HOST MariaDB build must not use JSON_OBJECT in migrations');

async function collectTs(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collectTs(path));
    else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(path);
  }
  return out;
}

for (const sourceFile of await collectTs(resolve(root, 'apps/server/src'))) {
  const source = await readFile(sourceFile, 'utf8');
  if (/JSON_OBJECT\s*\(/i.test(source)) throw new Error(`server source still uses JSON_OBJECT: ${sourceFile}`);
}

console.log('NOVERA v0.15.3 Alpha GTA5HOST legacy-Node/auth UI validation passed');
