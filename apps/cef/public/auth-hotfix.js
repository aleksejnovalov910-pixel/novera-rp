(() => {
  const $ = (id) => document.getElementById(id);
  const submit = $('authSubmit');
  const authCard = $('auth');
  if (!submit || !authCard) return;

  const debug = document.createElement('div');
  debug.id = 'authDebug';
  debug.className = 'auth-debug';
  authCard.appendChild(debug);

  let pending = false;
  let timeout = 0;
  const setDebug = (text, type = '') => {
    debug.textContent = text || '';
    debug.className = `auth-debug ${type}`.trim();
  };
  const finishPending = () => {
    pending = false;
    window.clearTimeout(timeout);
    authCard.classList.remove('auth-busy');
    submit.disabled = false;
    submit.textContent = $('tabRegister')?.classList.contains('active') ? 'Начать историю' : 'Войти в NOVERA';
  };

  const originalAuthResult = window.noveraAuthResult;
  window.noveraAuthResult = (raw) => {
    finishPending();
    try {
      const result = JSON.parse(raw);
      setDebug(result.message || (result.ok ? 'Готово.' : 'Ошибка.'), result.ok ? 'ok' : 'error');
    } catch {
      setDebug('Получен некорректный ответ сервера.', 'error');
    }
    if (typeof originalAuthResult === 'function') originalAuthResult(raw);
  };

  submit.onclick = () => {
    if (pending) return;
    const login = $('login')?.value.trim() || '';
    const password = $('password')?.value || '';
    const confirm = $('passwordConfirm')?.value || '';
    const registering = $('tabRegister')?.classList.contains('active');

    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(login)) {
      setDebug('Логин: 3–32 символа, латиница, цифры, ., _, -.', 'error');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setDebug('Пароль должен содержать минимум 8 символов.', 'error');
      return;
    }
    if (registering && confirm !== password) {
      setDebug('Пароли не совпадают.', 'error');
      return;
    }

    pending = true;
    authCard.classList.add('auth-busy');
    submit.disabled = true;
    submit.textContent = registering ? 'Создаём аккаунт…' : 'Входим…';
    setDebug('Отправляем данные на сервер…');

    try {
      if (!window.mp || typeof window.mp.trigger !== 'function') throw new Error('RAGE CEF bridge unavailable');
      window.mp.trigger(registering ? 'novera:cef:register' : 'novera:cef:login', login, password);
      setDebug('Запрос отправлен. Ожидаем ответ сервера…');
    } catch (error) {
      finishPending();
      setDebug(`CEF bridge error: ${String(error)}`, 'error');
      return;
    }

    timeout = window.setTimeout(() => {
      if (!pending) return;
      finishPending();
      setDebug('Сервер не ответил за 10 секунд. Проверь консоль GTA5HOST.', 'error');
    }, 10000);
  };

  // Tell the RAGE client that DOM and JS are ready. The client re-enables the cursor here,
  // which avoids playerReady/browser timing races seen on GTA5HOST.
  window.setTimeout(() => {
    try { window.mp?.trigger?.('novera:cef:ready'); } catch {}
  }, 50);
})();
