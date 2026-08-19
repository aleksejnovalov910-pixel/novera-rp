import type { NoveraDatabase } from '@novera/database';

export class AdminService {
  constructor(private readonly db:NoveraDatabase) {}
  async level(accountId:bigint):Promise<number>{ const [rows]=await this.db.pool.query<any[]>('SELECT admin_level FROM accounts WHERE id=? LIMIT 1',[accountId]); return Number(rows[0]?.admin_level??0); }
  async createReport(characterId:bigint,subject:string,message:string):Promise<bigint|null>{ const s=subject.trim(),m=message.trim(); if(s.length<3||s.length>96||m.length<5||m.length>1000)return null;const [result]=await this.db.pool.execute<any>('INSERT INTO admin_reports(reporter_character_id,subject,message) VALUES(?,?,?)',[characterId,s,m]);return BigInt(result.insertId); }
  async punish(adminAccountId:bigint,targetAccountId:bigint,targetCharacterId:bigint|null,type:'warn'|'mute'|'jail'|'kick'|'ban',reason:string,durationMinutes:number|null):Promise<bigint>{ const text=reason.trim();if(text.length<3||text.length>255)throw new Error('invalid reason');const expires=durationMinutes&&durationMinutes>0?new Date(Date.now()+Math.min(durationMinutes,5256000)*60000):null;const [result]=await this.db.pool.execute<any>('INSERT INTO punishments(account_id,character_id,admin_account_id,punishment_type,reason,expires_at) VALUES(?,?,?,?,?,?)',[targetAccountId,targetCharacterId,adminAccountId,type,text,expires]);if(type==='ban')await this.db.pool.execute('UPDATE accounts SET is_banned=TRUE WHERE id=?',[targetAccountId]);return BigInt(result.insertId); }
}
