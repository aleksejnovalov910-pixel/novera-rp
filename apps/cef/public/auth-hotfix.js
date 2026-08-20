(() => {
  const $ = (id) => document.getElementById(id);
  const submit = $('authSubmit');
  const authCard = $('auth');
  const slots = $('slots');
  const slotGrid = $('slotGrid');
  if (!submit || !authCard || !slots || !slotGrid) return;

  const meta = document.querySelector('.server-meta');
  if (meta) Array.from(meta.querySelectorAll('span')).forEach((el) => {
    if ((el.textContent || '').includes('ALPHA')) el.textContent = 'ALPHA 0.15.4';
  });

  let message = $('authDebug');
  if (!message) {
    message = document.createElement('div');
    message.id = 'authDebug';
    message.className = 'auth-debug';
    authCard.appendChild(message);
  }

  let pending = false;
  let timeout = 0;
  let authGranted = false;

  const setAuthenticated = (value) => {
    authGranted = !!value;
    document.documentElement.classList.toggle('novera-authenticated', authGranted);
    document.body.classList.toggle('novera-authenticated', authGranted);
  };

  const setMessage = (text, type = '') => {
    message.textContent = text || '';
    message.className = `auth-debug ${type}`.trim();
  };

  const finishPending = () => {
    pending = false;
    clearTimeout(timeout);
    authCard.classList.remove('auth-busy');
    submit.disabled = false;
    submit.textContent = $('tabRegister')?.classList.contains('active') ? 'Начать историю' : 'Войти в NOVERA';
  };

  const notice = (text) => {
    const status = $('status');
    if (!status || !text) return;
    status.textContent = text;
    status.classList.add('show');
    clearTimeout(notice.timer);
    notice.timer = setTimeout(() => status.classList.remove('show'), 2600);
  };

  const showAuth = () => {
    $('authScene')?.classList.remove('hidden');
    authCard.classList.remove('hidden');
    slots.classList.add('hidden');
    $('creator')?.classList.add('hidden');
    $('gameplay')?.classList.add('hidden');
    $('brand')?.classList.add('hidden');
  };

  const showCharacters = () => {
    if (!authGranted) return showAuth();
    $('authScene')?.classList.add('hidden');
    authCard.classList.add('hidden');
    slots.classList.remove('hidden');
    $('creator')?.classList.add('hidden');
    $('gameplay')?.classList.add('hidden');
    $('brand')?.classList.add('hidden');
  };

  const renderCharacters = (list) => {
    slotGrid.innerHTML = '';
    for (let slot = 1; slot <= 3; slot++) {
      const c = Array.isArray(list) ? list.find((x) => +x.slot === slot) : null;
      const el = document.createElement('div');
      el.className = `slot ${c ? 'occupied' : 'empty'}`;
      if (c) {
        const fullName = `${c.firstName || 'Без имени'} ${c.lastName || ''}`.trim();
        el.innerHTML = `<div><div class="eyebrow">ПЕРСОНАЖ ${slot}</div><h3>${fullName}</h3><p>Уровень ${Number(c.level || 1)} · ${c.gender === 'female' ? 'Женщина' : 'Мужчина'}</p></div><div class="slot-actions"><button data-select="${c.id}">Продолжить</button><button data-delete="${c.id}">Удалить</button></div>`;
      } else {
        el.innerHTML = `<div><div class="eyebrow">СЛОТ ${slot}</div><h3>Новая история</h3><p>Создай нового персонажа и начни путь в Los Santos.</p></div><div class="slot-actions"><button data-create="${slot}">Создать персонажа</button></div>`;
      }
      slotGrid.appendChild(el);
    }

    slotGrid.querySelectorAll('[data-create]').forEach((b) => b.onclick = () => window.mp?.trigger?.('novera:cef:creator:open', +b.dataset.create));
    slotGrid.querySelectorAll('[data-select]').forEach((b) => b.onclick = () => window.mp?.trigger?.('novera:cef:character:select', b.dataset.select));
    slotGrid.querySelectorAll('[data-delete]').forEach((b) => b.onclick = () => { if (confirm('Удалить персонажа?')) window.mp?.trigger?.('novera:cef:character:delete', b.dataset.delete); });
  };

  setAuthenticated(false);
  showAuth();

  window.noveraAuthResult = (raw) => {
    finishPending();
    let result;
    try { result = JSON.parse(raw); }
    catch {
      setAuthenticated(false);
      showAuth();
      setMessage('Не удалось обработать ответ сервера.', 'error');
      return;
    }

    if (!result.ok) {
      setAuthenticated(false);
      showAuth();
      setMessage(result.message || 'Ошибка авторизации.', 'error');
      return;
    }

    setAuthenticated(true);
    setMessage('');
    notice(result.message || 'Авторизация успешна.');
    showAuth();
  };

  window.noveraCharacters = (raw) => {
    if (!authGranted) {
      showAuth();
      return;
    }
    let list;
    try { list = JSON.parse(raw); }
    catch { list = []; }
    renderCharacters(list);
    showCharacters();
  };

  const originalOpenCreator = window.noveraOpenCreator;
  if (typeof originalOpenCreator === 'function') {
    window.noveraOpenCreator = (slot) => {
      if (!authGranted) return showAuth();
      originalOpenCreator(slot);
    };
  }

  const originalSelected = window.noveraCharacterSelected;
  if (typeof originalSelected === 'function') {
    window.noveraCharacterSelected = (...args) => {
      if (!authGranted) return showAuth();
      originalSelected(...args);
    };
  }

  window.noveraAuthBridgeAck = () => {};

  submit.onclick = () => {
    if (pending) return;
    const login = $('login')?.value.trim() || '';
    const password = $('password')?.value || '';
    const confirmPassword = $('passwordConfirm')?.value || '';
    const registering = $('tabRegister')?.classList.contains('active');

    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(login)) return setMessage('Логин: 3–32 символа, латиница, цифры, ., _, -.', 'error');
    if (password.length < 8 || password.length > 128) return setMessage('Пароль должен содержать минимум 8 символов.', 'error');
    if (registering && confirmPassword !== password) return setMessage('Пароли не совпадают.', 'error');

    setAuthenticated(false);
    showAuth();
    pending = true;
    authCard.classList.add('auth-busy');
    submit.disabled = true;
    submit.textContent = registering ? 'Создаём аккаунт…' : 'Входим…';
    setMessage('');

    try {
      if (!window.mp || typeof window.mp.trigger !== 'function') throw new Error('bridge');
      window.mp.trigger(registering ? 'novera:cef:register' : 'novera:cef:login', login, password);
    } catch {
      finishPending();
      setMessage('Не удалось отправить запрос серверу.', 'error');
      return;
    }

    timeout = setTimeout(() => {
      if (!pending) return;
      finishPending();
      setAuthenticated(false);
      showAuth();
      setMessage('Сервер временно не отвечает. Повтори попытку.', 'error');
    }, 10000);
  };

  setTimeout(() => {
    showAuth();
    try { window.mp?.trigger?.('novera:cef:ready'); } catch {}
  }, 50);
})();
