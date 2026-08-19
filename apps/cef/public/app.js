(() => {
  const $ = (id) => document.getElementById(id);
  const auth = $('auth');
  const slots = $('slots');
  const creator = $('creator');
  const status = $('status');
  const slotGrid = $('slotGrid');
  const authSubmit = $('authSubmit');
  const tabLogin = $('tabLogin');
  const tabRegister = $('tabRegister');
  const stage = $('creatorStage');
  let authMode = 'login';
  let creatorSlot = 1;
  let gender = 'male';
  let dragging = false;
  let lastX = 0;

  const trigger = (name, ...args) => {
    if (window.mp && typeof window.mp.trigger === 'function') window.mp.trigger(name, ...args);
  };

  const toast = (message) => {
    status.textContent = message || '';
    status.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => status.classList.remove('show'), 2800);
  };

  const show = (name) => {
    auth.classList.toggle('hidden', name !== 'auth');
    slots.classList.toggle('hidden', name !== 'slots');
    creator.classList.toggle('hidden', name !== 'creator');
  };

  const appearance = () => ({
    mother: Number($('mother').value),
    father: Number($('father').value),
    resemblance: Number($('resemblance').value) / 100,
    skinMix: Number($('skinMix').value) / 100,
    hair: Number($('hair').value),
    hairColor: Number($('hairColor').value),
    eyebrow: Number($('eyebrow').value),
    eyebrowColor: Number($('eyebrowColor').value),
    beard: Number($('beard').value),
    beardColor: Number($('beardColor').value),
    eyeColor: Number($('eyeColor').value)
  });

  const preview = () => trigger('novera:cef:creator:preview', JSON.stringify({ gender, appearance: appearance() }));

  tabLogin.addEventListener('click', () => {
    authMode = 'login'; tabLogin.classList.add('active'); tabRegister.classList.remove('active'); authSubmit.textContent = 'Войти';
  });
  tabRegister.addEventListener('click', () => {
    authMode = 'register'; tabRegister.classList.add('active'); tabLogin.classList.remove('active'); authSubmit.textContent = 'Создать аккаунт';
  });
  authSubmit.addEventListener('click', () => {
    const login = $('login').value.trim();
    const password = $('password').value;
    trigger(authMode === 'login' ? 'novera:cef:login' : 'novera:cef:register', login, password);
  });

  document.querySelectorAll('[data-gender]').forEach((button) => button.addEventListener('click', () => {
    gender = button.dataset.gender;
    document.querySelectorAll('[data-gender]').forEach((b) => b.classList.toggle('active', b === button));
    const female = gender === 'female';
    $('beardLabel').style.display = female ? 'none' : '';
    $('beardColorLabel').style.display = female ? 'none' : '';
    preview();
  }));

  ['mother','father','resemblance','skinMix','hair','hairColor','eyebrow','eyebrowColor','beard','beardColor','eyeColor']
    .forEach((id) => $(id).addEventListener('input', preview));

  $('createCharacter').addEventListener('click', () => {
    const payload = {
      slot: creatorSlot,
      firstName: $('firstName').value.trim(),
      lastName: $('lastName').value.trim(),
      birthDate: $('birthDate').value,
      gender,
      appearance: appearance()
    };
    trigger('novera:cef:character:create', JSON.stringify(payload));
  });

  stage.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    dragging = true; lastX = e.clientX; stage.classList.add('dragging');
  });
  window.addEventListener('mouseup', () => { dragging = false; stage.classList.remove('dragging'); });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const delta = (e.clientX - lastX) * 0.22;
    lastX = e.clientX;
    trigger('novera:cef:creator:rotate', delta);
  });
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    trigger('novera:cef:creator:zoom', e.deltaY > 0 ? 0.18 : -0.18);
  }, { passive: false });

  window.noveraAuthResult = (raw) => {
    const result = JSON.parse(raw);
    toast(result.message);
    if (result.ok) show('slots');
  };

  window.noveraCharacters = (raw) => {
    const list = JSON.parse(raw);
    show('slots');
    slotGrid.innerHTML = '';
    for (let slot = 1; slot <= 3; slot++) {
      const character = list.find((item) => Number(item.slot) === slot);
      const card = document.createElement('div');
      card.className = `slot ${character ? '' : 'empty'}`;
      if (!character) {
        card.innerHTML = `<div><h3>Слот ${slot}</h3><p>Свободный персонаж</p></div><div class="slot-actions"><button data-create="${slot}">Создать</button></div>`;
      } else {
        card.innerHTML = `<div><h3>${character.firstName} ${character.lastName}</h3><p>Уровень ${character.level} · ${character.gender === 'female' ? 'Женщина' : 'Мужчина'}</p></div><div class="slot-actions"><button data-select="${character.id}">Играть</button><button data-delete="${character.id}">Удалить</button></div>`;
      }
      slotGrid.appendChild(card);
    }
    slotGrid.querySelectorAll('[data-create]').forEach((button) => button.addEventListener('click', () => trigger('novera:cef:creator:open', Number(button.dataset.create))));
    slotGrid.querySelectorAll('[data-select]').forEach((button) => button.addEventListener('click', () => trigger('novera:cef:character:select', button.dataset.select)));
    slotGrid.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => {
      if (confirm('Удалить персонажа? Это действие будет подтверждаться сервером.')) trigger('novera:cef:character:delete', button.dataset.delete);
    }));
  };

  window.noveraOpenCreator = (slot) => {
    creatorSlot = Number(slot);
    $('creatorSlotLabel').textContent = `Слот ${creatorSlot}`;
    show('creator');
    setTimeout(preview, 150);
  };

  window.noveraCharacterResult = (raw) => {
    const result = JSON.parse(raw);
    toast(result.message);
  };

  window.noveraCharacterSelected = () => show('slots');
})();
