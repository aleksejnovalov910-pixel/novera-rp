import argon2 from 'argon2';
import { accounts, eq, type NoveraDatabase } from '@novera/database';

const LOGIN_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

export class AccountService {
  constructor(private readonly db: NoveraDatabase) {}

  validate(login: string, password: string): boolean {
    return LOGIN_PATTERN.test(login) && password.length >= 8 && password.length <= 128;
  }

  async register(login: string, password: string): Promise<{ id: bigint } | null> {
    const normalized = login.trim().toLowerCase();
    const existing = await this.db.orm.select({ id: accounts.id }).from(accounts).where(eq(accounts.login, normalized)).limit(1);
    if (existing.length > 0) return null;
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const result = await this.db.orm.insert(accounts).values({ login: normalized, passwordHash });
    return { id: BigInt(result[0].insertId) };
  }

  async authenticate(login: string, password: string): Promise<{ id: bigint } | null> {
    const normalized = login.trim().toLowerCase();
    const rows = await this.db.orm.select().from(accounts).where(eq(accounts.login, normalized)).limit(1);
    const account = rows[0];
    if (!account || account.isBanned || !(await argon2.verify(account.passwordHash, password))) return null;
    await this.db.orm.update(accounts).set({ lastLoginAt: new Date() }).where(eq(accounts.id, account.id));
    return { id: account.id };
  }
}
