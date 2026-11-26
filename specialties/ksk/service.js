'use strict';
window.openKskService=function(done,cancel){
 const key='sota_ksk_service_v1',fresh=()=>({diagnosed:false,inspect:false,cause:false,on:true,plug:true,dust:Array(60).fill(1),cable:true,screws:0,removed:false,cpu:1,base:1,paste:false,installed:false,verified:false});
 let s=fresh();try{const v=JSON.parse(localStorage.getItem(key));if(v?.dust?.length===60)s={...s,...v};}catch(e){}
 let tool='hand',held=false,last=null,closed=false,testing=false;
 const d=document.createElement('dialog');d.className='pc-service';d.setAttribute('aria-label','Ремонт и обслуживание ПК');
 const icon=id=>window.KskServiceArt.tool(id);
 d.innerHTML=` <header class="pc-topbar">
  <div class="pc-brand"><svg class="pc-logo" viewBox="0 0 60 60" aria-hidden="true"><path d="M4 17l10-17h20l10 17-10 17H14Z" fill="#328acb"/><path d="M27 39l10-17h19l10 17-10 17H37Z" fill="#c73950"/><path d="M4 52l10-17h20l10 17-10 17H14Z" fill="#8793a2"/></svg><div><b>СОТА</b><span>Смоленская областная<br>технологическая академия</span></div><strong>КСК</strong></div>
  <div class="pc-title"><h2>Сервисная мастерская</h2><p>Ремонт и обслуживание ПК</p></div>
  <button data-act="exit" class="pc-close ksk-minigame-exit" type="button" aria-label="&#1047;&#1072;&#1082;&#1088;&#1099;&#1090;&#1100; &#1084;&#1080;&#1085;&#1080;-&#1080;&#1075;&#1088;&#1091;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
 </header>
 <div class="pc-tutorial" role="status" aria-live="polite" aria-atomic="true"><strong class="pc-hint-title"></strong><p id="pc-instruction" class="pc-instruction"></p><button data-act="hint" aria-controls="pc-instruction" aria-expanded="false">Подсказка</button></div>
 <div class="pc-layout">

  <main class="pc-workbench"><div class="pc-scene">${window.KskServiceArt.scene()}<div class="pc-cursor"></div></div><div class="pc-switches"><div class="pc-power-summary"><span class="pc-power-caption"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v10M6.3 5.7a9 9 0 1 0 11.4 0"/></svg><span>Состояние питания</span></span><span class="pc-power-state" role="status" aria-live="polite"></span></div><button data-act="inspect">Осмотреть ПК</button><button data-act="power"></button><button data-act="plug"></button><button data-act="hold" aria-pressed="false">Фиксатор вентилятора</button></div></main>
  <aside class="pc-diag">
   <section class="pc-glass pc-diagnostic-card"><h3>Диагностика</h3><div class="pc-cpu-readout"><label><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="7" width="18" height="18" rx="3"/><rect x="12" y="12" width="8" height="8" rx="1"/><path d="M11 2v5m10-5v5M11 25v5m10-5v5M2 11h5m-5 10h5m18-10h5m-5 10h5"/></svg>Процессор</label><div class="temperature">95 <span>°C</span></div><div class="pc-thermal-track"><i></i></div><small class="pc-temp-caption">Критическая температура</small></div><div class="pc-gpu-readout"><label><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 8h25v16H3Zm25 4h3M7 24v4h13v-4"/><circle cx="12" cy="16" r="5"/><path d="M22 12v8"/></svg>Видеокарта</label><b>54 <span>°C</span></b><small>В пределах нормы</small></div><div class="pc-cooling-readout"><label>Система охлаждения</label><p class="cooling">Нет данных</p></div></section>
   <button data-act="diagnose" class="pc-primary">Запустить диагностику</button><div class="causes pc-glass" hidden><small>Причина неисправности</small><button data-cause="0">Видеокарта</button><button data-cause="1">Пыль и термоинтерфейс</button><button data-cause="0">Накопитель</button></div><div class="result"></div><button data-act="finish" class="pc-primary" hidden>В комнату КСК →</button>
  </aside>
 </div>
 <footer><nav class="pc-mobile-nav" aria-label="Навигация по мастерской"><button data-act="view-pc">Системный блок</button><button data-act="view-diagnostics">Диагностика</button></nav><div class="pc-tools">${Object.entries({hand:'Рука',driver:'Отвёртка',brush:'Кисть',air:'Сжатый воздух',cloth:'Салфетка',paste:'Термопаста'}).map(([id,n])=>`<button data-tool="${id}" aria-label="${n}" aria-pressed="${id==='hand'}">${icon(id)}<span>${n}</span></button>`).join('')}</div><div class="pc-feedback"><p role="status" class="pc-status"></p><button data-act="sound" class="pc-sound" aria-pressed="true" aria-label="Выключить звук">Звук: вкл.</button></div></footer>
 <dialog class="pc-exit-confirm" aria-labelledby="pc-exit-title" aria-describedby="pc-exit-description">
  <div class="qconfirm-box"><h3 class="qconfirm-title" id="pc-exit-title">Выйти из мини-игры?</h3>
  <p class="qconfirm-text" id="pc-exit-description">Вы точно хотите выйти? Вы потеряете <b>15 света</b>. Прогресс ремонта сохранится.</p>
  <div class="btnrow"><button type="button" class="btn ghost pc-exit-cancel" autofocus>Отмена</button><button type="button" class="btn danger pc-exit-accept">Выйти из мини-игры</button></div></div>
 </dialog>
`;
 document.body.append(d);d.showModal();const q=v=>d.querySelector(v),clean=()=>s.dust.every(v=>v<=.01),positions=[[230,145],[352,145],[230,272],[352,272]];
 let soundEnabled=true,audioContext=null,lastSound=0;
 function playSound(kind='click'){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!soundEnabled||!Audio||performance.now()-lastSound<65)return;
  lastSound=performance.now();
  try{
   audioContext=audioContext||new Audio();
   if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
   const osc=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
   osc.type=kind==='error'?'triangle':'sine';
   osc.frequency.setValueAtTime(kind==='error'?170:kind==='tool'?620:440,now);
   osc.frequency.exponentialRampToValueAtTime(kind==='error'?95:310,now+.07);
   gain.gain.setValueAtTime(.025,now);gain.gain.exponentialRampToValueAtTime(.001,now+.09);
   osc.connect(gain);gain.connect(audioContext.destination);osc.start(now);osc.stop(now+.1);
  }catch(e){/* Audio is optional; the station also works in silent browsers. */}
 }
 function msg(t,error=false){q('.pc-status').textContent=t;d.classList.toggle('pc-error',error);if(t)playSound(error?'error':'click');}
 // Instructions are derived from the repair state, including restored progress.
 // They never advance the repair or unlock an operation themselves.
 let tutorialId='',hintVisible=true,dustBuilt=false,dustNodes=[],previousDust=[];
 function tutorialStep(){
  const ui=(id,text,target)=>({id,text,target});
  const part=(id,text,rect)=>({id,text,rect});
  const select=(id,text)=>ui('tool-'+id,text,`[data-tool="${id}"]`);
  if(s.verified)return ui('success','Ремонт завершён! Процессор остыл с 95 до 52 °C при той же нагрузке. Вернитесь в комнату КСК.','[data-act="finish"]');
  if(testing)return ui('testing','Идёт повторная диагностика. Следите за снижением температуры процессора.','.temperature');
  if(!s.diagnosed)return ui('diagnose','Нажми на кнопку «Запустить диагностику». Она измерит температуру комплектующих.','[data-act="diagnose"]');
  if(!s.inspect)return ui('inspect','Температура процессора слишком высокая — 95 °C. Необходимо проверить систему охлаждения. Нажми «Осмотреть».','[data-act="inspect"]');
  if(!s.cause)return ui('cause','Пыль мешает отводу тепла, а термопаста передаёт тепло от процессора к кулеру. Выбери причину «Пыль и термоинтерфейс».','[data-cause="1"]');
  const repaired=clean()&&s.installed&&!s.screws&&s.cable;
  if(!repaired){
   if(s.on)return ui('off','Перед обслуживанием выключи компьютер кнопкой «Выключить ПК».','[data-act="power"]');
   if(s.plug)return ui('unplug','Теперь отключи питание. Только после этого можно касаться деталей.','[data-act="plug"]');
  }
  if(!clean()){
   if(tool!=='air'&&tool!=='brush')return select('brush','Возьми инструмент для очистки — антистатическую кисть. Можно также использовать сжатый воздух.');
   if(tool==='air'&&!held)return ui('hold','Перед продувкой нажми «Фиксатор вентилятора»: он удержит лопасти и не даст им раскручиваться.','[data-act="hold"]');
   const index=s.dust.findIndex(v=>v>.01),[x,y]=dustPos(index);
   return part('dust-'+index,'Наведи инструмент на подсвеченные загрязнения. Зажми кнопку мыши или палец и води по пыли, пока она не исчезнет. Простой щелчок не очищает.',[x-20,y-17,40,34]);
  }
  if(!s.installed&&!s.removed){
   if(s.cable){
    if(tool!=='hand')return select('hand','Выбери «Рука», чтобы отсоединить кабель вентилятора.');
    return part('disconnect','Нажми на светлый разъём CPU_FAN. Это кабель питания вентилятора: перед снятием кулера его нужно отсоединить.',[360,75,45,40]);
   }
   if(s.screws<4){
    if(tool!=='driver')return select('driver','Возьми отвёртку: она нужна, чтобы открутить четыре крепления кулера.');
    const [x,y]=positions[s.screws];
    return part('unscrew-'+s.screws,`Открути четыре крепления кулера. Нажми на подсвеченный винт № ${s.screws+1}. Готово: ${s.screws} из 4.`,[x-12,y-12,24,24]);
   }
   if(tool!=='hand')return select('hand','Выбери «Рука», чтобы снять освобождённый кулер.');
   return part('remove','Сними систему охлаждения: нажми на вентилятор в центре кулера. Под ним находится процессор.',[252,168,78,78]);
  }
  if(s.removed){
   if(s.cpu>.01||s.base>.01){
    if(tool!=='cloth')return select('cloth','Возьми безворсовую салфетку, чтобы удалить старую термопасту с двух поверхностей.');
    return s.cpu>.01
     ?part('wipe-cpu','Удали старую термопасту с процессора: зажми мышь или палец и протирай серое пятно до полного исчезновения.',[254,170,75,73])
     :part('wipe-base','Теперь протри основание снятого кулера — металлический квадрат справа. Обе поверхности должны быть чистыми.',[396,186,76,76]);
   }
   if(!s.paste){
    if(tool!=='paste')return select('paste','Возьми термопасту. Она заполнит мелкие зазоры между процессором и кулером.');
    return part('apply','Нанеси новую термопасту в центр процессора одним нажатием. Достаточно небольшой капли.',[274,190,32,32]);
   }
   if(tool!=='hand')return select('hand','Выбери «Рука», чтобы установить кулер обратно.');
   return part('install','Установи кулер обратно: нажми на процессор с новой термопастой. Затем потребуется закрепить кулер.',[252,168,78,78]);
  }
  if(s.screws){
   if(tool!=='driver')return select('driver','Возьми отвёртку, чтобы закрепить установленный кулер.');
   const i=4-s.screws,[x,y]=positions[i];
   return part('tighten-'+i,`Закрепи кулер: затяни подсвеченный винт № ${i+1}. Готово: ${i} из 4.`,[x-12,y-12,24,24]);
  }
  if(!s.cable){
   if(tool!=='hand')return select('hand','Выбери «Рука», чтобы подключить вентилятор.');
   return part('connect','Подключи кабель CPU_FAN нажатием на светлый разъём. Без питания вентилятора охлаждение не заработает.',[360,75,45,40]);
  }
  if(!s.plug)return ui('plug','Обслуживание закончено. Подключи питание компьютера.','[data-act="plug"]');
  if(!s.on)return ui('on','Включи компьютер. Вентиляторы и подсветка должны заработать.','[data-act="power"]');
  return ui('retest','Запусти повторную диагностику. Сравним температуру до и после ремонта при одинаковой нагрузке.','[data-act="diagnose"]');
 }
 function updateTutorial(repeat=false){
  const step=tutorialStep(),changed=step.id!==tutorialId;
  if(!changed&&!repeat)return;
  tutorialId=step.id;
  if(changed)hintVisible=true;
  if(repeat)hintVisible=true;
  q('.pc-tutorial').hidden=!hintVisible||s.verified;
  q('[data-act=hint]').setAttribute('aria-expanded',String(hintVisible));
  d.classList.toggle('pc-show-hint',hintVisible);
  d.classList.toggle('pc-guide-cleaning',step.id.startsWith('dust-'));
  d.querySelectorAll('.pc-guide-target').forEach(n=>n.classList.remove('pc-guide-target'));
  const toolNames={hand:'Рука',driver:'Отвёртка',brush:'Кисть',air:'Сжатый воздух',cloth:'Салфетка',paste:'Термопаста'};
  const toolActions={hand:'Выбери руку',driver:'Выбери отвёртку',brush:'Выбери кисть',air:'Выбери баллон',cloth:'Выбери салфетку',paste:'Выбери термопасту'};
  d.querySelectorAll('[data-tool]').forEach(n=>{
   if(toolNames[n.dataset.tool])n.querySelector('span').textContent=toolNames[n.dataset.tool];
  });
  if(step.id.startsWith('tool-')){
   const needed=step.id.slice(5);
   q(`[data-tool="${needed}"] span`).textContent=toolActions[needed];
  }
  const marker=q('.pc-guide-marker');
  marker.innerHTML='';
  if(step.rect){
   const [x,y,w,h]=step.rect;
   const label=step.id.startsWith('dust-')?'Участок загрязнения':step.id.startsWith('unscrew-')||step.id.startsWith('tighten-')?'Крепление кулера':step.id==='disconnect'||step.id==='connect'?'Разъём CPU_FAN':step.id==='wipe-base'?'Основание кулера':step.id==='remove'?'Процессорный кулер':'Поверхность CPU';
   marker.innerHTML=`<rect class="pc-guide-ring" x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/><g class="pc-guide-arrow" transform="translate(${x+w/2} ${y-8})"><path d="M0 -28V-4M-7 -11L0 -4 7 -11"/></g><g class="pc-guide-caption"><path d="M216 ${y-14}H${x-12}L${x} ${y}"/><rect x="8" y="${y-30}" width="208" height="32" rx="5"/><text x="20" y="${y-9}">${label}</text></g>`;
   // Size the plate from the rendered SVG text, including inherited font styles.
   const caption=marker.querySelector('.pc-guide-caption');
   const captionText=caption.querySelector('text');
   if(typeof captionText.getComputedTextLength==='function'){
    const right=20+Math.ceil(captionText.getComputedTextLength())+12;
    caption.querySelector('rect').setAttribute('width',Math.max(208,right-8));
    caption.querySelector('path').setAttribute('d',`M${Math.max(216,right)} ${y-14}H${x-12}L${x} ${y}`);
   }
  }else q(step.target)?.classList.add('pc-guide-target');
  q('.pc-instruction').textContent=step.text;
  const titles={diagnose:'Запусти диагностику',inspect:'Осмотри систему охлаждения',cause:'Определи причину перегрева',off:'Выключи компьютер',unplug:'Отключи питание',hold:'Зафиксируй вентилятор',disconnect:'Отсоедини кабель кулера',remove:'Сними кулер','wipe-cpu':'Протри процессор','wipe-base':'Протри основание кулера',apply:'Нанеси термопасту',install:'Установи кулер',connect:'Подключи кабель кулера',plug:'Подключи питание',on:'Включи компьютер',retest:'Проверь результат ремонта',testing:'Проверка под нагрузкой',success:'Ремонт завершён'};
  q('.pc-hint-title').textContent=titles[step.id]||toolActions[step.id.slice(5)]||(step.id.startsWith('dust-')?'Удали подсвеченную пыль':step.id.startsWith('unscrew-')?'Открути подсвеченный винт':'Закрепи кулер');
  const card=q('.pc-tutorial');
  card.dataset.step=step.id;
  // Restart only the reveal animation; advancing always requires a game action.
  card.classList.remove('pc-guide-reveal');
  void card.offsetWidth;
  card.classList.add('pc-guide-reveal');
  if(repeat&&hintVisible)card.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 function render(){
  updateTutorial();
  q('[data-act=diagnose]').textContent=testing?'Диагностика…':s.verified?'Проверка пройдена':s.installed?'Повторная диагностика':s.diagnosed?'Повторить измерение':'Запустить диагностику';
  q('[data-act=diagnose]').disabled=testing||s.verified;
  d.classList.toggle('pc-diagnosed',s.diagnosed);
  d.classList.toggle('pc-running',s.on);d.classList.toggle('pc-success',s.verified);
  q('.pc-power-state').textContent=s.on?'ПК включён':s.plug?'ПК выключен · кабель подключён':'ПК выключен · кабель отключён';
  q('[data-act=power]').textContent=s.on?'Выключить ПК':'Включить ПК';
  q('[data-act=plug]').textContent=s.plug?'Отключить питание':'Подключить питание';
  q('.cooler').classList.toggle('pc-lifted',s.removed);
  q('.base').classList.toggle('pc-base-hidden',!s.removed);
  q('.old-cpu').style.opacity=s.cpu;q('.old-base').style.opacity=s.base;
  q('.new-paste').classList.toggle('pc-no-paste',!s.paste);
  q('.cable').style.opacity=s.cable?1:.12;
  d.querySelectorAll('.screw').forEach((n,i)=>n.classList.toggle('pc-loose',s.installed?i>=4-s.screws:i<s.screws));
  q('.causes').hidden=!s.diagnosed||s.cause;
  q('.cooling').textContent=s.verified?'В норме · теплоотвод восстановлен':s.diagnosed?'Неудовлетворительное':'Ожидание диагностики';
  q('[data-act=finish]').hidden=!s.verified;
  q('.pc-temp-caption').textContent=s.verified?'РАБОЧАЯ ТЕМПЕРАТУРА':'ВЫШЕ РАБОЧЕЙ ТЕМПЕРАТУРЫ';
  d.querySelectorAll('[data-tool]').forEach(n=>{const selected=n.dataset.tool===tool;n.classList.toggle('selected',selected);n.setAttribute('aria-pressed',String(selected));});
  if(!dustBuilt){q('.dust').innerHTML=s.dust.map((v,i)=>{const [x,y]=dustPos(i);return `<g data-dust="${i}" opacity="${v}">${window.KskServiceArt.dust(i,x,y)}</g>`;}).join('');dustNodes=s.dust.map((_,i)=>q(`[data-dust="${i}"]`));dustBuilt=true;}
  s.dust.forEach((v,i)=>{if(previousDust[i]!==v)dustNodes[i].setAttribute('opacity',v);});previousDust=s.dust.slice();
  try{localStorage.setItem(key,JSON.stringify(s));}catch(e){}
 }
 function dustPos(i){return i<30?[242+i%6*20,160+Math.floor(i/6)*22]:[120+(i-30)%10*47,320+Math.floor((i-30)/10)*36];}
 const exitConfirmation=q('.pc-exit-confirm');let confirmingExit=false;
 function dismissExit(){confirmingExit=false;exitConfirmation.close();}
 q('.pc-exit-cancel').onclick=dismissExit;
 q('.pc-exit-accept').onclick=()=>{dismissExit();close(false,true);};
 exitConfirmation.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();dismissExit();});
 function close(ok,confirmed=false){if(closed)return;if(!ok&&!confirmed){if(!confirmingExit){confirmingExit=true;exitConfirmation.showModal();}return;}closed=true;if(audioContext)audioContext.close().catch(()=>{});d.close();d.remove();if(ok){try{localStorage.removeItem(key);}catch(e){}done(600);}else cancel();}
 d.addEventListener('cancel',e=>{e.preventDefault();close(false);});
 d.onclick=e=>{let t=e.target.closest('[data-tool]');if(t){playSound('tool');tool=t.dataset.tool;q('.pc-cursor').innerHTML=icon(tool);render();return;}t=e.target.closest('[data-cause]');if(t){if(s.diagnosed&&s.inspect&&t.dataset.cause==='1'){s.cause=true;msg('Причина установлена.');render();}else msg(s.inspect?'Показатели не подтверждают эту причину.':'Сначала осмотрите системный блок.',true);return;}const a=e.target.closest('[data-act]')?.dataset.act;if(a==='exit')return close(false);const mobileViews={'view-pc':'.pc-workbench','view-diagnostics':'.pc-diag'};if(mobileViews[a]){q(mobileViews[a]).scrollIntoView({behavior:'smooth',block:'start'});return;}if(a==='sound'){soundEnabled=!soundEnabled;q('[data-act=sound]').textContent=soundEnabled?'Звук: вкл.':'Звук: выкл.';q('[data-act=sound]').setAttribute('aria-pressed',String(soundEnabled));q('[data-act=sound]').setAttribute('aria-label',soundEnabled?'Выключить звук':'Включить звук');return;}if(a==='hint'){updateTutorial(true);return;}if(testing)return;if(a==='inspect'){s.inspect=true;msg('Радиатор забит пылью. Термоинтерфейс требует замены.');}if(a==='hold'){held=!held;q('[data-act=hold]').setAttribute('aria-pressed',held);}if(a==='power'){if(s.on){if(!s.cause)return msg('Сначала установите причину неисправности.',true);s.on=false;}else{if(!s.plug||s.removed||!s.cable||s.screws||s.cause&&!s.installed)return msg('Проверьте питание, крепления и подключение кулера.',true);s.on=true;}}if(a==='plug'){if(s.on)return msg('Сначала выключите ПК.',true);s.plug=!s.plug;}if(a==='diagnose'){if(!s.on||!s.plug)return msg('Для диагностики включите ПК.',true);if(!s.installed){s.diagnosed=true;msg('CPU 95 °C · GPU 54 °C. Нагрузка 100%, 60 виртуальных секунд.');}else if(clean()&&s.cable&&s.paste&&s.cpu<=.01&&s.base<=.01){testing=true;const start=performance.now();const tick=now=>{if(closed)return;const v=Math.min(1,(now-start)/3000);q('.pc-thermal-track i').style.width=(95-43*v)+'%';q('.temperature').innerHTML=Math.round(95-43*v)+' <span>°C</span>';if(v<1)requestAnimationFrame(tick);else{testing=false;s.verified=true;q('.result').innerHTML='<h3>Компьютер успешно обслужен!</h3><p>Нагрузка до и после: 100%, 60 виртуальных секунд</p><p>CPU: 95 → 52 °C<br>GPU: 54 → 54 °C</p>';msg('Система стабильна. Проверка пройдена.');render();}};requestAnimationFrame(tick);}}if(a==='finish'&&s.verified)return close(true);render();};
 const svg=q('.hardware');function point(e){let p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
 function use(p,moving){if(testing||s.verified)return;if(s.on||s.plug)return msg('Обслуживание запрещено: выключите ПК и отключите питание.',true);if(!s.cause)return msg('Сначала установите причину неисправности.',true);const cpu=p.x>250&&p.x<335&&p.y>170&&p.y<250,base=p.x>395&&p.x<475&&p.y>185&&p.y<265;
 if(tool==='air'||tool==='brush'){if(!moving)return;if(tool==='air'&&!held)return msg('Зафиксируйте вентилятор перед продувкой.',true);let hit=false;s.dust=s.dust.map((v,i)=>{const [x,y]=dustPos(i);if(Math.hypot(x-p.x,y-p.y)<34&&v>0){hit=true;return Math.max(0,v-(tool==='air'?.15:.1));}return v;});if(hit){for(let particleIndex=0;particleIndex<3;particleIndex++){let n=document.createElementNS('http://www.w3.org/2000/svg','circle');n.setAttribute('cx',p.x);n.setAttribute('cy',p.y);n.setAttribute('r',4);n.setAttribute('fill','#a4adb2');n.classList.add('pc-particle');n.style.setProperty('--dust-x',(20+Math.random()*40)+'px');n.style.setProperty('--dust-y',(-10-Math.random()*40)+'px');q('.particles').append(n);setTimeout(()=>n.remove(),650);}msg(clean()?'Все загрязнения удалены.':'');}render();return;}
 if(!clean())return msg('Сначала удалите пыль со всех участков.',true);
 if(tool==='cloth'&&moving&&s.removed){if(cpu)s.cpu=Math.max(0,s.cpu-.05);else if(base)s.base=Math.max(0,s.base-.05);render();return;}if(moving)return;
 if(tool==='hand'&&p.x>360&&p.x<410&&p.y>70&&p.y<120){if(!s.removed&&!s.installed){s.cable=false;msg('CPU_FAN отсоединён.');}else if(s.installed&&!s.screws){s.cable=true;msg('CPU_FAN подключён.');}else msg('Сначала закрепите кулер.',true);render();return;}
 if(tool==='driver'&&!s.cable&&!s.removed){const i=positions.findIndex(([x,y])=>Math.hypot(x-p.x,y-p.y)<20),expected=s.installed?4-s.screws:s.screws;if(i===expected&&i<4){s.screws+=s.installed?-1:1;msg(s.installed?'Крепление затянуто.':'Крепление ослаблено.');}else msg('Крепления пронумерованы: работайте по порядку.',true);render();return;}
 if(tool==='hand'&&cpu){if(!s.removed&&!s.installed&&s.screws===4&&!s.cable){s.removed=true;msg('Кулер снят.');}else if(s.removed&&s.paste){s.removed=false;s.installed=true;s.screws=4;msg('Кулер установлен. Закрепите его отвёрткой.');}else msg('Проверьте крепления, кабель и термоинтерфейс.',true);render();return;}
 if(tool==='paste'&&cpu&&s.removed&&s.cpu<=.01&&s.base<=.01&&!s.paste){s.paste=true;msg('Нанесена небольшая капля термопасты.');render();return;}msg('Действие не подходит для текущего состояния компонента.',true);}
 svg.onpointerdown=e=>{e.preventDefault();svg.setPointerCapture(e.pointerId);last=point(e);use(last,false);};svg.onpointermove=e=>{const p=point(e),r=q('.pc-scene').getBoundingClientRect();q('.pc-cursor').style.left=e.clientX-r.left+'px';q('.pc-cursor').style.top=e.clientY-r.top+'px';if(last&&Math.hypot(last.x-p.x,last.y-p.y)>=3){last=p;use(p,true);}};['pointerup','pointercancel','lostpointercapture'].forEach(n=>svg.addEventListener(n,()=>last=null));
 if(s.verified){s.verified=false;s.on=true;}render();
};
