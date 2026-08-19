import type { NoveraDatabase } from '@novera/database';

const MAX_MONEY = 9_000_000_000_000;

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
      await connection.execute("INSERT INTO property_access (property_id, character_id, access_type) VALUES (?, ?, 'owner') ON DUPLICATE KEY UPDATE access_type='owner', revoked=0, expires_at=NULL", [propertyId, characterId]);
      await connection.execute("INSERT INTO property_owner_history (property_id, to_character_id, transfer_type, price) VALUES (?, ?, 'purchase', ?)", [propertyId, characterId, property.price]);
      await connection.execute('INSERT INTO money_transactions (character_id, type, amount, metadata) VALUES (?, ?, ?, JSON_OBJECT("propertyId", ?))', [characterId, 'property_purchase', -Number(property.price), propertyId.toString()]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async hasAccess(characterId: bigint, propertyId: bigint): Promise<boolean> {
    const [rows] = await this.db.pool.query<any[]>('SELECT 1 FROM properties p LEFT JOIN property_access a ON a.property_id=p.id AND a.character_id=? AND a.revoked=0 AND (a.expires_at IS NULL OR a.expires_at>CURRENT_TIMESTAMP) WHERE p.id=? AND (p.owner_character_id=? OR a.id IS NOT NULL) LIMIT 1', [characterId, propertyId, characterId]);
    return Boolean(rows[0]);
  }

  async interior(characterId: bigint, propertyId: bigint): Promise<{ x: number; y: number; z: number; dimension: number } | null> {
    const [rows] = await this.db.pool.query<any[]>('SELECT interior_x, interior_y, interior_z, dimension, locked FROM properties WHERE id = ? LIMIT 1', [propertyId]);
    const p = rows[0]; if (!p || p.interior_x == null) return null;
    if (p.locked && !(await this.hasAccess(characterId, propertyId))) return null;
    return { x: Number(p.interior_x), y: Number(p.interior_y), z: Number(p.interior_z), dimension: Number(p.dimension) || Number(propertyId % BigInt(2000000000)) + 100000 };
  }

  async shareAccess(ownerId: bigint, propertyId: bigint, targetId: bigint, type: 'resident'|'guest'): Promise<boolean> {
    if (ownerId === targetId) return false;
    const [owned] = await this.db.pool.query<any[]>('SELECT id FROM properties WHERE id=? AND owner_character_id=? LIMIT 1', [propertyId, ownerId]);
    if (!owned[0]) return false;
    await this.db.pool.execute('INSERT INTO property_access (property_id, character_id, access_type, revoked) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE access_type=VALUES(access_type), revoked=0, expires_at=NULL', [propertyId, targetId, type]);
    return true;
  }

  async revokeAccess(ownerId: bigint, propertyId: bigint, targetId: bigint): Promise<boolean> {
    const [result] = await this.db.pool.execute<any>("UPDATE property_access a JOIN properties p ON p.id=a.property_id SET a.revoked=1 WHERE a.property_id=? AND a.character_id=? AND p.owner_character_id=? AND a.access_type<>'owner'", [propertyId, targetId, ownerId]);
    return result.affectedRows > 0;
  }

  async rent(characterId: bigint, propertyId: bigint): Promise<boolean> {
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<any[]>('SELECT owner_character_id, rent_price, rentable FROM properties WHERE id=? FOR UPDATE', [propertyId]);
      const p = rows[0];
      if (!p || !p.rentable || p.owner_character_id == null || BigInt(String(p.owner_character_id)) === characterId) { await connection.rollback(); return false; }
      const amount = Number(p.rent_price);
      if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_MONEY) { await connection.rollback(); return false; }
      const [active] = await connection.query<any[]>('SELECT id FROM property_rentals WHERE property_id=? AND status=\'active\' FOR UPDATE', [propertyId]);
      if (active[0]) { await connection.rollback(); return false; }
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [characterId]);
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [p.owner_character_id]);
      const [debit] = await connection.execute<any>('UPDATE character_wallets SET bank=bank-? WHERE character_id=? AND bank>=?', [amount, characterId, amount]);
      if (debit.affectedRows !== 1) { await connection.rollback(); return false; }
      const [credit] = await connection.execute<any>('UPDATE character_wallets SET bank=bank+? WHERE character_id=? AND bank<=?', [amount, p.owner_character_id, MAX_MONEY-amount]);
      if (credit.affectedRows !== 1) { await connection.rollback(); return false; }
      await connection.execute('INSERT INTO property_rentals (property_id, tenant_character_id, landlord_character_id, rent_amount, paid_until) VALUES (?, ?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY))', [propertyId, characterId, p.owner_character_id, amount]);
      await connection.execute("INSERT INTO property_access (property_id, character_id, access_type, revoked, expires_at) VALUES (?, ?, 'tenant', 0, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY)) ON DUPLICATE KEY UPDATE access_type='tenant', revoked=0, expires_at=VALUES(expires_at)", [propertyId, characterId]);
      await connection.execute('INSERT INTO money_transactions (character_id, counterparty_character_id, type, amount, metadata) VALUES (?, ?, ?, ?, JSON_OBJECT("propertyId", ?)), (?, ?, ?, ?, JSON_OBJECT("propertyId", ?))', [characterId, p.owner_character_id, 'property_rent_out', -amount, propertyId.toString(), p.owner_character_id, characterId, 'property_rent_in', amount, propertyId.toString()]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async listContainers(characterId: bigint, propertyId: bigint): Promise<any[] | null> {
    if (!(await this.hasAccess(characterId, propertyId))) return null;
    const [rows] = await this.db.pool.query<any[]>('SELECT id, container_key, name, capacity_slots, max_weight, locked FROM property_containers WHERE property_id=? ORDER BY id', [propertyId]);
    return rows.map(r=>({id:String(r.id),key:r.container_key,name:r.name,capacitySlots:Number(r.capacity_slots),maxWeight:Number(r.max_weight),locked:Boolean(r.locked)}));
  }

  async info(characterId: bigint, propertyId: bigint): Promise<Record<string, unknown> | null> {
    const [rows] = await this.db.pool.query<any[]>('SELECT id, owner_character_id, property_type, name, price, rent_price, rentable, locked FROM properties WHERE id=? LIMIT 1', [propertyId]);
    const p=rows[0]; if(!p) return null;
    const access=await this.hasAccess(characterId,propertyId);
    const [history]=await this.db.pool.query<any[]>('SELECT from_character_id,to_character_id,transfer_type,price,created_at FROM property_owner_history WHERE property_id=? ORDER BY id DESC LIMIT 20',[propertyId]);
    return {property:{id:String(p.id),ownerCharacterId:p.owner_character_id==null?null:String(p.owner_character_id),type:p.property_type,name:p.name,price:Number(p.price),rentPrice:p.rent_price==null?null:Number(p.rent_price),rentable:Boolean(p.rentable),locked:Boolean(p.locked)},access,history};
  }
}
