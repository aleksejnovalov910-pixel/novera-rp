export const WorldEvents = {
  request: 'novera:world:request',
  result: 'novera:world:result',
  jobStart: 'novera:jobs:start',
  jobFinish: 'novera:jobs:finish',
  vehicleSpawn: 'novera:vehicles:spawn',
  vehicleStore: 'novera:vehicles:store',
  propertyBuy: 'novera:properties:buy',
  propertyEnter: 'novera:properties:enter',
  familyCreate: 'novera:families:create',
  marketCreate: 'novera:market:create',
  marketBuy: 'novera:market:buy',
  adminAudit: 'novera:admin:audit'
} as const;

export type JobKey = 'taxi' | 'courier' | 'trucker' | 'mechanic' | 'tow' | 'builder' | 'electrician' | 'garbage';

export interface JobProgressView { jobKey: JobKey; level: number; experience: number; completedTasks: number; }
export interface FamilyView { id: string; name: string; rank: number; level: number; treasury: number; }
export interface FactionView { id: string; key: string; name: string; rank: number; type: string; }
export interface WorldState { jobs: JobProgressView[]; family: FamilyView | null; faction: FactionView | null; }
