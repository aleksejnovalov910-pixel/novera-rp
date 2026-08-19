(() => {
  const $ = (id) => document.getElementById(id);
  const submit = $('authSubmit');
  const authCard = $('auth');
  if (!submit || !authCard) return;

  const message = document.createElement('div');
  message.id = 'authDebug';
  message.className = 'auth-debug';
  authCard.appendChild(message);

  let pending = false;
  let timeout = 0;
  const setMessage = (text, type = '') => {
    message.textContent = text || '';
    message.className = `auth-debug ${type}`.trim();
  };
  const finishPending = () => {
    pending = false;
    window.clearTimeout(timeout);
    authCard.classList.remove('auth-busy');
    submit.disabled = false;
    submit.textContent = $('tabRegister')?.classList.contains('active') ? 'Начать историю' : 'Войти в NOVERA';
  };

  // Internal bridge acknowledgement is intentionally invisible to players.
  window.noveraAuthBridgeAck = () => {};

  const originalAuthResult = window.noveraAuthResult;
  window.noveraAuthResult = (raw) => {
    finishPending();
    try {
      const result = JSON.parse(raw);
      setMessage(result.ok ? '' : (result.message || 'Не удалось выполнить запрос.'), result.ok ? 'ok' : 'error');
    } catch {
      setMessage('Не удалось обработать ответ сервера. Повтори попытку.', 'error');
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
      setMessage('Логин: 3–32 символа, латиница, цифры, ., _, -.', 'error');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setMessage('Пароль должен содержать минимум 8 символов.', 'error');
      return;
    }
    if (registering && confirm !== password) {
      setMessage('Пароли не совпадают.', 'error');
      return;
    }

    pending = true;
    authCard.classList.add('auth-busy');
    submit.disabled = true;
    submit.textContent = registering ? 'Создаём аккаунт…' : 'Входим…';
    setMessage('');

    try {
      if (!window.mp || typeof window.mp.trigger !== 'function') throw new Error('bridge unavailable');
      window.mp.trigger(registering ? 'novera:cef:register' : 'novera:cef:login', login, password);
    } catch {
      finishPending();
      setMessage('Не удалось отправить запрос. Повтори попытку.', 'error');
      return;
    }

    timeout = window.setTimeout(() => {
      if (!pending) return;
      finishPending();
      setMessage('Сервер временно не отвечает. Повтори попытку.', 'error');
    }, 10000);
  };

  window.setTimeout(() => {
    try { window.mp?.trigger?.('novera:cef:ready'); } catch {}
  }, 50);
})();
