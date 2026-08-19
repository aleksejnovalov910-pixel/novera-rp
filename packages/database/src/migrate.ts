import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const connection = await mysql.createConnection(databaseUrl);
  await connection.execute(`CREATE TABLE IF NOT EXISTS _novera_migrations (name VARCHAR(190) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  const migrationsDir = path.resolve(__dirname, '../migrations');
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const [rows] = await connection.execute('SELECT name FROM _novera_migrations WHERE name = ?', [file]);
    if (Array.isArray(rows) && rows.length > 0) continue;
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    await connection.beginTransaction();
    try {
      for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map((part) => part.trim()).filter(Boolean)) await connection.query(statement);
      await connection.execute('INSERT INTO _novera_migrations(name) VALUES (?)', [file]);
      await connection.commit();
      console.log(`Applied ${file}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
  await connection.end();
}

void main();
