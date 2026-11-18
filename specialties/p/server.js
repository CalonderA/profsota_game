'use strict';

// Все скрипты выполняются только в учебной симуляции.
const P_SERVER_STEPS = [
 {title:'Подготовка резервной копии',goal:'Создайте папку backups, скопируйте в неё server.conf и перейдите в эту папку.',file:'backup.sh',lines:[['comment','# Подготовка резервной копии'],['slot','mkdir backups'],['code','cp server.conf backups/'],['slot','cd backups'],['code','pwd']],words:['mkdir backups','cd backups','mv server.conf backups/','rm -r backups'],hint:'mkdir создаёт папку, cp копирует файл, cd меняет папку.',output:'/home/admin/backups\nРезервная копия server.conf сохранена.'},
 {title:'Проверка журналов',goal:'Перейдите в /var/log/nginx и найдите строки с текстом error в файле error.log.',file:'logs.sh',lines:[['comment','# Диагностика веб-сервера'],['slot','cd /var/log/nginx'],['code','ls'],['slot','grep error error.log']],words:['cd /var/log/nginx','grep error error.log','mkdir error.log','mv error.log access.log'],hint:'cd меняет папку. grep ищет строки с заданным текстом в файле.',output:'error: permission denied\nПричина найдена: у файла сайта неверные права доступа.'},
 {title:'Восстановление доступа',goal:'Перейдите в /var/www/sota и установите права 644 для index.html: владелец читает и пишет, остальные только читают.',file:'permissions.sh',lines:[['comment','# Восстановление доступа к странице'],['slot','cd /var/www/sota'],['code','ls -l index.html'],['slot','chmod 644 index.html']],words:['cd /var/www/sota','chmod 644 index.html','rm index.html','chmod 000 index.html'],hint:'chmod меняет права. 644 даёт владельцу чтение и запись, остальным — чтение.',output:'-rw-r--r-- index.html\nПрава исправлены. Сервер может прочитать страницу.'},
 {title:'Применение настроек',goal:'Проверьте конфигурацию Nginx, затем перечитайте настройки службы и проверьте HTTP-ответ сайта.',file:'deploy.sh',lines:[['comment','# Проверка и применение конфигурации'],['slot','sudo nginx -t'],['slot','sudo systemctl reload nginx'],['code','curl -I http://localhost']],words:['sudo nginx -t','sudo systemctl reload nginx','sudo systemctl stop nginx','sudo nginx -v'],hint:'nginx -t проверяет настройки, systemctl reload перечитывает их без полной остановки.',output:'nginx: configuration test is successful\nHTTP/1.1 200 OK\nСайт восстановлен. Инцидент закрыт!'}
];
const P_LINUX_MEMO = [['ls','Показать содержимое папки'],['cd','Перейти в другую папку'],['pwd','Показать текущий путь'],['mkdir','Создать папку'],['rm','Удалить файл или папку'],['cp','Копировать файлы'],['mv','Переместить или переименовать'],['cat','Показать содержимое файла'],['grep','Найти строки в файле'],['chmod','Изменить права доступа'],['nginx -t','Проверить конфигурацию Nginx'],['systemctl reload','Перечитать настройки службы'],['curl -I','Проверить HTTP-заголовки']];

