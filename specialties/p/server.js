'use strict';

// Все скрипты выполняются только в учебной симуляции.
const P_SERVER_STEPS = [
 {title:'Подготовка резервной копии',goal:'Создайте папку backups, скопируйте в неё server.conf и перейдите в эту папку.',file:'backup.sh',lines:[['comment','# Подготовка резервной копии'],['slot','mkdir backups'],['code','cp server.conf backups/'],['slot','cd backups'],['code','pwd']],words:['mkdir backups','cd backups','mv server.conf backups/','rm -r backups'],hint:'mkdir создаёт папку, cp копирует файл, cd меняет папку.',output:'/home/admin/backups\nРезервная копия server.conf сохранена.'},
 {title:'Проверка журналов',goal:'Перейдите в /var/log/nginx и найдите строки с текстом error в файле error.log.',file:'logs.sh',lines:[['comment','# Диагностика веб-сервера'],['slot','cd /var/log/nginx'],['code','ls'],['slot','grep error error.log']],words:['cd /var/log/nginx','grep error error.log','mkdir error.log','mv error.log access.log'],hint:'cd меняет папку. grep ищет строки с заданным текстом в файле.',output:'error: permission denied\nПричина найдена: у файла сайта неверные права доступа.'},
 {title:'Восстановление доступа',goal:'Перейдите в /var/www/sota и установите права 644 для index.html: владелец читает и пишет, остальные только читают.',file:'permissions.sh',lines:[['comment','# Восстановление доступа к странице'],['slot','cd /var/www/sota'],['code','ls -l index.html'],['slot','chmod 644 index.html']],words:['cd /var/www/sota','chmod 644 index.html','rm index.html','chmod 000 index.html'],hint:'chmod меняет права. 644 даёт владельцу чтение и запись, остальным — чтение.',output:'-rw-r--r-- index.html\nПрава исправлены. Сервер может прочитать страницу.'},
 {title:'Применение настроек',goal:'Проверьте конфигурацию Nginx, затем перечитайте настройки службы и проверьте HTTP-ответ сайта.',file:'deploy.sh',lines:[['comment','# Проверка и применение конфигурации'],['slot','sudo nginx -t'],['slot','sudo systemctl reload nginx'],['code','curl -I http://localhost']],words:['sudo nginx -t','sudo systemctl reload nginx','sudo systemctl stop nginx','sudo nginx -v'],hint:'nginx -t проверяет настройки, systemctl reload перечитывает их без полной остановки.',output:'nginx: configuration test is successful\nHTTP/1.1 200 OK\nСайт восстановлен. Инцидент закрыт!'}
];
const P_LINUX_MEMO = [
 ['cd', 'Перейти в другую папку.', 'cd /tmp'],
 ['ls', 'Показать содержимое папки. Флаг -l показывает подробности, в том числе права.', 'ls -l'],
 ['pwd', 'Показать путь к текущей папке.', 'pwd'],
 ['mkdir', 'Создать новую папку.', 'mkdir reports'],
 ['cp', 'Скопировать файл. Сначала укажите исходный файл, затем место для копии.', 'cp notes.txt reports/'],
 ['mv', 'Переместить или переименовать файл.', 'mv old.txt new.txt'],
 ['rm', 'Удалить файл. Флаг -r удаляет папку вместе с содержимым.', 'rm draft.txt'],
 ['cat', 'Показать содержимое текстового файла.', 'cat notes.txt'],
 ['grep', 'Показать строки, содержащие заданный текст. Сначала укажите текст, затем файл.', 'grep warning access.log'],
 ['chmod', 'Изменить права доступа. 644 даёт владельцу чтение и запись, остальным только чтение.', 'chmod 644 notes.txt'],
 ['nginx -t', 'Проверить, правильно ли написаны настройки Nginx.', 'sudo nginx -t'],
 ['systemctl reload', 'Попросить службу перечитать настройки без полной остановки.', 'sudo systemctl reload nginx'],
 ['curl -I', 'Показать заголовки HTTP-ответа, в том числе код состояния.', 'curl -I http://localhost']
];
const P_LINUX_MEMO_BY_STEP = [
 ['mkdir', 'cp', 'cd', 'pwd'],
 ['cd', 'ls', 'grep'],
 ['cd', 'ls', 'chmod'],
 ['nginx -t', 'systemctl reload', 'curl -I']
];

