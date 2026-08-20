'use strict';
function load(path){try{require(path);}catch(e){try{mp.gui.chat.push('[NOVERA] client module error: '+path);}catch(_){}}}
// Existing auth/character UI may load from its own package. Playable helpers are independent.
load('./novera/playable.js');
