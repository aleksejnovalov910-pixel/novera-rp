export const GameplayEvents = {
  bootstrap: 'novera:gameplay:bootstrap',
  state: 'novera:gameplay:state',
  inventoryMove: 'novera:inventory:move',
  inventorySplit: 'novera:inventory:split',
  inventoryUse: 'novera:inventory:use',
  walletTransfer: 'novera:economy:transfer',
  bankDeposit: 'novera:bank:deposit',
  bankWithdraw: 'novera:bank:withdraw',
  bankTransfer: 'novera:bank:transfer',
  vehicleSpawn: 'novera:vehicle:spawn',
  vehicleStore: 'novera:vehicle:store',
  propertyEnter: 'novera:property:enter',
  propertyExit: 'novera:property:exit',
  jobStart: 'novera:job:start',
  jobStop: 'novera:job:stop',
  familyCreate: 'novera:family:create',
  marketList: 'novera:market:list',
  marketBuy: 'novera:market:buy'
} as const;

export interface MoneyState { cash: number; bank: number; bankAccount?: string; }
export interface InventoryItemView { id: string; itemKey: string; amount: number; slot: number; durability: number | null; metadata: Record<string, unknown>; }
export interface VehicleView {
  id: string; model: string; plate: string; vin?: string; fuel: number; mileage: number; stored: boolean;
  insuranceStatus?: 'none' | 'basic' | 'full'; insuranceExpiresAt?: string | null; engineHealth?: number; oilLevel?: number;
  batteryLevel?: number; tireHealth?: number; inspectionExpiresAt?: string | null; impounded?: boolean; impoundFee?: number;
}
export interface PropertyView { id: string; type: 'apartment' | 'house' | 'garage' | 'warehouse' | 'business'; name: string; owned: boolean; }
export interface GameplayBootstrap { characterId: string; money: MoneyState; inventory: InventoryItemView[]; vehicles: VehicleView[]; properties: PropertyView[]; }
export interface InventoryUseResult { itemKey: string; consumed: boolean; remaining: number; effect: 'phone' | 'identity' | 'hydrate' | 'feed' | 'heal_minor' | 'repair_vehicle' | 'none'; }
export interface GameplayResult { ok: boolean; code: string; message: string; payload?: unknown; }
