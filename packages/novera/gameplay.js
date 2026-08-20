'use strict';

// Minimal end-to-end gameplay loop for NOVERA's playable baseline.
const profiles = new Map();

function key(p) { return p && p.id != null ? String(p.id) : String(p && p.name || 'unknown'); }
function profile(p) {
  const k = key(p);
  if (!profiles.has(k)) profiles.set(k, { cash: 5000, bank: 15000, job: null, jobRuns: 0 });
  return profiles.get(k);
}
function notify(p, text) {
  try { if (p && p.outputChatBox) p.outputChatBox('!{#7777ff}[NOVERA] !{#ffffff}' + text); } catch (_) {}
}

if (typeof mp !== 'undefined' && mp.events) {
  mp.events.add('playerJoin', function (p) {
    const d = profile(p);
    notify(p, 'Добро пожаловать. После выбора персонажа начните с обучения или первой работы.');
    try {
      p.setVariable('novera:cash', d.cash);
      p.setVariable('novera:bank', d.bank);
      p.setVariable('novera:job', d.job || 'Безработный');
    } catch (_) {}
  });

  mp.events.add('novera:job:start', function (p, requestedJob) {
    const d = profile(p);
    const allowed = ['courier', 'taxi', 'loader'];
    d.job = allowed.indexOf(String(requestedJob)) >= 0 ? String(requestedJob) : 'courier';
    try { p.setVariable('novera:job', d.job); } catch (_) {}
    notify(p, 'Работа начата: ' + d.job + '. Выполняйте маршрут и получайте оплату.');
  });

  mp.events.add('novera:job:complete', function (p) {
    const d = profile(p);
    if (!d.job) return notify(p, 'Сначала выберите работу.');
    const reward = 750;
    d.cash += reward;
    d.jobRuns += 1;
    try { p.setVariable('novera:cash', d.cash); } catch (_) {}
    notify(p, 'Задание выполнено. +$' + reward + '. Баланс: $' + d.cash);
  });

  mp.events.add('novera:bank:deposit', function (p, rawAmount) {
    const d = profile(p); const amount = Math.floor(Number(rawAmount));
    if (!Number.isFinite(amount) || amount <= 0 || amount > d.cash) return;
    d.cash -= amount; d.bank += amount;
    try { p.setVariable('novera:cash', d.cash); p.setVariable('novera:bank', d.bank); } catch (_) {}
  });

  mp.events.add('novera:bank:withdraw', function (p, rawAmount) {
    const d = profile(p); const amount = Math.floor(Number(rawAmount));
    if (!Number.isFinite(amount) || amount <= 0 || amount > d.bank) return;
    d.bank -= amount; d.cash += amount;
    try { p.setVariable('novera:cash', d.cash); p.setVariable('novera:bank', d.bank); } catch (_) {}
  });
}

console.log('[NOVERA] gameplay baseline loaded');
