import { WorldEvents, type PropertyAccessType } from '@novera/shared';
import type { Logger } from '@novera/logging';
import type { PropertyService } from '../modules/properties/property.service';

interface Deps { properties: PropertyService; logger: Logger; }
function cid(player: PlayerMp): bigint | null { const raw=player.getVariable('characterId'); if(!raw)return null; try{return BigInt(String(raw));}catch{return null;} }
function send(player: PlayerMp,payload:unknown):void{player.call(WorldEvents.result,[JSON.stringify(payload)]);}

export function registerPropertyEvents(deps:Deps):void{
  mp.events.add(WorldEvents.propertyInfo,async(player:PlayerMp,propertyIdRaw:string)=>{
    const id=cid(player); if(!id)return send(player,{ok:false,code:'NO_CHARACTER'});
    try{const info=await deps.properties.info(id,BigInt(propertyIdRaw));send(player,{ok:Boolean(info),code:info?'OK':'NOT_FOUND',property:info});}
    catch(error){deps.logger.warn('property info rejected',{error:String(error)});send(player,{ok:false,code:'INVALID_PROPERTY'});}
  });
  mp.events.add(WorldEvents.propertyShareAccess,async(player:PlayerMp,propertyIdRaw:string,targetRaw:string,typeRaw:string)=>{
    const id=cid(player); if(!id)return send(player,{ok:false,code:'NO_CHARACTER'});
    const type=String(typeRaw) as PropertyAccessType; if(!['resident','guest'].includes(type))return send(player,{ok:false,code:'INVALID_ACCESS'});
    try{const ok=await deps.properties.shareAccess(id,BigInt(propertyIdRaw),BigInt(targetRaw),type);send(player,{ok,code:ok?'OK':'REJECTED'});}
    catch(error){deps.logger.warn('property share rejected',{error:String(error)});send(player,{ok:false,code:'INVALID_REQUEST'});}
  });
  mp.events.add(WorldEvents.propertyRevokeAccess,async(player:PlayerMp,propertyIdRaw:string,targetRaw:string)=>{
    const id=cid(player); if(!id)return send(player,{ok:false,code:'NO_CHARACTER'});
    try{const ok=await deps.properties.revokeAccess(id,BigInt(propertyIdRaw),BigInt(targetRaw));send(player,{ok,code:ok?'OK':'REJECTED'});}
    catch(error){deps.logger.warn('property revoke rejected',{error:String(error)});send(player,{ok:false,code:'INVALID_REQUEST'});}
  });
  mp.events.add(WorldEvents.propertyRent,async(player:PlayerMp,propertyIdRaw:string)=>{
    const id=cid(player); if(!id)return send(player,{ok:false,code:'NO_CHARACTER'});
    try{const ok=await deps.properties.rent(id,BigInt(propertyIdRaw));send(player,{ok,code:ok?'OK':'REJECTED'});}
    catch(error){deps.logger.error('property rent failed',{error:String(error)});send(player,{ok:false,code:'INTERNAL_ERROR'});}
  });
  mp.events.add(WorldEvents.propertyContainers,async(player:PlayerMp,propertyIdRaw:string)=>{
    const id=cid(player); if(!id)return send(player,{ok:false,code:'NO_CHARACTER'});
    try{const containers=await deps.properties.listContainers(id,BigInt(propertyIdRaw));send(player,{ok:containers!==null,code:containers!==null?'OK':'NO_ACCESS',containers:containers??[]});}
    catch(error){deps.logger.warn('property containers rejected',{error:String(error)});send(player,{ok:false,code:'INVALID_PROPERTY'});}
  });
}
