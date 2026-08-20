'use strict';

// NOVERA RP playable-baseline bootstrap.
// This module intentionally provides safe runtime fallbacks while the deeper systems are expanded.

const state = new Map();

function ensurePlayer(player) {
  if (!player) return null;
  const key = player.id != null ? String(player.id) : String(player.name || 'unknown');
  if (!state.has(key)) {
    state.set(key, {
      cash: 5000,
      bank: 15000,
      level: 1,
      xp: 0,
      inventory: [],
      tutorial: false,
      spawned: false
    });
  }
  return state.get(key);
}

function safeCall(fn) {
  try { fn(); } catch (e) { console.log('[NOVERA][baseline]', e && e.message ? e.message : e); }
}

if (typeof mp !== 'undefined' && mp.events) {
  mp.events.add('playerJoin', function (player) {
    const data = ensurePlayer(player);
    safeCall(function () {
      if (player && player.setVariable) {
        player.setVariable('novera:level', data.level);
        player.setVariable('novera:cash', data.cash);
        player.setVariable('novera:bank', data.bank);
      }
    });
  });

  mp.events.add('novera:baseline:spawn', function (player) {
    const data = ensurePlayer(player);
    if (!data) return;
    data.spawned = true;
    safeCall(function () {
      // Legion Square fallback spawn. Existing character/spawn systems may override this.
      player.position = new mp.Vector3(215.76, -810.12, 30.73);
      player.dimension = 0;
      if (player.health <= 0) player.health = 100;
    });
  });

  mp.events.add('novera:baseline:tutorialComplete', function (player) {
    const data = ensurePlayer(player);
    if (data) data.tutorial = true;
  });

  mp.events.add('playerQuit', function (player) {
    // Persistence adapter will replace this in the DB-backed milestone.
    // Keep state during process lifetime to avoid crashes in the baseline.
  });
}

console.log('[NOVERA] playable baseline bootstrap loaded');
