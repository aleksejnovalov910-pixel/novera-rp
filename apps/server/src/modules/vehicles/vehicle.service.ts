import type { NoveraDatabase } from '@novera/database';
import type { VehicleServiceType } from '@novera/shared';

export interface OwnedVehicleRecord {
  id: bigint;
  characterId: bigint;
  model: string;
  plate: string;
  vin: string;
  fuel: number;
  mileage: number;
  stored: boolean;
  insuranceStatus: 'none' | 'basic' | 'full';
  insuranceExpiresAt: Date | null;
  engineHealth: number;
  oilLevel: number;
  batteryLevel: number;
  tireHealth: number;
  inspectionExpiresAt: Date | null;
  impounded: boolean;
  impoundReason: string | null;
  impoundFee: number;
  lastServiceAt: Date | null;
  posX: number | null;
  posY: number | null;
  posZ: number | null;
  heading: number | null;
}

const SERVICE_PRICES: Record<VehicleServiceType, number> = { repair: 4500, oil: 1200, battery: 1800, tires: 3000 };
const INSURANCE_PRICES = { basic: 12000, full: 28000 } as const;
const MAX_MONEY = 9_000_000_000_000;

export class VehicleService {
  constructor(private readonly db: NoveraDatabase) {}

  private map(r: any): OwnedVehicleRecord {
    return {
      id: BigInt(r.id), characterId: BigInt(r.character_id), model: String(r.model), plate: String(r.plate), vin: String(r.vin),
      fuel: Number(r.fuel), mileage: Number(r.mileage), stored: Boolean(r.stored), insuranceStatus: r.insurance_status ?? 'none',
      insuranceExpiresAt: r.insurance_expires_at ? new Date(r.insurance_expires_at) : null, engineHealth: Number(r.engine_health),
      oilLevel: Number(r.oil_level ?? 100), batteryLevel: Number(r.battery_level ?? 100), tireHealth: Number(r.tire_health ?? 100),
      inspectionExpiresAt: r.inspection_expires_at ? new Date(r.inspection_expires_at) : null, impounded: Boolean(r.impounded),
      impoundReason: r.impound_reason ?? null, impoundFee: Number(r.impound_fee ?? 0), lastServiceAt: r.last_service_at ? new Date(r.last_service_at) : null,
      posX: r.pos_x == null ? null : Number(r.pos_x), posY: r.pos_y == null ? null : Number(r.pos_y), posZ: r.pos_z == null ? null : Number(r.pos_z), heading: r.heading == null ? null : Number(r.heading)
    };
  }

  async recoverWorldState(): Promise<number> {
    const [result] = await this.db.pool.execute<any>('UPDATE owned_vehicles SET stored = 1 WHERE stored = 0 AND impounded = 0');
    return Number(result.affectedRows ?? 0);
  }

  async getOwned(characterId: bigint, vehicleId: bigint): Promise<OwnedVehicleRecord | null> {
    const [rows] = await this.db.pool.query<any[]>('SELECT * FROM owned_vehicles WHERE id = ? AND character_id = ? LIMIT 1', [vehicleId, characterId]);
    return rows[0] ? this.map(rows[0]) : null;
  }

  async hasKey(characterId: bigint, vehicleId: bigint): Promise<boolean> {
    const [rows] = await this.db.pool.query<any[]>('SELECT 1 FROM vehicle_keys WHERE vehicle_id = ? AND character_id = ? AND revoked = 0 LIMIT 1', [vehicleId, characterId]);
    return Boolean(rows[0]);
  }

