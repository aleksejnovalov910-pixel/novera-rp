import { AdminEvents,BusinessEvents,GovernmentEvents,PhoneEvents } from '@novera/shared';
import type { Logger } from '@novera/logging';
import type { PhoneService } from '../modules/phone/phone.service';
import type { BusinessService } from '../modules/business/business.service';
import type { GovernmentService } from '../modules/government/government.service';
import type { AdminService } from '../modules/admin/admin.service';
import { getPlayerContext } from '../services/player-context';
import type { EventGuard } from '../services/event-guard';

interface Deps{phone:PhoneService;business:BusinessService;government:GovernmentService;admin:AdminService;guard:EventGuard;logger:Logger}
const send=(p:PlayerMp,event:string,data:unknown)=>p.call(event,[JSON.stringify(data)]);
export function registerExtendedEvents(d:Deps):void{
  mp.events.add(PhoneEvents.state,async(p:PlayerMp)=>{const c=getPlayerContext(p);if(!c||!d.guard.allow(p,'phone.state',4,1000))return;send(p,PhoneEvents.state,{ok:true,contacts:await d.phone.contacts(c.characterId)})});
  mp.events.add(PhoneEvents.addContact,async(p:PlayerMp,targetRaw:string,alias:string)=>{const c=getPlayerContext(p);if(!c||!d.guard.allow(p,'phone.contact',5,2000))return;try{send(p,PhoneEvents.state,{ok:await d.phone.addContact(c.characterId,BigInt(targetRaw),String(alias))})}catch{send(p,PhoneEvents.state,{ok:false})}});
  mp.events.add(PhoneEvents.sendMessage,async(p:PlayerMp,targetRaw:string,body:string)=>{const c=getPlayerContext(p);if(!c||!d.guard.allow(p,'phone.message',4,2000))return;try{const id=await d.phone.send(c.characterId,BigInt(targetRaw),String(body));send(p,PhoneEvents.state,{ok:id!=null,messageId:id?.toString()})}catch{send(p,PhoneEvents.state,{ok:false})}});
  mp.events.add(BusinessEvents.state,async(p:PlayerMp)=>{const c=getPlayerContext(p);if(!c)return;send(p,BusinessEvents.state,{ok:true,businesses:await d.business.list(c.characterId)})});
  const funds=(direction:'deposit'|'withdraw')=>async(p:PlayerMp,idRaw:string,amountRaw:number)=>{const c=getPlayerContext(p);if(!c||!d.guard.allow(p,`business.${direction}`,3,2000))return;try{const ok=await d.business.moveFunds(c.characterId,BigInt(idRaw),Number(amountRaw),direction);send(p,BusinessEvents.state,{ok})}catch(e){d.logger.error('business funds failed',{error:String(e)});send(p,BusinessEvents.state,{ok:false})}};
  mp.events.add(BusinessEvents.deposit,funds('deposit'));mp.events.add(BusinessEvents.withdraw,funds('withdraw'));
  mp.events.add(GovernmentEvents.state,async(p:PlayerMp)=>{const c=getPlayerContext(p);if(!c)return;send(p,GovernmentEvents.state,{ok:true,fines:await d.government.fines(c.characterId)})});
  mp.events.add(GovernmentEvents.finePay,async(p:PlayerMp,idRaw:string)=>{const c=getPlayerContext(p);if(!c||!d.guard.allow(p,'fine.pay',2,2000))return;try{send(p,GovernmentEvents.state,{ok:await d.government.payFine(c.characterId,BigInt(idRaw))})}catch{send(p,GovernmentEvents.state,{ok:false})}});
  mp.events.add(AdminEvents.reportCreate,async(p:PlayerMp,subject:string,message:string)=>{const c=getPlayerContext(p);if(!c||!d.guard.allow(p,'report',1,10000))return;const id=await d.admin.createReport(c.characterId,String(subject),String(message));send(p,AdminEvents.reportState,{ok:id!=null,id:id?.toString()})});
  mp.events.add('playerQuit',(p:PlayerMp)=>d.guard.clear(p));
}
