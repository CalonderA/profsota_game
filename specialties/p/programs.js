'use strict';

// Общее подтверждение выхода для всех мини-игр программистов.
window.confirmPMinigameExit = function(game, onConfirm){
 if(game.pExitConfirmation)return;
 game.pExitConfirmation=true;
 const previousFocus=document.activeElement,confirmation=document.createElement('div');
 confirmation.className='qconfirm p-exit-confirm';
 confirmation.setAttribute('role','alertdialog');
 confirmation.setAttribute('aria-modal','true');
 confirmation.setAttribute('aria-labelledby','pExitTitle');
 confirmation.setAttribute('aria-describedby','pExitDescription');
 confirmation.innerHTML=`<div class="qconfirm-box">
 <h3 class="qconfirm-title" id="pExitTitle">Выйти из мини-игры?</h3>
 <p class="qconfirm-text" id="pExitDescription">Вы точно хотите выйти? Вы потеряете <b>15 света</b>. Незавершённое задание начнётся заново.</p>
 <div class="btnrow"><button type="button" class="btn ghost p-exit-cancel">Отмена</button><button type="button" class="btn danger p-exit-accept">Выйти из мини-игры</button></div></div>`;
 game.inert=true;
 let closed=false;
 function close(accepted){
  if(closed)return;closed=true;confirmation.remove();game.inert=false;game.pExitConfirmation=false;
  if(accepted)onConfirm();else if(previousFocus?.isConnected)previousFocus.focus();
 }
 const cancel=confirmation.querySelector('.p-exit-cancel'),accept=confirmation.querySelector('.p-exit-accept');
 cancel.onclick=()=>close(false);accept.onclick=()=>close(true);
 confirmation.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(false);}
  else if(event.key==='Tab'){
   if(event.shiftKey&&document.activeElement===cancel){event.preventDefault();accept.focus();}
   else if(!event.shiftKey&&document.activeElement===accept){event.preventDefault();cancel.focus();}
  }
 });
 document.body.appendChild(confirmation);cancel.focus();
};

// Учебные сценарии: постоянная полка программ и последовательные задачи.
const P_PROGRAM_LABS = [
 {title:'Разработка приложения', programs:[
  ['vscode','VS Code','Редактор для написания и изменения кода.'],
  ['python','Python','Выполняет программы на языке Python.'],
  ['git','Git','Сохраняет версии кода и историю изменений.'],
  ['gimp','GIMP','Редактор изображений.']
 ], steps:[
  ['Написать код','Нужно открыть файл приложения и добавить в него код. Перетащите редактор кода.','vscode','В VS Code написали код приложения.'],
  ['Запустить приложение','Код готов. Теперь нужна программа, которая выполнит код на Python.','python','Python выполнил программу. Приложение работает!'],
  ['Сохранить версию','Приложение проверено. Нужно сохранить историю изменений, чтобы можно было вернуться к этой версии.','git','Git сохранил версию проекта.']
 ]},
 {title:'Диагностика сети', programs:[
  ['ping','ping','Проверяет, отвечает ли устройство в сети.'],
  ['wireshark','Wireshark','Показывает сетевые пакеты и помогает разбирать обмен данными.'],
  ['firefox','Firefox','Открывает сайты и веб-приложения.'],
  ['blender','Blender','Создаёт трёхмерные модели.']
 ], steps:[
  ['Проверить связь','Компьютер не открывает сайт. Сначала проверьте, отвечает ли шлюз на сетевые запросы.','ping','Шлюз ответил. Связь с ним есть.'],
  ['Изучить трафик','Связь есть, но данные приходят с ошибками. Нужен анализатор сетевых пакетов.','wireshark','В Wireshark нашли причину: неверные DNS-ответы. Настройка исправлена.'],
  ['Проверить сайт','Сеть восстановлена. Откройте сайт в браузере, чтобы проверить результат.','firefox','Сайт открылся. Сеть работает!']
 ]},
 {title:'Настройка сервера', programs:[
  ['ssh','OpenSSH','Позволяет подключаться к удалённому серверу по SSH.'],
  ['nginx','Nginx','Веб-сервер: принимает запросы и отдаёт страницы сайта.'],
  ['htop','htop','Показывает процессы и нагрузку на процессор и память.'],
  ['libreoffice','LibreOffice','Создаёт документы и электронные таблицы.']
 ], steps:[
  ['Подключиться к серверу','Сервер стоит в другой комнате. Нужна программа для защищённого удалённого подключения.','ssh','Подключение к SRV-03 установлено по SSH.'],
  ['Разместить сайт','На сервер загружены страницы сайта. Выберите программу, которая будет отдавать их посетителям.','nginx','Nginx настроен. Сайт доступен посетителям.'],
  ['Проверить нагрузку','Сайт запущен. Посмотрите процессы и использование процессора и памяти сервера.','htop','Нагрузка в норме. Сервер готов к работе!']
 ]},
 {title:'Разработка игры', programs:[
  ['gimp','GIMP','Рисует и редактирует двумерные изображения и спрайты.'],
  ['audacity','Audacity','Записывает и редактирует звук.'],
  ['godot','Godot','Игровой движок: собирает сцены, логику и управление.'],
  ['calc','LibreOffice Calc','Работает с электронными таблицами.']
 ], steps:[
  ['Нарисовать персонажа','Для двумерной игры нужен спрайт персонажа. Выберите редактор изображений.','gimp','Спрайт персонажа нарисован.'],
  ['Подготовить звук','Теперь нужно обрезать запись и подготовить звук прыжка.','audacity','Звук прыжка готов.'],
  ['Собрать игру','Изображения и звук готовы. Нужен игровой движок, чтобы добавить сцену, персонажа и управление.','godot','Игра собрана. Персонаж двигается и прыгает!']
 ]}
];