  async info(characterId: bigint, vehicleId: bigint): Promise<Record<string, unknown> | null> {
    const vehicle = await this.getOwned(characterId, vehicleId);
    if (!vehicle) return null;
    const [keys] = await this.db.pool.query<any[]>('SELECT character_id, key_type, revoked, created_at FROM vehicle_keys WHERE vehicle_id = ? ORDER BY id', [vehicleId]);
    const [history] = await this.db.pool.query<any[]>('SELECT from_character_id, to_character_id, transfer_type, price, created_at FROM vehicle_owner_history WHERE vehicle_id = ? ORDER BY id DESC LIMIT 20', [vehicleId]);
    const [service] = await this.db.pool.query<any[]>('SELECT service_type, cost, details, created_at FROM vehicle_service_history WHERE vehicle_id = ? ORDER BY id DESC LIMIT 20', [vehicleId]);
    return { vehicle: { ...vehicle, id: vehicle.id.toString(), characterId: vehicle.characterId.toString() }, keys: keys.map(k => ({ ...k, character_id: String(k.character_id) })), history, service };
  }

  async setStored(characterId: bigint, vehicleId: bigint, stored: boolean, position?: { x: number; y: number; z: number; heading: number }): Promise<boolean> {
    const params = stored ? [1, vehicleId, characterId] : [0, position?.x ?? null, position?.y ?? null, position?.z ?? null, position?.heading ?? null, vehicleId, characterId];
    const sql = stored
      ? 'UPDATE owned_vehicles SET stored = ? WHERE id = ? AND character_id = ?'
      : 'UPDATE owned_vehicles SET stored = ?, pos_x = ?, pos_y = ?, pos_z = ?, heading = ? WHERE id = ? AND character_id = ? AND impounded = 0';
    const [result] = await this.db.pool.execute<any>(sql, params);
    return result.affectedRows === 1;
  }

