'use strict';

const inventories = new Map();
function k(p){ return p && p.id != null ? String(p.id) : String(p && p.name || 'unknown'); }
function inv(p){ const id=k(p); if(!inventories.has(id)) inventories.set(id,[{key:'water',amount:2},{key:'sandwich',amount:2}]); return inventories.get(id); }
function sync(p){ try { p.setVariable('novera:inventory', JSON.stringify(inv(p))); } catch(_){} }

if(typeof mp!=='undefined' && mp.events){
  mp.events.add('playerJoin', function(p){ inv(p); sync(p); });
  mp.events.add('novera:inventory:request', function(p){ sync(p); });
  mp.events.add('novera:inventory:use', function(p, rawKey){
    const key=String(rawKey||''); const items=inv(p); const item=items.find(x=>x.key===key && x.amount>0); if(!item)return;
    item.amount--; if(item.amount<=0) items.splice(items.indexOf(item),1);
    try { if(key==='water') p.health=Math.min(100,Number(p.health||100)+5); } catch(_){}
    sync(p);
  });
}
console.log('[NOVERA] inventory baseline loaded');
