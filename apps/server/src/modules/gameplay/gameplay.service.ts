import type { NoveraDatabase } from '@novera/database';
import { ITEM_CATALOG, type GameplayBootstrap, type InventoryItemView, type InventoryUseResult, type MoneyState, type PropertyView, type VehicleView } from '@novera/shared';

const MAX_MONEY = 9_000_000_000_000;
const MAX_INVENTORY_SLOT = 99;

export class GameplayService {
  constructor(private readonly db: NoveraDatabase) {}

  async ensureCharacterState(characterId: bigint): Promise<void> {
    await this.db.pool.execute('INSERT IGNORE INTO character_wallets (character_id, cash, bank) VALUES (?, 5000, 25000)', [characterId]);
    await this.db.pool.execute("UPDATE character_wallets SET bank_account = CONCAT('NR', LPAD(character_id, 10, '0')) WHERE character_id = ? AND bank_account IS NULL", [characterId]);
  }

  async bootstrap(characterId: bigint): Promise<GameplayBootstrap> {
    await this.ensureCharacterState(characterId);
    const [walletRows] = await this.db.pool.query<any[]>('SELECT cash, bank, bank_account FROM character_wallets WHERE character_id = ? LIMIT 1', [characterId]);
    const [itemRows] = await this.db.pool.query<any[]>('SELECT id, item_key, amount, slot, durability, metadata FROM inventory_items WHERE character_id = ? ORDER BY slot', [characterId]);
    const [vehicleRows] = await this.db.pool.query<any[]>('SELECT id, model, plate, fuel, mileage, stored FROM owned_vehicles WHERE character_id = ? ORDER BY id DESC', [characterId]);
    const [propertyRows] = await this.db.pool.query<any[]>('SELECT id, property_type, name, owner_character_id FROM properties WHERE owner_character_id = ? ORDER BY id DESC', [characterId]);
    const wallet = walletRows[0] ?? { cash: 0, bank: 0, bank_account: undefined };
    const money: MoneyState = { cash: Number(wallet.cash), bank: Number(wallet.bank), bankAccount: wallet.bank_account ?? undefined };
    const inventory: InventoryItemView[] = itemRows.map((row) => ({ id: String(row.id), itemKey: row.item_key, amount: Number(row.amount), slot: Number(row.slot), durability: row.durability == null ? null : Number(row.durability), metadata: this.parseJson(row.metadata) }));
    const vehicles: VehicleView[] = vehicleRows.map((row) => ({ id: String(row.id), model: row.model, plate: row.plate, fuel: Number(row.fuel), mileage: Number(row.mileage), stored: Boolean(row.stored) }));
    const properties: PropertyView[] = propertyRows.map((row) => ({ id: String(row.id), type: row.property_type, name: row.name, owned: String(row.owner_character_id) === characterId.toString() }));
    return { characterId: characterId.toString(), money, inventory, vehicles, properties };
  }

