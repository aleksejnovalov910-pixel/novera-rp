import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { accounts, eq, type NoveraDatabase } from '@novera/database';

const scrypt = promisify(nodeScrypt);
const LOGIN_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;
const HASH_BYTES = 64;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, HASH_BYTES) as Buffer;
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  try {
    const expected = Buffer.from(hashHex, 'hex');
    const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

export class AccountService {
  constructor(private readonly db: NoveraDatabase) {}
  validate(login: string, password: string): boolean { return LOGIN_PATTERN.test(login) && password.length >= 8 && password.length <= 128; }

  async register(login: string, password: string): Promise<{ id: bigint; adminLevel: number } | null> {
    const normalized = login.trim().toLowerCase();
    const existing = await this.db.orm.select({ id: accounts.id }).from(accounts).where(eq(accounts.login, normalized)).limit(1);
    if (existing.length > 0) return null;
    const passwordHash = await hashPassword(password);
    const result = await this.db.orm.insert(accounts).values({ login: normalized, passwordHash });
    return { id: BigInt(result[0].insertId), adminLevel: 0 };
  }

  async authenticate(login: string, password: string): Promise<{ id: bigint; adminLevel: number } | null> {
    const normalized = login.trim().toLowerCase();
    const rows = await this.db.orm.select().from(accounts).where(eq(accounts.login, normalized)).limit(1);
    const account = rows[0];
    if (!account || account.isBanned || !(await verifyPassword(password, account.passwordHash))) return null;
    await this.db.orm.update(accounts).set({ lastLoginAt: new Date() }).where(eq(accounts.id, account.id));
    return { id: account.id, adminLevel: Number(account.adminLevel ?? 0) };
  }
}
