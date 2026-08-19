(() => {
  const $ = (id) => document.getElementById(id);
  const authScene = $('authScene'), auth = $('auth'), slots = $('slots'), creator = $('creator'), gameplay = $('gameplay');
  const status = $('status'), slotGrid = $('slotGrid'), stage = $('creatorStage');
  const overlay = $('overlay'), deviceTitle = $('deviceTitle'), deviceEyebrow = $('deviceEyebrow'), deviceHome = $('deviceHome'), deviceContent = $('deviceContent');
  let authMode = 'login', creatorSlot = 1, gender = 'male', dragging = false, lastX = 0;
  let game = { money: { cash: 0, bank: 0, bankAccount: '' }, inventory: [], vehicles: [], properties: [] };
  let world = { jobs: [], family: null, faction: null };

  const trigger = (name, ...args) => { if (window.mp && typeof window.mp.trigger === 'function') window.mp.trigger(name, ...args); };
  const money = (v) => `$${Number(v || 0).toLocaleString('ru-RU')}`;
  const toast = (message) => { status.textContent = message || ''; status.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => status.classList.remove('show'), 3200); };
  const show = (name) => {
    authScene.classList.toggle('hidden', name !== 'auth');
    auth.classList.toggle('hidden', name !== 'auth');
    slots.classList.toggle('hidden', name !== 'slots');
    creator.classList.toggle('hidden', name !== 'creator');
    gameplay.classList.toggle('hidden', name !== 'gameplay');
    $('brand').classList.toggle('hidden', name === 'auth' || name === 'gameplay');
  };
  const appearance = () => ({ mother:+$('mother').value,father:+$('father').value,resemblance:+$('resemblance').value/100,skinMix:+$('skinMix').value/100,hair:+$('hair').value,hairColor:+$('hairColor').value,eyebrow:+$('eyebrow').value,eyebrowColor:+$('eyebrowColor').value,beard:+$('beard').value,beardColor:+$('beardColor').value,eyeColor:+$('eyeColor').value });
  const preview = () => trigger('novera:cef:creator:preview', JSON.stringify({ gender, appearance: appearance() }));

  function setAuthMode(mode) {
    authMode = mode;
    const registering = mode === 'register';
    $('tabLogin').classList.toggle('active', !registering);
    $('tabRegister').classList.toggle('active', registering);
    $('confirmWrap').classList.toggle('hidden', !registering);
    $('loginExtras').classList.toggle('hidden', registering);
    $('authTitle').textContent = registering ? 'Создай аккаунт' : 'С возвращением';
    $('authSubmit').textContent = registering ? 'Начать историю' : 'Войти в NOVERA';
    $('authFootnote').textContent = registering ? 'Регистрируясь, ты принимаешь правила сервера и пользовательское соглашение.' : 'Продолжая, ты принимаешь правила сервера и пользовательское соглашение.';
  }
  $('tabLogin').onclick = () => setAuthMode('login');
  $('tabRegister').onclick = () => setAuthMode('register');
  $('forgotPassword').onclick = () => toast('Восстановление доступа появится в следующем обновлении.');
  const remembered = localStorage.getItem('novera:login') || '';
  if (remembered) { $('login').value = remembered; $('remember').checked = true; }
  $('authSubmit').onclick = () => {
    const login = $('login').value.trim(), password = $('password').value;
    if (login.length < 3) return toast('Логин должен содержать минимум 3 символа.');
    if (password.length < 6) return toast('Пароль должен содержать минимум 6 символов.');
    if (authMode === 'register' && $('passwordConfirm').value !== password) return toast('Пароли не совпадают.');
    if (authMode === 'login' && $('remember').checked) localStorage.setItem('novera:login', login); else if (authMode === 'login') localStorage.removeItem('novera:login');
    trigger(authMode === 'login' ? 'novera:cef:login' : 'novera:cef:register', login, password);
  };
  ['login','password','passwordConfirm'].forEach((id)=>$(id).addEventListener('keydown',(e)=>{if(e.key==='Enter')$('authSubmit').click()}));

  document.querySelectorAll('[data-gender]').forEach((button) => button.onclick = () => { gender=button.dataset.gender; document.querySelectorAll('[data-gender]').forEach((b)=>b.classList.toggle('active',b===button)); const f=gender==='female'; $('beardLabel').style.display=f?'none':''; $('beardColorLabel').style.display=f?'none':''; preview(); });
  ['mother','father','resemblance','skinMix','hair','hairColor','eyebrow','eyebrowColor','beard','beardColor','eyeColor'].forEach((id)=>$(id).addEventListener('input',preview));
  $('createCharacter').onclick = () => trigger('novera:cef:character:create', JSON.stringify({ slot:creatorSlot, firstName:$('firstName').value.trim(), lastName:$('lastName').value.trim(), birthDate:$('birthDate').value, gender, appearance:appearance() }));
  stage.onmousedown=(e)=>{if(e.button===0){dragging=true;lastX=e.clientX;stage.classList.add('dragging')}}; window.onmouseup=()=>{dragging=false;stage.classList.remove('dragging')}; window.onmousemove=(e)=>{if(dragging){const d=(e.clientX-lastX)*.22;lastX=e.clientX;trigger('novera:cef:creator:rotate',d)}}; stage.addEventListener('wheel',(e)=>{e.preventDefault();trigger('novera:cef:creator:zoom',e.deltaY>0?.18:-.18)},{passive:false});

  function refreshHud(){ $('hudCash').textContent=money(game.money.cash); $('hudBank').textContent=money(game.money.bank); }
  function card(title, subtitle, action, value){ return `<button class="app-card" data-app="${action}" data-value="${value||''}"><b>${title}</b><span>${subtitle||''}</span></button>`; }
  function openDevice(name){
    overlay.classList.remove('hidden'); deviceContent.innerHTML=''; deviceHome.innerHTML='';
    if(name==='phone'){ deviceEyebrow.textContent='NOVERA OS'; deviceTitle.textContent='Телефон'; deviceHome.innerHTML=card('Банк',money(game.money.bank),'bank')+card('V-Market','Объявления','market')+card('Транспорт',`${game.vehicles.length} авто`,'vehicles')+card('Недвижимость',`${game.properties.length} объектов`,'properties')+card('Контакты','Связь с игроками','contacts')+card('Такси','Вызвать машину','taxi'); }
    if(name==='tablet'){ deviceEyebrow.textContent='NOVERA TABLET'; deviceTitle.textContent='Планшет'; deviceHome.innerHTML=card('Работы',`${world.jobs.length} профессий`,'jobs')+card('Семья',world.family?.name||'Нет семьи','family')+card('Организация',world.faction?.name||'Нет организации','faction')+card('V-Market','Экономика города','market')+card('Недвижимость','Управление имуществом','properties')+card('Автопарк','Гаражи и транспорт','vehicles'); }
    if(name==='inventory'){ deviceEyebrow.textContent='CHARACTER'; deviceTitle.textContent='Инвентарь'; renderInventory(); }
    if(name==='settings'){ deviceEyebrow.textContent='NOVERA'; deviceTitle.textContent='Настройки'; deviceContent.innerHTML='<div class="content-card"><h3>Управление</h3><p>F2 — настройки · ↑ — телефон · ↓ — планшет · I — инвентарь</p><p>Перебинды, звук, HUD и графические параметры будут расширяться модулем настроек.</p></div>'; }
    bindApps();
  }
  function renderInventory(){
    deviceHome.innerHTML=''; const items=game.inventory||[];
    deviceContent.innerHTML=`<div class="content-card"><p>Двойной клик — использовать предмет. ПКМ по стакуемому предмету — разделить стак.</p></div><div class="inventory-grid">${Array.from({length:30},(_,slot)=>{const i=items.find(x=>+x.slot===slot);return `<div class="inv-slot" data-slot="${slot}" data-item="${i?i.id:''}">${i?`<b>${i.itemKey}</b><span>x${i.amount}</span>`:`<span>${slot+1}</span>`}</div>`}).join('')}</div>`;
    deviceContent.querySelectorAll('.inv-slot[data-item]:not([data-item=""])').forEach((el)=>{
      el.ondblclick=()=>trigger('novera:cef:inventory:use',+el.dataset.slot);
      el.oncontextmenu=(e)=>{e.preventDefault();const item=items.find(x=>String(x.id)===String(el.dataset.item));if(!item||+item.amount<2)return;const amount=Number(prompt(`Сколько отделить? Доступно: ${item.amount}`,Math.floor(+item.amount/2)));if(!Number.isInteger(amount)||amount<=0||amount>=+item.amount)return;const free=Array.from({length:30},(_,s)=>s).find(s=>!items.some(x=>+x.slot===s));if(free===undefined)return toast('Нет свободного слота');trigger('novera:cef:inventory:split',+el.dataset.slot,free,amount)};
    });
  }
  function renderApp(app){
    deviceHome.innerHTML='';
    if(app==='bank') deviceContent.innerHTML=`<div class="content-card"><h3>Счёт NOVERA Bank</h3><div class="big-number">${money(game.money.bank)}</div><p>Наличные: ${money(game.money.cash)}</p><p>Номер счёта: <b>${game.money.bankAccount||'создаётся...'}</b></p><div class="row"><button data-bank="deposit">Внести $1000</button><button data-bank="withdraw">Снять $1000</button></div><h3>Перевод</h3><div class="grid2"><input id="bankTarget" placeholder="NR0000000001" maxlength="12"><input id="bankAmount" type="number" min="1" step="1" placeholder="Сумма"></div><button id="bankTransfer" class="primary">Перевести</button></div>`;
    else if(app==='vehicles') deviceContent.innerHTML=(game.vehicles.length?game.vehicles.map(v=>`<div class="list-row"><div><b>${v.model}</b><span>${v.plate} · ${Math.round(v.fuel)}% топлива</span></div><button data-spawn="${v.id}">${v.stored?'Вызвать':'В мире'}</button></div>`).join(''):'<div class="empty-state">У тебя пока нет транспорта</div>');
    else if(app==='properties') deviceContent.innerHTML=(game.properties.length?game.properties.map(p=>`<div class="list-row"><div><b>${p.name}</b><span>${p.type}</span></div></div>`).join(''):'<div class="empty-state">Недвижимость ещё не приобретена</div>');
    else if(app==='jobs') deviceContent.innerHTML=`<div class="content-card"><h3>Карьера</h3><p>Такси · Курьер · Дальнобойщик · Механик · Эвакуатор · Строитель · Электрик · Мусоровоз</p></div>`;
    else if(app==='family') deviceContent.innerHTML=`<div class="content-card"><h3>${world.family?.name||'Семья'}</h3><p>${world.family?`Уровень ${world.family.level} · казна ${money(world.family.treasury)}`:'Создай семью или получи приглашение.'}</p></div>`;
    else if(app==='faction') deviceContent.innerHTML=`<div class="content-card"><h3>${world.faction?.name||'Организация'}</h3><p>${world.faction?`Ранг ${world.faction.rank}`:'Ты пока не состоишь в организации.'}</p></div>`;
    else if(app==='market') deviceContent.innerHTML='<div class="content-card"><h3>V-Market</h3><p>Единая площадка транспорта, недвижимости, предметов и услуг. Сделки выполняются сервером транзакционно.</p></div>';
    else deviceContent.innerHTML='<div class="empty-state">Модуль подключён к оболочке и будет наполнен игровыми сценариями.</div>';
    deviceContent.querySelectorAll('[data-bank]').forEach(b=>b.onclick=()=>trigger(`novera:cef:bank:${b.dataset.bank}`,1000));
    if($('bankTransfer')) $('bankTransfer').onclick=()=>{const account=$('bankTarget').value.trim().toUpperCase(),amount=Number($('bankAmount').value);if(!/^NR\d{10}$/.test(account)||!Number.isSafeInteger(amount)||amount<=0)return toast('Проверь номер счёта и сумму');trigger('novera:cef:bank:transfer',account,amount)};
    deviceContent.querySelectorAll('[data-spawn]').forEach(b=>b.onclick=()=>trigger('novera:cef:vehicle:spawn',b.dataset.spawn));
  }
  function bindApps(){ deviceHome.querySelectorAll('[data-app]').forEach((b)=>b.onclick=()=>renderApp(b.dataset.app)); }
  $('closeDevice').onclick=()=>{overlay.classList.add('hidden');trigger('novera:cef:device:close')};

  window.noveraAuthResult=(raw)=>{const r=JSON.parse(raw);toast(r.message);if(r.ok)show('slots')};
  window.noveraCharacters=(raw)=>{const list=JSON.parse(raw);show('slots');slotGrid.innerHTML='';for(let slot=1;slot<=3;slot++){const c=list.find(x=>+x.slot===slot),el=document.createElement('div');el.className=`slot ${c?'':'empty'}`;el.innerHTML=c?`<div><h3>${c.firstName} ${c.lastName}</h3><p>Уровень ${c.level} · ${c.gender==='female'?'Женщина':'Мужчина'}</p></div><div class="slot-actions"><button data-select="${c.id}">Играть</button><button data-delete="${c.id}">Удалить</button></div>`:`<div><h3>Слот ${slot}</h3><p>Свободный персонаж</p></div><div class="slot-actions"><button data-create="${slot}">Создать</button></div>`;slotGrid.appendChild(el)}slotGrid.querySelectorAll('[data-create]').forEach(b=>b.onclick=()=>trigger('novera:cef:creator:open',+b.dataset.create));slotGrid.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>trigger('novera:cef:character:select',b.dataset.select));slotGrid.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(confirm('Удалить персонажа?'))trigger('novera:cef:character:delete',b.dataset.delete)})};
  window.noveraOpenCreator=(slot)=>{creatorSlot=+slot;$('creatorSlotLabel').textContent=`Слот ${creatorSlot}`;show('creator');setTimeout(preview,150)};
  window.noveraCharacterResult=(raw)=>toast(JSON.parse(raw).message);
  window.noveraCharacterSelected=()=>{show('gameplay');overlay.classList.add('hidden')};
  window.noveraGameplayState=(raw)=>{const r=JSON.parse(raw);if(!r.ok){toast(r.message||'Ошибка');return}if(r.payload&&r.payload.money){game=r.payload;refreshHud()}else if(r.message)toast(r.message);if(!overlay.classList.contains('hidden')&&deviceTitle.textContent==='Инвентарь'&&r.ok)trigger('novera:cef:device:close')};
  window.noveraWorldState=(raw)=>{const r=JSON.parse(raw);if(r.ok)world={jobs:r.jobs||[],family:r.family||null,faction:r.faction||null}};
  window.noveraOpenDevice=(name)=>openDevice(name);
  setAuthMode('login');
})();
