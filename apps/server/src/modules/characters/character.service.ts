import { characters, eq, type NoveraDatabase } from '@novera/database';
import type { CharacterSummary } from '@novera/shared';

export class CharacterService {
  constructor(private readonly db: NoveraDatabase) {}

  async list(accountId: bigint): Promise<CharacterSummary[]> {
    const rows = await this.db.orm.select().from(characters).where(eq(characters.accountId, accountId));
    return rows.map((row) => ({
      id: row.id.toString(),
      firstName: row.firstName,
      lastName: row.lastName,
      level: row.level,
      lastPlayedAt: row.lastPlayedAt?.toISOString() ?? null
    }));
  }
}
