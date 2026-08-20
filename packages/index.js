'use strict';

// NOVERA RP server package entry point.
// Keep startup resilient: a secondary system must not prevent players from connecting.
function load(path, label) {
  try {
    require(path);
    console.log('[NOVERA] loaded:', label || path);
  } catch (e) {
    console.log('[NOVERA] optional module failed:', label || path, e && e.message ? e.message : e);
  }
}

load('./novera/index.js', 'novera-core');
