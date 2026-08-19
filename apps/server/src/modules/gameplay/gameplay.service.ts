import type { NoveraDatabase } from '@novera/database';
import type { GameplayBootstrap, InventoryItemView, MoneyState, PropertyView, VehicleView } from '@novera/shared';

const MAX_MONEY = 9_000_000_000_000;

export class GameplayService {
  constructor(private readonly db: NoveraDatabase) {}

  async ensureCharacterState(characterId: bigint): Promise<void> {
    await this.db.pool.execute(
      'INSERT IGNORE INTO character_wallets (character_id, cash, bank) VALUES (?, 5000, 25000)',
      [characterId]
    );
  }

  async bootstrap(characterId: bigint): Promise<GameplayBootstrap> {
    await this.ensureCharacterState(characterId);
    const [walletRows] = await this.db.pool.query<any[]>('SELECT cash, bank FROM character_wallets WHERE character_id = ? LIMIT 1', [characterId]);
    const [itemRows] = await this.db.pool.query<any[]>('SELECT id, item_key, amount, slot, durability, metadata FROM inventory_items WHERE character_id = ? ORDER BY slot', [characterId]);
    const [vehicleRows] = await this.db.pool.query<any[]>('SELECT id, model, plate, fuel, mileage, stored FROM owned_vehicles WHERE character_id = ? ORDER BY id DESC', [characterId]);
    const [propertyRows] = await this.db.pool.query<any[]>('SELECT id, property_type, name, owner_character_id FROM properties WHERE owner_character_id = ? ORDER BY id DESC', [characterId]);

    const wallet = walletRows[0] ?? { cash: 0, bank: 0 };
    const money: MoneyState = { cash: Number(wallet.cash), bank: Number(wallet.bank) };
    const inventory: InventoryItemView[] = itemRows.map((row) => ({
      id: String(row.id), itemKey: row.item_key, amount: Number(row.amount), slot: Number(row.slot),
      durability: row.durability == null ? null : Number(row.durability), metadata: this.parseJson(row.metadata)
    }));
    const vehicles: VehicleView[] = vehicleRows.map((row) => ({
      id: String(row.id), model: row.model, plate: row.plate, fuel: Number(row.fuel), mileage: Number(row.mileage), stored: Boolean(row.stored)
    }));
    const properties: PropertyView[] = propertyRows.map((row) => ({
      id: String(row.id), type: row.property_type, name: row.name, owned: String(row.owner_character_id) === characterId.toString()
    }));

    return { characterId: characterId.toString(), money, inventory, vehicles, properties };
  }

  async transferCash(from: bigint, to: bigint, amount: number): Promise<boolean> {
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_MONEY || from === to) return false;
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [from]);
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [to]);
      const [result] = await connection.execute<any>('UPDATE character_wallets SET cash = cash - ? WHERE character_id = ? AND cash >= ?', [amount, from, amount]);
      if (result.affectedRows !== 1) { await connection.rollback(); return false; }
      await connection.execute('UPDATE character_wallets SET cash = cash + ? WHERE character_id = ?', [amount, to]);
      await connection.execute('INSERT INTO money_transactions (character_id, counterparty_character_id, type, amount) VALUES (?, ?, ?, ?), (?, ?, ?, ?)', [from, to, 'cash_transfer_out', -amount, to, from, 'cash_transfer_in', amount]);
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async bankMove(characterId: bigint, amount: number, direction: 'deposit' | 'withdraw'): Promise<boolean> {
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_MONEY) return false;
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [characterId]);
      const source = direction === 'deposit' ? 'cash' : 'bank';
      const target = direction === 'deposit' ? 'bank' : 'cash';
      const [result] = await connection.execute<any>(`UPDATE character_wallets SET ${source} = ${source} - ?, ${target} = ${target} + ? WHERE character_id = ? AND ${source} >= ?`, [amount, amount, characterId, amount]);
      if (result.affectedRows !== 1) { await connection.rollback(); return false; }
      await connection.execute('INSERT INTO money_transactions (character_id, type, amount) VALUES (?, ?, ?)', [characterId, direction, amount]);
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async moveInventory(characterId: bigint, fromSlot: number, toSlot: number): Promise<boolean> {
    if (!Number.isInteger(fromSlot) || !Number.isInteger(toSlot) || fromSlot < 0 || toSlot < 0 || fromSlot > 99 || toSlot > 99 || fromSlot === toSlot) return false;
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [fromRows] = await connection.query<any[]>('SELECT id FROM inventory_items WHERE character_id = ? AND slot = ? FOR UPDATE', [characterId, fromSlot]);
      if (!fromRows[0]) { await connection.rollback(); return false; }
      const [toRows] = await connection.query<any[]>('SELECT id FROM inventory_items WHERE character_id = ? AND slot = ? FOR UPDATE', [characterId, toSlot]);
      await connection.execute('UPDATE inventory_items SET slot = 65535 WHERE id = ?', [fromRows[0].id]);
      if (toRows[0]) await connection.execute('UPDATE inventory_items SET slot = ? WHERE id = ?', [fromSlot, toRows[0].id]);
      await connection.execute('UPDATE inventory_items SET slot = ? WHERE id = ?', [toSlot, fromRows[0].id]);
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async savePosition(characterId: bigint, x: number, y: number, z: number, heading: number, dimension: number): Promise<void> {
    if (![x, y, z, heading, dimension].every(Number.isFinite)) return;
    await this.db.pool.execute('UPDATE characters SET pos_x = ?, pos_y = ?, pos_z = ?, heading = ?, dimension = ? WHERE id = ?', [x, y, z, heading, Math.max(0, Math.trunc(dimension)), characterId]);
  }

  private parseJson(value: unknown): Record<string, unknown> {
    if (!value) return {};
    if (typeof value === 'object') return value as Record<string, unknown>;
    try { return JSON.parse(String(value)) as Record<string, unknown>; } catch { return {}; }
  }
}
