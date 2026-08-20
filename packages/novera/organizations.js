'use strict';
const memberships=new Map();
function k(p){return p&&p.id!=null?String(p.id):String(p&&p.name||'unknown');}
function tell(p,t){try{p.outputChatBox('!{#7777ff}[NOVERA] !{#ffffff}'+t);}catch(_){}}
if(typeof mp!=='undefined'&&mp.events){
 mp.events.add('novera:org:join',function(p,raw){const org=String(raw||'').toLowerCase();const allowed=['lspd','ems','government','news','family'];if(allowed.indexOf(org)<0)return tell(p,'Неизвестная организация.');memberships.set(k(p),org);try{p.setVariable('novera:org',org);}catch(_){}tell(p,'Организация: '+org);});
 mp.events.addCommand('org',function(p,_full,org){mp.events.call('novera:org:join',p,org||'family');});
}
console.log('[NOVERA] organizations baseline loaded');
