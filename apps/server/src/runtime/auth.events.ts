import { AuthEvents, type AuthCredentials, type AuthResult } from '@novera/shared';
import type { Logger } from '@novera/logging';
import type { AccountService } from '../modules/accounts/account.service';
import type { CharacterService } from '../modules/characters/character.service';
import type { RateLimitStore } from '../services/rate-limit';

interface AuthDependencies {
  accounts: AccountService;
  characters: CharacterService;
  rateLimits: RateLimitStore;
  logger: Logger;
  maxAttempts: number;
  lockSeconds: number;
}

function send(player: PlayerMp, result: AuthResult): void {
  player.call(AuthEvents.result, [JSON.stringify(result)]);
}

export function registerAuthEvents(deps: AuthDependencies): void {
  const key = (player: PlayerMp) => `auth:attempts:${player.ip}`;

  mp.events.add(AuthEvents.register, async (player: PlayerMp, raw: string) => {
    try {
      const input = JSON.parse(raw) as AuthCredentials;
      if (!deps.accounts.validate(input.login, input.password)) return send(player, { ok: false, code: 'INVALID_INPUT', message: 'Проверь логин и пароль.' });
      const created = await deps.accounts.register(input.login, input.password);
      if (!created) return send(player, { ok: false, code: 'ACCOUNT_EXISTS', message: 'Такой аккаунт уже существует.' });
      player.setVariable('accountId', created.id.toString());
      await deps.rateLimits.reset(key(player));
      send(player, { ok: true, code: 'OK', message: 'Аккаунт создан.' });
      player.call(AuthEvents.characters, [JSON.stringify([])]);
      deps.logger.info('account registered', { accountId: created.id.toString(), player: player.name });
    } catch (error) {
      deps.logger.error('registration failed', { error: String(error), player: player.name });
      send(player, { ok: false, code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера.' });
    }
  });

  mp.events.add(AuthEvents.login, async (player: PlayerMp, raw: string) => {
    const rateKey = key(player);
    try {
      const attempts = await deps.rateLimits.get(rateKey);
      if (attempts >= deps.maxAttempts) return send(player, { ok: false, code: 'RATE_LIMITED', message: 'Слишком много попыток. Попробуй позже.' });
      const input = JSON.parse(raw) as AuthCredentials;
      if (!deps.accounts.validate(input.login, input.password)) return send(player, { ok: false, code: 'INVALID_INPUT', message: 'Проверь логин и пароль.' });
      const account = await deps.accounts.authenticate(input.login, input.password);
      if (!account) {
        await deps.rateLimits.increment(rateKey, deps.lockSeconds);
        return send(player, { ok: false, code: 'INVALID_CREDENTIALS', message: 'Неверный логин или пароль.' });
      }
      await deps.rateLimits.reset(rateKey);
      player.setVariable('accountId', account.id.toString());
      send(player, { ok: true, code: 'OK', message: 'Авторизация успешна.' });
      const list = await deps.characters.list(account.id);
      player.call(AuthEvents.characters, [JSON.stringify(list)]);
      deps.logger.info('account authenticated', { accountId: account.id.toString(), player: player.name });
    } catch (error) {
      deps.logger.error('login failed', { error: String(error), player: player.name });
      send(player, { ok: false, code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера.' });
    }
  });
}
