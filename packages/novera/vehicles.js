'use strict';

const owned = new Map();
function key(p){ return p && p.id != null ? String(p.id) : String(p && p.name || 'unknown'); }
function list(p){ const k=key(p); if(!owned.has(k)) owned.set(k,[]); return owned.get(k); }
function tell(p,t){ try{p.outputChatBox('!{#7777ff}[NOVERA] !{#ffffff}'+t);}catch(_){} }

if(typeof mp!=='undefined' && mp.events){
  mp.events.add('novera:vehicle:starter', function(p){
    const cars=list(p); if(cars.length) return tell(p,'Стартовый транспорт уже получен.');
    cars.push({model:'blista',plate:'NOV'+String(Math.floor(Math.random()*9000)+1000),fuel:100});
    tell(p,'Стартовый транспорт добавлен в гараж.');
  });
  mp.events.add('novera:vehicle:garage', function(p){
    const cars=list(p); if(!cars.length) return tell(p,'Гараж пуст.');
    const car=cars[0];
    try{
      const pos=p.position; const v=mp.vehicles.new(mp.joaat(car.model),new mp.Vector3(pos.x+3,pos.y,pos.z),{heading:Number(p.heading||0),numberPlate:car.plate});
      v.setVariable('novera:owner',key(p));
      tell(p,'Транспорт выдан из гаража: '+car.model+' ['+car.plate+']');
    }catch(e){ tell(p,'Не удалось выдать транспорт.'); }
  });
}
console.log('[NOVERA] vehicle baseline loaded');
