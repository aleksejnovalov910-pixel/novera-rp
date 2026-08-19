(() => {
  const $ = (id) => document.getElementById(id);
  const trigger = (name, ...args) => { if (window.mp && typeof window.mp.trigger === 'function') window.mp.trigger(name, ...args); };
  let contacts = [];
  let activeContact = null;
  let messages = [];
  let jobs = [];

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const content = () => $('deviceContent');

  function renderContacts() {
    $('deviceHome').innerHTML = '';
    content().innerHTML = `<div class="content-card"><h3>Контакты</h3><div class="grid2"><input id="phoneTarget" placeholder="ID персонажа"><input id="phoneAlias" placeholder="Имя контакта" maxlength="64"></div><button id="phoneAdd" class="primary">Добавить контакт</button></div><div id="phoneContactList">${contacts.length ? contacts.map(c => `<button class="list-row phone-contact" data-contact="${esc(c.characterId)}"><div><b>${esc(c.alias)}</b><span>ID ${esc(c.characterId)}</span></div><span>›</span></button>`).join('') : '<div class="empty-state">Контактов пока нет</div>'}</div>`;
    $('phoneAdd').onclick = () => { const id=$('phoneTarget').value.trim(),alias=$('phoneAlias').value.trim(); if(!/^\d+$/.test(id)||!alias)return; trigger('novera:cef:phone:add-contact',id,alias); };
    content().querySelectorAll('[data-contact]').forEach((el) => el.onclick = () => { activeContact=el.dataset.contact; trigger('novera:cef:phone:conversation',activeContact); });
  }

  function renderConversation() {
    const contact = contacts.find(c => String(c.characterId) === String(activeContact));
    content().innerHTML = `<div class="content-card"><div class="device-head"><div><div class="eyebrow">MESSAGES</div><h3>${esc(contact?.alias || `ID ${activeContact}`)}</h3></div><button id="phoneBack" class="ghost">Назад</button></div><div class="message-list">${messages.length ? messages.map(m => `<div class="message-bubble ${String(m.senderId)===String(activeContact)?'incoming':'outgoing'}"><p>${esc(m.body)}</p><span>${new Date(m.createdAt).toLocaleString('ru-RU')}</span></div>`).join('') : '<div class="empty-state">Сообщений пока нет</div>'}</div><div class="message-compose"><input id="phoneMessage" maxlength="500" placeholder="Сообщение"><button id="phoneSend" class="primary">Отправить</button></div></div>`;
    $('phoneBack').onclick=renderContacts;
    $('phoneSend').onclick=()=>{const text=$('phoneMessage').value.trim();if(!text||!activeContact)return;trigger('novera:cef:phone:message',String(activeContact),text)};
  }

  function renderJobs() {
    $('deviceHome').innerHTML='';
    const names={taxi:'Такси',courier:'Курьер',trucker:'Дальнобойщик',mechanic:'Механик',tow:'Эвакуатор',builder:'Строитель',electrician:'Электрик',garbage:'Мусоровоз'};
    content().innerHTML=`<div class="content-card"><h3>Карьера NOVERA</h3><p>Прогресс хранится сервером. Уровень и опыт увеличивают развитие профессии, а задания защищены уникальными job-сессиями.</p></div>${jobs.length?jobs.map(j=>`<div class="list-row"><div><b>${esc(names[j.jobKey]||j.jobKey)}</b><span>Уровень ${Number(j.level)||1} · XP ${Number(j.experience)||0} · выполнено ${Number(j.completedTasks)||0}</span></div></div>`).join(''):'<div class="empty-state">Начни первую работу, чтобы открыть карьерный прогресс.</div>'}`;
  }

  document.addEventListener('click',(event)=>{
    const target=event.target.closest?.('[data-app]'); if(!target)return;
    if(target.dataset.app==='contacts'){event.preventDefault();event.stopImmediatePropagation();renderContacts();trigger('novera:cef:phone:state');}
    if(target.dataset.app==='jobs'){event.preventDefault();event.stopImmediatePropagation();renderJobs();}
  },true);

  const previousWorld=window.noveraWorldState;
  window.noveraWorldState=(raw)=>{try{const r=JSON.parse(raw);if(r.ok)jobs=r.jobs||[]}catch{};if(typeof previousWorld==='function')previousWorld(raw)};
  window.noveraPhoneState=(raw)=>{try{const r=JSON.parse(raw);if(r.contacts)contacts=r.contacts;if(r.messages&&r.targetId){activeContact=String(r.targetId);messages=r.messages;renderConversation();return;}if(r.ok&&content()&&$('deviceTitle')?.textContent==='Телефон')renderContacts();}catch{}};
  window.noveraPhoneConversation=(raw)=>{try{const r=JSON.parse(raw);if(!r.ok)return;activeContact=String(r.targetId);messages=r.messages||[];renderConversation();}catch{}};
})();
