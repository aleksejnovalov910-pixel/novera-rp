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

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function positiveInteger(name: string, fallback: string): number {
  const value = Number(required(name, fallback));
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

export function loadConfig(): NoveraConfig {
  const environment = required('NODE_ENV', 'development');
  if (!['development', 'test', 'production'].includes(environment)) throw new Error(`Invalid NODE_ENV: ${environment}`);
  const logLevel = required('LOG_LEVEL', 'info');
  if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) throw new Error(`Invalid LOG_LEVEL: ${logLevel}`);

  const redisValue = (process.env.REDIS_URL ?? '').trim();
  return {
    environment: environment as NoveraConfig['environment'],
    serverName: required('SERVER_NAME', 'NOVERA RP'),
    maxPlayers: positiveInteger('SERVER_MAX_PLAYERS', '500'),
    port: positiveInteger('SERVER_PORT', '22005'),
    databaseUrl: required('DATABASE_URL'),
    redisUrl: redisValue.length > 0 ? redisValue : null,
    logLevel: logLevel as NoveraConfig['logLevel'],
    authMaxAttempts: positiveInteger('AUTH_MAX_ATTEMPTS', '5'),
    authLockSeconds: positiveInteger('AUTH_LOCK_SECONDS', '900')
  };
}
