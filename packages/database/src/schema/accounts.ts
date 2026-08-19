import { bigint, boolean, datetime, index, int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

export const accounts = mysqlTable('accounts', {
  id: bigint('id', { mode: 'bigint', unsigned: true }).primaryKey().autoincrement(),
  login: varchar('login', { length: 64 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  email: varchar('email', { length: 190 }),
  isBanned: boolean('is_banned').notNull().default(false),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().defaultNow(),
  lastLoginAt: datetime('last_login_at', { mode: 'date' })
}, (table) => [index('accounts_email_idx').on(table.email)]);

export const characters = mysqlTable('characters', {
  id: bigint('id', { mode: 'bigint', unsigned: true }).primaryKey().autoincrement(),
  accountId: bigint('account_id', { mode: 'bigint', unsigned: true }).notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 32 }).notNull(),
  lastName: varchar('last_name', { length: 32 }).notNull(),
  level: int('level', { unsigned: true }).notNull().default(1),
  experience: int('experience', { unsigned: true }).notNull().default(0),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().defaultNow(),
  lastPlayedAt: datetime('last_played_at', { mode: 'date' })
}, (table) => [index('characters_account_idx').on(table.accountId)]);
