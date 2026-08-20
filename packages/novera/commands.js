'use strict';
if(typeof mp!=='undefined'&&mp.events){
 function msg(p,t){try{p.outputChatBox('!{#7777ff}[NOVERA] !{#ffffff}'+t);}catch(_){}}
 mp.events.addCommand('help',function(p){msg(p,'/spawn | /job courier | /work | /startercar | /garage | /starterhome | /home | /leavehome');msg(p,'/phone | /tablet | /settings');});
 mp.events.addCommand('spawn',function(p){mp.events.call('novera:baseline:spawn',p);});
 mp.events.addCommand('job',function(p,_full,job){mp.events.call('novera:job:start',p,job||'courier');});
 mp.events.addCommand('work',function(p){mp.events.call('novera:job:complete',p);});
 mp.events.addCommand('startercar',function(p){mp.events.call('novera:vehicle:starter',p);});
 mp.events.addCommand('garage',function(p){mp.events.call('novera:vehicle:garage',p);});
 mp.events.addCommand('starterhome',function(p){mp.events.call('novera:property:starter',p);});
 mp.events.addCommand('home',function(p){mp.events.call('novera:property:enter',p);});
 mp.events.addCommand('leavehome',function(p){mp.events.call('novera:property:exit',p);});
 mp.events.addCommand('phone',function(p){msg(p,'Телефон будет открыт через CEF-модуль.');});
 mp.events.addCommand('tablet',function(p){msg(p,'Планшет будет открыт через CEF-модуль.');});
 mp.events.addCommand('settings',function(p){msg(p,'Настройки клавиш будут открыты через CEF-модуль.');});
}
console.log('[NOVERA] baseline commands loaded');
