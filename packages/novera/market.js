'use strict';
const listings=[];
function tell(p,t){try{p.outputChatBox('!{#7777ff}[V-Market] !{#ffffff}'+t);}catch(_){}}
if(typeof mp!=='undefined'&&mp.events){
 mp.events.addCommand('vmarket',function(p){if(!listings.length)return tell(p,'Объявлений пока нет.');tell(p,'Активных объявлений: '+listings.length);});
 mp.events.add('novera:market:list',function(p,type,refId,rawPrice){const price=Math.floor(Number(rawPrice));if(!Number.isFinite(price)||price<=0)return;listings.push({seller:p&&p.name||'unknown',type:String(type||'item'),refId:String(refId||''),price:price});tell(p,'Объявление размещено за $'+price);});
}
console.log('[NOVERA] V-Market baseline loaded');
