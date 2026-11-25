'use strict';

window.openKskNetwork = function(done, cancel) {
  const model = new window.KskNetwork();
  const names = {internet:'Интернет',router:'Маршрутизатор',switch:'Коммутатор',server:'Сервер',dev1:'Разработка · ПК 1',dev2:'Разработка · ПК 2',design1:'Дизайн · ПК 1',design2:'Дизайн · ПК 2',printer:'Принтер'};
  const locations = {internet:[500,102],dev1:[180,250],dev2:[300,250],design1:[710,250],design2:[830,250],printer:[215,510]};
  const slots = {hub1:[500,305],hub2:[500,435],rack:[750,545]};
  let selected = null, startPort = null, closed = false, won = false, dragging = null;
  const dialog = document.createElement('dialog');
  dialog.className = 'ksk-network';
  dialog.setAttribute('aria-label', 'Прокладка сети');
  const logo = document.querySelector('.brand-header-logo .brand-hex-icon')?.outerHTML || '';
  const box = (x,y,w,h,depth=10,color='#5b566d') => `<path d="M${x} ${y}l${w} 0 12 -7 -${w} 0Z" fill="#8a819b"/><path d="M${x+w} ${y}l12 -7v${h}l-12 7Z" fill="#302d40"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${color}"/><path d="M${x} ${y+h}v${depth}h${w}v-${depth}" fill="#242334"/>`;
  function art(kind) {
    if (kind === 'internet') return '<g class="nw-internet-cloud"><path d="M-53 0a23 23 0 0 1 5-45 33 33 0 0 1 64-12 27 27 0 0 1 34 52H-53Z" fill="#152c48" stroke="#55d3ff" stroke-width="3"/><g transform="translate(0 -34)" fill="none" stroke="#65dcff" stroke-width="1.5"><circle r="13"/><ellipse rx="6" ry="13"/><path d="M-13 0h26M-11-6h22M-11 6h22"/></g><text x="0" y="-8" text-anchor="middle" fill="#e7f5ff" font-size="15" font-weight="600">Интернет</text></g>';
    if (kind === 'cable') return '<path d="M-35-18c-20 45 50 45 38 6S36-49 38-18" fill="none" stroke="#b6a0cb" stroke-width="5"/><rect x="-40" y="-29" width="11" height="17" rx="2" fill="#8e879c"/><rect x="32" y="-25" width="11" height="17" rx="2" fill="#8e879c"/>';
    if (kind === 'router' || kind === 'switch') return `${kind==='router'?'<path d="M-37-19v-29m70 29v-29" stroke="#a49aaf" stroke-width="5" stroke-linecap="round"/>':''}${box(-43,-23,84,21,3)}${Array.from({length:kind==='switch'?8:2},(_,i)=>`<rect x="${-35+i*(kind==='switch'?9:51)}" y="-17" width="6" height="5" fill="#131a25"/>`).join('')}<path d="M-30-27h42" stroke="#b7aaca" opacity=".5"/><circle class="nw-led" cx="33" cy="-7" r="2"/>`;
    if (kind === 'server') return `${box(-28,-91,54,83,8,'#454456')}${Array.from({length:5},(_,i)=>`<rect x="-22" y="${-84+i*14}" width="42" height="11" rx="1" fill="#242536"/><path d="M-18 ${-79+i*14}h20" stroke="#6c6b80" stroke-dasharray="2 2"/><circle class="nw-led" cx="13" cy="${-79+i*14}" r="2"/>`).join('')}`;
    if (kind === 'printer') return `${box(-45,-8,88,12,18,'#666170')}${box(-27,-45,52,32,3,'#aba6b5')}<path d="M-20-49v-21h36v21" fill="#ddd9e4"/><path d="M-15-63h24m-24 6h19" stroke="#938b9e"/><rect x="-18" y="-28" width="34" height="6" fill="#202433"/><path d="M-16-23h30v19h-30Z" fill="#e7e1eb"/><circle class="nw-led" cx="19" cy="-39" r="2"/>`;
    return `${box(-48,-4,94,10,22,'#756b7d')}<path d="M-41 26v14m78-14v14" stroke="#514b60" stroke-width="5"/>${box(-30,-65,60,39,2,'#8a8398')}<rect x="-26" y="-61" width="52" height="31" fill="${kind==='design'?'#39304e':'#1e3440'}"/><path d="M-20-52h21m-21 7h31m-31 7h16" stroke="${kind==='design'?'#ae8cbd':'#6c9d9c'}" stroke-width="2"/><path d="M-3-24v15m-12 0h25" stroke="#aca0b5" stroke-width="4"/><path d="M-27-1h46l-6 7h-46Z" fill="#272333"/><path d="M-20 1h27" stroke="#83798c" stroke-dasharray="2 2"/><g class="nw-monitor-online"><path d="M8-48h12v9H8Zm6 9v4m-6 0h12" fill="none" stroke="#a1e1bb" stroke-width="2"/></g><ellipse cx="3" cy="52" rx="22" ry="10" fill="#171520"/><path d="M-16 37q20-14 39 0v13q-20 13-39 0Z" fill="#514b63"/><path d="M-16 37v-14q20-12 39 0v14" fill="#635a76"/>`;
  }
  function room(id,x,y,title) {
    const plant=(px,py)=>`<g transform="translate(${px} ${py})"><path d="M-10 0h20l-3 20h-14Z" fill="#aca0b9"/><path d="M0 4v-38M0-8q-30-10-19-25Q0-28 0-8M0-18q7-30 21-23Q24-24 0-18M0-2q26-19 28-7Q18 4 0-2" fill="#60895f" stroke="#344f43" stroke-width="2"/></g>`;
    const shelf=(px,py)=>`<g transform="translate(${px} ${py})">${box(0,0,48,65,4,'#5d465c')}${[9,28,47].map((v,i)=>`<rect x="5" y="${v}" width="38" height="14" fill="#242235"/>${[0,1,2,3,4].map((n)=>`<rect x="${7+n*7}" y="${v+3}" width="4" height="11" fill="${['#9c7c97','#7e93a3','#ae976b'][(n+i)%3]}"/>`).join('')}`).join('')}</g>`;
    return `<g data-room="${id}" class="nw-room" transform="translate(${x} ${y})"><path d="M0 24L25 0H325L350 24V232L325 255H25L0 232Z" fill="#211d31" stroke="#171322" stroke-width="12"/><path class="nw-room-floor" d="M13 45H337V222L317 241H33L13 222Z"/><path d="M13 45H337V222L317 241H33L13 222Z" fill="url(#nw-floor)"/><path d="M0 184V24L25 0H325L350 24V184M0 218v14l25 23h300l25-23v-14" fill="none" stroke="#786489" stroke-width="16"/><path d="M3 182V27L29 5H321L347 27V182M7 233l22 17H321l22-17" fill="none" stroke="#b298c3" stroke-opacity=".4" stroke-width="3"/><path d="M26 21H324V86H26Z" fill="#3c314d"/><path d="M38 29H310M38 51H310M38 73H310" stroke="#554262"/><rect class="nw-room-sign" x="65" y="29" width="225" height="37" rx="8"/><text x="177" y="53" text-anchor="middle" class="nw-room-title">${title}</text><path d="M144 12h66" stroke="#ffe1a3" stroke-width="5" class="nw-lamp"/>
    ${id==='dev'||id==='design'?`${plant(40,115)}${shelf(270,85)}${id==='dev'?'<path d="M18 70l28-15v69l-28 15Z" fill="#9d73bb" stroke="#c6a2de" stroke-width="3"/><path d="M32 64v67m-14-28 28-15" stroke="#483558" stroke-width="4"/>':'<rect x="85" y="78" width="60" height="28" fill="#9a76ae" stroke="#cdb4d6"/><path d="M90 83h13v8H90m17-8h13v8h-13m17-8h13v8h-13M90 95h13v7H90m17-7h13v7h-13" fill="#758fa4"/>'}`:id==='print'?`${plant(42,160)}${box(48,157,44,56,5,'#705768')}${box(268,138,43,65,6,'#554b69')}<rect x="36" y="88" width="38" height="45" fill="#846b70" stroke="#b39388"/><path d="M43 95h22v26H43Z" fill="#c6bad0"/>`:`${shelf(285,165)}<g transform="translate(260 208)">${art('server')}</g><path d="M32 89h30v45H32Z" fill="#292538" stroke="#756183"/><path d="M37 95h20m-20 7h20m-20 7h20m-20 7h20" stroke="#81708e"/>`}</g>`;
  }
  dialog.innerHTML = `<header class="nw-header"><div class="nw-brand">${logo}<b>СОТА</b><span>КСК</span></div><div><h2>Прокладка сети</h2><p>Подключи оборудование и обеспечь связь между отделами</p></div><button class="nw-close" type="button" aria-label="Закрыть мини-игру">×</button></header>
    <div class="nw-layout"><div class="nw-viewport"><svg class="nw-office" viewBox="0 0 1000 660" aria-label="Офис с четырьмя помещениями">
    <defs><pattern id="nw-floor" width="32" height="24" patternUnits="userSpaceOnUse"><path d="M0 0H32V24H0Z M16 0V24" fill="none" stroke="#120e21" stroke-opacity=".5"/><path d="M1 1H31" stroke="#a089b4" stroke-opacity=".12"/></pattern></defs>
    <rect x="8" y="8" width="984" height="638" rx="18" fill="#211c30" stroke="#50405f" stroke-width="4"/>
    <rect x="8" y="8" width="984" height="638" rx="18" fill="url(#nw-floor)"/>
    <path d="M395 155V620H605V155" fill="#30283d" stroke="#695470" stroke-width="3"/>
    <path d="M405 190V609H595V190" fill="none" stroke="#ad9060" stroke-width="8" stroke-dasharray="8 9" opacity=".6"/>
    ${room('dev',35,85,'Отдел разработки')}
    ${room('design',615,85,'Отдел дизайна')}
    ${room('print',35,365,'Зона печати')}
    ${room('server',615,365,'Серверная')}
    <rect x="424" y="559" width="152" height="31" rx="5" fill="#43344e" stroke="#9978ac"/>
    <text x="500" y="580" text-anchor="middle" class="nw-zone-label">Техническая зона</text>
    <g class="nw-slots">${Object.entries(slots).map(([id,[x,y]])=>`<g data-slot="${id}" role="button" tabindex="0" aria-label="${id==='rack'?'Место в серверной':'Место в технической зоне'}"><path d="M${x-49} ${y}l49-25 49 25-49 25Z"/><text x="${x}" y="${y+5}" text-anchor="middle">+</text></g>`).join('')}</g>
    <g class="nw-cables"></g><g class="nw-devices"></g><g class="nw-ports"></g><path class="nw-draft" fill="none" pointer-events="none"/>
    </svg></div><aside class="nw-hint"><span class="nw-hint-mark" aria-hidden="true">i</span><h3>Подсказка</h3><p>Маршрутизатор обеспечивает выход в интернет, а коммутатор объединяет устройства локальной сети.</p></aside></div>
    <footer class="nw-footer"><div class="nw-tools">${['router','switch','server','cable'].map(kind=>`<button type="button" data-tool="${kind}" aria-pressed="false"><svg viewBox="-60 -105 120 145" aria-hidden="true">${art(kind)}</svg><span>${kind==='cable'?'Сетевой кабель':names[kind]}</span></button>`).join('')}</div><div class="nw-actions"><p class="nw-status" role="status" aria-live="polite">Перетащи оборудование в офис или выбери его и нажми на свободное место.</p><button class="nw-check" type="button">Проверить сеть</button></div></footer>`;
  document.body.append(dialog);
  const q = s => dialog.querySelector(s), svg=q('.nw-office');
  const tell = text => q('.nw-status').textContent=text;
  const pos = d => locations[d] || slots[model.placed[d]];
  function portPos(port) {
    const [device,p]=port.split(':'), [x,y]=pos(device);
    if(device==='switch') return [x-63+(Number(p)-1)*18,y+25];
    if(device==='router') return [x+(p==='wan'?-26:26),y+24];
    return [x,y+(device==='internet'?9:device==='server'?14:20)];
  }
  function route(a,b) {
    const [x,y]=portPos(a),[u,v]=portPos(b);
    const index=model.links.findIndex(l=>l.a===a&&l.b===b);
    const branch=(port,px,py)=>{
      const device=port.split(':')[0];
      if(['router','switch','internet'].includes(device))return [[px,py],[px,py+15],[500,py+15]];
      const left=px<500,wall=left?398-index*3:602+index*3;
      const rail=py<350?330:605;
      return [[px,py],[px,rail],[wall,rail],[wall,460+index*4],[500,460+index*4]];
    };
    const points=[...branch(a,x,y),...branch(b,u,v).reverse()];
    return points.map(([px,py],i)=>`${i?'L':'M'}${px} ${py}`).join(' ');
  }
  function render() {
    const status=model.status();
    q('.nw-devices').innerHTML=[...model.fixed,...Object.keys(model.placed)].map(d=>{
      const [x,y]=pos(d), kind=d.startsWith('dev')?'pc':d.startsWith('design')?'design':d;
      return `<g data-device="${d}" class="${status.active.has(d)?'nw-online':''}" transform="translate(${x} ${y})">${art(kind)}<text class="nw-device-label" text-anchor="middle" y="${d==='internet'?-50:d==='server'?-112:d==='router'||d==='switch'?-60:-85}">${names[d]}</text></g>`;
    }).join('');
    q('.nw-ports').innerHTML=[...model.fixed,...Object.keys(model.placed)].flatMap(d=>model.ports(d).map(p=>{
      const id=`${d}:${p}`, [x,y]=portPos(id), link=model.occupied(id);
      return `<g data-port="${id}" role="button" tabindex="0" aria-label="${names[d]}, порт ${p==='net'?'LAN':p.toUpperCase()}${link?', занят, нажми для отключения':''}" class="nw-port ${link?'nw-occupied':''} ${startPort===id?'nw-selected':''} ${link&&model.valid(link)&&status.active.has(d)?'nw-active':''}"><circle class="nw-port-hit" cx="${x}" cy="${y}" r="12"/><rect x="${x-5}" y="${y-4}" width="10" height="8" rx="1"/><text x="${x}" y="${y+22}" text-anchor="middle">${p==='net'?'LAN':p.toUpperCase()}</text></g>`;
    })).join('');
    q('.nw-cables').innerHTML=model.links.map(l=>{
      const d=route(l.a,l.b),active=model.valid(l)&&status.active.has(l.a.split(':')[0]);
      return `<g class="nw-link ${active?'nw-link-active':''}"><path class="nw-wire" d="${d}"/><path class="nw-wire-hit" d="${d}" data-link="${l.id}" role="button" tabindex="0" aria-label="Отсоединить кабель: ${names[l.a.split(':')[0]]} — ${names[l.b.split(':')[0]]}"/>${active?`<path class="nw-packet" d="${d}"/>`:''}</g>`;
    }).join('');
    for(const node of dialog.querySelectorAll('[data-slot]'))node.classList.toggle('nw-slot-used',Object.values(model.placed).includes(node.dataset.slot));
    for(const button of dialog.querySelectorAll('[data-tool]')){button.disabled=!!model.placed[button.dataset.tool]||won;button.setAttribute('aria-pressed',String(button.dataset.tool===selected));}
    const rooms={dev:['dev1','dev2'],design:['design1','design2'],print:['printer'],server:['server']};
    for(const [id,devices] of Object.entries(rooms))q(`[data-room="${id}"]`).classList.toggle('nw-room-online',devices.every(d=>status.active.has(d)));
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
    if(occupied){model.remove(occupied.id);startPort=null;tell('Кабель отсоединён.');}
    else if(startPort===id){startPort=null;tell('Прокладка кабеля отменена.');}
    else if(startPort){
      if(model.connect(startPort,id)){startPort=null;tell('Кабель подключён.');}
      else tell('Выбери свободный порт другого устройства.');
    } else {selected='cable';startPort=id;tell('Выбери порт второго устройства.');}
    q('.nw-draft').setAttribute('d','');render();
  }
  function coordinates(e) {const point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;return point.matrixTransform(svg.getScreenCTM().inverse());}
  function preview(e) {if(!startPort)return;const [x,y]=portPos(startPort),p=coordinates(e);q('.nw-draft').setAttribute('d',`M${x} ${y}L${x} ${y+15}L${p.x} ${p.y}`);}
  let portGesture=null;
  svg.addEventListener('pointerdown',e=>{
    const port=e.target.closest('[data-port]');
    if(!port||won||e.button!==0)return;
    e.preventDefault();portGesture={id:port.dataset.port,x:e.clientX,y:e.clientY,pointer:e.pointerId,moved:false};
    if(!startPort&&!model.occupied(port.dataset.port)){startPort=port.dataset.port;portGesture.started=true;preview(e);}
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
  function close(){if(closed)return;closed=true;dialog.remove();if(won)done(600);else cancel();}
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
};
