(() => {
  const $ = (id) => document.getElementById(id);
  const submit = $('authSubmit');
  const authCard = $('auth');
  if (!submit || !authCard) return;

  const meta = document.querySelector('.server-meta');
  if (meta) {
    Array.from(meta.querySelectorAll('span')).forEach((el) => {
      if ((el.textContent || '').includes('ALPHA')) el.textContent = 'ALPHA 0.15.3';
    });
  }

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
  const showNotice = (text) => {
    const status = $('status');
    if (!status || !text) return;
    status.textContent = text;
    status.classList.add('show');
    window.clearTimeout(showNotice.timer);
    showNotice.timer = window.setTimeout(() => status.classList.remove('show'), 3200);
  };
  const showCharacters = () => {
    $('authScene')?.classList.add('hidden');
    authCard.classList.add('hidden');
    $('slots')?.classList.remove('hidden');
    $('creator')?.classList.add('hidden');
    $('gameplay')?.classList.add('hidden');
    $('brand')?.classList.remove('hidden');
  };

  // Internal bridge acknowledgement is intentionally invisible to players.
  window.noveraAuthBridgeAck = () => {};

  const originalAuthResult = window.noveraAuthResult;
  window.noveraAuthResult = (raw) => {
    finishPending();
    let result;
    try {
      result = JSON.parse(raw);
      if (result.ok) {
        setMessage('');
        showNotice(result.message || 'Готово.');
      } else {
        setMessage(result.message || 'Не удалось выполнить запрос.', 'error');
      }
    } catch {
      setMessage('Не удалось обработать ответ сервера. Повтори попытку.', 'error');
      return;
    }

    if (typeof originalAuthResult === 'function') {
      try { originalAuthResult(raw); } catch {}
    }

    // Some legacy RAGE:MP CEF builds occasionally fail to repaint the screen
    // after the original handler toggles classes. Force the authenticated view.
    if (result.ok) {
      showCharacters();
      window.setTimeout(showCharacters, 50);
      window.setTimeout(showCharacters, 250);
    }
  };

  const originalCharacters = window.noveraCharacters;
  if (typeof originalCharacters === 'function') {
    window.noveraCharacters = (raw) => {
      showCharacters();
      originalCharacters(raw);
      window.setTimeout(showCharacters, 50);
    };
  }

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
