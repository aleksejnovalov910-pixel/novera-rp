import { WorldEvents } from '@novera/shared';
import type { Logger } from '@novera/logging';
import type { JobService } from '../modules/jobs/job.service';
import type { VehicleService } from '../modules/vehicles/vehicle.service';
import type { PropertyService } from '../modules/properties/property.service';
import type { SocialService } from '../modules/social/social.service';
import type { MarketService } from '../modules/market/market.service';

interface Deps { jobs: JobService; vehicles: VehicleService; properties: PropertyService; social: SocialService; market: MarketService; logger: Logger; }
function cid(player: PlayerMp): bigint | null { const raw = player.getVariable('characterId'); if (!raw) return null; try { return BigInt(String(raw)); } catch { return null; } }
function result(player: PlayerMp, payload: unknown): void { player.call(WorldEvents.result, [JSON.stringify(payload)]); }

export function registerWorldEvents(deps: Deps): void {
  mp.events.add(WorldEvents.request, async (player: PlayerMp) => {
    const id = cid(player); if (!id) return result(player, { ok: false, code: 'NO_CHARACTER' });
    try { result(player, { ok: true, jobs: await deps.jobs.list(id), family: await deps.social.family(id), faction: await deps.social.faction(id) }); }
    catch (error) { deps.logger.error('world request failed', { error: String(error) }); result(player, { ok: false, code: 'INTERNAL_ERROR' }); }
  });

  mp.events.add(WorldEvents.jobFinish, async (player: PlayerMp, jobKeyRaw: string, tokenRaw: string) => {
    const id = cid(player); if (!id) return result(player, { ok: false, code: 'NO_CHARACTER' });
    const jobKey = String(jobKeyRaw); if (!deps.jobs.isJobKey(jobKey)) return result(player, { ok: false, code: 'INVALID_JOB' });
    const token = String(tokenRaw); const expected = String(player.getVariable('activeJobToken') ?? '');
    if (!expected || token !== expected || String(player.getVariable('activeJobKey') ?? '') !== jobKey) return result(player, { ok: false, code: 'INVALID_JOB_SESSION' });
    try { const reward = await deps.jobs.reward(id, jobKey, 750, 125); player.setVariable('activeJobToken', null); player.setVariable('activeJobKey', null); result(player, { ok: true, code: 'OK', reward }); }
    catch (error) { deps.logger.error('job reward failed', { characterId: id.toString(), jobKey, error: String(error) }); result(player, { ok: false, code: 'INTERNAL_ERROR' }); }
  });

  mp.events.add(WorldEvents.jobStart, (player: PlayerMp, jobKeyRaw: string) => {
    const id = cid(player); if (!id) return result(player, { ok: false, code: 'NO_CHARACTER' });
    const jobKey = String(jobKeyRaw); if (!deps.jobs.isJobKey(jobKey)) return result(player, { ok: false, code: 'INVALID_JOB' });
    const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${player.id}`;
    player.setVariable('activeJobKey', jobKey); player.setVariable('activeJobToken', token); result(player, { ok: true, code: 'OK', jobKey, token });
  });

  mp.events.add(WorldEvents.vehicleSpawn, async (player: PlayerMp, vehicleIdRaw: string) => {
    const id = cid(player); if (!id) return result(player, { ok: false, code: 'NO_CHARACTER' });
    try {
      const vehicleId = BigInt(vehicleIdRaw); const owned = await deps.vehicles.getOwned(id, vehicleId);
      if (!owned || !owned.stored) return result(player, { ok: false, code: 'NOT_AVAILABLE' });
      const p = player.position; const vehicle = mp.vehicles.new(mp.joaat(owned.model), new mp.Vector3(p.x + 3, p.y, p.z), { heading: player.heading, numberPlate: owned.plate, dimension: player.dimension });
      vehicle.setVariable('dbVehicleId', owned.id.toString()); vehicle.setVariable('ownerCharacterId', id.toString());
      await deps.vehicles.setStored(id, vehicleId, false, { x: p.x + 3, y: p.y, z: p.z, heading: player.heading });
      result(player, { ok: true, code: 'OK', vehicleId: owned.id.toString(), entityId: vehicle.id });
    } catch (error) { deps.logger.warn('vehicle spawn rejected', { error: String(error) }); result(player, { ok: false, code: 'INVALID_VEHICLE' }); }
  });

  mp.events.add(WorldEvents.propertyBuy, async (player: PlayerMp, propertyIdRaw: string) => {
    const id = cid(player); if (!id) return result(player, { ok: false, code: 'NO_CHARACTER' });
    try { const ok = await deps.properties.buy(id, BigInt(propertyIdRaw)); result(player, { ok, code: ok ? 'OK' : 'REJECTED' }); }
    catch (error) { deps.logger.error('property buy failed', { error: String(error) }); result(player, { ok: false, code: 'INTERNAL_ERROR' }); }
  });

  mp.events.add(WorldEvents.propertyEnter, async (player: PlayerMp, propertyIdRaw: string) => {
    const id = cid(player); if (!id) return result(player, { ok: false, code: 'NO_CHARACTER' });
    try { const interior = await deps.properties.interior(id, BigInt(propertyIdRaw)); if (!interior) return result(player, { ok: false, code: 'LOCKED' }); player.position = new mp.Vector3(interior.x, interior.y, interior.z); player.dimension = interior.dimension; result(player, { ok: true, code: 'OK' }); }
    catch { result(player, { ok: false, code: 'INVALID_PROPERTY' }); }
  });

  mp.events.add(WorldEvents.familyCreate, async (player: PlayerMp, name: string) => {
    const id = cid(player); if (!id) return result(player, { ok: false, code: 'NO_CHARACTER' });
    try { const familyId = await deps.social.createFamily(id, String(name)); result(player, { ok: familyId != null, code: familyId ? 'OK' : 'REJECTED', familyId: familyId?.toString() }); }
    catch (error) { deps.logger.error('family create failed', { error: String(error) }); result(player, { ok: false, code: 'INTERNAL_ERROR' }); }
  });

  mp.events.add(WorldEvents.marketBuy, async (player: PlayerMp, listingIdRaw: string) => {
    const id = cid(player); if (!id) return result(player, { ok: false, code: 'NO_CHARACTER' });
    try { const ok = await deps.market.buy(id, BigInt(listingIdRaw)); result(player, { ok, code: ok ? 'OK' : 'REJECTED' }); }
    catch (error) { deps.logger.error('market buy failed', { error: String(error) }); result(player, { ok: false, code: 'INTERNAL_ERROR' }); }
  });
}
