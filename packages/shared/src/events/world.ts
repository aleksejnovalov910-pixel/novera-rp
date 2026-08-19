export const WorldEvents = {
  request: 'novera:world:request',
  result: 'novera:world:result',
  jobStart: 'novera:jobs:start',
  jobFinish: 'novera:jobs:finish',
  vehicleSpawn: 'novera:vehicles:spawn',
  vehicleStore: 'novera:vehicles:store',
  vehicleInfo: 'novera:vehicles:info',
  vehicleShareKey: 'novera:vehicles:key:share',
  vehicleRevokeKey: 'novera:vehicles:key:revoke',
  vehicleService: 'novera:vehicles:service',
  vehicleInsure: 'novera:vehicles:insure',
  vehicleInspect: 'novera:vehicles:inspect',
  vehicleReleaseImpound: 'novera:vehicles:impound:release',
  propertyBuy: 'novera:properties:buy',
  propertyEnter: 'novera:properties:enter',
  familyCreate: 'novera:families:create',
  marketCreate: 'novera:market:create',
  marketBuy: 'novera:market:buy',
  adminAudit: 'novera:admin:audit'
} as const;

export type JobKey = 'taxi' | 'courier' | 'trucker' | 'mechanic' | 'tow' | 'builder' | 'electrician' | 'garbage';
export type VehicleServiceType = 'repair' | 'oil' | 'battery' | 'tires';
export interface JobProgressView { jobKey: JobKey; level: number; experience: number; completedTasks: number; }
export interface FamilyView { id: string; name: string; rank: number; level: number; treasury: number; }
export interface FactionView { id: string; key: string; name: string; rank: number; type: string; }
export interface WorldState { jobs: JobProgressView[]; family: FamilyView | null; faction: FactionView | null; }
