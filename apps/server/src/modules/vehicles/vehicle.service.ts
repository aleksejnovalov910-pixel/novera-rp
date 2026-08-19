import type { NoveraDatabase } from '@novera/database';

export interface OwnedVehicleRecord {
  id: bigint; characterId: bigint; model: string; plate: string; vin: string; fuel: number; mileage: number; stored: boolean;
  posX: number | null; posY: number | null; posZ: number | null; heading: number | null;
}

export class VehicleService {
  constructor(private readonly db: NoveraDatabase) {}

  async getOwned(characterId: bigint, vehicleId: bigint): Promise<OwnedVehicleRecord | null> {
    const [rows] = await this.db.pool.query<any[]>('SELECT id, character_id, model, plate, vin, fuel, mileage, stored, pos_x, pos_y, pos_z, heading FROM owned_vehicles WHERE id = ? AND character_id = ? LIMIT 1', [vehicleId, characterId]);
    const r = rows[0]; if (!r) return null;
    return { id: BigInt(r.id), characterId: BigInt(r.character_id), model: r.model, plate: r.plate, vin: r.vin, fuel: Number(r.fuel), mileage: Number(r.mileage), stored: Boolean(r.stored), posX: r.pos_x == null ? null : Number(r.pos_x), posY: r.pos_y == null ? null : Number(r.pos_y), posZ: r.pos_z == null ? null : Number(r.pos_z), heading: r.heading == null ? null : Number(r.heading) };
  }

  async setStored(characterId: bigint, vehicleId: bigint, stored: boolean, position?: { x: number; y: number; z: number; heading: number }): Promise<boolean> {
    const params = stored ? [1, vehicleId, characterId] : [0, position?.x ?? null, position?.y ?? null, position?.z ?? null, position?.heading ?? null, vehicleId, characterId];
    const sql = stored
      ? 'UPDATE owned_vehicles SET stored = ? WHERE id = ? AND character_id = ?'
      : 'UPDATE owned_vehicles SET stored = ?, pos_x = ?, pos_y = ?, pos_z = ?, heading = ? WHERE id = ? AND character_id = ?';
    const [result] = await this.db.pool.execute<any>(sql, params);
    return result.affectedRows === 1;
  }

  async create(characterId: bigint, model: string, plate: string, vin: string): Promise<bigint> {
    if (!/^[a-zA-Z0-9_]{1,64}$/.test(model) || !/^[A-Z0-9]{2,12}$/.test(plate) || !/^[A-Z0-9-]{8,32}$/.test(vin)) throw new Error('invalid vehicle identity');
    const [result] = await this.db.pool.execute<any>('INSERT INTO owned_vehicles (character_id, model, plate, vin) VALUES (?, ?, ?, ?)', [characterId, model, plate, vin]);
    return BigInt(result.insertId);
  }
}
