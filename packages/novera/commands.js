'use strict';

// Temporary player-facing commands so the baseline is testable before every CEF screen is finished.
if (typeof mp !== 'undefined' && mp.events) {
  function msg(p, t) { try { p.outputChatBox('!{#7777ff}[NOVERA] !{#ffffff}' + t); } catch (_) {} }

  mp.events.addCommand('help', function (p) {
    msg(p, '/spawn — появиться в городе | /job courier — начать работу | /work — завершить тестовый рейс');
    msg(p, '/phone — телефон | /tablet — планшет | /settings — настройки');
  });
  mp.events.addCommand('spawn', function (p) { mp.events.call('novera:baseline:spawn', p); });
  mp.events.addCommand('job', function (p, _full, job) { mp.events.call('novera:job:start', p, job || 'courier'); });
  mp.events.addCommand('work', function (p) { mp.events.call('novera:job:complete', p); });
  mp.events.addCommand('phone', function (p) { msg(p, 'Телефон: модуль подключается к UI-этапу playable baseline.'); });
  mp.events.addCommand('tablet', function (p) { msg(p, 'Планшет: модуль подключается к UI-этапу playable baseline.'); });
  mp.events.addCommand('settings', function (p) { msg(p, 'Настройки и переназначение клавиш: модуль подключается к UI-этапу playable baseline.'); });
}

console.log('[NOVERA] baseline commands loaded');