window.openPServerGame = function(done,cancel){
 let stage=0,mistakes=0,solved=false,closed=false,drag=null,activeSlot=0,slots=[],values=[];
 const previousFocus=document.activeElement,overlay=document.createElement('div');
 overlay.className='p-algorithm-overlay p-linux-overlay';
 overlay.innerHTML=`<section class="p-linux-game" role="dialog" aria-modal="true" aria-labelledby="pServerTitle">
 <details class="p-linux-memo" open><summary><img class="p-linux-penguin" src="../../assets/linux-penguin.svg" alt="" aria-hidden="true"><span>Памятка:<br>команды <em>Linux</em></span></summary><dl class="p-linux-memo-list"></dl></details>
 <div class="p-linux-main"><button type="button" class="qclose p-minigame-exit p-game-close" title="Выйти из мини-игры (−15 света)" aria-label="Выйти из мини-игры: минус 15 света">✕</button><header class="p-linux-header">
 <svg class="p-linux-server-icon" viewBox="0 0 110 112" aria-hidden="true"><defs><linearGradient id="serverMetal" x2="1" y2="1"><stop stop-color="#697087"/><stop offset="1" stop-color="#303747"/></linearGradient></defs><g stroke="#81899d" stroke-width="1.2"><path d="M8 28 64 8 102 23 46 44Z" fill="url(#serverMetal)"/><path d="M8 28v20l38 16V44Z" fill="#3c4356"/><path d="m46 44 56-21v20L46 64Z" fill="#242a38"/><path d="M8 53v20l38 16V69Z" fill="#3c4356"/><path d="m46 69 56-21v20L46 89Z" fill="#242a38"/><path d="M8 78v20l38 13V94Z" fill="#3c4356"/><path d="m46 94 56-21v20l-56 18Z" fill="#242a38"/></g><g fill="#ffad32"><path d="m60 45 30-11v5L60 50Zm0 25 30-11v5L60 75Zm0 24 30-11v5L60 99Z"/><path d="M34 43h4v5h-4zm0 25h4v5h-4zm0 24h4v5h-4z"/></g><g stroke="#181d2b" stroke-width="4"><path d="m15 37 12 5m-12 20 12 5m-12 20 12 5"/></g></svg>
 <div class="p-linux-heading"><h2 id="pServerTitle">Задание</h2><p class="p-task"></p></div></header>
 <p class="p-progress"></p><h3 class="p-stage-title" hidden></h3>
 <div class="p-linux-editor"><div class="p-linux-editor-bar"><span class="p-linux-terminal-icon">&gt;_</span><span class="p-linux-file"></span><span class="p-linux-lights" aria-hidden="true"><i></i><i></i><i></i></span></div><div class="p-linux-lines"></div><pre class="p-linux-output" aria-label="Результат выполнения"></pre></div>
 <p class="p-feedback" role="status" aria-live="polite"></p>
 <div class="p-linux-options"><p>⠿ Выберите фрагменты и перетащите в код:</p><div class="p-server-choices" role="group" aria-label="Фрагменты скрипта"></div><small>Можно нажать на пропуск, затем на нужный фрагмент.</small></div>
 <footer class="p-linux-actions"><button type="button" class="p-server-reset">⟳ Сбросить</button><button type="button" class="p-server-check">✓ Проверить</button><button type="button" class="p-server-next" hidden>Следующий этап →</button></footer>
 <div class="p-linux-exit-row"><small class="p-linux-exit-note">Выход по крестику или Escape: −15 света. Практика начнётся заново.</small></div></div></section>`;
 const q=s=>overlay.querySelector(s),bank=q('.p-server-choices'),check=q('.p-server-check'),next=q('.p-server-next'),reset=q('.p-server-reset'),feedback=q('.p-feedback');
 P_LINUX_MEMO.forEach(([command,description])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=command;dd.textContent=description;row.append(dt,dd);q('.p-linux-memo-list').appendChild(row);});
 if(window.matchMedia?.('(max-width: 760px)').matches)q('.p-linux-memo').open=false;
 function clearDrag(){if(!drag)return;drag.ghost?.remove();drag=null;slots.forEach(slot=>slot.classList.remove('drag-over'));}
 function focusSlot(index){activeSlot=index;slots.forEach((slot,i)=>slot.classList.toggle('active',i===index&&!solved));}
 function update(){
  slots.forEach((slot,i)=>{slot.textContent=values[i]||'Перетащите сюда';slot.setAttribute('aria-label','Пропуск '+(i+1)+': '+(values[i]||'пусто'));});
  bank.querySelectorAll('button').forEach(button=>button.disabled=solved||values.includes(button.dataset.fragment));check.disabled=solved||values.some(value=>!value);
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
    button.onclick=()=>{if(solved)return;values[index]='';focusSlot(index);update();feedback.textContent='Выберите фрагмент снизу для пропуска '+(index+1)+'.';};row.appendChild(button);
   }else{
    const code=document.createElement('code');code.className=kind==='comment'?'p-linux-comment':'p-linux-code';
    if(kind==='comment')code.textContent=text;else {const split=text.indexOf(' '),command=document.createElement('span');command.className='p-linux-command';command.textContent=split===-1?text:text.slice(0,split);code.appendChild(command);if(split!==-1)code.appendChild(document.createTextNode(text.slice(split)));}row.appendChild(code);
   }
   q('.p-linux-lines').appendChild(row);
  });
  const words=[...step.words];for(let i=words.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[words[i],words[j]]=[words[j],words[i]];}
  words.forEach(word=>{
   const button=document.createElement('button');button.type='button';button.className='p-server-choice';button.dataset.fragment=word;
   const grip=document.createElement('span');grip.className='p-linux-grip';grip.textContent='⠿';grip.setAttribute('aria-hidden','true');button.append(grip,document.createTextNode(word));let skipClick=false;
   button.onclick=()=>{if(skipClick){skipClick=false;return;}insert(word);};
   button.addEventListener('pointerdown',event=>{if(solved||closed||event.button!==0)return;clearDrag();skipClick=false;button.setPointerCapture(event.pointerId);drag={pointer:event.pointerId,x:event.clientX,y:event.clientY,ghost:null};});
   function hit(event){return slots.findIndex(slot=>{const r=slot.getBoundingClientRect();return event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;});}
   button.addEventListener('pointermove',event=>{
    if(!drag||drag.pointer!==event.pointerId)return;if(!drag.ghost&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<7)return;
    if(!drag.ghost){drag.ghost=document.createElement('div');drag.ghost.className='p-program-ghost p-linux-ghost';drag.ghost.textContent=word;document.body.appendChild(drag.ghost);}
    drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';const index=hit(event);slots.forEach((slot,i)=>slot.classList.toggle('drag-over',i===index));
   });
   button.addEventListener('pointerup',event=>{if(!drag||drag.pointer!==event.pointerId)return;const moved=!!drag.ghost,index=hit(event);clearDrag();if(moved){skipClick=true;event.preventDefault();if(index!==-1)insert(word,index);}});
   button.addEventListener('pointercancel',clearDrag);button.addEventListener('lostpointercapture',clearDrag);bank.appendChild(button);
  });
  check.hidden=false;next.hidden=true;reset.disabled=false;feedback.textContent='';focusSlot(0);update();slots[0].focus();
 }
 reset.onclick=()=>{if(solved||closed)return;clearDrag();values=values.map(()=>'');slots.forEach(slot=>{slot.classList.remove('incorrect');slot.removeAttribute('aria-invalid');});focusSlot(0);update();feedback.textContent='Пропуски очищены.';slots[0].focus();};
 check.onclick=()=>{
  if(solved||closed||values.some(value=>!value))return;const step=P_SERVER_STEPS[stage],answers=step.lines.filter(line=>line[0]==='slot').map(line=>line[1]),wrong=values.map((value,i)=>value!==answers[i]);
  slots.forEach((slot,i)=>{slot.classList.toggle('incorrect',wrong[i]);slot.setAttribute('aria-invalid',String(wrong[i]));});
  if(wrong.some(Boolean)){mistakes++;feedback.textContent='Проверьте выделенные строки. '+step.hint;focusSlot(wrong.indexOf(true));return;}
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
