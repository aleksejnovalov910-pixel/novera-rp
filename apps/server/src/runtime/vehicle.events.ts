import { WorldEvents, type VehicleServiceType } from '@novera/shared';
import type { Logger } from '@novera/logging';
import type { VehicleService } from '../modules/vehicles/vehicle.service';

interface Deps { vehicles: VehicleService; logger: Logger; }
function cid(player: PlayerMp): bigint | null { const raw = player.getVariable('characterId'); if (!raw) return null; try { return BigInt(String(raw)); } catch { return null; } }
function send(player: PlayerMp, payload: unknown): void { player.call(WorldEvents.result, [JSON.stringify(payload)]); }
function vehicleId(raw: string): bigint | null { try { return BigInt(String(raw)); } catch { return null; } }

export function registerVehicleEvents(deps: Deps): void {
  mp.events.add(WorldEvents.vehicleInfo, async (player: PlayerMp, raw: string) => {
    const characterId = cid(player), id = vehicleId(raw); if (!characterId || !id) return send(player, { ok: false, code: 'INVALID_VEHICLE' });
    try { const info = await deps.vehicles.info(characterId, id); send(player, info ? { ok: true, code: 'OK', vehicleInfo: info } : { ok: false, code: 'NOT_OWNER' }); }
    catch (error) { deps.logger.error('vehicle info failed', { error: String(error) }); send(player, { ok: false, code: 'INTERNAL_ERROR' }); }
  });

  mp.events.add(WorldEvents.vehicleShareKey, async (player: PlayerMp, raw: string, targetRaw: string) => {
    const characterId = cid(player), id = vehicleId(raw), targetId = vehicleId(targetRaw); if (!characterId || !id || !targetId) return send(player, { ok: false, code: 'INVALID_REQUEST' });
    try { const ok = await deps.vehicles.shareKey(characterId, id, targetId); send(player, { ok, code: ok ? 'OK' : 'REJECTED' }); }
    catch (error) { deps.logger.warn('vehicle key share rejected', { error: String(error) }); send(player, { ok: false, code: 'REJECTED' }); }
  });

  mp.events.add(WorldEvents.vehicleRevokeKey, async (player: PlayerMp, raw: string, targetRaw: string) => {
    const characterId = cid(player), id = vehicleId(raw), targetId = vehicleId(targetRaw); if (!characterId || !id || !targetId) return send(player, { ok: false, code: 'INVALID_REQUEST' });
    try { const ok = await deps.vehicles.revokeKey(characterId, id, targetId); send(player, { ok, code: ok ? 'OK' : 'REJECTED' }); }
    catch (error) { deps.logger.warn('vehicle key revoke rejected', { error: String(error) }); send(player, { ok: false, code: 'REJECTED' }); }
  });

  mp.events.add(WorldEvents.vehicleService, async (player: PlayerMp, raw: string, typeRaw: string) => {
    const characterId = cid(player), id = vehicleId(raw), type = String(typeRaw) as VehicleServiceType;
    if (!characterId || !id || !['repair','oil','battery','tires'].includes(type)) return send(player, { ok: false, code: 'INVALID_REQUEST' });
    try { const ok = await deps.vehicles.service(characterId, id, type); send(player, { ok, code: ok ? 'OK' : 'INSUFFICIENT_FUNDS_OR_STATE' }); }
    catch (error) { deps.logger.error('vehicle service failed', { error: String(error) }); send(player, { ok: false, code: 'INTERNAL_ERROR' }); }
  });

  mp.events.add(WorldEvents.vehicleInsure, async (player: PlayerMp, raw: string, planRaw: string) => {
    const characterId = cid(player), id = vehicleId(raw), plan = String(planRaw);
    if (!characterId || !id || (plan !== 'basic' && plan !== 'full')) return send(player, { ok: false, code: 'INVALID_REQUEST' });
    try { const ok = await deps.vehicles.insure(characterId, id, plan); send(player, { ok, code: ok ? 'OK' : 'INSUFFICIENT_FUNDS' }); }
    catch (error) { deps.logger.error('vehicle insurance failed', { error: String(error) }); send(player, { ok: false, code: 'INTERNAL_ERROR' }); }
  });

  mp.events.add(WorldEvents.vehicleInspect, async (player: PlayerMp, raw: string) => {
    const characterId = cid(player), id = vehicleId(raw); if (!characterId || !id) return send(player, { ok: false, code: 'INVALID_REQUEST' });
    try { const ok = await deps.vehicles.inspect(characterId, id); send(player, { ok, code: ok ? 'OK' : 'INSPECTION_FAILED' }); }
    catch (error) { deps.logger.error('vehicle inspection failed', { error: String(error) }); send(player, { ok: false, code: 'INTERNAL_ERROR' }); }
  });

  mp.events.add(WorldEvents.vehicleReleaseImpound, async (player: PlayerMp, raw: string) => {
    const characterId = cid(player), id = vehicleId(raw); if (!characterId || !id) return send(player, { ok: false, code: 'INVALID_REQUEST' });
    try { const ok = await deps.vehicles.releaseImpound(characterId, id); send(player, { ok, code: ok ? 'OK' : 'RELEASE_REJECTED' }); }
    catch (error) { deps.logger.error('vehicle impound release failed', { error: String(error) }); send(player, { ok: false, code: 'INTERNAL_ERROR' }); }
  });
}
