import type { NoveraDatabase } from '@novera/database';

export class PropertyService {
  constructor(private readonly db: NoveraDatabase) {}

  async buy(characterId: bigint, propertyId: bigint): Promise<boolean> {
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<any[]>('SELECT id, price, owner_character_id FROM properties WHERE id = ? FOR UPDATE', [propertyId]);
      const property = rows[0];
      if (!property || property.owner_character_id != null) { await connection.rollback(); return false; }
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [characterId]);
      const [wallet] = await connection.execute<any>('UPDATE character_wallets SET bank = bank - ? WHERE character_id = ? AND bank >= ?', [property.price, characterId, property.price]);
      if (wallet.affectedRows !== 1) { await connection.rollback(); return false; }
      const [claimed] = await connection.execute<any>('UPDATE properties SET owner_character_id = ? WHERE id = ? AND owner_character_id IS NULL', [characterId, propertyId]);
      if (claimed.affectedRows !== 1) { await connection.rollback(); return false; }
      await connection.execute('INSERT INTO money_transactions (character_id, type, amount, metadata) VALUES (?, ?, ?, JSON_OBJECT("propertyId", ?))', [characterId, 'property_purchase', -Number(property.price), propertyId.toString()]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async interior(characterId: bigint, propertyId: bigint): Promise<{ x: number; y: number; z: number; dimension: number } | null> {
    const [rows] = await this.db.pool.query<any[]>('SELECT interior_x, interior_y, interior_z, dimension, owner_character_id, locked FROM properties WHERE id = ? LIMIT 1', [propertyId]);
    const p = rows[0]; if (!p || p.interior_x == null || (p.locked && String(p.owner_character_id) !== characterId.toString())) return null;
    return { x: Number(p.interior_x), y: Number(p.interior_y), z: Number(p.interior_z), dimension: Number(p.dimension) || Number(propertyId % BigInt(2000000000)) + 100000 };
  }
}
