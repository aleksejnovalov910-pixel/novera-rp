import { MedicalEvents,PoliceEvents,ProgressionEvents } from '@novera/shared';
import type { Logger } from '@novera/logging';
import type { OrganizationService } from '../modules/organizations/organization.service';
import type { PoliceService } from '../modules/police/police.service';
import type { MedicalService } from '../modules/medical/medical.service';
import type { ProgressionService } from '../modules/progression/progression.service';
import type { EventGuard } from '../services/event-guard';
import { getPlayerContext } from '../services/player-context';
interface D{organizations:OrganizationService;police:PoliceService;medical:MedicalService;progression:ProgressionService;guard:EventGuard;logger:Logger}
const send=(p:PlayerMp,e:string,d:unknown)=>p.call(e,[JSON.stringify(d)]);
export function registerRoleplayEvents(d:D):void{
 mp.events.add(PoliceEvents.state,async(p:PlayerMp,targetRaw?:string)=>{const c=getPlayerContext(p);if(!c)return;const m=await d.organizations.require(c.characterId,['police','government'],1);if(!m)return send(p,PoliceEvents.state,{ok:false,code:'FORBIDDEN'});try{const target=targetRaw?BigInt(targetRaw):c.characterId;send(p,PoliceEvents.state,{ok:true,wanted:await d.police.wanted(target)})}catch{send(p,PoliceEvents.state,{ok:false,code:'INVALID_TARGET'})}});
 mp.events.add(PoliceEvents.wantedSet,async(p:PlayerMp,targetRaw:string,levelRaw:number,reason:string)=>{const c=getPlayerContext(p);if(!c||!d.guard.allow(p,'wanted.set',3,3000))return;const m=await d.organizations.require(c.characterId,['police'],2);if(!m)return send(p,PoliceEvents.state,{ok:false,code:'FORBIDDEN'});try{const id=await d.police.setWanted(BigInt(targetRaw),c.characterId,Number(levelRaw),String(reason));send(p,PoliceEvents.state,{ok:id!=null,id:id?.toString()})}catch(e){d.logger.warn('wanted set rejected',{error:String(e)});send(p,PoliceEvents.state,{ok:false})}});
 mp.events.add(MedicalEvents.state,async(p:PlayerMp,targetRaw?:string)=>{const c=getPlayerContext(p);if(!c)return;try{const target=targetRaw?BigInt(targetRaw):c.characterId;send(p,MedicalEvents.state,{ok:true,injuries:await d.medical.injuries(target)})}catch{send(p,MedicalEvents.state,{ok:false})}});
 mp.events.add(MedicalEvents.treat,async(p:PlayerMp,injuryRaw:string)=>{const c=getPlayerContext(p);if(!c||!d.guard.allow(p,'medical.treat',3,2000))return;const m=await d.organizations.require(c.characterId,['ems'],1);if(!m)return send(p,MedicalEvents.state,{ok:false,code:'FORBIDDEN'});try{send(p,MedicalEvents.state,{ok:await d.medical.treat(BigInt(injuryRaw))})}catch{send(p,MedicalEvents.state,{ok:false})}});
 mp.events.add(ProgressionEvents.state,async(p:PlayerMp)=>{const c=getPlayerContext(p);if(c)send(p,ProgressionEvents.state,{ok:true,...await d.progression.state(c.characterId)})});
 mp.events.add(ProgressionEvents.questStart,async(p:PlayerMp,key:string)=>{const c=getPlayerContext(p);if(!c||!d.guard.allow(p,'quest.start',3,2000))return;send(p,ProgressionEvents.state,{ok:await d.progression.startQuest(c.characterId,String(key))})});
}