  async transferCash(from: bigint, to: bigint, amount: number): Promise<boolean> {
    if (!this.validAmount(amount) || from === to) return false;
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [from]);
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [to]);
      const [result] = await connection.execute<any>('UPDATE character_wallets SET cash = cash - ? WHERE character_id = ? AND cash >= ?', [amount, from, amount]);
      if (result.affectedRows !== 1) { await connection.rollback(); return false; }
      const [credit] = await connection.execute<any>('UPDATE character_wallets SET cash = cash + ? WHERE character_id = ? AND cash <= ?', [amount, to, MAX_MONEY - amount]);
      if (credit.affectedRows !== 1) { await connection.rollback(); return false; }
      await connection.execute('INSERT INTO money_transactions (character_id, counterparty_character_id, type, amount) VALUES (?, ?, ?, ?), (?, ?, ?, ?)', [from, to, 'cash_transfer_out', -amount, to, from, 'cash_transfer_in', amount]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async bankMove(characterId: bigint, amount: number, direction: 'deposit' | 'withdraw'): Promise<boolean> {
    if (!this.validAmount(amount)) return false;
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [characterId]);
      const source = direction === 'deposit' ? 'cash' : 'bank';
      const target = direction === 'deposit' ? 'bank' : 'cash';
      const [result] = await connection.execute<any>(`UPDATE character_wallets SET ${source} = ${source} - ?, ${target} = ${target} + ? WHERE character_id = ? AND bank_frozen = 0 AND ${source} >= ? AND ${target} <= ?`, [amount, amount, characterId, amount, MAX_MONEY - amount]);
      if (result.affectedRows !== 1) { await connection.rollback(); return false; }
      await connection.execute('INSERT INTO money_transactions (character_id, type, amount) VALUES (?, ?, ?)', [characterId, direction, amount]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async bankTransfer(from: bigint, targetAccount: string, amount: number): Promise<boolean> {
    if (!this.validAmount(amount) || !/^NR\d{10}$/.test(targetAccount)) return false;
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [targets] = await connection.query<any[]>('SELECT character_id FROM character_wallets WHERE bank_account = ? AND bank_frozen = 0 FOR UPDATE', [targetAccount]);
      const target = targets[0]?.character_id == null ? null : BigInt(String(targets[0].character_id));
      if (!target || target === from) { await connection.rollback(); return false; }
      const [debit] = await connection.execute<any>('UPDATE character_wallets SET bank = bank - ? WHERE character_id = ? AND bank_frozen = 0 AND bank >= ?', [amount, from, amount]);
      if (debit.affectedRows !== 1) { await connection.rollback(); return false; }
      const [credit] = await connection.execute<any>('UPDATE character_wallets SET bank = bank + ? WHERE character_id = ? AND bank_frozen = 0 AND bank <= ?', [amount, target, MAX_MONEY - amount]);
      if (credit.affectedRows !== 1) { await connection.rollback(); return false; }
      await connection.execute('INSERT INTO money_transactions (character_id, counterparty_character_id, type, amount) VALUES (?, ?, ?, ?), (?, ?, ?, ?)', [from, target, 'bank_transfer_out', -amount, target, from, 'bank_transfer_in', amount]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async moveInventory(characterId: bigint, fromSlot: number, toSlot: number): Promise<boolean> {
    if (!this.validSlot(fromSlot) || !this.validSlot(toSlot) || fromSlot === toSlot) return false;
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [fromRows] = await connection.query<any[]>('SELECT id FROM inventory_items WHERE character_id = ? AND slot = ? FOR UPDATE', [characterId, fromSlot]);
      if (!fromRows[0]) { await connection.rollback(); return false; }
      const [toRows] = await connection.query<any[]>('SELECT id FROM inventory_items WHERE character_id = ? AND slot = ? FOR UPDATE', [characterId, toSlot]);
      await connection.execute('UPDATE inventory_items SET slot = 65535 WHERE id = ?', [fromRows[0].id]);
      if (toRows[0]) await connection.execute('UPDATE inventory_items SET slot = ? WHERE id = ?', [fromSlot, toRows[0].id]);
      await connection.execute('UPDATE inventory_items SET slot = ? WHERE id = ?', [toSlot, fromRows[0].id]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async splitInventory(characterId: bigint, fromSlot: number, toSlot: number, amount: number): Promise<boolean> {
    if (!this.validSlot(fromSlot) || !this.validSlot(toSlot) || fromSlot === toSlot || !Number.isSafeInteger(amount) || amount <= 0) return false;
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [sourceRows] = await connection.query<any[]>('SELECT id, item_key, amount, durability, metadata FROM inventory_items WHERE character_id = ? AND slot = ? FOR UPDATE', [characterId, fromSlot]);
      const source = sourceRows[0];
      if (!source || Number(source.amount) <= amount) { await connection.rollback(); return false; }
      const def = ITEM_CATALOG[String(source.item_key)];
      if (!def || amount > def.stack) { await connection.rollback(); return false; }
      const [occupied] = await connection.query<any[]>('SELECT id FROM inventory_items WHERE character_id = ? AND slot = ? FOR UPDATE', [characterId, toSlot]);
      if (occupied[0]) { await connection.rollback(); return false; }
      await connection.execute('UPDATE inventory_items SET amount = amount - ? WHERE id = ?', [amount, source.id]);
      await connection.execute('INSERT INTO inventory_items (character_id, item_key, amount, slot, durability, metadata) VALUES (?, ?, ?, ?, ?, ?)', [characterId, source.item_key, amount, toSlot, source.durability, typeof source.metadata === 'string' ? source.metadata : JSON.stringify(source.metadata ?? {})]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async useInventory(characterId: bigint, slot: number): Promise<InventoryUseResult | null> {
    if (!this.validSlot(slot)) return null;
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<any[]>('SELECT id, item_key, amount FROM inventory_items WHERE character_id = ? AND slot = ? FOR UPDATE', [characterId, slot]);
      const item = rows[0];
      if (!item) { await connection.rollback(); return null; }
      const key = String(item.item_key), def = ITEM_CATALOG[key];
      if (!def?.usable) { await connection.rollback(); return null; }
      const effect: InventoryUseResult['effect'] = key === 'phone.basic' ? 'phone' : key === 'document.id' ? 'identity' : key === 'food.water' ? 'hydrate' : key === 'food.sandwich' ? 'feed' : key === 'medical.bandage' ? 'heal_minor' : key === 'tool.repairkit' ? 'repair_vehicle' : 'none';
      const consumable = !['phone.basic', 'document.id'].includes(key);
      let remaining = Number(item.amount);
      if (consumable) {
        remaining -= 1;
        if (remaining <= 0) await connection.execute('DELETE FROM inventory_items WHERE id = ?', [item.id]);
        else await connection.execute('UPDATE inventory_items SET amount = ? WHERE id = ?', [remaining, item.id]);
      }
      await connection.execute('INSERT INTO inventory_use_log (character_id, item_key, effect) VALUES (?, ?, ?)', [characterId, key, effect]);
      await connection.commit();
      return { itemKey: key, consumed: consumable, remaining, effect };
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async savePosition(characterId: bigint, x: number, y: number, z: number, heading: number, dimension: number): Promise<void> {
    if (![x, y, z, heading, dimension].every(Number.isFinite)) return;
    await this.db.pool.execute('UPDATE characters SET pos_x = ?, pos_y = ?, pos_z = ?, heading = ?, dimension = ?, last_played_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [x, y, z, heading, Math.max(0, Math.trunc(dimension)), characterId]);
  }

  private validAmount(amount: number): boolean { return Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_MONEY; }
  private validSlot(slot: number): boolean { return Number.isInteger(slot) && slot >= 0 && slot <= MAX_INVENTORY_SLOT; }
  private parseJson(value: unknown): Record<string, unknown> { if (!value) return {}; if (typeof value === 'object') return value as Record<string, unknown>; try { return JSON.parse(String(value)) as Record<string, unknown>; } catch { return {}; } }
}
