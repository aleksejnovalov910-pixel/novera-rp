import { bigint, boolean, date, datetime, double, float, index, int, json, mysqlEnum, mysqlTable, tinyint, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';
import type { CharacterAppearance } from '@novera/shared';

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
  slot: tinyint('slot', { unsigned: true }).notNull(),
  firstName: varchar('first_name', { length: 32 }).notNull(),
  lastName: varchar('last_name', { length: 32 }).notNull(),
  gender: mysqlEnum('gender', ['male', 'female']).notNull().default('male'),
  birthDate: date('birth_date', { mode: 'string' }).notNull(),
  appearance: json('appearance_json').$type<CharacterAppearance>().notNull(),
  level: int('level', { unsigned: true }).notNull().default(1),
  experience: int('experience', { unsigned: true }).notNull().default(0),
  posX: double('pos_x').notNull().default(-1037.6),
  posY: double('pos_y').notNull().default(-2737.8),
  posZ: double('pos_z').notNull().default(20.17),
  heading: float('heading').notNull().default(330),
  dimension: int('dimension', { unsigned: true }).notNull().default(0),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().defaultNow(),
  lastPlayedAt: datetime('last_played_at', { mode: 'date' }),
  deletedAt: datetime('deleted_at', { mode: 'date' })
}, (table) => [
  index('characters_account_idx').on(table.accountId),
  uniqueIndex('characters_account_slot_uq').on(table.accountId, table.slot),
  uniqueIndex('characters_name_uq').on(table.firstName, table.lastName)
]);
