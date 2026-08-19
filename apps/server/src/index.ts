import { loadConfig } from '@novera/config';
import { createDatabase } from '@novera/database';
import { Logger } from '@novera/logging';
import { AccountService } from './modules/accounts/account.service';
import { CharacterService } from './modules/characters/character.service';
import { GameplayService } from './modules/gameplay/gameplay.service';
import { JobService } from './modules/jobs/job.service';
import { VehicleService } from './modules/vehicles/vehicle.service';
import { PropertyService } from './modules/properties/property.service';
import { SocialService } from './modules/social/social.service';
import { MarketService } from './modules/market/market.service';
import { registerAuthEvents } from './runtime/auth.events';
import { registerCharacterEvents } from './runtime/character.events';
import { registerGameplayEvents } from './runtime/gameplay.events';
import { registerWorldEvents } from './runtime/world.events';
import { createRateLimitStore } from './services/rate-limit';

async function boot(): Promise<void> {
  const started = Date.now();
  const config = loadConfig();
  const logger = new Logger('server', config.logLevel);
  const db = createDatabase(config.databaseUrl);
  const rateLimits = await createRateLimitStore(config.redisUrl);
  const health = await db.healthcheck();

  const accounts = new AccountService(db);
  const characters = new CharacterService(db);
  const gameplay = new GameplayService(db);
  const jobs = new JobService(db);
  const vehicles = new VehicleService(db);
  const properties = new PropertyService(db);
  const social = new SocialService(db);
  const market = new MarketService(db);

  registerAuthEvents({ accounts, characters, rateLimits, logger: logger.child('auth'), maxAttempts: config.authMaxAttempts, lockSeconds: config.authLockSeconds });
  registerCharacterEvents({ characters, logger: logger.child('characters') });
  registerGameplayEvents({ gameplay, logger: logger.child('gameplay') });
  registerWorldEvents({ jobs, vehicles, properties, social, market, logger: logger.child('world') });

  mp.events.add('playerJoin', (player: PlayerMp) => {
    player.dimension = 1000 + player.id;
    logger.info('player connected', { player: player.name, id: player.id });
  });

  mp.events.add('playerQuit', (player: PlayerMp, exitType: string, reason: string) => {
    logger.info('player disconnected', { player: player.name, exitType, reason });
  });

  logger.info('NOVERA RP bootstrap ready', {
    environment: config.environment,
    maxPlayers: config.maxPlayers,
    dbLatencyMs: health.latencyMs,
    rateLimitStore: rateLimits.mode,
    bootMs: Date.now() - started
  });
}

void boot().catch((error) => {
  console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', scope: 'server', message: 'fatal bootstrap error', error: String(error) }));
  process.exitCode = 1;
});
