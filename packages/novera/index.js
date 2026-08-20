'use strict';

console.log('[NOVERA] core loading...');

function load(path) {
  try { require(path); }
  catch (e) { console.log('[NOVERA] module error ' + path + ':', e && e.stack ? e.stack : e); }
}

load('./playable-baseline.js');
load('./gameplay.js');
load('./commands.js');

console.log('[NOVERA] core loaded');
