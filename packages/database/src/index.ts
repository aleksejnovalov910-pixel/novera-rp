import { drizzle } from 'drizzle-orm/mysql2';
import mysql, { type Pool } from 'mysql2/promise';
import * as schema from './schema/accounts';

export type NoveraDatabase = ReturnType<typeof createDatabase>;

export function createDatabase(databaseUrl: string) {
  const pool: Pool = mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 20,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
  const orm = drizzle(pool, { schema, mode: 'default' });

  return {
    orm,
    pool,
    async healthcheck(): Promise<{ ok: boolean; latencyMs: number }> {
      const started = Date.now();
      await pool.query('SELECT 1');
      return { ok: true, latencyMs: Date.now() - started };
    },
    async close(): Promise<void> { await pool.end(); }
  };
}

export { accounts, characters } from './schema/accounts';
export { eq } from 'drizzle-orm';
