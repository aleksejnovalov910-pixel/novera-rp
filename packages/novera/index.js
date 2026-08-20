'use strict';
console.log('[NOVERA] core loading...');
function load(path){try{require(path);}catch(e){console.log('[NOVERA] module error '+path+':',e&&e.stack?e.stack:e);}}
load('./playable-baseline.js');
load('./gameplay.js');
load('./inventory.js');
load('./vehicles.js');
load('./properties.js');
load('./organizations.js');
load('./market.js');
load('./tutorial.js');
load('./admin.js');
load('./commands.js');
load('./healthcheck.js');
console.log('[NOVERA] core loaded');
