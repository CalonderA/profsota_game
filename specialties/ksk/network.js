'use strict';

window.openKskNetwork = function(done, cancel) {
  const model = new window.KskNetwork();
  const names = {internet:'Интернет',router:'Маршрутизатор',switch:'Коммутатор',server:'Сервер',dev1:'Разработка · ПК 1',dev2:'Разработка · ПК 2',design1:'Дизайн · ПК 1',design2:'Дизайн · ПК 2',printer:'Принтер'};
  const locations = {internet:[600,92],dev1:[176,230],dev2:[326,230],design1:[896,230],design2:[1046,230],printer:[244,494]};
  const slots = {hub1:[600,260],hub2:[600,410],rack:[920,520]};
  let selected = null, startPort = null, closed = false, won = false, dragging = null;
  const dialog = document.createElement('dialog');
  dialog.className = 'ksk-network';
  dialog.setAttribute('aria-label', 'Прокладка сети');
  const logo = document.querySelector('.brand-header-logo .brand-hex-icon')?.outerHTML || '';
  // Realistic raster layers; socket coordinates match the visible equipment fronts.
  const spriteSizes = {pc:[132,140,-66,-90],design:[144,132,-72,-82],router:[176,88,-88,-72],switch:[176,88,-88,-72],server:[80,128,-40,-112],printer:[128,128,-64,-96],internet:[128,80,-64,-72],cable:[128,80,-64,-60]};
  function art(kind) {
    const [w,h,x,y]=spriteSizes[kind];
    if(kind==='internet')return `<g class="nw-internet"><circle cy="-36" r="25"/><ellipse cy="-36" rx="11" ry="25"/><path d="M-25-36h50M-21-49h42M-21-23h42"/><text y="-73" text-anchor="middle">${names.internet}</text></g>`;
    const led=kind==='server'?Array.from({length:5},(_,i)=>`<circle class="nw-led" cx="16" cy="${-81+i*16}" r="1.3" style="animation-delay:${i*.21}s"/>`).join(''):'';
    return `<image class="nw-sprite" href="network-real/${kind}.webp" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>${led}`;
  }
  function room(id,x,y,title) {
    return `<g data-room="${id}" class="nw-room" transform="translate(${x} ${y})"><image class="nw-sprite" href="network-real/room-${id}.webp" width="440" height="240" preserveAspectRatio="none"/><rect class="nw-room-plaque" x="105" y="-18" width="230" height="25" rx="7"/><text x="220" y="0" text-anchor="middle" class="nw-room-title">${title}</text><circle class="nw-room-indicator" cx="322" cy="-6" r="3"/></g>`;
  }
  dialog.innerHTML = `<header class="nw-header"><div class="nw-brand">${logo}<b>СОТА</b><span>КСК</span></div><div><h2>Прокладка сети</h2><p>Подключи оборудование и обеспечь связь между отделами</p></div><button class="nw-close ksk-minigame-exit" type="button" aria-label="Закрыть мини-игру"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></header>
    <div class="nw-layout"><div class="nw-viewport"><svg class="nw-office" viewBox="0 0 1200 600" aria-label="Офис с четырьмя помещениями">

    ${room('dev',20,60,'Отдел разработки')}
    ${room('design',740,60,'Отдел дизайна')}
    ${room('print',20,330,'Зона печати')}
    ${room('server',740,330,'Серверная')}
    <text x="600" y="554" text-anchor="middle" class="nw-zone-label">Техническая зона</text>
    <g class="nw-slots">${Object.entries(slots).map(([id,[x,y]])=>`<g data-slot="${id}" role="button" tabindex="0" aria-label="${id==='rack'?'Место в серверной':'Место в технической зоне'}"><path d="M${x-80} ${y-70}h160v84h-160Z"/><text x="${x}" y="${y-16}" text-anchor="middle">+</text></g>`).join('')}</g>
    <g class="nw-cables"></g><g class="nw-devices"></g><g class="nw-ports"></g><path class="nw-draft" fill="none" pointer-events="none"/><g class="nw-guide-markers" aria-hidden="true" pointer-events="none"></g>
    </svg></div><aside class="nw-hint" aria-live="polite" aria-atomic="true"><h3></h3><p></p></aside></div>
    <footer class="nw-footer"><div class="nw-tools">${['router','switch','server','cable'].map(kind=>`<button type="button" data-tool="${kind}" aria-pressed="false"><svg viewBox="${kind==='server'?'-48 -118 96 138':kind==='cable'?'-70 -64 140 88':'-90 -76 180 96'}" aria-hidden="true">${art(kind)}</svg><span>${kind==='cable'?'Сетевой кабель':names[kind]}</span></button>`).join('')}</div><div class="nw-actions"><p class="nw-status" role="status" aria-live="polite">Перетащи оборудование в офис или выбери его и нажми на свободное место.</p><button class="nw-check" type="button">Проверить сеть</button></div></footer>`;
  document.body.append(dialog);
  const q = s => dialog.querySelector(s), svg=q('.nw-office');
  const mapNav=document.createElement('nav');
  mapNav.className='nw-map-nav';mapNav.setAttribute('aria-label','Помещения на карте');
  mapNav.innerHTML=[['hub','Сеть'],['dev','Разработка'],['design','Дизайн'],['print','Печать'],['server','Серверная']].map(([id,label])=>`<button type="button" data-map-room="${id}">${label}</button>`).join('');
  q('.nw-layout').append(mapNav);
  mapNav.addEventListener('click',event=>{
    const button=event.target.closest('[data-map-room]');if(!button)return;
    const id=button.dataset.mapRoom,viewport=q('.nw-viewport'),bounds=viewport.getBoundingClientRect();
    const point=svg.createSVGPoint();
    const centers={hub:[600,300],dev:[240,180],design:[960,180],print:[240,450],server:[960,450]};
    [point.x,point.y]=centers[id];const center=point.matrixTransform(svg.getScreenCTM());
    viewport.scrollTo({left:viewport.scrollLeft+center.x-bounds.left-viewport.clientWidth/2,top:viewport.scrollTop+center.y-bounds.top-viewport.clientHeight/2,behavior:'instant'});
    mapNav.querySelectorAll('button').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));
  });
  const tell = text => q('.nw-status').textContent=text;
  const pos = d => locations[d] || slots[model.placed[d]];
  function portPos(port) {
    const [device,p]=port.split(':'), [x,y]=pos(device);
    if(device==='switch') return [x-67+(Number(p)-1)*19.6,y-17];
    if(device==='router') return [x+(p==='wan'?-29:29),y+1];
    if(device==='internet')return [x,y-15];
    if(device==='server')return [x+17,y-9];
    if(device==='printer')return [x+51,y-8];
    return device.startsWith('design')?[x+56,y-35]:[x+51,y-43];
  }
  function route(a,b) {
    const [x,y]=portPos(a),[u,v]=portPos(b);
    const index=model.links.findIndex(l=>l.a===a&&l.b===b);
    const lane=570+index*9;
    const branch=(port,px,py)=>{
      const device=port.split(':')[0];
      if(['router','switch','internet'].includes(device))return [[px,py],[px,py+15],[lane,py+15]];
      const left=px<600,wall=left?490-index*3:710+index*3;
      const rail=py<310?282+index*2:554+index*3;
      return [[px,py],[px,rail],[wall,rail],[wall,460+index*4],[lane,460+index*4]];
    };
    const points=[...branch(a,x,y),...branch(b,u,v).reverse()];
    return points.map(([px,py],i)=>`${i?'L':'M'}${px} ${py}`).join(' ');
  }
  // Read-only coaching: derives the next action from the actual topology, so
  // alternative switch ports, out-of-order actions and disconnections still work.
  function renderGuide(status) {
    dialog.querySelectorAll('.nw-guide-target').forEach(node=>node.classList.remove('nw-guide-target'));
    q('.nw-guide-markers').innerHTML='';
    const highlight=selector=>q(selector)?.classList.add('nw-guide-target');
    const portName=id=>{const [device,port]=id.split(':');return `${names[device]} — ${port==='net'?'LAN':port.toUpperCase()}`;};
    const markPoint=(x,y,number)=>{
      q('.nw-guide-markers').insertAdjacentHTML('beforeend',`<g class="nw-guide-${number===1?'first':number===2?'second':'error'}"><circle class="nw-guide-ring" cx="${x}" cy="${y}" r="13"/><path class="nw-guide-arrow" d="M${x} ${y-26}V${y-15}m-5-6 5 6 5-6"/><circle class="nw-guide-badge" cx="${x}" cy="${y-40}" r="14"/><text x="${x}" y="${y-34}" text-anchor="middle">${number}</text></g>`);
    };
    const mark=(id,number)=>{
      highlight(`[data-port="${id}"]`);
      markPoint(...portPos(id),number);
    };
    const valid=model.links.filter(link=>model.valid(link));
    const step=Math.min(12,Object.keys(model.placed).length+valid.length+1);
    let heading=`Шаг ${step} из 12`,instruction='';
    if(won){heading='Готово!';instruction='Все устройства подключены. Нажми «Выйти в лабораторию».';highlight('.nw-check');}
    else if(status.invalid.length){
      const link=status.invalid[0];
      heading='Исправь соединение';
      instruction=`Кабель «${portName(link.a)} ↔ ${portName(link.b)}» подключён неверно. Нажми на выделенный порт, чтобы убрать его.`;
      mark(link.a,'×');
    } else {
      const device=['router','switch','server'].find(id=>!model.placed[id]);
      if(device){
        const slot=device==='server'?'rack':['hub1','hub2'].find(id=>!Object.values(model.placed).includes(id));
        const where=slot==='rack'?'в серверной':slot==='hub1'?'на верхней площадке между отделами':'на нижней площадке между отделами';
        highlight(`[data-tool="${device}"]`);highlight(`[data-slot="${slot}"]`);
        const [slotX,slotY]=slots[slot];
        markPoint(slotX,slotY-22,2);
        instruction=selected===device?`Нажми на выделенный «+» ${where}, чтобы установить ${names[device].toLowerCase()}.`:`Нажми «${names[device]}» внизу, затем на выделенный «+» ${where}. Можно перетащить оборудование.`;
      } else if(status.ok){
        instruction='Все 8 кабелей подключены правильно. Нажми «Проверить сеть», чтобы завершить задание.';highlight('.nw-check');
      } else {
        const sources=['internet:net','router:lan','dev1:net','dev2:net','design1:net','design2:net','printer:net','server:net'];
        const source=sources.find(id=>!valid.some(link=>link.a===id||link.b===id));
        const freeSwitch=model.ports('switch').map(p=>`switch:${p}`).filter(id=>!model.occupied(id));
        const target=source==='internet:net'?'router:wan':freeSwitch.includes(startPort)?startPort:freeSwitch[0];
        const endpoints=sources.slice(2).filter(id=>!model.occupied(id));
        if(endpoints.includes(source)&&(!startPort||freeSwitch.includes(startPort)||endpoints.includes(startPort))){
          // Switch = 1; all free computers, the printer and the server = 2.
          mark(target,1);
          if(endpoints.includes(startPort)){
            mark(startPort,2);
            instruction=`Выбрано: «${portName(startPort)}». Теперь нажми порт 1: «${portName(target)}», чтобы подключить устройство.`;
          } else {
            endpoints.forEach(id=>mark(id,2));
            instruction=startPort
              ?'Теперь нажми порт 2 на любом выделенном устройстве: компьютере, принтере или сервере. Для каждого нужен отдельный кабель.'
              :`Нажми порт 1: «${portName(target)}», затем порт 2 на любом выделенном устройстве. Подключи все компьютеры, принтер и сервер.`;
          }
        } else if(startPort&&startPort!==source&&startPort!==target){
          instruction=`Сначала отмени выбор: нажми ещё раз на выделенный порт «${portName(startPort)}». Затем покажу нужную пару.`;
          mark(startPort,'×');
        } else if(startPort){
          const next=startPort===source?target:source;
          instruction=`Теперь нажми порт 2: «${portName(next)}». Кабель появится после нажатия.`;
          mark(next,2);
        } else {
          instruction=`Нажми порт 1: «${portName(source)}», затем порт 2: «${portName(target)}».`;
          mark(source,1);mark(target,2);
        }
      }
    }
    // Avoid repeated screen-reader announcements when only selection paint changes.
    if(q('.nw-hint h3').textContent!==heading)q('.nw-hint h3').textContent=heading;
    if(q('.nw-hint p').textContent!==instruction)q('.nw-hint p').textContent=instruction;
    let legend=q('.nw-guide-legend');
    if(!legend){legend=document.createElement('div');legend.className='nw-guide-legend';q('.nw-hint').append(legend);}
    const connecting=!won&&!status.invalid.length&&Object.keys(model.placed).length===3&&!status.ok;
    const legendText=connecting
      ?startPort?'Порт уже выбран → нажми на выделенный второй конец кабеля.':'① СНАЧАЛА нажми порт с цифрой 1 → ② ЗАТЕМ нажми порт с цифрой 2.'
      :won?'Задание выполнено.':status.invalid.length?'× Нажми выделенный порт, чтобы снять ошибочный кабель.':status.ok?'Последнее действие: нажми подсвеченную кнопку внизу.':'СНАЧАЛА выбери подсвеченную карточку внизу → ЗАТЕМ нажми подсвеченный «+» на карте.';
    if(legend.textContent!==legendText)legend.textContent=legendText;
    dialog.dataset.guideState=connecting?'connect':status.invalid.length?'error':'place';
  }
  function render() {
    if(!startPort)q('.nw-draft').classList.remove('nw-blocked');
    const status=model.status();
    q('.nw-devices').innerHTML=[...model.fixed,...Object.keys(model.placed)].map(d=>{
      const [x,y]=pos(d), kind=d.startsWith('dev')?'pc':d.startsWith('design')?'design':d;
      return `<g data-device="${d}" class="${status.active.has(d)?'nw-online':''}" transform="translate(${x} ${y})">${art(kind)}<text class="nw-device-label" text-anchor="middle" y="${d==='internet'?-50:d==='server'?-112:d==='router'||d==='switch'?-84:-108}">${names[d]}</text></g>`;
    }).join('');
    q('.nw-ports').innerHTML=[...model.fixed,...Object.keys(model.placed)].flatMap(d=>model.ports(d).map(p=>{
      const id=`${d}:${p}`, [x,y]=portPos(id), link=model.occupied(id);
      return `<g data-port="${id}" role="button" tabindex="0" aria-label="${names[d]}, порт ${p==='net'?'LAN':p.toUpperCase()}${link?', занят, нажми для отключения':''}" class="nw-port ${link?'nw-occupied':''} ${startPort===id?'nw-selected':''} ${link&&model.valid(link)&&status.active.has(d)?'nw-active':''}"><circle class="nw-port-hit" cx="${x}" cy="${y}" r="12"/><rect x="${x-5}" y="${y-4}" width="10" height="8"/><text x="${x}" y="${y+19}" text-anchor="middle">${p==='net'?'LAN':p.toUpperCase()}</text></g>`;
    })).join('');
    q('.nw-cables').innerHTML=model.links.map(l=>{
      const d=route(l.a,l.b),active=model.valid(l)&&status.active.has(l.a.split(':')[0]);
      return `<g class="nw-link ${active?'nw-link-active':''}"><path class="nw-wire" d="${d}"/><path class="nw-wire-hit" d="${d}" data-link="${l.id}" role="button" tabindex="0" aria-label="Отсоединить кабель: ${names[l.a.split(':')[0]]} — ${names[l.b.split(':')[0]]}"/>${active?`<path class="nw-packet" d="${d}"/>`:''}</g>`;
    }).join('');
    for(const node of dialog.querySelectorAll('[data-slot]'))node.classList.toggle('nw-slot-used',Object.values(model.placed).includes(node.dataset.slot));
    for(const button of dialog.querySelectorAll('[data-tool]')){button.disabled=!!model.placed[button.dataset.tool]||won;button.setAttribute('aria-pressed',String(button.dataset.tool===selected));}
    const rooms={dev:['dev1','dev2'],design:['design1','design2'],print:['printer'],server:['server']};
    for(const [id,devices] of Object.entries(rooms))q(`[data-room="${id}"]`).classList.toggle('nw-room-online',devices.every(d=>status.active.has(d)));
    renderGuide(status);
    for(const node of dialog.querySelectorAll('[data-slot]')){
      const blocked=!!selected&&selected!=='cable'&&!model.canPlace(selected,node.dataset.slot);
      node.classList.toggle('nw-blocked',blocked);
      node.setAttribute('aria-disabled',String(blocked));
    }
    for(const node of dialog.querySelectorAll('[data-port]')){
      const blocked=!!startPort&&node.dataset.port!==startPort&&!model.canConnect(startPort,node.dataset.port);
      node.classList.toggle('nw-blocked',blocked);
      node.setAttribute('aria-disabled',String(blocked));
    }
  }
  function choose(tool) {
    if(won||model.placed[tool])return;
    selected=tool; startPort=null;q('.nw-draft').setAttribute('d','');render();
    tell(tool==='cable'?'Нажми на порт, затем на второй. Чтобы снять кабель, нажми на него или на занятый порт.':'Выбери свободное место в офисе.');
  }
  function place(slot) {
    if(won||!selected||selected==='cable')return;
    if(model.place(selected,slot)){selected=null;tell('Оборудование установлено. Соединяй устройства через сетевые порты.');render();}
    else tell('Здесь это оборудование не помещается. Попробуй другое свободное место.');
  }
  function usePort(id) {
    if(won)return;
    const occupied=model.occupied(id);
    if(occupied&&!startPort){model.remove(occupied.id);startPort=null;tell('Кабель отсоединён.');}
    else if(startPort===id){startPort=null;tell('Прокладка кабеля отменена.');}
    else if(startPort){
      if(model.connect(startPort,id)){startPort=null;tell('Кабель подключён.');}
      else tell('Сюда нельзя подключить кабель. Выбери совместимый свободный порт без красной подсветки.');
    } else {selected='cable';startPort=id;tell('Выбери порт второго устройства.');}
    q('.nw-draft').setAttribute('d','');render();
  }
  function coordinates(e) {const point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;return point.matrixTransform(svg.getScreenCTM().inverse());}
  function preview(e) {if(!startPort)return;const [x,y]=portPos(startPort),p=coordinates(e);q('.nw-draft').setAttribute('d',`M${x} ${y}L${x} ${y+15}L${p.x} ${p.y}`);const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-port]');q('.nw-draft').classList.toggle('nw-blocked',!!target&&target.dataset.port!==startPort&&!model.canConnect(startPort,target.dataset.port));}
  let portGesture=null;
  svg.addEventListener('pointerdown',e=>{
    const port=e.target.closest('[data-port]');
    if(!port||won||e.button!==0)return;
    e.preventDefault();portGesture={id:port.dataset.port,x:e.clientX,y:e.clientY,pointer:e.pointerId,moved:false};
    if(!startPort&&!model.occupied(port.dataset.port)){startPort=port.dataset.port;portGesture.started=true;render();preview(e);}
  });
  dialog.addEventListener('pointermove',e=>{
    preview(e);
    if(portGesture&&portGesture.pointer===e.pointerId&&Math.hypot(e.clientX-portGesture.x,e.clientY-portGesture.y)>7)portGesture.moved=true;
    if(dragging&&dragging.pointer===e.pointerId){dragging.moved ||= Math.hypot(e.clientX-dragging.x,e.clientY-dragging.y)>7;dragging.ghost.style.left=`${e.clientX}px`;dragging.ghost.style.top=`${e.clientY}px`;dragging.ghost.hidden=!dragging.moved;}
  });
  dialog.addEventListener('pointerup',e=>{
    if(portGesture&&portGesture.pointer===e.pointerId){
      const g=portGesture;portGesture=null;
      const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-port]');
      if(g.moved){if(target&&target.dataset.port!==g.id)usePort(target.dataset.port);else {startPort=null;q('.nw-draft').setAttribute('d','');render();}}
      else if(g.started){selected='cable';render();tell('Выбери порт второго устройства.');}
      else usePort(g.id);
    }
    if(dragging&&dragging.pointer===e.pointerId){
      const d=dragging;dragging=null;d.ghost.remove();
      if(d.moved){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');if(target)place(target.dataset.slot);else tell('Перенеси оборудование на свободную площадку в офисе.');}
    }
  });
  function resetGesture(){if(dragging){dragging.ghost.remove();dragging=null;}portGesture=null;startPort=null;q('.nw-draft').setAttribute('d','');render();}
  dialog.addEventListener('pointercancel',resetGesture);
  for(const button of dialog.querySelectorAll('[data-tool]')){
    button.addEventListener('pointerdown',e=>{
      if(e.button!==0||button.disabled)return;
      choose(button.dataset.tool);
      if(button.dataset.tool==='cable')return;
      const ghost=document.createElement('div');ghost.className='nw-drag-ghost';ghost.innerHTML=button.innerHTML;ghost.hidden=true;dialog.append(ghost);
      dragging={pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false,ghost};button.setPointerCapture(e.pointerId);
    });
    button.addEventListener('click',e=>{if(e.detail===0)choose(button.dataset.tool);});
  }
  dialog.addEventListener('click',e=>{
    if(won)return;
    const slot=e.target.closest('[data-slot]');if(slot)place(slot.dataset.slot);
    const wire=e.target.closest('[data-link]');if(wire){model.remove(Number(wire.dataset.link));startPort=null;q('.nw-draft').setAttribute('d','');render();tell('Кабель отсоединён.');}
  });
  dialog.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.key==='Escape'&&(startPort||selected)){e.preventDefault();selected=null;resetGesture();return;}
    if(e.key!=='Enter'&&e.key!==' ')return;
    const port=e.target.closest('[data-port]'),slot=e.target.closest('[data-slot]'),wire=e.target.closest('[data-link]');
    if(port||slot||wire){e.preventDefault();const selector=port?`[data-port="${port.dataset.port}"]`:null;if(port)usePort(port.dataset.port);else if(slot)place(slot.dataset.slot);else if(!won){model.remove(Number(wire.dataset.link));render();}if(selector)q(selector)?.focus();}
  });
  function close(confirmed=false){
    if(closed)return;
    if(!won&&confirmed!==true){
      resetGesture();
      window.confirmKskMinigameExit(dialog,()=>close(true));
      return;
    }
    closed=true;dialog.close();dialog.remove();if(won)done(600);else cancel();
  }
  q('.nw-close').onclick=close;
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  q('.nw-check').onclick=()=>{
    if(won){close();return;}
    startPort=null;selected=null;q('.nw-draft').setAttribute('d','');
    const result=model.status();
    if(result.ok){won=true;dialog.classList.add('nw-won');tell('Сеть успешно настроена!');q('.nw-check').textContent='Выйти в лабораторию';render();}
    else {render();tell(`Без связи: ${result.missing.map(d=>names[d]).join(', ') || 'проверь лишние соединения'}.${result.invalid.length?' Есть несовместимые соединения.':''}`);}
  };
  render();dialog.showModal();
  if(window.matchMedia('(max-width:760px)').matches)mapNav.querySelector('[data-map-room="hub"]').click();
};
