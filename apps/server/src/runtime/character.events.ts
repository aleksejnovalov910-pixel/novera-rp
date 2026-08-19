import { CharacterEvents, type CharacterActionResult, type CreateCharacterInput } from '@novera/shared';
import type { Logger } from '@novera/logging';
import type { CharacterService } from '../modules/characters/character.service';

const CREATOR_BASE_DIMENSION = 50000;
const CREATOR_POSITION = new mp.Vector3(402.89, -996.76, -99.0);

interface CharacterDependencies {
  characters: CharacterService;
  logger: Logger;
}

function accountId(player: PlayerMp): bigint | null {
  const raw = player.getVariable('accountId');
  if (!raw) return null;
  try {
    return BigInt(String(raw));
  } catch {
    return null;
  }
}

function send(player: PlayerMp, result: CharacterActionResult): void {
  player.call(CharacterEvents.result, [JSON.stringify(result)]);
}

async function pushList(player: PlayerMp, characters: CharacterService, id: bigint): Promise<void> {
  player.call(CharacterEvents.list, [JSON.stringify(await characters.list(id))]);
}

export function registerCharacterEvents(deps: CharacterDependencies): void {
  mp.events.add(CharacterEvents.creatorOpen, (player: PlayerMp, rawSlot: number) => {
    const id = accountId(player);
    const slot = Number(rawSlot);
    if (!id) return send(player, { ok: false, code: 'UNAUTHENTICATED', message: 'Сначала войди в аккаунт.' });
    if (![1, 2, 3].includes(slot)) return send(player, { ok: false, code: 'INVALID_INPUT', message: 'Некорректный слот.' });

    player.dimension = CREATOR_BASE_DIMENSION + player.id;
    player.position = CREATOR_POSITION;
    player.heading = 180;
    player.setVariable('creatorSlot', slot);
    player.call(CharacterEvents.creatorOpen, [slot]);
  });

  mp.events.add(CharacterEvents.create, async (player: PlayerMp, raw: string) => {
    const id = accountId(player);
    if (!id) return send(player, { ok: false, code: 'UNAUTHENTICATED', message: 'Сначала войди в аккаунт.' });

    try {
      const input = JSON.parse(raw) as CreateCharacterInput;
      const expectedSlot = Number(player.getVariable('creatorSlot') ?? 0);
      if (input.slot !== expectedSlot || !deps.characters.validate(input)) {
        return send(player, { ok: false, code: 'INVALID_INPUT', message: 'Проверь данные персонажа.' });
      }

      const created = await deps.characters.create(id, input);
      if (created === 'SLOT_OCCUPIED') return send(player, { ok: false, code: 'SLOT_OCCUPIED', message: 'Этот слот уже занят.' });
      if (created === 'NAME_TAKEN') return send(player, { ok: false, code: 'NAME_TAKEN', message: 'Такое имя уже занято.' });

      player.setVariable('creatorSlot', null);
      send(player, { ok: true, code: 'OK', message: 'Персонаж создан.' });
      await pushList(player, deps.characters, id);
      deps.logger.info('character created', { accountId: id.toString(), characterId: created.id, slot: created.slot });
    } catch (error) {
      deps.logger.error('character create failed', { player: player.name, error: String(error) });
      send(player, { ok: false, code: 'INTERNAL_ERROR', message: 'Не удалось создать персонажа.' });
    }
  });

  mp.events.add(CharacterEvents.select, async (player: PlayerMp, rawCharacterId: string) => {
    const id = accountId(player);
    if (!id) return send(player, { ok: false, code: 'UNAUTHENTICATED', message: 'Сначала войди в аккаунт.' });

    try {
      const character = await deps.characters.select(id, BigInt(rawCharacterId));
      if (!character) return send(player, { ok: false, code: 'NOT_OWNER', message: 'Персонаж не найден.' });

      player.setVariable('characterId', character.id.toString());
      player.dimension = character.dimension;
      player.position = new mp.Vector3(character.posX, character.posY, character.posZ);
      player.heading = character.heading;
      player.model = mp.joaat(character.gender === 'female' ? 'mp_f_freemode_01' : 'mp_m_freemode_01');
      player.call(CharacterEvents.selected, [JSON.stringify({ id: character.id.toString() })]);
      deps.logger.info('character selected', { accountId: id.toString(), characterId: character.id.toString() });
    } catch (error) {
      deps.logger.error('character select failed', { player: player.name, error: String(error) });
      send(player, { ok: false, code: 'INTERNAL_ERROR', message: 'Не удалось загрузить персонажа.' });
    }
  });

  mp.events.add(CharacterEvents.delete, async (player: PlayerMp, rawCharacterId: string) => {
    const id = accountId(player);
    if (!id) return send(player, { ok: false, code: 'UNAUTHENTICATED', message: 'Сначала войди в аккаунт.' });

    try {
      const removed = await deps.characters.softDelete(id, BigInt(rawCharacterId));
      if (!removed) return send(player, { ok: false, code: 'NOT_OWNER', message: 'Персонаж не найден.' });

      send(player, { ok: true, code: 'OK', message: 'Персонаж удалён.' });
      await pushList(player, deps.characters, id);
      deps.logger.info('character soft deleted', { accountId: id.toString(), characterId: rawCharacterId });
    } catch (error) {
      deps.logger.error('character delete failed', { player: player.name, error: String(error) });
      send(player, { ok: false, code: 'INTERNAL_ERROR', message: 'Не удалось удалить персонажа.' });
    }
  });
}