window.startPStation = function(type, floor, done, cancel){
 if(type===0){window.openPApplicationGame(done,cancel);return;}
 if(type===1){window.openPNetworkGame(done,cancel);return;}
 if(type===2){window.openPServerGame(done,cancel);return;}
 if(type===3){window.openPGameDevelopment(done,cancel);return;}
 openPProgramGame(P_PROGRAM_LABS[type] || P_PROGRAM_LABS[0], P_NAMES[type] || P_NAMES[0], done, 'Вернуться к оборудованию', cancel);
};
function openPProgramGame(lab, label, done, finishLabel, cancel){
 let stage=0, mistakes=0, solved=false, closed=false, selected=null, drag=null;
 const previousFocus=document.activeElement;
 const overlay=document.createElement('div');
 overlay.className='p-algorithm-overlay';
 overlay.innerHTML=`<section class="p-algorithm-card p-program-card" role="dialog" aria-modal="true" aria-labelledby="pProgramTitle">
 <small class="p-equipment"></small><h2 id="pProgramTitle"></h2>
 <button type="button" class="qclose p-minigame-exit p-game-close" title="Выйти из мини-игры (−15 света)" aria-label="Выйти из мини-игры: минус 15 света">✕</button>
 <p>Выход по крестику или Escape: −15 света. Задание начнётся заново.</p>
 <p class="p-program-instructions">Перетащите подходящую программу со списка на карточку задания. Можно также выбрать программу нажатием, затем нажать на задание.</p>
 <div class="p-program-layout"><aside><h3>Доступные программы</h3><div class="p-program-shelf"></div></aside>
 <div class="p-program-work"><p class="p-progress"></p><h3 class="p-stage-title"></h3><p class="p-task"></p>
 <button type="button" class="p-program-drop" aria-label="Место для выбранной программы">Перетащите программу сюда</button>
 <p class="p-feedback" role="status" aria-live="polite"></p><ol class="p-program-history" aria-label="Выполненные этапы"></ol>
 <button type="button" class="p-program-next" disabled>Следующий этап →</button></div></div></section>`;
 const q=s=>overlay.querySelector(s);
 q('.p-equipment').textContent=label+' · МИНИ-ИГРА';q('#pProgramTitle').textContent=lab.title;
 const shelf=q('.p-program-shelf'),target=q('.p-program-drop'),next=q('.p-program-next'),feedback=q('.p-feedback');
 const touchControls = window.matchMedia('(pointer: coarse)').matches;
 if(touchControls){
  q('.p-program-instructions').textContent='Коснитесь программы, которая подходит для задания.';
  target.hidden=true;
 }
 q('.p-program-layout').classList.add('p-selection-bottom');
 q('.p-program-layout').appendChild(shelf.parentElement);
 function leave(){
  if(closed)return;
  clearDrag();
  window.confirmPMinigameExit(overlay,()=>{closed=true;overlay.remove();if(previousFocus?.isConnected)previousFocus.focus();cancel?.();});
 }
 q('.p-minigame-exit').onclick=leave;
 function choose(id){
  if(solved||closed)return;
  selected=id;
  shelf.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.program===id)));
 }
 function submit(id){
  if(solved||closed)return;
  const step=lab.steps[stage],program=lab.programs.find(item=>item[0]===id);
  if(!program)return;
  choose(id);
  if(id!==step[2]){mistakes++;feedback.textContent=program[1]+' — '+program[2]+' Попробуйте другую программу.';target.classList.add('incorrect');return;}
  solved=true;target.classList.remove('incorrect');target.classList.add('correct');target.textContent='✓ '+program[1];target.disabled=true;
  feedback.textContent=step[3];
  const entry=document.createElement('li');entry.textContent=step[0]+' — '+program[1];q('.p-program-history').appendChild(entry);
  shelf.querySelectorAll('button').forEach(button=>button.disabled=true);
  next.disabled=false;next.textContent=stage===lab.steps.length-1?finishLabel+' →':'Следующий этап →';
  if(stage===lab.steps.length-1)feedback.textContent+=' Все этапы выполнены! +'+Math.max(50,200-mistakes*25)+' очков.';
  next.focus();
 }
 function clearDrag(){
  if(!drag)return;
  drag.ghost?.remove();drag.button.classList.remove('dragging');drag=null;target.classList.remove('drag-over');
 }
 lab.programs.forEach(([id,name,description])=>{
  let skipClick=false;
  const button=document.createElement('button');button.type='button';button.className='p-program-tile';button.dataset.program=id;button.setAttribute('aria-pressed','false');
  const title=document.createElement('strong'),info=document.createElement('span');title.textContent=name;info.textContent=description;button.append(title,info);
  button.onclick=()=>{if(skipClick){skipClick=false;return;}if(touchControls){submit(id);return;}choose(id);if(!solved)feedback.textContent='Выбрано: '+name+'. Перетащите программу или нажмите на карточку задания.';};
  button.addEventListener('pointerdown',event=>{
   if(solved||closed||event.button!==0||event.pointerType==='touch'||touchControls)return;
   skipClick=false;clearDrag();choose(id);button.setPointerCapture(event.pointerId);drag={id,button,pointer:event.pointerId,x:event.clientX,y:event.clientY,ghost:null};
  });
  button.addEventListener('pointermove',event=>{
   if(!drag||drag.pointer!==event.pointerId)return;
   if(!drag.ghost&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<7)return;
   if(!drag.ghost){drag.ghost=document.createElement('div');drag.ghost.className='p-program-ghost';drag.ghost.textContent=name;document.body.appendChild(drag.ghost);button.classList.add('dragging');}
   drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';
   const rect=target.getBoundingClientRect();target.classList.toggle('drag-over',event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom);
  });
  button.addEventListener('pointerup',event=>{
   if(!drag||drag.pointer!==event.pointerId)return;
   const moved=!!drag.ghost,rect=target.getBoundingClientRect();
   const inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
   clearDrag();if(moved){skipClick=true;event.preventDefault();if(inside)submit(id);}
  });
  button.addEventListener('pointercancel',clearDrag);button.addEventListener('lostpointercapture',clearDrag);
  shelf.appendChild(button);
 });
 target.onclick=()=>{if(selected)submit(selected);else feedback.textContent='Сначала выберите программу из списка.';};
 function load(){
  selected=null;solved=false;target.disabled=false;target.classList.remove('correct','incorrect');target.textContent='Перетащите программу сюда';
  shelf.querySelectorAll('button').forEach(button=>{button.disabled=false;button.setAttribute('aria-pressed','false');});
  q('.p-progress').textContent='Этап '+(stage+1)+' из '+lab.steps.length;
  q('.p-stage-title').textContent=lab.steps[stage][0];q('.p-task').textContent=lab.steps[stage][1];feedback.textContent='';next.disabled=true;
 }
 next.onclick=()=>{
  if(!solved||closed)return;
  if(stage<lab.steps.length-1){
   stage++;
   load();
   if(touchControls)q('.p-program-card').scrollTop=0;
   shelf.querySelector('button').focus({preventScroll:touchControls});
   return;
  }
  closed=true;clearDrag();overlay.remove();if(previousFocus?.isConnected)previousFocus.focus();done(Math.max(50,200-mistakes*25));
 };
 overlay.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();leave();return;}
  if(event.key!=='Tab')return;
  const buttons=[...overlay.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons[buttons.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 });
 document.body.appendChild(overlay);load();shelf.querySelector('button').focus({preventScroll:true});
}
