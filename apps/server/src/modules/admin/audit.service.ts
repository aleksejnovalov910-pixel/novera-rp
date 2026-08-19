import type { NoveraDatabase } from '@novera/database';

export class AuditService {
  constructor(private readonly db: NoveraDatabase) {}

  async write(input: { accountId?: bigint | null; characterId?: bigint | null; action: string; targetType?: string | null; targetId?: string | null; payload?: unknown }): Promise<void> {
    if (!/^[a-z0-9_.:-]{3,96}$/i.test(input.action)) throw new Error('invalid audit action');
    await this.db.pool.execute('INSERT INTO audit_log (actor_account_id, actor_character_id, action, target_type, target_id, payload) VALUES (?, ?, ?, ?, ?, ?)', [input.accountId ?? null, input.characterId ?? null, input.action, input.targetType ?? null, input.targetId ?? null, input.payload == null ? null : JSON.stringify(input.payload)]);
  }
}
