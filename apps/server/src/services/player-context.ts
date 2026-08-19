export interface PlayerContext { accountId: bigint; characterId: bigint; adminLevel: number; }

export function getPlayerContext(player: PlayerMp): PlayerContext | null {
  try {
    const accountRaw = player.getVariable('accountId');
    const characterRaw = player.getVariable('characterId');
    if (!accountRaw || !characterRaw) return null;
    return { accountId: BigInt(String(accountRaw)), characterId: BigInt(String(characterRaw)), adminLevel: Number(player.getVariable('adminLevel') ?? 0) || 0 };
  } catch { return null; }
}
