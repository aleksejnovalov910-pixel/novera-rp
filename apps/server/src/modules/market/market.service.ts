import type { NoveraDatabase } from '@novera/database';

export class MarketService {
  constructor(private readonly db: NoveraDatabase) {}

  async list(category: string, limit = 50): Promise<any[]> {
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
    const [rows] = await this.db.pool.query<any[]>('SELECT id, seller_character_id, category, object_type, object_id, price, created_at, expires_at FROM marketplace_listings WHERE status = "active" AND category = ? ORDER BY created_at DESC LIMIT ?', [category, safeLimit]);
    return rows.map((r) => ({ id: String(r.id), sellerCharacterId: String(r.seller_character_id), category: r.category, objectType: r.object_type, objectId: String(r.object_id), price: Number(r.price), createdAt: new Date(r.created_at).toISOString(), expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null }));
  }

  async create(sellerId: bigint, category: string, objectType: string, objectId: bigint, price: number): Promise<bigint | null> {
    if (!/^[a-z0-9_-]{2,32}$/.test(category) || !/^[a-z0-9_-]{2,32}$/.test(objectType) || !Number.isSafeInteger(price) || price <= 0 || price > 9_000_000_000_000) return null;
    const [result] = await this.db.pool.execute<any>('INSERT INTO marketplace_listings (seller_character_id, category, object_type, object_id, price, expires_at) VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [sellerId, category, objectType, objectId, price]);
    return BigInt(result.insertId);
  }

  async buy(buyerId: bigint, listingId: bigint): Promise<boolean> {
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<any[]>('SELECT * FROM marketplace_listings WHERE id = ? AND status = "active" FOR UPDATE', [listingId]);
      const listing = rows[0]; if (!listing || String(listing.seller_character_id) === buyerId.toString()) { await connection.rollback(); return false; }
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [buyerId]);
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [listing.seller_character_id]);
      const [paid] = await connection.execute<any>('UPDATE character_wallets SET bank = bank - ? WHERE character_id = ? AND bank >= ?', [listing.price, buyerId, listing.price]);
      if (paid.affectedRows !== 1) { await connection.rollback(); return false; }
      const fee = Math.max(1, Math.floor(Number(listing.price) * 0.05));
      const sellerNet = Number(listing.price) - fee;
      await connection.execute('UPDATE character_wallets SET bank = bank + ? WHERE character_id = ?', [sellerNet, listing.seller_character_id]);
      await connection.execute('UPDATE marketplace_listings SET status = "sold" WHERE id = ?', [listingId]);
      const metadata = JSON.stringify({ listingId: listingId.toString() });
      await connection.execute('INSERT INTO money_transactions (character_id, counterparty_character_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)', [buyerId, listing.seller_character_id, 'market_buy', -Number(listing.price), metadata, listing.seller_character_id, buyerId, 'market_sale', sellerNet, metadata]);
      await connection.commit(); return true;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }
}
