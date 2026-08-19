import type { NoveraDatabase } from '@novera/database';
import type { JobKey, JobProgressView } from '@novera/shared';

const JOBS: ReadonlySet<JobKey> = new Set<JobKey>(['taxi','courier','trucker','mechanic','tow','builder','electrician','garbage']);

export class JobService {
  constructor(private readonly db: NoveraDatabase) {}

  isJobKey(value: string): value is JobKey { return JOBS.has(value as JobKey); }

  async list(characterId: bigint): Promise<JobProgressView[]> {
    const [rows] = await this.db.pool.query<any[]>('SELECT job_key, level, experience, completed_tasks FROM jobs_progress WHERE character_id = ?', [characterId]);
    return rows.map((r) => ({ jobKey: r.job_key as JobKey, level: Number(r.level), experience: Number(r.experience), completedTasks: Number(r.completed_tasks) }));
  }

  async reward(characterId: bigint, jobKey: JobKey, basePay: number, experience: number): Promise<{ pay: number; level: number }> {
    if (!Number.isSafeInteger(basePay) || basePay < 0 || basePay > 100000 || !Number.isSafeInteger(experience) || experience < 0 || experience > 10000) throw new Error('invalid job reward');
    const connection = await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('INSERT INTO jobs_progress (character_id, job_key) VALUES (?, ?) ON DUPLICATE KEY UPDATE job_key = VALUES(job_key)', [characterId, jobKey]);
      const [rows] = await connection.query<any[]>('SELECT level, experience FROM jobs_progress WHERE character_id = ? AND job_key = ? FOR UPDATE', [characterId, jobKey]);
      const current = rows[0];
      const currentLevel = Number(current?.level ?? 1);
      const currentXp = Number(current?.experience ?? 0);
      const pay = Math.round(basePay * (1 + Math.min(currentLevel - 1, 20) * 0.025));
      const totalXp = currentXp + experience;
      const nextLevel = Math.min(50, Math.max(currentLevel, Math.floor(Math.sqrt(totalXp / 100)) + 1));
      await connection.execute('UPDATE jobs_progress SET level = ?, experience = ?, completed_tasks = completed_tasks + 1 WHERE character_id = ? AND job_key = ?', [nextLevel, totalXp, characterId, jobKey]);
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)', [characterId]);
      await connection.execute('UPDATE character_wallets SET bank = bank + ? WHERE character_id = ?', [pay, characterId]);
      await connection.execute('INSERT INTO money_transactions (character_id, type, amount, metadata) VALUES (?, ?, ?, JSON_OBJECT("job", ?))', [characterId, 'job_reward', pay, jobKey]);
      await connection.commit();
      return { pay, level: nextLevel };
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }
}
