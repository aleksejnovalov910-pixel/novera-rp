import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const runtime = resolve(root, 'runtime');
const required = [
  'conf.json',
  'packages/novera/index.js',
  'client_packages/index.js',
  'client_packages/novera/client/index.js',
  'client_packages/novera/cef/index.html',
  'migrations/0001_accounts_characters.sql',
  'migrations/0002_character_creator.sql',
  'migrations/0003_gameplay_core.sql',
  'migrations/0004_extended_core.sql',
  'migrations/0005_roleplay_core.sql',
  'migrations/0006_onboarding_seed.sql',
  'migrations/0007_economy_inventory_hardening.sql'
];

for (const file of required) await access(resolve(runtime, file));
const conf = JSON.parse(await readFile(resolve(runtime, 'conf.json'), 'utf8'));
if (conf.name !== 'NOVERA RP') throw new Error('runtime conf.json has wrong server name');
if (Number(conf.maxplayers) !== 500) throw new Error('runtime conf.json must use 500 slots');
console.log('NOVERA runtime validation passed');
