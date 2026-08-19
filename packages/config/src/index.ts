import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface NoveraConfig {
  environment: 'development' | 'test' | 'production';
  serverName: string;
  maxPlayers: number;
  port: number;
  databaseUrl: string;
  redisUrl: string | null;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  authMaxAttempts: number;
  authLockSeconds: number;
}

type RuntimeConfigFile = Partial<Record<'NODE_ENV'|'SERVER_NAME'|'SERVER_MAX_PLAYERS'|'SERVER_PORT'|'DATABASE_URL'|'REDIS_URL'|'LOG_LEVEL'|'AUTH_MAX_ATTEMPTS'|'AUTH_LOCK_SECONDS', string | number | null>>;

function loadRuntimeFile(): RuntimeConfigFile {
  const candidates = [
    process.env.NOVERA_CONFIG_FILE,
    resolve(process.cwd(), 'novera.config.json'),
    resolve(process.cwd(), 'packages/novera/novera.config.json')
  ].filter((v): v is string => Boolean(v));
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try { return JSON.parse(readFileSync(path, 'utf8')) as RuntimeConfigFile; }
    catch (error) { throw new Error(`Invalid NOVERA config file ${path}: ${String(error)}`); }
  }
  return {};
}

function source(file: RuntimeConfigFile, name: keyof RuntimeConfigFile, fallback?: string): string {
  const raw = process.env[name] ?? file[name] ?? fallback;
  const value = raw == null ? '' : String(raw).trim();
  if (!value) throw new Error(`Missing required configuration: ${name}`);
  return value;
}

function positiveInteger(file: RuntimeConfigFile, name: keyof RuntimeConfigFile, fallback: string): number {
  const value = Number(source(file, name, fallback));
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

export function loadConfig(): NoveraConfig {
  const file = loadRuntimeFile();
  const environment = source(file, 'NODE_ENV', 'production');
  if (!['development', 'test', 'production'].includes(environment)) throw new Error(`Invalid NODE_ENV: ${environment}`);
  const logLevel = source(file, 'LOG_LEVEL', 'info');
  if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) throw new Error(`Invalid LOG_LEVEL: ${logLevel}`);
  const redisValue = String(process.env.REDIS_URL ?? file.REDIS_URL ?? '').trim();
  const databaseUrl = source(file, 'DATABASE_URL');
  if (databaseUrl.includes('CHANGE_ME')) throw new Error('DATABASE_URL still contains CHANGE_ME; edit novera.config.json before launch');

  return {
    environment: environment as NoveraConfig['environment'],
    serverName: source(file, 'SERVER_NAME', 'NOVERA RP'),
    maxPlayers: positiveInteger(file, 'SERVER_MAX_PLAYERS', '500'),
    port: positiveInteger(file, 'SERVER_PORT', '22620'),
    databaseUrl,
    redisUrl: redisValue.length > 0 ? redisValue : null,
    logLevel: logLevel as NoveraConfig['logLevel'],
    authMaxAttempts: positiveInteger(file, 'AUTH_MAX_ATTEMPTS', '5'),
    authLockSeconds: positiveInteger(file, 'AUTH_LOCK_SECONDS', '900')
  };
}
