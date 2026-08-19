import type { NoveraDatabase } from '@novera/database';
import type { FamilyView, FactionView } from '@novera/shared';

export class SocialService {
  constructor(private readonly db: NoveraDatabase) {}

  async family(characterId: bigint): Promise<FamilyView | null> {
    const [rows] = await this.db.pool.query<any[]>('SELECT f.id, f.name, f.level, f.treasury, fm.rank FROM family_members fm JOIN families f ON f.id = fm.family_id WHERE fm.character_id = ? LIMIT 1', [characterId]);
    const r = rows[0]; return r ? { id: String(r.id), name: r.name, rank: Number(r.rank), level: Number(r.level), treasury: Number(r.treasury) } : null;
  }

  async faction(characterId: bigint): Promise<FactionView | null> {
    const [rows] = await this.db.pool.query<any[]>('SELECT f.id, f.faction_key, f.name, f.type, fm.rank FROM faction_members fm JOIN factions f ON f.id = fm.faction_id WHERE fm.character_id = ? LIMIT 1', [characterId]);
    const r = rows[0]; return r ? { id: String(r.id), key: r.faction_key, name: r.name, rank: Number(r.rank), type: r.type } : null;
  }

  async createFamily(characterId: bigint, name: string): Promise<bigint | null> {
    const normalized = name.trim();
    if (!/^[A-Za-zА-Яа-яЁё0-9 _-]{3,32}$/.test(normalized)) return null;
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [membership] = await connection.query<any[]>('SELECT family_id FROM family_members WHERE character_id = ? LIMIT 1', [characterId]);
      if (membership[0]) { await connection.rollback(); return null; }
      const [result] = await connection.execute<any>('INSERT INTO families (owner_character_id, name) VALUES (?, ?)', [characterId, normalized]);
      const familyId = BigInt(result.insertId);
      await connection.execute('INSERT INTO family_members (family_id, character_id, rank) VALUES (?, ?, 10)', [familyId, characterId]);
      await connection.commit(); return familyId;
    } catch (error: any) {
      await connection.rollback();
      if (String(error?.code) === 'ER_DUP_ENTRY') return null;
      throw error;
    } finally { connection.release(); }
  }
}
