import type { NoveraDatabase } from '@novera/database';
import type { JobKey, JobProgressView } from '@novera/shared';

const JOBS: ReadonlySet<JobKey> = new Set<JobKey>(['taxi','courier','trucker','mechanic','tow','builder','electrician','garbage']);
const TASKS: Record<JobKey, readonly string[]> = {
  taxi: ['city_ride','airport_ride','vip_ride'], courier: ['small_parcel','food_delivery','priority_parcel'], trucker: ['local_freight','long_freight','fragile_freight'],
  mechanic: ['diagnostic','road_repair','workshop_repair'], tow: ['breakdown_tow','impound_tow','illegal_parking'], builder: ['materials','framework','site_finish'],
  electrician: ['street_box','building_grid','emergency_grid'], garbage: ['residential_route','commercial_route','recycling_route']
};
const BASE_PAY: Record<JobKey, number> = { taxi:850,courier:700,trucker:1450,mechanic:1200,tow:1250,builder:900,electrician:1050,garbage:800 };
const BASE_XP: Record<JobKey, number> = { taxi:110,courier:95,trucker:150,mechanic:135,tow:140,builder:105,electrician:120,garbage:100 };

export class JobService {
  constructor(private readonly db: NoveraDatabase) {}
  isJobKey(value: string): value is JobKey { return JOBS.has(value as JobKey); }
  isTaskKey(jobKey: JobKey, taskKey: string): boolean { return TASKS[jobKey].includes(taskKey); }
  taskFor(jobKey: JobKey, seed: number): string { const tasks=TASKS[jobKey]; return tasks[Math.abs(seed)%tasks.length]!; }

  async list(characterId: bigint): Promise<JobProgressView[]> {
    const [rows] = await this.db.pool.query<any[]>('SELECT job_key, level, experience, completed_tasks FROM jobs_progress WHERE character_id = ?', [characterId]);
    return rows.map((r) => ({ jobKey: r.job_key as JobKey, level: Number(r.level), experience: Number(r.experience), completedTasks: Number(r.completed_tasks) }));
  }

  async startSession(characterId: bigint, jobKey: JobKey, token: string, taskKey: string): Promise<boolean> {
    if (!this.isTaskKey(jobKey, taskKey) || !/^[a-zA-Z0-9_-]{20,96}$/.test(token)) return false;
    await this.db.pool.execute("UPDATE job_sessions SET state='expired' WHERE character_id=? AND state='active' AND expires_at<CURRENT_TIMESTAMP",[characterId]);
    const [active] = await this.db.pool.query<any[]>('SELECT id FROM job_sessions WHERE character_id=? AND state=\'active\' LIMIT 1',[characterId]);
    if (active[0]) return false;
    await this.db.pool.execute("INSERT INTO job_sessions (character_id,job_key,session_token,task_key,expires_at) VALUES (?,?,?,?,DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 30 MINUTE))",[characterId,jobKey,token,taskKey]);
    return true;
  }

  async completeSession(characterId: bigint, jobKey: JobKey, token: string): Promise<{ pay:number; level:number; experience:number; taskKey:string } | null> {
    const connection=await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [sessions]=await connection.query<any[]>('SELECT id,task_key,TIMESTAMPDIFF(SECOND,started_at,CURRENT_TIMESTAMP) duration_seconds FROM job_sessions WHERE character_id=? AND job_key=? AND session_token=? AND state=\'active\' AND expires_at>CURRENT_TIMESTAMP FOR UPDATE',[characterId,jobKey,token]);
      const session=sessions[0]; if(!session || Number(session.duration_seconds)<10){await connection.rollback();return null;}
      await connection.execute('INSERT INTO jobs_progress (character_id,job_key) VALUES (?,?) ON DUPLICATE KEY UPDATE job_key=VALUES(job_key)',[characterId,jobKey]);
      const [rows]=await connection.query<any[]>('SELECT level,experience,streak FROM jobs_progress WHERE character_id=? AND job_key=? FOR UPDATE',[characterId,jobKey]);
      const current=rows[0],currentLevel=Number(current?.level??1),currentXp=Number(current?.experience??0),streak=Math.min(20,Number(current?.streak??0)+1);
      const pay=Math.round(BASE_PAY[jobKey]*(1+Math.min(currentLevel-1,20)*0.03)*(1+streak*0.005));
      const xp=BASE_XP[jobKey],totalXp=currentXp+xp,nextLevel=Math.min(50,Math.max(currentLevel,Math.floor(Math.sqrt(totalXp/100))+1));
      await connection.execute('UPDATE jobs_progress SET level=?,experience=?,completed_tasks=completed_tasks+1,total_earnings=total_earnings+?,streak=?,reputation=reputation+1,last_completed_at=CURRENT_TIMESTAMP WHERE character_id=? AND job_key=?',[nextLevel,totalXp,pay,streak,characterId,jobKey]);
      await connection.execute('INSERT IGNORE INTO character_wallets (character_id) VALUES (?)',[characterId]);
      await connection.execute('UPDATE character_wallets SET bank=bank+? WHERE character_id=?',[pay,characterId]);
      await connection.execute('INSERT INTO money_transactions (character_id,type,amount,metadata) VALUES (?,?,?,JSON_OBJECT(\'job\',?,\'task\',?))',[characterId,'job_reward',pay,jobKey,session.task_key]);
      await connection.execute('INSERT INTO job_completion_log (character_id,job_key,task_key,pay,experience,duration_seconds) VALUES (?,?,?,?,?,?)',[characterId,jobKey,session.task_key,pay,xp,Number(session.duration_seconds)]);
      await connection.execute("UPDATE job_sessions SET state='completed',completed_at=CURRENT_TIMESTAMP WHERE id=?",[session.id]);
      await connection.commit(); return {pay,level:nextLevel,experience:totalXp,taskKey:String(session.task_key)};
    } catch(error){await connection.rollback();throw error;} finally {connection.release();}
  }
}