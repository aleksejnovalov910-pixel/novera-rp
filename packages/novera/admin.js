'use strict';
function tell(p,t){try{p.outputChatBox('!{#ffb86c}[NOVERA ADMIN] !{#ffffff}'+t);}catch(_){}}
if(typeof mp!=='undefined'&&mp.events){
 mp.events.addCommand('serverstatus',function(p){tell(p,'NOVERA playable baseline активен. Online: '+(mp.players&&mp.players.length!=null?mp.players.length:'?'));});
 mp.events.add('playerDeath',function(p){console.log('[NOVERA][death]',p&&p.name||'unknown');});
 mp.events.add('playerQuit',function(p,exitType,reason){console.log('[NOVERA][quit]',p&&p.name||'unknown',exitType||'',reason||'');});
}
console.log('[NOVERA] admin/logging baseline loaded');
