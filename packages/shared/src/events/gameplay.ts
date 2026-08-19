export const GameplayEvents = {
  bootstrap: 'novera:gameplay:bootstrap',
  state: 'novera:gameplay:state',
  inventoryMove: 'novera:inventory:move',
  inventoryUse: 'novera:inventory:use',
  walletTransfer: 'novera:economy:transfer',
  bankDeposit: 'novera:bank:deposit',
  bankWithdraw: 'novera:bank:withdraw',
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

export interface MoneyState {
  cash: number;
  bank: number;
}

export interface InventoryItemView {
  id: string;
  itemKey: string;
  amount: number;
  slot: number;
  durability: number | null;
  metadata: Record<string, unknown>;
}

export interface VehicleView {
  id: string;
  model: string;
  plate: string;
  fuel: number;
  mileage: number;
  stored: boolean;
}

export interface PropertyView {
  id: string;
  type: 'apartment' | 'house' | 'garage' | 'warehouse' | 'business';
  name: string;
  owned: boolean;
}

export interface GameplayBootstrap {
  characterId: string;
  money: MoneyState;
  inventory: InventoryItemView[];
  vehicles: VehicleView[];
  properties: PropertyView[];
}

export interface GameplayResult {
  ok: boolean;
  code: string;
  message: string;
  payload?: unknown;
}
