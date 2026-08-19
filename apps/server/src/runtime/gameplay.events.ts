import { GameplayEvents, type GameplayResult } from '@novera/shared';
import type { Logger } from '@novera/logging';
import type { GameplayService } from '../modules/gameplay/gameplay.service';

interface Dependencies { gameplay: GameplayService; logger: Logger; }
function characterId(player: PlayerMp): bigint | null { const raw=player.getVariable('characterId'); if(!raw)return null; try{return BigInt(String(raw))}catch{return null} }
function send(player: PlayerMp,result:GameplayResult):void{player.call(GameplayEvents.state,[JSON.stringify(result)])}

export function registerGameplayEvents(deps: Dependencies): void {
  mp.events.add(GameplayEvents.bootstrap, async (player: PlayerMp) => {
    const id=characterId(player); if(!id)return send(player,{ok:false,code:'NO_CHARACTER',message:'Персонаж не выбран.'});
    try{send(player,{ok:true,code:'OK',message:'Состояние загружено.',payload:await deps.gameplay.bootstrap(id)})}catch(error){deps.logger.error('gameplay bootstrap failed',{characterId:id.toString(),error:String(error)});send(player,{ok:false,code:'INTERNAL_ERROR',message:'Не удалось загрузить состояние.'})}
  });

  mp.events.add(GameplayEvents.walletTransfer, async (player:PlayerMp,targetRaw:string,amountRaw:number)=>{
    const from=characterId(player);if(!from)return send(player,{ok:false,code:'NO_CHARACTER',message:'Персонаж не выбран.'});
    try{const target=BigInt(targetRaw),amount=Number(amountRaw),ok=await deps.gameplay.transferCash(from,target,amount);send(player,{ok,code:ok?'OK':'REJECTED',message:ok?'Перевод выполнен.':'Перевод отклонён.'});if(ok)deps.logger.info('cash transfer',{from:from.toString(),to:target.toString(),amount})}catch(error){deps.logger.warn('cash transfer rejected',{from:from.toString(),error:String(error)});send(player,{ok:false,code:'INVALID_TARGET',message:'Некорректный получатель.'})}
  });

  const bank=(direction:'deposit'|'withdraw')=>async(player:PlayerMp,amountRaw:number)=>{const id=characterId(player);if(!id)return send(player,{ok:false,code:'NO_CHARACTER',message:'Персонаж не выбран.'});try{const amount=Number(amountRaw),ok=await deps.gameplay.bankMove(id,amount,direction);send(player,{ok,code:ok?'OK':'REJECTED',message:ok?'Операция выполнена.':'Операция отклонена.'})}catch(error){deps.logger.error('bank move failed',{characterId:id.toString(),direction,error:String(error)});send(player,{ok:false,code:'INTERNAL_ERROR',message:'Банк временно недоступен.'})}};
  mp.events.add(GameplayEvents.bankDeposit,bank('deposit'));
  mp.events.add(GameplayEvents.bankWithdraw,bank('withdraw'));
  mp.events.add(GameplayEvents.bankTransfer,async(player:PlayerMp,accountRaw:string,amountRaw:number)=>{const id=characterId(player);if(!id)return send(player,{ok:false,code:'NO_CHARACTER',message:'Персонаж не выбран.'});try{const account=String(accountRaw).trim().toUpperCase(),amount=Number(amountRaw),ok=await deps.gameplay.bankTransfer(id,account,amount);send(player,{ok,code:ok?'OK':'REJECTED',message:ok?'Банковский перевод выполнен.':'Перевод отклонён.'});if(ok)deps.logger.info('bank transfer',{from:id.toString(),account,amount})}catch(error){deps.logger.error('bank transfer failed',{characterId:id.toString(),error:String(error)});send(player,{ok:false,code:'INTERNAL_ERROR',message:'Банк временно недоступен.'})}});

  mp.events.add(GameplayEvents.inventoryMove,async(player:PlayerMp,fromRaw:number,toRaw:number)=>{const id=characterId(player);if(!id)return send(player,{ok:false,code:'NO_CHARACTER',message:'Персонаж не выбран.'});try{const ok=await deps.gameplay.moveInventory(id,Number(fromRaw),Number(toRaw));send(player,{ok,code:ok?'OK':'REJECTED',message:ok?'Инвентарь обновлён.':'Нельзя переместить предмет.'})}catch(error){deps.logger.error('inventory move failed',{characterId:id.toString(),error:String(error)});send(player,{ok:false,code:'INTERNAL_ERROR',message:'Не удалось обновить инвентарь.'})}});
  mp.events.add(GameplayEvents.inventorySplit,async(player:PlayerMp,fromRaw:number,toRaw:number,amountRaw:number)=>{const id=characterId(player);if(!id)return send(player,{ok:false,code:'NO_CHARACTER',message:'Персонаж не выбран.'});try{const ok=await deps.gameplay.splitInventory(id,Number(fromRaw),Number(toRaw),Number(amountRaw));send(player,{ok,code:ok?'OK':'REJECTED',message:ok?'Стак разделён.':'Не удалось разделить предмет.'})}catch(error){deps.logger.error('inventory split failed',{characterId:id.toString(),error:String(error)});send(player,{ok:false,code:'INTERNAL_ERROR',message:'Не удалось разделить предмет.'})}});
  mp.events.add(GameplayEvents.inventoryUse,async(player:PlayerMp,slotRaw:number)=>{const id=characterId(player);if(!id)return send(player,{ok:false,code:'NO_CHARACTER',message:'Персонаж не выбран.'});try{const result=await deps.gameplay.useInventory(id,Number(slotRaw));send(player,{ok:Boolean(result),code:result?'OK':'REJECTED',message:result?'Предмет использован.':'Предмет нельзя использовать.',payload:result??undefined})}catch(error){deps.logger.error('inventory use failed',{characterId:id.toString(),error:String(error)});send(player,{ok:false,code:'INTERNAL_ERROR',message:'Не удалось использовать предмет.'})}});

  mp.events.add('playerQuit',async(player:PlayerMp)=>{const id=characterId(player);if(!id)return;try{const p=player.position;await deps.gameplay.savePosition(id,p.x,p.y,p.z,player.heading,player.dimension)}catch(error){deps.logger.error('position save on quit failed',{characterId:id.toString(),error:String(error)})}});
}
