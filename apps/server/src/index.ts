import { loadConfig } from '@novera/config';
import { createDatabase } from '@novera/database';
import { Logger } from '@novera/logging';
import { AccountService } from './modules/accounts/account.service';
import { CharacterService } from './modules/characters/character.service';
import { OnboardingService } from './modules/onboarding/onboarding.service';
import { GameplayService } from './modules/gameplay/gameplay.service';
import { JobService } from './modules/jobs/job.service';
import { VehicleService } from './modules/vehicles/vehicle.service';
import { PropertyService } from './modules/properties/property.service';
import { SocialService } from './modules/social/social.service';
import { MarketService } from './modules/market/market.service';
import { PhoneService } from './modules/phone/phone.service';
import { BusinessService } from './modules/business/business.service';
import { GovernmentService } from './modules/government/government.service';
import { AdminService } from './modules/admin/admin.service';
import { OrganizationService } from './modules/organizations/organization.service';
import { PoliceService } from './modules/police/police.service';
import { MedicalService } from './modules/medical/medical.service';
import { ProgressionService } from './modules/progression/progression.service';
import { registerAuthEvents } from './runtime/auth.events';
import { registerCharacterEvents } from './runtime/character.events';
import { registerGameplayEvents } from './runtime/gameplay.events';
import { registerWorldEvents } from './runtime/world.events';
import { registerVehicleEvents } from './runtime/vehicle.events';
import { registerPropertyEvents } from './runtime/property.events';
import { registerExtendedEvents } from './runtime/extended.events';
import { registerRoleplayEvents } from './runtime/roleplay.events';
import { createRateLimitStore } from './services/rate-limit';
import { EventGuard } from './services/event-guard';

function selectedCharacterId(player: PlayerMp): bigint | null {
  const raw = player.getVariable('characterId');
  if (!raw) return null;
  try { return BigInt(String(raw)); } catch { return null; }
}

function snapshot(player: PlayerMp) {
  return {
    x: Number(player.position.x),
    y: Number(player.position.y),
    z: Number(player.position.z),
    heading: Number(player.heading),
    dimension: Number(player.dimension)
  };
}

async function boot(): Promise<void> {
  const started=Date.now(),config=loadConfig(),logger=new Logger('server',config.logLevel),db=createDatabase(config.databaseUrl),rateLimits=await createRateLimitStore(config.redisUrl),health=await db.healthcheck();
  const accounts=new AccountService(db),characters=new CharacterService(db),onboarding=new OnboardingService(db),gameplay=new GameplayService(db),jobs=new JobService(db),vehicles=new VehicleService(db),properties=new PropertyService(db),social=new SocialService(db),market=new MarketService(db),phone=new PhoneService(db),business=new BusinessService(db),government=new GovernmentService(db),admin=new AdminService(db),organizations=new OrganizationService(db),police=new PoliceService(db),medical=new MedicalService(db),progression=new ProgressionService(db),guard=new EventGuard();
  registerAuthEvents({accounts,characters,rateLimits,logger:logger.child('auth'),maxAttempts:config.authMaxAttempts,lockSeconds:config.authLockSeconds});
  registerCharacterEvents({characters,onboarding,logger:logger.child('characters')});
  registerGameplayEvents({gameplay,logger:logger.child('gameplay')});
  registerWorldEvents({jobs,vehicles,properties,social,market,logger:logger.child('world')});
  registerVehicleEvents({vehicles,logger:logger.child('vehicles')});
  registerPropertyEvents({properties,logger:logger.child('properties')});
  registerExtendedEvents({phone,business,government,admin,guard,logger:logger.child('extended')});
  registerRoleplayEvents({organizations,police,medical,progression,guard,logger:logger.child('roleplay')});

  mp.events.add('playerJoin',(player:PlayerMp)=>{
    player.dimension=1000+player.id;
    logger.info('player connected',{player:player.name,id:player.id});
  });

  const autosave = setInterval(() => {
    for (const player of mp.players.toArray()) {
      const characterId = selectedCharacterId(player);
      if (!characterId) continue;
      void characters.savePosition(characterId, snapshot(player)).catch((error) => {
        logger.error('character autosave failed',{player:player.name,characterId:characterId.toString(),error:String(error)});
      });
    }
  }, 30000);
  autosave.unref?.();

  mp.events.add('playerQuit',(player:PlayerMp,exitType:string,reason:string)=>{
    const characterId = selectedCharacterId(player);
    if (characterId) {
      void characters.savePosition(characterId, snapshot(player)).catch((error) => {
        logger.error('character disconnect save failed',{player:player.name,characterId:characterId.toString(),error:String(error)});
      });
    }
    logger.info('player disconnected',{player:player.name,exitType,reason});
  });

  logger.info('NOVERA RP bootstrap ready',{environment:config.environment,maxPlayers:config.maxPlayers,dbLatencyMs:health.latencyMs,rateLimitStore:rateLimits.mode,bootMs:Date.now()-started});
}
void boot().catch((error)=>{console.error(JSON.stringify({timestamp:new Date().toISOString(),level:'error',scope:'server',message:'fatal bootstrap error',error:String(error)}));process.exitCode=1});
