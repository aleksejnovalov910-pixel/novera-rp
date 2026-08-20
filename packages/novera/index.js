'use strict';

console.log('[NOVERA] core loading...');

// Playable baseline comes first. Individual production modules can replace
// these fallbacks without changing the package entry point.
try {
  require('./playable-baseline.js');
} catch (e) {
  console.log('[NOVERA] baseline load error:', e && e.stack ? e.stack : e);
}

console.log('[NOVERA] core loaded');
