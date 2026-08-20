'use strict';
function tell(p,t){try{p.outputChatBox('!{#7777ff}[NOVERA] !{#ffffff}'+t);}catch(_){}}
if(typeof mp!=='undefined'&&mp.events){
 mp.events.addCommand('tutorial',function(p){tell(p,'Обучение: 1) осмотритесь 2) получите стартовый транспорт 3) выберите работу 4) выполните рейс 5) посетите жильё.');tell(p,'Команды: /startercar, /garage, /job courier, /work, /starterhome, /home.');});
}
console.log('[NOVERA] tutorial baseline loaded');
