'use strict';

// NOVERA playable baseline client helpers.
let phoneOpen=false, tabletOpen=false, settingsOpen=false;
function chat(t){try{mp.gui.chat.push('!{#7777ff}[NOVERA] !{#ffffff}'+t);}catch(_){}}
function toggle(name){
 if(name==='phone'){phoneOpen=!phoneOpen;chat(phoneOpen?'Телефон открыт':'Телефон закрыт');}
 if(name==='tablet'){tabletOpen=!tabletOpen;chat(tabletOpen?'Планшет открыт':'Планшет закрыт');}
 if(name==='settings'){settingsOpen=!settingsOpen;chat(settingsOpen?'Настройки открыты':'Настройки закрыты');}
}
if(typeof mp!=='undefined'&&mp.keys){
 // Arrow Up / Arrow Down / F2
 mp.keys.bind(0x26,true,function(){toggle('phone');});
 mp.keys.bind(0x28,true,function(){toggle('tablet');});
 mp.keys.bind(0x71,true,function(){toggle('settings');});
}
if(typeof mp!=='undefined'&&mp.events){
 mp.events.add('novera:ui:phone',function(){toggle('phone');});
 mp.events.add('novera:ui:tablet',function(){toggle('tablet');});
 mp.events.add('novera:ui:settings',function(){toggle('settings');});
}
chat('NOVERA client baseline загружен. ↑ телефон, ↓ планшет, F2 настройки.');
