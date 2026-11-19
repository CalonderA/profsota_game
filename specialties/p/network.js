'use strict';

window.openPNetworkGame = function(done, cancel){
 const devices = [
  {type:'router', label:'Роутер'},
  {type:'switch', label:'Коммутатор'},
  {type:'pc', label:'ПК 1'},
  {type:'pc', label:'ПК 2'},
  {type:'pc', label:'ПК 3'}
 ];
 const positions = [
  {type:'router', label:'Узел под интернетом'},
  {type:'pc', label:'Левое подключение'},
  {type:'pc', label:'Центральное подключение'},
  {type:'pc', label:'Правое подключение'}
 ];
 const connected = new Map();
 const previousFocus = document.activeElement;
 let active = 0;
 let wrong = null;
 let mistakes = 0;
 let closed = false;
 let drag = null;
 let keyboardDevice = null;
 const overlay = document.createElement('div');
 overlay.className = 'p-algorithm-overlay p-network-overlay';
 overlay.innerHTML = `
  <section class="p-network-game" role="dialog" aria-modal="true" aria-labelledby="pNetworkTitle">
   <header class="p-network-header">
    <span class="p-network-target" aria-hidden="true">◎</span>
    <div><h2 id="pNetworkTitle">Постройте сеть</h2><p>Подключите три компьютера к интернету через роутер.</p></div>
    <button type="button" class="p-network-close" aria-label="Выйти из мини-игры" title="Выйти · −15 света">✕</button>
   </header>
   <div class="p-network-layout">
    <div class="p-network-board" role="group" aria-label="Схема сети">
     <div class="p-network-internet">
      <svg class="p-network-cloud" viewBox="0 0 144 84" aria-hidden="true" focusable="false">
       <defs><linearGradient id="pNetSky" x2=".85" y2="1">
        <stop stop-color="#978bff"/><stop offset=".44" stop-color="#5042af"/><stop offset="1" stop-color="#233e80"/>
       </linearGradient></defs>
       <path d="M30 78C-1 78-3 34 27 31C35 8 55 5 69 13C88-5 114 6 119 28C149 30 150 78 118 78Z" fill="url(#pNetSky)" stroke="#a9a0ff" stroke-width="2"/>
       <g fill="none" stroke="#d1f5ff" stroke-width="2">
        <circle cx="73" cy="38" r="15"/><ellipse cx="73" cy="38" rx="7" ry="15"/>
        <path d="M58 38h30m-27-8q12 6 24 0m-24 16q12-6 24 0"/>
       </g>
      </svg>
      <span class="p-network-cloud-label">Интернет</span>
      <span class="p-network-port" aria-hidden="true"></span>
     </div>
     <i class="p-network-wire p-network-wire-in" aria-hidden="true"></i>
     <i class="p-network-wire p-network-wire-trunk" aria-hidden="true"></i>
     <i class="p-network-wire p-network-wire-cross" aria-hidden="true"></i>
     ${positions.map((position, index) => `<button class="p-network-slot" data-position="${index}" type="button"></button>`).join('')}
    </div>
    <aside class="p-network-goal">
     <h3>Цель</h3>
     <p class="p-network-count">○ Подключено ПК: 0 из 3</p>
     <p class="p-network-feedback" role="status">Перетащите карточку устройства в свободную ячейку на схеме.</p>
     <button class="p-network-finish" type="button" hidden>В лабораторию</button>
    </aside>
   </div>
   <div class="p-network-bank" role="group" aria-label="Доступные устройства">
    ${devices.map((device, index) => `
     <button class="p-network-tile" data-device="${index}" type="button" draggable="false">
      <span class="p-network-art" aria-hidden="true"><span class="p-network-icon p-network-icon-${device.type}"><i></i></span></span>
      <span class="p-network-name">${device.label}</span>
      <span class="p-network-used" hidden>✓ На схеме</span>
     </button>`).join('')}
   </div>
  </section>`;

 const slots = [...overlay.querySelectorAll('[data-position]')];
 const cards = [...overlay.querySelectorAll('[data-device]')];
 const feedback = overlay.querySelector('.p-network-feedback');
 const count = overlay.querySelector('.p-network-count');
 const finish = overlay.querySelector('.p-network-finish');
 const game = overlay.querySelector('.p-network-game');

 function render(){
  slots.forEach((slot, index) => {
   const correct = connected.has(index);
   const error = wrong?.position === index;
   const device = devices[correct ? connected.get(index) : error ? wrong.device : -1];
   slot.textContent = correct ? '✓ ' + device.label : error ? '✕ ' + device.label : '＋';
   slot.setAttribute('aria-label', positions[index].label + ': ' + (correct ? device.label + ', верно' : error ? device.label + ', неверно' : 'пусто'));
   slot.setAttribute('aria-pressed', String(active === index));
   slot.classList.toggle('correct', correct);
   slot.classList.toggle('incorrect', error);
   slot.disabled = correct;
  });
  const used = new Set(connected.values());
  cards.forEach((card, index) => {
   card.querySelector('.p-network-used').hidden = !used.has(index);
   card.disabled = used.has(index) || connected.size === slots.length;
  });
  const online = connected.has(0) ? connected.size - 1 : 0;
  overlay.classList.toggle('p-network-linked', connected.has(0));
  count.textContent = (online === 3 ? '✓ ' : '○ ') + 'Подключено ПК: ' + online + ' из 3';
  overlay.classList.toggle('p-network-solved', online === 3);
 }

 function place(device, position){
  if(closed || !devices[device] || !positions[position] || connected.has(position))return;
  if(cards[device].disabled)return;
  if(devices[device].type !== positions[position].type){
   mistakes++;
   wrong = {position, device};
   active = position;
   feedback.textContent = position === 0
    ? 'Неверно. Здесь нужно устройство, которое соединяет локальную сеть с интернетом.'
    : 'Неверно. В этом месте должен стоять компьютер.';
   render();
   return;
  }

  connected.set(position, device);
  wrong = null;
  active = slots.findIndex((_, index) => !connected.has(index));
  render();
  if(active === -1){
   feedback.textContent = 'Верно! Все три ПК подключены к интернету. +' + reward() + ' очков.';
   finish.hidden = false;
   finish.focus();
   return;
  }
  feedback.textContent = position === 0 ? 'Верно. Роутер подключён к интернету.'
   : connected.has(0) ? 'Верно. Компьютер подключён к интернету.' : 'Верно. Компьютер на своём месте. Для доступа в интернет нужен роутер.';
  slots[active].focus({preventScroll:true});
 }

 function reward(){
  return Math.max(50, 200 - mistakes * 25);
 }

 function targetAt(x, y){
  return slots.indexOf(document.elementFromPoint(x, y)?.closest('[data-position]'));
 }
 function updateDrag(){
  if(!drag?.ghost)return;
  const {x, y} = drag;
  const bounds = game.getBoundingClientRect();
  if(y < bounds.top + 36)game.scrollTop -= 8;
  else if(y > bounds.bottom - 36)game.scrollTop += 8;
  const target = targetAt(x, y);
  slots.forEach((slot, index) => slot.classList.toggle('drag-over', target === index && !slot.disabled));
  drag.frame = requestAnimationFrame(updateDrag);
 }
 function stopDrag(){
  if(!drag)return;
  cancelAnimationFrame(drag.frame);
  drag.ghost?.remove();
  drag.card.classList.remove('dragging');
  slots.forEach(slot => slot.classList.remove('drag-over'));
  drag = null;
 }
 slots.forEach((slot, index) => {
  slot.onclick = event => {
   if(event.detail !== 0 || keyboardDevice === null)return;
   const device = keyboardDevice;
   keyboardDevice = null;
   place(device, index);
  };
 });
 cards.forEach((card, index) => {
  card.onclick = event => {
   if(event.detail !== 0)return;
   keyboardDevice = index;
   feedback.textContent = 'Выберите ячейку клавишей Tab и нажмите Enter.';
   slots[active]?.focus();
  };
  card.onpointerdown = event => {
   if(closed || card.disabled || drag || !event.isPrimary || event.button !== 0)return;
   keyboardDevice = null;
   card.setPointerCapture(event.pointerId);
   drag = {card, pointer:event.pointerId, x:event.clientX, y:event.clientY};
  };
  card.onpointermove = event => {
   if(drag?.pointer !== event.pointerId)return;
   if(!drag.ghost){
    if(Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6)return;
    drag.ghost = document.createElement('div');
    drag.ghost.className = 'p-program-ghost p-network-ghost';
    drag.ghost.setAttribute('aria-hidden', 'true');
    drag.ghost.textContent = devices[index].label;
    overlay.appendChild(drag.ghost);
    card.classList.add('dragging');
    drag.frame = requestAnimationFrame(updateDrag);
   }
   drag.x = event.clientX;
   drag.y = event.clientY;
   drag.ghost.style.left = drag.x + 'px';
   drag.ghost.style.top = drag.y + 'px';
  };
  card.onpointerup = event => {
   if(drag?.pointer !== event.pointerId)return;
   const target = drag.ghost ? targetAt(event.clientX, event.clientY) : -1;
   stopDrag();
   if(target !== -1)place(index, target);
  };
  card.onpointercancel = card.onlostpointercapture = event => {
   if(drag?.pointer === event.pointerId)stopDrag();
  };
 });

 function close(complete){
  if(closed)return;
  closed = true;
  overlay.remove();
  if(previousFocus?.isConnected)previousFocus.focus();
  if(complete)done(reward());
  else cancel?.();
 }
 function leave(){
  stopDrag();
  keyboardDevice = null;
  if(connected.size === slots.length)close(true);
  else window.confirmPMinigameExit(overlay, () => close(false));
 }
 overlay.querySelector('.p-network-close').onclick = leave;
 finish.onclick = () => close(true);
 overlay.addEventListener('keydown', event => {
  if(event.key === 'Escape'){
   event.preventDefault();
   leave();
   return;
  }
  if(event.key !== 'Tab')return;
  const controls = [...overlay.querySelectorAll('button:not(:disabled):not([hidden])')];
  const first = controls[0], last = controls[controls.length - 1];
  if(event.shiftKey && document.activeElement === first){
   event.preventDefault();
   last.focus();
  }else if(!event.shiftKey && document.activeElement === last){
   event.preventDefault();
   first.focus();
  }
 });
 document.body.appendChild(overlay);
 render();
 slots[0].focus({preventScroll:true});
};
