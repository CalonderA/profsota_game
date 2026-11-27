'use strict';

window.openKskDisks=function(done,cancel){
 const states=Array(18).fill('healthy'),order=Array.from({length:18},(_,i)=>i);
 for(let i=17;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 order.slice(0,3).forEach(i=>states[i]='failed');
 const used=new Set(),timers=new Set();
 let selected=null,drag=null,closed=false,won=false,suppressClick=false;
 const dialog=document.createElement('dialog');dialog.className='sd-game';dialog.setAttribute('aria-label','Замена серверных дисков');
 const logo=document.querySelector('.brand-header-logo .brand-hex-icon')?.outerHTML||'';
 const img=(kind='disk')=>`<img src="${window.KskDiskArt[kind]}" alt="" draggable="false">`;
 dialog.innerHTML=`<header class="sd-header"><div class="sd-brand">${logo}<b>СОТА</b><span>КСК</span></div><div class="sd-title"><h2>Замена серверных дисков</h2><p>Найди неисправные накопители и замени их</p></div><button class="sd-close ksk-minigame-exit" aria-label="Закрыть мини-игру" type="button"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></header>
 <main class="sd-main"><div class="sd-viewport"><div class="sd-scene"><img class="sd-room" src="${window.KskDiskArt.room}" alt="Серверная стойка с тремя серверами" draggable="false">${states.map((_,i)=>`<button type="button" class="sd-slot" data-slot="${i}" style="left:${(508+i%6*120)/17.17}%;top:${(231+Math.floor(i/6)*193)/9.16}%;--delay:${i*.13}s">${img()}<i class="sd-led" aria-hidden="true"></i><i class="sd-warning" aria-hidden="true">!</i><span class="sd-slot-label">${String(i+1).padStart(2,'0')}</span></button>`).join('')}<div class="sd-rack-lights" aria-hidden="true"><i></i><i></i><i></i></div></div></div>
 <aside class="sd-hint"><span class="sd-eyebrow">ГОРЯЧАЯ ЗАМЕНА</span><h3>Подсказка</h3><p>Красный индикатор сигнализирует о неисправности накопителя. Извлеки его и установи новый диск.</p><small>Серверы поддерживают Hot Swap. Неисправности определены мониторингом — питание остаётся включённым.</small></aside></main>
 <footer class="sd-footer"><div class="sd-stock"><div><b>Запасные накопители</b><span class="sd-count"></span></div><div class="sd-spares">${[0,1,2].map(i=>`<button type="button" data-spare="${i}" aria-label="Запасной накопитель ${i+1}" aria-pressed="false">${img('spare')}</button>`).join('')}</div></div><div class="sd-feedback"><p class="sd-status" role="status" aria-live="polite">Найди три диска с красными индикаторами.</p><button class="sd-finish" type="button" hidden>Выйти в лабораторию</button></div></footer>`;
 document.body.append(dialog);
 const q=s=>dialog.querySelector(s),slots=[...dialog.querySelectorAll('[data-slot]')],spares=[...dialog.querySelectorAll('[data-spare]')];
 q('.sd-hint h3').insertAdjacentHTML('afterend',`<div class="sd-hint-art" aria-hidden="true"><div>${img('spare')}<i>!</i></div><b>→</b><div>${img('spare')}<i>✓</i></div></div>`);
 const say=text=>q('.sd-status').textContent=text;
 function later(fn,ms){const timer=setTimeout(()=>{timers.delete(timer);if(!closed)fn();},ms);timers.add(timer);}
 function flash(node){node.classList.remove('sd-error');void node.offsetWidth;node.classList.add('sd-error');later(()=>node.classList.remove('sd-error'),420);}
 q('.sd-hint').setAttribute('aria-live','polite');
 q('.sd-hint').setAttribute('aria-atomic','true');
 q('.sd-viewport').insertAdjacentHTML('beforeend','<div class="sd-next-action" aria-hidden="true"></div>');
 q('.sd-hint h3').insertAdjacentHTML('afterend',`<div class="sd-action-card">${img('spare')}<strong class="sd-action-title"></strong></div>`);
 function renderGuide(){
  dialog.querySelectorAll('[data-guide-label]').forEach(node=>node.removeAttribute('data-guide-label'));
  dialog.querySelectorAll('[data-guide]').forEach(node=>node.removeAttribute('data-guide'));
  const mark=(node,label)=>node.setAttribute('data-guide',label);
  const empty=states.indexOf('empty'),failed=states.indexOf('failed');
  const repaired=states.filter(s=>s==='repaired').length;
  const address=i=>`сервер ${Math.floor(i/6)+1}, диск ${i%6+1}`;
  let heading=`Замена ${Math.min(3,repaired+1)} из 3`,text;
  if(won){heading='Готово!';text='Все три накопителя заменены и проверены. Нажми «Выйти в лабораторию».';mark(q('.sd-finish'),'✓');}
  else if(empty>=0){
   mark(slots[empty],'2');
   if(selected!==null){heading+=' · установка';text=`Теперь нажми на выделенный пустой слот: ${address(empty)}. Или отпусти над ним перетаскиваемый диск.`;}
   else{heading+=' · новый диск';const spare=spares.find((_,i)=>!used.has(i));if(spare)mark(spare,'1');text=`Выбери запасной накопитель с цифрой 1 внизу, затем нажми на пустой слот с цифрой 2 (${address(empty)}). Можно перетащить диск прямо в слот.`;}
  }else if(states.includes('removing')){text='Дождись извлечения неисправного накопителя. Скоро на его месте появится пустой слот.';}
  else if(selected!==null){mark(spares[selected],'↺');text='Сначала извлеки неисправный диск. Нажми ещё раз на выбранный запасной накопитель внизу, чтобы отменить выбор.';}
  else if(failed>=0){heading+=' · извлечение';mark(slots[failed],'1');text=`Нажми на выделенный диск с красным индикатором: ${address(failed)}. Исправные диски с зелёным индикатором оставь на месте.`;}
  else {heading='Проверка дисков';text='Подожди немного: сервер проверяет новые накопители. После проверки их индикаторы станут зелёными.';}
  let action='Подожди: проверяем диски…';
  const label=(node,value)=>node.setAttribute('data-guide-label',value);
  if(won){action='Готово! Выйди в лабораторию';label(q('.sd-finish'),'Нажми для выхода');}
  else if(empty>=0){
   label(slots[empty],selected!==null?'↓ УСТАНОВИ СЮДА':'↓ ПУСТОЙ СЛОТ');
   if(selected!==null)action='Нажми на подсвеченный пустой слот';
   else{action='Возьми новый диск внизу ↓';const spare=spares.find((_,i)=>!used.has(i));if(spare)label(spare,'↓ ВОЗЬМИ ЭТОТ ДИСК');}
  }else if(states.includes('removing'))action='Подожди: извлекаем диск…';
  else if(selected!==null){action='Отмени выбор запасного диска';label(spares[selected],'↓ НАЖМИ ЕЩЁ РАЗ');}
  else if(failed>=0){action='Нажми на красный диск под стрелкой';label(slots[failed],'↓ НАЖМИ НА ДИСК');}
  if(q('.sd-next-action').textContent!==action)q('.sd-next-action').textContent=action;
  if(q('.sd-action-title').textContent!==action)q('.sd-action-title').textContent=action;
  if(q('.sd-hint h3').textContent!==heading)q('.sd-hint h3').textContent=heading;
  if(q('.sd-hint p').textContent!==text)q('.sd-hint p').textContent=text;
 }
 function render(){
  const labels={healthy:'исправен',failed:'неисправен, нажми для извлечения',removing:'извлекается',empty:'пустой слот, установи запасной накопитель',checking:'проверка нового диска',repaired:'исправен, заменён'};
  slots.forEach((node,i)=>{node.dataset.state=states[i];node.setAttribute('aria-label',`Сервер ${Math.floor(i/6)+1}, диск ${i%6+1}: ${labels[states[i]]}`);node.setAttribute('aria-disabled',String(!['failed','empty'].includes(states[i])));node.classList.toggle('sd-target',selected!==null&&states[i]==='empty');});
  spares.forEach((node,i)=>{node.disabled=used.has(i)||won;node.classList.toggle('sd-used',used.has(i));node.setAttribute('aria-pressed',String(selected===i));});
  q('.sd-count').textContent=`Осталось: ${3-used.size} из 3`;
  q('.sd-finish').hidden=!won;
  renderGuide();
 }
 function install(index,spare){
  if(closed||won||spare===null||used.has(spare)||states[index]!=='empty'){flash(slots[index]);return false;}
  // Reserve synchronously: repeated clicks/drops cannot consume a disk twice.
  used.add(spare);selected=null;states[index]='checking';render();say('Новый накопитель установлен. Идёт проверка…');
  later(()=>{states[index]='repaired';won=states.filter(s=>s==='repaired').length===3;render();say(won?'Серверное оборудование исправно':'Проверка завершена: диск исправен. Найди следующий красный индикатор.');if(won){dialog.classList.add('sd-won');q('.sd-finish').focus();}},1200);
  return true;
 }
 function useSlot(index){
  if(won||closed)return;
  if(selected!==null){if(!install(index,selected))say('Новый накопитель можно установить только в свободный слот.');return;}
  if(states[index]==='failed'){
   states[index]='removing';render();say('Извлекаем неисправный накопитель…');
   later(()=>{states[index]='empty';render();say('Перетащи запасной накопитель в свободный слот. Можно выбрать диск и нажать на слот.');},320);
  }else {flash(slots[index]);say(states[index]==='empty'?'Выбери запасной накопитель внизу.':'Этот накопитель извлекать не нужно.');}
 }
 slots.forEach((node,i)=>node.addEventListener('click',()=>useSlot(i)));
 function clearDrag(){if(drag){const previous=drag;drag=null;previous.ghost.remove();if(previous.button.hasPointerCapture(previous.id))previous.button.releasePointerCapture(previous.id);}}
 spares.forEach((button,i)=>{
  button.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}if(used.has(i)||won)return;selected=selected===i?null:i;render();say('Нажми на свободный слот или перетащи туда накопитель.');});
  button.addEventListener('pointerdown',event=>{
   if(event.button!==0||used.has(i)||won||drag)return;
   const ghost=document.createElement('div');ghost.className='sd-ghost';ghost.innerHTML=img('spare');ghost.hidden=true;dialog.append(ghost);
   drag={id:event.pointerId,spare:i,button,ghost,x:event.clientX,y:event.clientY,moved:false};button.setPointerCapture(event.pointerId);
  });
 });
 dialog.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  drag.moved ||= Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>6;
  if(!drag.moved)return;
  selected=drag.spare;render();drag.ghost.hidden=false;drag.ghost.style.left=`${event.clientX}px`;drag.ghost.style.top=`${event.clientY}px`;
  const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.sd-slot');
  drag.ghost.classList.toggle('sd-invalid',!!target&&states[Number(target.dataset.slot)]!=='empty');
 });
 dialog.addEventListener('pointerup',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const current=drag;
  if(current.moved){
   suppressClick=true;later(()=>suppressClick=false,0);
   const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.sd-slot');
   if(!target||!install(Number(target.dataset.slot),current.spare)){selected=null;flash(current.button);say('Накопитель возвращён в запас. Установи его в пустой слот.');}
  }
  clearDrag();render();
 });
 function cancelDrag(){clearDrag();selected=null;render();}
 dialog.addEventListener('pointercancel',cancelDrag);
 dialog.addEventListener('lostpointercapture',()=>{if(drag)cancelDrag();});
 function close(confirmed=false){
  if(closed)return;
  cancelDrag();
  if(!won&&!confirmed){window.confirmKskMinigameExit(dialog,()=>close(true));return;}
  closed=true;timers.forEach(clearTimeout);timers.clear();dialog.close();dialog.remove();if(won)done(600);else cancel();
 }
 q('.sd-close').onclick=()=>close();q('.sd-finish').onclick=()=>{if(won)close();};
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();close();}});
 render();dialog.showModal();
};
