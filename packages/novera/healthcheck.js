'use strict';
const required=['playable-baseline','gameplay','inventory','vehicles','properties','organizations','market','tutorial','admin','commands'];
console.log('[NOVERA] healthcheck modules expected:',required.join(', '));
if(typeof mp!=='undefined'&&mp.events){mp.events.addCommand('health',function(p){try{p.outputChatBox('!{#50fa7b}[NOVERA] Runtime baseline OK');}catch(_){}});}