window.openPServerGame = function(done,cancel){
 let stage=0,mistakes=0,solved=false,closed=false,drag=null,activeSlot=0,slots=[],values=[];
 const previousFocus=document.activeElement,overlay=document.createElement('div');
 overlay.className='p-algorithm-overlay p-linux-overlay';
 overlay.innerHTML=`<section class="p-linux-game" role="dialog" aria-modal="true" aria-labelledby="pServerTitle">
 <div class="p-linux-main"><button type="button" class="qclose p-minigame-exit p-game-close" title="Выйти из мини-игры (−15 света)" aria-label="Выйти из мини-игры: минус 15 света">✕</button><header class="p-linux-header">
 <svg class="p-linux-server-icon" viewBox="0 0 110 112" aria-hidden="true"><defs><linearGradient id="serverMetal" x2="1" y2="1"><stop stop-color="#697087"/><stop offset="1" stop-color="#303747"/></linearGradient></defs><g stroke="#81899d" stroke-width="1.2"><path d="M8 28 64 8 102 23 46 44Z" fill="url(#serverMetal)"/><path d="M8 28v20l38 16V44Z" fill="#3c4356"/><path d="m46 44 56-21v20L46 64Z" fill="#242a38"/><path d="M8 53v20l38 16V69Z" fill="#3c4356"/><path d="m46 69 56-21v20L46 89Z" fill="#242a38"/><path d="M8 78v20l38 13V94Z" fill="#3c4356"/><path d="m46 94 56-21v20l-56 18Z" fill="#242a38"/></g><g fill="#ffad32"><path d="m60 45 30-11v5L60 50Zm0 25 30-11v5L60 75Zm0 24 30-11v5L60 99Z"/><path d="M34 43h4v5h-4zm0 25h4v5h-4zm0 24h4v5h-4z"/></g><g stroke="#181d2b" stroke-width="4"><path d="m15 37 12 5m-12 20 12 5m-12 20 12 5"/></g></svg>
 <div class="p-linux-heading"><h2 id="pServerTitle">Задание</h2><p class="p-task"></p></div></header>
 <div class="p-linux-tools"><p class="p-progress"></p><button type="button" class="p-linux-help" aria-haspopup="dialog">Памятка Linux</button></div><h3 class="p-stage-title" hidden></h3>
 <div class="p-linux-editor"><div class="p-linux-editor-bar"><span class="p-linux-terminal-icon">&gt;_</span><span class="p-linux-file"></span><span class="p-linux-lights" aria-hidden="true"><i></i><i></i><i></i></span></div><div class="p-linux-lines"></div><pre class="p-linux-output" aria-label="Результат выполнения"></pre></div>
 <p class="p-feedback" role="status" aria-live="polite"></p>
 <div class="p-linux-options"><p>Перетащите фрагмент в нужный пропуск.</p><div class="p-server-choices" role="group" aria-label="Фрагменты скрипта"></div><small>Можно также нажать на пропуск, а затем на фрагмент.</small></div>
 <footer class="p-linux-actions"><button type="button" class="p-server-reset">⟳ Сбросить</button><button type="button" class="p-server-check">✓ Проверить</button><button type="button" class="p-server-next" hidden>Следующий этап →</button></footer>
 <div class="p-linux-exit-row"><small class="p-linux-exit-note">Выход по крестику или Escape: −15 света. Практика начнётся заново.</small></div></div>
 <dialog class="p-linux-reference" aria-labelledby="pLinuxReferenceTitle">
  <header class="p-linux-reference-head"><h2 id="pLinuxReferenceTitle">Команды Linux</h2><button type="button" class="p-linux-back">К заданию</button></header>
  <div class="p-linux-reference-filters" role="group" aria-label="Показать команды">
   <button type="button" data-memo="step" aria-pressed="true">Для этапа</button><button type="button" data-memo="all" aria-pressed="false">Все команды</button>
  </div>
  <dl class="p-linux-reference-list" tabindex="0" aria-label="Список команд и примеров"></dl>
 </dialog></section>`;
 const q=s=>overlay.querySelector(s),bank=q('.p-server-choices'),check=q('.p-server-check'),next=q('.p-server-next'),reset=q('.p-server-reset'),feedback=q('.p-feedback');
 const game=q('.p-linux-game'),options=q('.p-linux-options'),reference=q('.p-linux-reference'),help=q('.p-linux-help'),referenceList=q('.p-linux-reference-list');
 const filters=[...reference.querySelectorAll('[data-memo]')];
 function renderReference(mode){
  const commands=mode==='step' ? P_LINUX_MEMO_BY_STEP[stage] : P_LINUX_MEMO.map(([command])=>command);
  referenceList.replaceChildren();
  for(const command of commands){
   const [,description,example]=P_LINUX_MEMO.find(entry=>entry[0]===command);
   const row=document.createElement('div'),title=document.createElement('dt');
   const detail=document.createElement('dd'),sample=document.createElement('code');
   title.textContent=command;
   detail.textContent=description;
   sample.textContent=example;
   detail.append(sample);
   row.append(title,detail);
   referenceList.append(row);
  }
  filters.forEach(filter=>filter.setAttribute('aria-pressed',String(filter.dataset.memo===mode)));
  referenceList.scrollTop=0;
 }
 help.onclick=()=>{
  clearDrag();
  renderReference('step');
  reference.showModal();
  q('.p-linux-back').focus({preventScroll:true});
 };
 filters.forEach(filter=>{filter.onclick=()=>renderReference(filter.dataset.memo);});
 q('.p-linux-back').onclick=()=>reference.close();
 reference.addEventListener('close',()=>help.focus({preventScroll:true}));
 reference.addEventListener('keydown',event=>event.stopPropagation());
 function slotAtPoint(x,y){
  return slots.indexOf(document.elementFromPoint(x,y)?.closest('.p-linux-slot'));
 }
 function overOptions(x,y){
  return options.contains(document.elementFromPoint(x,y));
 }
 function updateDrag(){
  if(!drag?.ghost)return;
  const bounds=game.getBoundingClientRect();
  if(drag.y<bounds.top+36)game.scrollTop-=8;
  else if(drag.y>bounds.bottom-36)game.scrollTop+=8;
  const target=drag.fromSlot ? -1 : slotAtPoint(drag.x,drag.y);
  slots.forEach((slot,index)=>slot.classList.toggle('drag-over',index===target));
  options.classList.toggle('drag-over',drag.fromSlot&&overOptions(drag.x,drag.y));
  drag.frame=requestAnimationFrame(updateDrag);
 }
 function clearDrag(){
  if(!drag)return;
  if(drag.frame!==undefined)cancelAnimationFrame(drag.frame);
  drag.ghost?.remove();
  drag.button.classList.remove('dragging');
  drag=null;
  slots.forEach(slot=>slot.classList.remove('drag-over'));
  options.classList.remove('drag-over');
 }
 function focusSlot(index){activeSlot=index;slots.forEach((slot,i)=>slot.classList.toggle('active',i===index&&!solved));}
 function update(){
  slots.forEach((slot,i)=>{slot.textContent=values[i]||'Выбрать фрагмент';slot.setAttribute('aria-label','Пропуск '+(i+1)+': '+(values[i]||'пусто'));slot.classList.toggle('filled',!!values[i]);});
  bank.querySelectorAll('button').forEach(button=>button.disabled=solved||values.includes(button.dataset.fragment));check.disabled=solved||values.some(value=>!value);
 }
 function clearSlot(index){
  if(solved||closed)return;
  values[index]='';
  slots[index].classList.remove('incorrect');
  slots[index].removeAttribute('aria-invalid');
  focusSlot(index);
  update();
  feedback.textContent='Выберите фрагмент снизу для пропуска '+(index+1)+'.';
 }
 function bindFragmentDrag(button,getWord,onClick,sourceIndex){
  const fromSlot=sourceIndex!==undefined;
  let skipClick=false;
  button.onclick=event=>{
   if(skipClick&&event.detail!==0){skipClick=false;return;}
   onClick();
  };
  button.addEventListener('pointerdown',event=>{
   if(solved||closed||drag||!event.isPrimary||event.button!==0)return;
   skipClick=false;
   const word=getWord();
   if(!word)return;
   button.setPointerCapture(event.pointerId);
   drag={button,word,fromSlot,pointer:event.pointerId,x:event.clientX,y:event.clientY};
  });
  button.addEventListener('pointermove',event=>{
   if(drag?.pointer!==event.pointerId)return;
   if(!drag.ghost){
    if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<7)return;
    drag.ghost=document.createElement('div');
    drag.ghost.className='p-program-ghost p-linux-ghost';
    drag.ghost.textContent=drag.word;
    drag.ghost.setAttribute('aria-hidden','true');
    overlay.appendChild(drag.ghost);
    button.classList.add('dragging');
    drag.frame=requestAnimationFrame(updateDrag);
   }
   drag.x=event.clientX;
   drag.y=event.clientY;
   drag.ghost.style.left=drag.x+'px';
   drag.ghost.style.top=drag.y+'px';
  });
  button.addEventListener('pointerup',event=>{
   if(drag?.pointer!==event.pointerId)return;
   skipClick=!!drag.ghost;
   const {word}=drag;
   clearDrag();
   if(!skipClick)return;
   const {clientX,clientY}=event;
   if(fromSlot){
    if(overOptions(clientX,clientY))clearSlot(sourceIndex);
   }else{
    const target=slotAtPoint(clientX,clientY);
    if(target!==-1)insert(word,target);
   }
  });
  for(const type of ['pointercancel','lostpointercapture']){
   button.addEventListener(type,event=>{if(drag?.pointer===event.pointerId)clearDrag();});
  }
 }
 function insert(word,index=activeSlot){
  if(solved||closed)return;const previous=values.indexOf(word);if(previous!==-1)values[previous]='';values[index]=word;
  slots[index].classList.remove('incorrect');slots[index].removeAttribute('aria-invalid');const empty=values.findIndex(value=>!value);focusSlot(empty===-1?index:empty);update();
  feedback.textContent=empty===-1?'Скрипт собран. Нажмите «Проверить».':'Заполните следующий пропуск.';
 }
 function leave(){
  if(closed)return;clearDrag();
  window.confirmPMinigameExit(overlay,()=>{closed=true;overlay.remove();if(previousFocus?.isConnected)previousFocus.focus();cancel?.();});
 }
 q('.p-minigame-exit').onclick=leave;
 function load(){
  clearDrag();solved=false;slots=[];values=[];activeSlot=0;const step=P_SERVER_STEPS[stage];
  q('.p-progress').textContent='Этап '+(stage+1)+' / '+P_SERVER_STEPS.length;q('.p-stage-title').textContent=step.title;
  q('.p-task').replaceChildren();
  ('Дополните скрипт: '+step.goal).split(/(backups|server\.conf|error\.log|index\.html|\/var\/log\/nginx|\/var\/www\/sota)/g).forEach((part,i)=>{
   if(i%2){const badge=document.createElement('code');badge.className='p-linux-inline-code';badge.textContent=part;q('.p-task').appendChild(badge);}
   else q('.p-task').appendChild(document.createTextNode(part));
  });
  q('.p-linux-file').textContent=step.file;q('.p-linux-output').textContent='';q('.p-linux-lines').replaceChildren();bank.replaceChildren();
  step.lines.forEach(([kind,text],lineIndex)=>{
   const row=document.createElement('div');row.className='p-linux-line';const number=document.createElement('span');number.className='p-linux-number';number.textContent=lineIndex+1;row.appendChild(number);
   if(kind==='slot'){
    const index=slots.length,button=document.createElement('button');button.type='button';button.className='p-linux-slot';values.push('');slots.push(button);
    bindFragmentDrag(button,()=>values[index],()=>clearSlot(index),index);row.appendChild(button);
   }else{
    const code=document.createElement('code');code.className=kind==='comment'?'p-linux-comment':'p-linux-code';
    if(kind==='comment')code.textContent=text;else {const split=text.indexOf(' '),command=document.createElement('span');command.className='p-linux-command';command.textContent=split===-1?text:text.slice(0,split);code.appendChild(command);if(split!==-1)code.appendChild(document.createTextNode(text.slice(split)));}row.appendChild(code);
   }
   q('.p-linux-lines').appendChild(row);
  });
  const words=[...step.words];for(let i=words.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[words[i],words[j]]=[words[j],words[i]];}
  words.forEach(word=>{
   const button=document.createElement('button');button.type='button';button.className='p-server-choice';button.dataset.fragment=word;
   const grip=document.createElement('span');grip.className='p-linux-grip';grip.textContent='⠿';grip.setAttribute('aria-hidden','true');button.append(grip,document.createTextNode(word));
   bindFragmentDrag(button,()=>word,()=>insert(word));
   bank.appendChild(button);
  });
  check.hidden=false;next.hidden=true;reset.disabled=false;feedback.textContent='';focusSlot(0);update();q('.p-linux-game').scrollTop=0;slots[0].focus({preventScroll:true});
 }
 reset.onclick=()=>{if(solved||closed)return;clearDrag();values=values.map(()=>'');slots.forEach(slot=>{slot.classList.remove('incorrect');slot.removeAttribute('aria-invalid');});focusSlot(0);update();feedback.textContent='Пропуски очищены.';slots[0].focus();};
 check.onclick=()=>{
  if(solved||closed||values.some(value=>!value))return;const step=P_SERVER_STEPS[stage],answers=step.lines.filter(line=>line[0]==='slot').map(line=>line[1]),wrong=values.map((value,i)=>value!==answers[i]);
  slots.forEach((slot,i)=>{slot.classList.toggle('incorrect',wrong[i]);slot.setAttribute('aria-invalid',String(wrong[i]));});
  if(wrong.some(Boolean)){mistakes++;feedback.textContent='Перетащите неверный фрагмент обратно к вариантам или нажмите на него. '+step.hint;focusSlot(wrong.indexOf(true));return;}
  solved=true;clearDrag();slots.forEach(slot=>{slot.disabled=true;slot.classList.add('correct');slot.classList.remove('active');});update();reset.disabled=true;check.hidden=true;next.hidden=false;
  q('.p-linux-output').textContent=step.output;const last=stage===P_SERVER_STEPS.length-1;feedback.textContent=last?'Все скрипты готовы! +'+Math.max(50,200-mistakes*25)+' очков.':'Верно! Скрипт выполнен.';next.textContent=last?'Вернуться в лабораторию →':'Следующий этап →';next.focus();
 };
 next.onclick=()=>{if(!solved||closed)return;if(stage<P_SERVER_STEPS.length-1){stage++;load();return;}closed=true;clearDrag();overlay.remove();if(previousFocus?.isConnected)previousFocus.focus();done(Math.max(50,200-mistakes*25));};
 overlay.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();leave();return;}if(event.key!=='Tab')return;
  const items=[...overlay.querySelectorAll('button:not(:disabled):not([hidden]), summary')].filter(item=>item.getClientRects().length),first=items[0],last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 });
 document.body.appendChild(overlay);load();
};
