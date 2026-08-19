import type { NoveraDatabase } from '@novera/database';

export class OnboardingService {
  constructor(private readonly db:NoveraDatabase) {}

  async ensure(characterId:bigint):Promise<{firstSpawn:boolean}> {
    const connection=await this.db.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [flags]=await connection.query<any[]>('SELECT flag_value FROM character_flags WHERE character_id=? AND flag_key="starter_granted" FOR UPDATE',[characterId]);
      if(flags[0]){await connection.commit();return{firstSpawn:false};}
      await connection.execute('INSERT IGNORE INTO character_wallets(character_id,cash,bank) VALUES(?,5000,25000)',[characterId]);
      await connection.execute('INSERT IGNORE INTO character_stats(character_id) VALUES(?)',[characterId]);
      const phoneMetadata=JSON.stringify({number:`555${characterId.toString().slice(-7).padStart(7,'0')}`});
      const idMetadata=JSON.stringify({issued:'San Andreas'});
      await connection.execute('INSERT IGNORE INTO inventory_items(character_id,item_key,amount,slot,durability,metadata) VALUES (?,"phone.basic",1,0,NULL,?), (?,"document.id",1,1,NULL,?), (?,"food.water",2,2,NULL,NULL), (?,"food.sandwich",2,3,NULL,NULL)',[characterId,phoneMetadata,characterId,idMetadata,characterId,characterId]);
      await connection.execute('INSERT INTO quest_progress(character_id,quest_key,stage,progress,status) VALUES(?,"onboarding.arrival","welcome",?,"active") ON DUPLICATE KEY UPDATE quest_key=quest_key',[characterId,JSON.stringify({documents:true,phone:true})]);
      await connection.execute('INSERT INTO character_flags(character_id,flag_key,flag_value) VALUES(?,"starter_granted","1")',[characterId]);
      await connection.commit();return{firstSpawn:true};
    } catch(error){await connection.rollback();throw error;} finally{connection.release();}
  }
}
