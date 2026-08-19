import { loadConfig } from '@novera/config';
import { createDatabase } from '@novera/database';
import { Logger } from '@novera/logging';
import { AccountService } from './modules/accounts/account.service';
import { CharacterService } from './modules/characters/character.service';
import { registerAuthEvents } from './runtime/auth.events';
import { registerCharacterEvents } from './runtime/character.events';
import { createRedis } from './services/redis';

async function boot(): Promise<void> {
  const started = Date.now();
  const config = loadConfig();
  const logger = new Logger('server', config.logLevel);
  const db = createDatabase(config.databaseUrl);
  const redis = await createRedis(config.redisUrl);
  const health = await db.healthcheck();

  const accounts = new AccountService(db);
  const characters = new CharacterService(db);
  registerAuthEvents({ accounts, characters, redis, logger: logger.child('auth'), maxAttempts: config.authMaxAttempts, lockSeconds: config.authLockSeconds });
  registerCharacterEvents({ characters, logger: logger.child('characters') });

  mp.events.add('playerJoin', (player: PlayerMp) => {
    player.dimension = 1000 + player.id;
    logger.info('player connected', { player: player.name, id: player.id });
  });

  mp.events.add('playerQuit', (player: PlayerMp, exitType: string, reason: string) => {
    logger.info('player disconnected', { player: player.name, exitType, reason });
  });

  logger.info('NOVERA RP bootstrap ready', { environment: config.environment, maxPlayers: config.maxPlayers, dbLatencyMs: health.latencyMs, bootMs: Date.now() - started });
}

void boot().catch((error) => {
  console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', scope: 'server', message: 'fatal bootstrap error', error: String(error) }));
  process.exitCode = 1;
});
