'use strict';

const homes=new Map();
function k(p){return p&&p.id!=null?String(p.id):String(p&&p.name||'unknown');}
function tell(p,t){try{p.outputChatBox('!{#7777ff}[NOVERA] !{#ffffff}'+t);}catch(_){}}
if(typeof mp!=='undefined'&&mp.events){
 mp.events.add('novera:property:starter',function(p){if(homes.has(k(p)))return tell(p,'У вас уже есть жильё.'); homes.set(k(p),{key:'starter-apartment',locked:true}); tell(p,'Тестовая квартира закреплена за персонажем.');});
 mp.events.add('novera:property:enter',function(p){if(!homes.has(k(p)))return tell(p,'Сначала получите или купите жильё.'); try{p.dimension=10000+Number(p.id||0);p.position=new mp.Vector3(266.0,-1007.0,-101.0);}catch(_){} });
 mp.events.add('novera:property:exit',function(p){try{p.dimension=0;p.position=new mp.Vector3(215.76,-810.12,30.73);}catch(_){} });
}
console.log('[NOVERA] property baseline loaded');
