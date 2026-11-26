'use strict';

window.openKskAssembly = function(done, cancel){
 const parts = {
  cpu: {
   name:'Процессор', socket:'Сокет CPU',
   socketHelp:'В этот квадратный сокет ставят процессор.',
   hint:'Процессор выполняет команды программ. Найди квадратную металлическую рамку «Сокет CPU» в верхней части платы.'
  },
  ram: {
   name:'Оперативная память', socket:'Слот DIMM',
   socketHelp:'Эти длинные разъёмы с защёлками нужны для планок оперативной памяти.',
   hint:'Оперативная память временно хранит данные запущенных программ. Перенеси планку в вертикальный «Слот DIMM» справа от процессора.'
  },
  ssd: {
   name:'SSD M.2', socket:'Разъём M.2',
   socketHelp:'Здесь подключают SSD M.2. Один конец накопителя входит в разъём, другой закрепляется на плате.',
   hint:'SSD хранит файлы даже после выключения компьютера. Найди «Разъём M.2» под процессором, над длинным слотом видеокарты.'
  },
  gpu: {
   name:'Видеокарта', socket:'Слот PCIe ×16',
   socketHelp:'В этой сборке длинный слот PCIe ×16 нужен для видеокарты.',
   hint:'Видеокарта обрабатывает графику. Её ряд контактов вставляется в длинный горизонтальный «Слот PCIe ×16» внизу платы.'
  }
 };
 const tasks = [
  {part:'cpu', text:'Вставь процессор.', guide:'Перетащи его в квадратную металлическую рамку вверху платы. Это гнездо подписано «Сокет CPU».'},
  {part:'ram', text:'Установи оперативную память.', guide:'Перетащи планку в длинный вертикальный разъём справа от процессора. Ищи надпись «Слот DIMM».'},
  {part:'ssd', text:'Установи накопитель SSD M.2.', guide:'Перетащи его в короткий горизонтальный разъём под процессором. Он подписан «Разъём M.2».'},
  {part:'gpu', text:'Вставь видеокарту.', guide:'Перетащи её в длинный горизонтальный разъём ниже накопителя. Он подписан «Слот PCIe ×16».'}
 ];
 const dialog = document.createElement('dialog');
 dialog.className = 'ksk-assembly';
 dialog.setAttribute('aria-labelledby', 'assembly-title');
 dialog.innerHTML = `
  <header><h2 id="assembly-title">Собери ПК</h2>
   <button type="button" class="assembly-exit ksk-minigame-exit" aria-label="Выйти из задания"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></header>
  <div class="assembly-objective" aria-live="polite" aria-atomic="true">
   <p class="assembly-task"></p><p class="assembly-guide"></p>
  </div>
  <div class="assembly-case" role="group" aria-label="Открытый корпус ПК">
   <div class="assembly-board" role="group" aria-label="Материнская плата">
    ${Object.entries(parts).map(([id, part]) => `<button type="button" data-slot="${id}"><span>${part.socket}</span></button>`).join('')}
   </div>
  </div>
  <div class="assembly-bank" role="group" aria-label="Детали">
   ${['gpu','ssd','cpu','ram'].map(id => `<button type="button" data-part="${id}"><i class="assembly-piece" data-hardware="${id}" aria-hidden="true"></i>${parts[id].name}</button>`).join('')}
  </div>
  <footer><strong class="assembly-count">0 / 4</strong><p role="status">Перетащи деталь в подходящий разъём.</p>
   <button type="button" class="assembly-dismiss" hidden>Скрыть подсказку</button>
   <button type="button" class="assembly-finish" hidden>В лабораторию</button></footer>`;
 const count = dialog.querySelector('.assembly-count');
 const status = dialog.querySelector('[role=status]');
 const finish = dialog.querySelector('.assembly-finish');
 const taskLabel = dialog.querySelector('.assembly-task');
 const taskGuide = dialog.querySelector('.assembly-guide');
 const dismiss = dialog.querySelector('.assembly-dismiss');
 const cards = [...dialog.querySelectorAll('[data-part]')];
 const slots = [...dialog.querySelectorAll('[data-slot]')];
 let installed = 0, mistakes = 0, dragged = null, keyboardPart = null, closed = false;

 function updateTask(){
  const task = tasks[installed];
  taskLabel.textContent = task
   ? 'Задание ' + (installed + 1) + ' из ' + tasks.length + '. ' + task.text
   : 'Все задания выполнены.';
  taskGuide.textContent = task?.guide ?? '';
  taskGuide.hidden = !task;
 }
 function clearHint(){
  dialog.classList.remove('assembly-show-hint');
  slots.forEach(item=>item.classList.remove('incorrect','assembly-hinted'));
  dismiss.hidden = true;
 }
 function showHint(message){
  dialog.classList.add('assembly-show-hint');
  dismiss.hidden = false;
  status.textContent = message;
 }
 function dismissHint(){
  clearHint();
  status.textContent = '';
  cards.find(card=>card.dataset.part===tasks[installed].part)?.focus({preventScroll:true});
 }
 dismiss.onclick = dismissHint;

 function place(card, slot){
  if(!slot || card.disabled || slot.disabled || closed)return;
  const part = parts[card.dataset.part];
  clearHint();
  if(card.dataset.part !== tasks[installed].part){
   showHint('Выбрана деталь «' + part.name + '». Сейчас нужна деталь «' + parts[tasks[installed].part].name + '».');
   return;
  }
  if(card.dataset.part !== slot.dataset.slot){
   mistakes++;
   showHint(parts[slot.dataset.slot].socketHelp + ' ' + part.hint);
   slot.classList.add('incorrect');
   slots.find(item=>item.dataset.slot===card.dataset.part).classList.add('assembly-hinted');
   return;
  }
  card.disabled = slot.disabled = true;
  const {name,socket:connector} = part;
  slot.prepend(card.querySelector('.assembly-piece').cloneNode(true));
  slot.querySelector('span').textContent = '✓ ' + name;
  slot.setAttribute('aria-label', name + ' — установлено в ' + connector);
  count.textContent = ++installed + ' / 4';
  updateTask();
  status.textContent = installed === 4 ? 'ПК собран! Все четыре детали на своих местах.' : 'Верно! ' + name + ' — ' + connector + '.';
  if(installed === 4){finish.hidden = false; finish.focus();}
  else if(keyboardPart)cards.find(card=>card.dataset.part===tasks[installed].part)?.focus({preventScroll:true});
 }
 function target(x,y){
  const slot = document.elementFromPoint(x,y)?.closest('[data-slot]');
  return slots.includes(slot) && !slot.disabled ? slot : null;
 }
 function endDrag(){
  if(!dragged)return;
  cancelAnimationFrame(dragged.frame);
  dragged.preview?.remove();
  slots.forEach(slot=>slot.classList.remove('over'));
  dragged = null;
 }
 function follow(){
  if(!dragged?.preview)return;
  const {x,y} = dragged, bounds = dialog.getBoundingClientRect();
  if(y < bounds.top + 32)dialog.scrollTop -= 7;
  else if(y > bounds.bottom - 32)dialog.scrollTop += 7;
  const over = target(x,y);
  slots.forEach(slot=>slot.classList.toggle('over',slot === over));
  dragged.frame = requestAnimationFrame(follow);
 }
 cards.forEach(card=>{
  card.onpointerdown = event=>{
   if(dragged || !event.isPrimary || event.button !== 0 || card.disabled)return;
   keyboardPart = null;
   card.setPointerCapture(event.pointerId);
   dragged = {id:event.pointerId,x:event.clientX,y:event.clientY};
  };
  card.onpointermove = event=>{
   if(dragged?.id !== event.pointerId)return;
   if(!dragged.preview){
    if(Math.hypot(event.clientX-dragged.x,event.clientY-dragged.y)<6)return;
    dragged.preview = document.createElement('span');
    dragged.preview.className = 'assembly-drag';
    dragged.preview.append(card.querySelector('.assembly-piece').cloneNode(true));
    dragged.preview.setAttribute('aria-hidden','true');
    dialog.append(dragged.preview);
    dragged.frame = requestAnimationFrame(follow);
   }
   dragged.x = event.clientX;
   dragged.y = event.clientY;
   dragged.preview.style.left = dragged.x+'px';
   dragged.preview.style.top = dragged.y+'px';
  };
  card.onpointerup = event=>{
   if(dragged?.id !== event.pointerId)return;
   card.suppressSelection=!!dragged.preview;
   const slot = dragged.preview && target(event.clientX,event.clientY);
   endDrag();
   place(card,slot);
  };
  card.onlostpointercapture = card.onpointercancel = event=>{
   if(dragged?.id === event.pointerId)endDrag();
  };
  card.onclick = event=>{
   if(card.suppressSelection){card.suppressSelection=false;return;}
   if(card.disabled)return;
   clearHint();
   cards.forEach(item=>item.setAttribute('aria-pressed',String(item===card)));
   keyboardPart = card;
   status.textContent = 'Выбрано: '+parts[card.dataset.part].name+'. Нажми на подходящий разъём в корпусе.';
   const expected=slots.find(slot=>slot.dataset.slot===card.dataset.part);
   if(event.detail===0)expected?.focus();
   else if(window.matchMedia('(max-width:760px)').matches)qCaseScroll();
  };
 });
 function qCaseScroll(){dialog.querySelector('.assembly-case').scrollIntoView({block:'center',behavior:'smooth'});}
 slots.forEach(slot=>slot.onclick=event=>{
  if(keyboardPart){place(keyboardPart,slot); keyboardPart=null;cards.forEach(card=>card.setAttribute('aria-pressed','false'));}
 });
 function leave(confirmed=false){
  if(closed)return;
  endDrag();
  if(installed !== 4 && confirmed!==true){window.confirmKskMinigameExit(dialog,()=>leave(true));return;}
  closed = true;
  dialog.close();
  dialog.remove();
  if(installed === 4)done(Math.max(50,200-mistakes*25));
  else cancel();
 }
 dialog.querySelector('.assembly-exit').onclick = finish.onclick = leave;
 dialog.oncancel = event=>{
  event.preventDefault();
  if(!dismiss.hidden)dismissHint();
  else leave();
 };
 dialog.onkeydown = event=>event.stopPropagation();
 updateTask();
 document.body.append(dialog);
 dialog.showModal();
};
