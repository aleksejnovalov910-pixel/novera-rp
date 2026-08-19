(() => {
  const $ = (id) => document.getElementById(id);
  const submit = $('authSubmit');
  const authCard = $('auth');
  if (!submit || !authCard) return;

  const meta = document.querySelector('.server-meta');
  if (meta) {
    Array.from(meta.querySelectorAll('span')).forEach((el) => {
      if ((el.textContent || '').includes('ALPHA')) el.textContent = 'ALPHA 0.15.4';
    });
  }

  const message = document.createElement('div');
  message.id = 'authDebug';
  message.className = 'auth-debug';
  authCard.appendChild(message);

  let pending = false;
  let timeout = 0;
  let authGranted = false;

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

  const showAuth = () => {
    $('authScene')?.classList.remove('hidden');
    authCard.classList.remove('hidden');
    $('slots')?.classList.add('hidden');
    $('creator')?.classList.add('hidden');
    $('gameplay')?.classList.add('hidden');
    $('brand')?.classList.add('hidden');
    document.documentElement.classList.remove('character-selection-active');
    document.body.classList.remove('character-selection-active');
  };

  const showCharacters = () => {
    if (!authGranted) {
      showAuth();
      return false;
    }
    $('authScene')?.classList.add('hidden');
    authCard.classList.add('hidden');
    const slots = $('slots');
    if (slots) slots.classList.remove('hidden');
    $('creator')?.classList.add('hidden');
    $('gameplay')?.classList.add('hidden');
    $('brand')?.classList.add('hidden');
    document.documentElement.classList.add('character-selection-active');
    document.body.classList.add('character-selection-active');
    return true;
  };

  const leaveCharacters = () => {
    document.documentElement.classList.remove('character-selection-active');
    document.body.classList.remove('character-selection-active');
  };

  // Always start in AUTH LOCK. A character list is ignored until the server
  // has explicitly returned a successful auth result in this browser session.
  showAuth();

  window.noveraAuthBridgeAck = () => {};

  const originalAuthResult = window.noveraAuthResult;
  window.noveraAuthResult = (raw) => {
    finishPending();
    let result;
    try {
      result = JSON.parse(raw);
      if (result.ok) {
        authGranted = true;
        setMessage('');
        showNotice(result.message || 'Готово.');
      } else {
        authGranted = false;
        showAuth();
        setMessage(result.message || 'Не удалось выполнить запрос.', 'error');
      }
    } catch {
      authGranted = false;
      showAuth();
      setMessage('Не удалось обработать ответ сервера. Повтори попытку.', 'error');
      return;
    }

    if (typeof originalAuthResult === 'function') {
      try { originalAuthResult(raw); } catch {}
    }

    // Do NOT open character selection here. Wait for AuthEvents.characters.
    if (!result.ok) showAuth();
  };

  const originalCharacters = window.noveraCharacters;
  window.noveraCharacters = (raw) => {
    if (!authGranted) {
      showAuth();
      return;
    }
    if (typeof originalCharacters === 'function') {
      try { originalCharacters(raw); } catch {}
    }
    showCharacters();
    window.setTimeout(showCharacters, 50);
    window.setTimeout(showCharacters, 180);
  };

  const originalOpenCreator = window.noveraOpenCreator;
  if (typeof originalOpenCreator === 'function') {
    window.noveraOpenCreator = (slot) => {
      if (!authGranted) {
        showAuth();
        return;
      }
      leaveCharacters();
      originalOpenCreator(slot);
    };
  }

  const originalSelected = window.noveraCharacterSelected;
  if (typeof originalSelected === 'function') {
    window.noveraCharacterSelected = (...args) => {
      if (!authGranted) {
        showAuth();
        return;
      }
      leaveCharacters();
      originalSelected(...args);
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

    authGranted = false;
    showAuth();
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
      authGranted = false;
      showAuth();
      setMessage('Сервер временно не отвечает. Повтори попытку.', 'error');
    }, 10000);
  };

  window.setTimeout(() => {
    showAuth();
    try { window.mp?.trigger?.('novera:cef:ready'); } catch {}
  }, 50);
})();