  async create(characterId: bigint, model: string, plate: string, vin: string): Promise<bigint> {
    if (!/^[a-zA-Z0-9_]{1,64}$/.test(model) || !/^[A-Z0-9]{2,12}$/.test(plate) || !/^[A-Z0-9-]{8,32}$/.test(vin)) throw new Error('invalid vehicle identity');
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute<any>('INSERT INTO owned_vehicles (character_id, model, plate, vin) VALUES (?, ?, ?, ?)', [characterId, model, plate, vin]);
      const vehicleId = BigInt(result.insertId);
      await connection.execute('INSERT INTO vehicle_keys (vehicle_id, character_id, key_type) VALUES (?, ?, ?)', [vehicleId, characterId, 'owner']);
      await connection.execute('INSERT INTO vehicle_owner_history (vehicle_id, to_character_id, transfer_type) VALUES (?, ?, ?)', [vehicleId, characterId, 'initial']);
      await connection.commit();
      return vehicleId;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async shareKey(ownerId: bigint, vehicleId: bigint, targetId: bigint): Promise<boolean> {
    if (ownerId === targetId) return false;
    const owned = await this.getOwned(ownerId, vehicleId); if (!owned) return false;
    await this.db.pool.execute("INSERT INTO vehicle_keys (vehicle_id, character_id, key_type, revoked) VALUES (?, ?, 'spare', 0) ON DUPLICATE KEY UPDATE revoked = 0, key_type = 'spare'", [vehicleId, targetId]);
    return true;
  }

  async revokeKey(ownerId: bigint, vehicleId: bigint, targetId: bigint): Promise<boolean> {
    const owned = await this.getOwned(ownerId, vehicleId); if (!owned || ownerId === targetId) return false;
    const [result] = await this.db.pool.execute<any>("UPDATE vehicle_keys SET revoked = 1 WHERE vehicle_id = ? AND character_id = ? AND key_type <> 'owner'", [vehicleId, targetId]);
    return result.affectedRows > 0;
  }

  private async charge(connection: any, characterId: bigint, amount: number, type: string, vehicleId: bigint): Promise<boolean> {
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > MAX_MONEY) return false;
    await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [characterId]);
    const [result] = await connection.execute('UPDATE character_wallets SET bank = bank - ? WHERE character_id = ? AND bank >= ?', [amount, characterId, amount]);
    if (result.affectedRows !== 1) return false;
    await connection.execute('INSERT INTO money_transactions (character_id, type, amount, metadata) VALUES (?, ?, ?, ?)', [characterId, type, -amount, JSON.stringify({ vehicleId: vehicleId.toString() })]);
    return true;
  }

  async service(characterId: bigint, vehicleId: bigint, type: VehicleServiceType): Promise<boolean> {
    const price = SERVICE_PRICES[type]; if (!price) return false;
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<any[]>('SELECT * FROM owned_vehicles WHERE id = ? AND character_id = ? FOR UPDATE', [vehicleId, characterId]);
      if (!rows[0] || rows[0].impounded) { await connection.rollback(); return false; }
      if (!(await this.charge(connection, characterId, price, `vehicle_${type}`, vehicleId))) { await connection.rollback(); return false; }
      const set = type === 'repair' ? 'engine_health = 1000, body_health = 1000' : type === 'oil' ? 'oil_level = 100' : type === 'battery' ? 'battery_level = 100' : 'tire_health = 100';
      await connection.execute(`UPDATE owned_vehicles SET ${set}, last_service_at = CURRENT_TIMESTAMP WHERE id = ?`, [vehicleId]);
      await connection.execute('INSERT INTO vehicle_service_history (vehicle_id, character_id, service_type, cost) VALUES (?, ?, ?, ?)', [vehicleId, characterId, type, price]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async insure(characterId: bigint, vehicleId: bigint, plan: 'basic' | 'full'): Promise<boolean> {
    const price = INSURANCE_PRICES[plan];
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<any[]>('SELECT id FROM owned_vehicles WHERE id = ? AND character_id = ? FOR UPDATE', [vehicleId, characterId]);
      if (!rows[0] || !(await this.charge(connection, characterId, price, 'vehicle_insurance', vehicleId))) { await connection.rollback(); return false; }
      await connection.execute('UPDATE owned_vehicles SET insurance_status = ?, insurance_expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY) WHERE id = ?', [plan, vehicleId]);
      await connection.execute("INSERT INTO vehicle_service_history (vehicle_id, character_id, service_type, cost, details) VALUES (?, ?, 'insurance', ?, ?)", [vehicleId, characterId, price, JSON.stringify({ plan })]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async inspect(characterId: bigint, vehicleId: bigint): Promise<boolean> {
    const price = 2500; const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<any[]>('SELECT engine_health, oil_level, battery_level, tire_health FROM owned_vehicles WHERE id = ? AND character_id = ? FOR UPDATE', [vehicleId, characterId]);
      const r = rows[0]; if (!r || Number(r.engine_health) < 700 || Number(r.oil_level) < 40 || Number(r.battery_level) < 40 || Number(r.tire_health) < 40 || !(await this.charge(connection, characterId, price, 'vehicle_inspection', vehicleId))) { await connection.rollback(); return false; }
      await connection.execute('UPDATE owned_vehicles SET inspection_expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY) WHERE id = ?', [vehicleId]);
      await connection.execute("INSERT INTO vehicle_service_history (vehicle_id, character_id, service_type, cost) VALUES (?, ?, 'inspection', ?)", [vehicleId, characterId, price]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async releaseImpound(characterId: bigint, vehicleId: bigint): Promise<boolean> {
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<any[]>('SELECT impounded, impound_fee FROM owned_vehicles WHERE id = ? AND character_id = ? FOR UPDATE', [vehicleId, characterId]);
      const row = rows[0]; if (!row || !row.impounded) { await connection.rollback(); return false; }
      const fee = Number(row.impound_fee); if (!(await this.charge(connection, characterId, fee, 'vehicle_impound_release', vehicleId))) { await connection.rollback(); return false; }
      await connection.execute('UPDATE owned_vehicles SET impounded = 0, impound_reason = NULL, impound_fee = 0, stored = 1 WHERE id = ?', [vehicleId]);
      await connection.execute("INSERT INTO vehicle_service_history (vehicle_id, character_id, service_type, cost) VALUES (?, ?, 'impound_release', ?)", [vehicleId, characterId, fee]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }
}
