import type { NoveraDatabase } from '@novera/database';
export interface Membership{factionId:bigint;key:string;type:string;rank:number}
export class OrganizationService{
 constructor(private readonly db:NoveraDatabase){}
 async membership(characterId:bigint):Promise<Membership|null>{const[rows]=await this.db.pool.query<any[]>('SELECT f.id,f.faction_key,f.type,fm.rank FROM faction_members fm JOIN factions f ON f.id=fm.faction_id WHERE fm.character_id=? LIMIT 1',[characterId]);const r=rows[0];return r?{factionId:BigInt(r.id),key:r.faction_key,type:r.type,rank:Number(r.rank)}:null}
 async require(characterId:bigint,types:string[],minRank=1):Promise<Membership|null>{const m=await this.membership(characterId);return m&&types.includes(m.type)&&m.rank>=minRank?m:null}
}
