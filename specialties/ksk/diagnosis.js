'use strict';

window.openKskDiagnosis = function(done, cancel) {
  // Each part has its own load scenario: a high temperature alone is not a fault.
  const parts = [
    {id:'cpu', name:'Процессор (CPU)', x:260, y:190, w:125, h:105, normal:62, hot:103},
    {id:'ram', name:'Оперативная память (ОЗУ)', x:425, y:165, w:68, h:160, normal:41, hot:86,
      outline:'M425 165H455V325H425Z M463 165H493V325H463Z'},
    {id:'gpu', name:'Видеокарта (GPU)', x:150, y:395, w:350, h:106, normal:72,
      outline:'M150 407L162 395H488L500 407V489L488 501H162L150 489Z'},
    {id:'ssd', name:'M.2 SSD', x:265, y:335, w:160, h:34, normal:47, hot:72},
    {id:'vrm', name:'Питание процессора (VRM)', x:200, y:110, w:200, h:180, normal:74, hot:110,
      outline:'M218 110H400V158H244V290H200V172H218Z'},
    {id:'chipset', name:'Чипсет', x:438, y:535, w:72, h:62, normal:56, hot:98},
    {id:'cooling', name:'Система охлаждения', x:620, y:155, w:110, h:340, normal:39}
  ];
  const order = parts.map((_, i) => i).filter(i=>parts[i].hot!==undefined);
  for (let i=order.length-1; i>0; i--) {
    const j=Math.floor(Math.random()*(i+1));
    [order[i],order[j]]=[order[j],order[i]];
  }
  const faults=new Set(order.slice(0,2)), found=new Set(), timers=new Map();
  let mistakes=0, closed=false, gesture=null;
  const prefix='thermal-'+Math.random().toString(36).slice(2);
  const rect=(x,y,w,h,r=4,fill='var(--body, #303441)')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
  const rows=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
  const screw=(x,y)=>`<circle cx="${x}" cy="${y}" r="4" fill="#858493"/><path d="M${x-2} ${y}h4" stroke="#242430"/>`;
  const fan=(x,y,r)=>`<g transform="translate(${x} ${y})"><circle r="${r}" fill="var(--dark,#14151e)" stroke="var(--edge,#777184)" stroke-width="3"/><g>${rows(7,i=>`<path d="M0 -8Q${r*.9} -${r*.9} ${r*.8} 0Q${r*.35} ${r*.3} 3 7Z" transform="rotate(${i*360/7})" fill="var(--metal,#62616f)"/>`)}</g><circle r="${r*.23}" fill="var(--body,#44414f)" stroke="var(--edge,#8c839b)"/><circle r="3" fill="#aaa3b7"/></g>`;
  const art={
    cpu:`${rect(260,196,125,105,7,'#10131b')}${rect(260,190,125,105,7)}${rect(270,200,105,85,4,'var(--metal,#777789)')}${rect(280,210,85,65,6,'var(--body,#454454)')}<path d="M280 215H360V269" fill="none" stroke="var(--edge,#a9a2b9)" stroke-width="2"/>${rows(8,i=>`<path d="M${276+i*13} 191v-5M${276+i*13} 296v5" stroke="#99917d" stroke-width="3"/>`)}${screw(266,196)}${screw(379,289)}<text x="322" y="249" text-anchor="middle" fill="var(--edge,#c3bdce)" font-size="14" letter-spacing="3">CPU</text>`,
    ram:rows(2,i=>{const x=425+i*38;return `${rect(x,169,30,160,3,'#10131b')}${rect(x,165,30,160,3,'var(--body,#34483f)')}${rows(6,j=>rect(x+4,179+j*21,22,15,2,'var(--metal,#56515f)'))}${rect(x+1,164,28,8,2,'var(--edge,#aaa2b5)')}${rect(x+1,318,28,8,2,'var(--edge,#aaa2b5)')}<path d="M${x+28} 179v132" stroke="#bda87c" stroke-width="2"/>`;}),
    gpu:`<path d="M150 407L162 395H488L500 407V489L488 501H162L150 489Z" fill="var(--body,#40404e)"/><path d="M150 489L162 501H488L500 489V500L488 512H162L150 500Z" fill="#171923"/><path d="M165 401H485M166 495H484" stroke="var(--edge,#a29aaa)" stroke-width="2"/>${fan(250,448,43)}${fan(397,448,43)}${rect(139,403,9,94,2,'var(--metal,#8c8a95)')}${rows(4,i=>rect(143,411+i*20,6,12,1,'#171822'))}${rows(5,i=>rect(302+i*9,406,4,82,1,'var(--dark,#20212b)'))}`,
    ssd:`${rect(265,339,160,34,4,'#111721')}${rect(265,335,160,34,4,'var(--body,#3b4f4d)')}${rows(3,i=>rect(281+i*38,341,30,22,2,'var(--metal,#333442)'))}<path d="M414 340v24" stroke="#d1b979" stroke-width="7"/>${screw(270,352)}`,
    vrm:`<path d="M218 110H400V158H244V290H200V172H218Z" fill="var(--body,#4d495c)"/>${rows(10,i=>rect(226+i*17,115,9,37,2,'var(--metal,#888092)'))}${rows(7,i=>rect(205,179+i*15,33,8,2,'var(--metal,#888092)'))}`,
    chipset:`${rect(438,541,72,62,6,'#11131e')}${rect(438,535,72,62,6)}${rows(7,i=>`<path d="M${442+i*9} 544l12 42" stroke="var(--metal,#8c839b)" stroke-width="4"/>`)}${screw(444,541)}${screw(504,591)}`,
    cooling:`${rect(620,161,110,340,10,'#11131b')}${rect(620,155,110,340,10)}${rows(28,i=>`<path d="M626 ${162+i*12}h98" stroke="var(--metal,#646273)" stroke-width="2"/>`)}${fan(675,247,47)}${fan(675,403,47)}${screw(627,162)}${screw(723,162)}${screw(627,488)}${screw(723,488)}`
  };
  const shape=p=>p.outline?`<path d="${p.outline}"/>`:`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="7"/>`;
  const label=(x,y,text)=>`<text x="${x}" y="${y}" text-anchor="middle">${text}</text>`;
  const dialog=document.createElement('dialog');
  dialog.className='ksk-diagnosis';dialog.setAttribute('aria-labelledby',`${prefix}-title`);
  const logo=document.querySelector('.brand-header-logo .brand-hex-icon')?.outerHTML || '';
  dialog.innerHTML=`<header class="dg-header"><div class="dg-brand">${logo}<b>СОТА</b><span>КСК</span></div><div class="dg-heading"><h2 id="${prefix}-title">Тепловая диагностика</h2><p>Просканируй компьютер тепловизором и отметь неисправности</p></div><button type="button" class="dg-exit ksk-minigame-exit" data-action="exit" aria-label="Выйти из игры" title="Выйти из игры"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></header>
    <div class="dg-layout"><aside class="dg-hint"><svg class="dg-hint-demo" viewBox="0 0 260 116" role="img" aria-label="Пример: найди перегрев и нажми на деталь">
      <defs><radialGradient id="${prefix}-demo-heat"><stop stop-color="#fff4a1"/><stop offset=".45" stop-color="#ff993e"/><stop offset="1" stop-color="#c22e59"/></radialGradient><clipPath id="${prefix}-demo-clip"><circle class="dg-demo-scan" cx="53" cy="54" r="34"/></clipPath></defs>
      <rect x="8" y="8" width="244" height="100" rx="12" fill="#151821" stroke="#4d465a"/>
      <path d="M25 30H235M25 78H235M85 20V94M169 20V94" stroke="#344448" fill="none"/>
      <g fill="#484555" stroke="#8b809a"><rect x="36" y="36" width="34" height="36" rx="4"/><rect x="113" y="30" width="44" height="48" rx="5"/><rect x="202" y="36" width="22" height="36" rx="3"/></g>
      <g clip-path="url(#${prefix}-demo-clip)"><rect x="8" y="8" width="244" height="100" rx="12" fill="#263775" fill-opacity=".65"/><rect x="113" y="30" width="44" height="48" rx="5" fill="url(#${prefix}-demo-heat)"/></g>
      <g class="dg-demo-scan"><circle cx="53" cy="54" r="34" fill="none" stroke="#d7baf6" stroke-width="2"/><path d="M48 54H58M53 49V59" stroke="#fff"/></g>
      <text class="dg-demo-temperature" x="135" y="98" text-anchor="middle" fill="#ffca80" font-size="12">103 °C</text>
      <circle class="dg-demo-click" cx="135" cy="54" r="19" fill="none" stroke="#eee0ff" stroke-width="2"/>
      <path class="dg-demo-cursor" d="M0 0L1 22L7 17L12 27L17 24L12 15L20 14Z" fill="#fff" stroke="#282133" stroke-width="1.5"/>
      <g class="dg-demo-success"><rect x="111" y="28" width="48" height="52" rx="7" fill="none" stroke="#84dfb8" stroke-width="2"/><circle cx="157" cy="31" r="11" fill="#244f43" stroke="#84dfb8"/><path d="M152 31l3 3 6-7" fill="none" stroke="#b7ffe1" stroke-width="2"/></g>
    </svg><div class="dg-hint-copy"><h3>Как найти неисправность</h3><p>Веди тепловизор по деталям. Найди перегрев и нажми на горячий участок.</p></div></aside><main class="dg-scene"><svg class="dg-computer" viewBox="0 0 820 665" aria-label="Компьютер для тепловой диагностики">
    <defs><linearGradient id="${prefix}-case" x2="1" y2="1"><stop stop-color="#35323f"/><stop offset="1" stop-color="#1a1a25"/></linearGradient><radialGradient id="${prefix}-hot"><stop stop-color="#fff4a1"/><stop offset=".26" stop-color="#ffbc43"/><stop offset=".6" stop-color="#f64b30"/><stop offset="1" stop-color="#a61c58"/></radialGradient><radialGradient id="${prefix}-warm"><stop stop-color="#63dc92"/><stop offset=".65" stop-color="#229c9a"/><stop offset="1" stop-color="#2852a8"/></radialGradient><radialGradient id="${prefix}-cool"><stop stop-color="#2c8ac5"/><stop offset="1" stop-color="#442177"/></radialGradient><clipPath id="${prefix}-lens"><circle cx="325" cy="250" r="100"/></clipPath>${parts.map(p=>`<g id="${prefix}-${p.id}">${art[p.id]}</g>`).join('')}</defs>
    <path d="M47 42L61 28H762L780 46V618L762 637H61L47 621Z" fill="#080a11"/>
    <rect x="42" y="22" width="730" height="603" rx="22" fill="url(#${prefix}-case)" stroke="#625a72" stroke-width="2"/>
    <rect x="61" y="41" width="692" height="563" rx="12" fill="#12141e" stroke="#373441"/>
    <path d="M85 70H525L547 92V585L528 607H85Z" fill="#222d31" stroke="#4a555a" stroke-width="2"/>
    <g fill="none" stroke="#52616a" stroke-width="1" opacity=".48">${rows(11,i=>`<path d="M${100+i*10} 90V${300+i*7}L${158+i*10} ${355+i*5}H${235+i*7}M${105+i*10} 580V${530-i*4}H${280+i*11}L${310+i*11} ${512-i*5}"/>`)}</g>
    ${rows(8,i=>rect(91,120+i*42,31,28,3,'#464855'))}${rows(4,i=>`<circle cx="${164+i*22}" cy="316" r="8" fill="#777889"/><circle cx="${164+i*22}" cy="316" r="5" fill="#333a46"/>`)}
    ${rect(169,523,227,16,3,'#141820')}${rect(169,551,227,16,3,'#141820')}${rect(162,591,255,8,2,'#756a54')}${rows(10,i=>rect(176+i*22,589,4,13,0,'#bea677'))}
    <path d="M369 211C570 211 536 94 646 116V155M369 237C581 237 550 115 703 135V155" fill="none" stroke="#0c1018" stroke-width="17"/><path d="M369 211C570 211 536 94 646 116V155M369 237C581 237 550 115 703 135V155" fill="none" stroke="#565365" stroke-width="10"/>
    ${[[90,78],[533,96],[90,590],[532,590],[52,34],[760,34],[52,613],[760,613]].map(([x,y])=>screw(x,y)).join('')}
    <g class="dg-normal">${parts.map(p=>`<use href="#${prefix}-${p.id}"/>`).join('')}</g>
    <g class="dg-thermal" clip-path="url(#${prefix}-lens)" pointer-events="none"><rect x="61" y="41" width="692" height="563" rx="12" fill="#211846"/>${parts.map((p,i)=>{const hot=faults.has(i),tone=hot?'hot':p.normal>=50?'warm':'cool';return `<use href="#${prefix}-${p.id}" style="--body:url(#${prefix}-${tone});--metal:${hot?'#f58c37':'#327f9d'};--dark:${hot?'#c22e49':'#312567'};--edge:${hot?'#ffd477':'#49b6af'}"/>`;}).join('')}</g>
    <g class="dg-labels" pointer-events="none">${label(322,181,'Процессор · CPU')}${label(466,145,'ОЗУ')}${label(325,385,'Видеокарта · GPU')}${label(345,327,'M.2 SSD')}${label(303,100,'Питание · VRM')}${label(474,622,'Чипсет')}${label(675,527,'Охлаждение')}</g>
    <g class="dg-feedback" pointer-events="none">${parts.map((p,i)=>`<g data-feedback="${i}">${shape(p)}<g class="dg-check" transform="translate(${p.x+p.w-5} ${p.y+6})"><circle r="12"/><path d="M-6 0l4 4 8-8"/></g></g>`).join('')}</g>
    <g class="dg-lens-ui" pointer-events="none"><circle r="100" fill="none" stroke="#c8b4ee" stroke-width="1.5"/><circle r="96" fill="none" stroke="#e4d5ff" stroke-opacity=".18"/><path d="M-9 0H-3M3 0H9M0-9V-3M0 3V9" stroke="#fff" stroke-width="1.5"/><g transform="translate(0 71)"><rect x="-47" y="-13" width="94" height="26" rx="13" fill="#111020e8"/><text class="dg-temp" text-anchor="middle" y="5" fill="#fff" font-size="14"></text></g></g>
    <g class="dg-hitareas">${parts.map((p,i)=>`<g data-part="${i}" role="button" tabindex="0" aria-label="${p.name}">${shape(p)}</g>`).join('')}</g>
    </svg><div class="dg-result" hidden role="status"><span class="dg-result-icon">✓</span><h3>Диагностика успешно завершена!</h3><button type="button" data-action="finish">Выйти в лабораторию</button></div></main>
    </div><span class="dg-sr" aria-live="polite"></span>`;
  document.body.append(dialog);
  const q=s=>dialog.querySelector(s), svg=q('.dg-computer'), lens=q(`#${prefix}-lens circle`), lensUI=q('.dg-lens-ui');
  const hitNodes=[...dialog.querySelectorAll('[data-part]')];
  const announce=text=>q('.dg-sr').textContent=text;
  function at(point) {
    // Reuse the actual SVG contours for both temperature and selection.
    return hitNodes.findIndex(node=>node.firstElementChild.isPointInFill(point));
  }
  function move(point) {
    lens.setAttribute('cx',point.x);lens.setAttribute('cy',point.y);
    lensUI.setAttribute('transform',`translate(${point.x} ${point.y})`);
    const i=at(point);q('.dg-temp').textContent=i<0?'— °C':`${faults.has(i)?parts[i].hot:parts[i].normal} °C`;
  }
  function point(event) {
    const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  function close(success,confirmed=false) {
    if(closed)return;
    if(!success&&!confirmed){window.confirmKskMinigameExit(dialog,()=>close(false,true));return;}
    closed=true;
    for(const timer of timers.values())clearTimeout(timer);
    dialog.close();dialog.remove();
    if(success)done(Math.max(350,600-mistakes*25));else cancel();
  }
  function select(i) {
    if(closed||found.size===2||i<0||found.has(i))return;
    const feedback=q(`[data-feedback="${i}"]`);
    if(!faults.has(i)) {
      mistakes++;feedback.classList.add('dg-wrong');
      if(mistakes===2) {
        for(const index of faults) {
          if(!found.has(index))q(`[data-feedback="${index}"]`).classList.add('dg-hot-hint');
        }
      }
      clearTimeout(timers.get(i));timers.set(i,setTimeout(()=>{feedback.classList.remove('dg-wrong');timers.delete(i);},650));
      announce(`${parts[i].name}: температура в пределах нормы.`);return;
    }
    found.add(i);feedback.classList.remove('dg-hot-hint');feedback.classList.add('dg-found');
    hitNodes[i].setAttribute('aria-label',`${parts[i].name}: неисправность найдена`);
    announce(`${parts[i].name}: перегрев обнаружен.`);
    if(found.size===2) {
      q('.dg-result').hidden=false;
      q('[data-action="finish"]').focus({preventScroll:true});
    }
  }
  svg.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||event.button!==0)return;
    const p=point(event);move(p);
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,index:at(p),moved:false};
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener('pointermove',event=>{
    if(!event.isPrimary)return;
    move(point(event));
    if(gesture&&gesture.id===event.pointerId&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>9)gesture.moved=true;
  });
  svg.addEventListener('pointerup',event=>{
    if(!gesture||gesture.id!==event.pointerId)return;
    const p=point(event),i=at(p);move(p);
    if(!gesture.moved&&i===gesture.index)select(i);
    gesture=null;if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);
  });
  for(const event of ['pointercancel','lostpointercapture'])svg.addEventListener(event,()=>gesture=null);
  svg.addEventListener('focusin',event=>{
    const target=event.target.closest('[data-part]');if(!target)return;
    const p=parts[Number(target.dataset.part)];move({x:p.id==='vrm'?310:p.id==='ram'?440:p.x+p.w/2,y:p.id==='vrm'?134:p.y+p.h/2});
  });
  dialog.addEventListener('keydown',event=>{
    // Do not let the laboratory's global controls handle modal input.
    event.stopPropagation();
    const target=event.target.closest('[data-part]');
    if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();if(!event.repeat)select(Number(target.dataset.part));}
  });
  q('[data-action="finish"]').onclick=()=>{if(found.size===2)close(true);};
  q('[data-action="exit"]').onclick=()=>close(found.size===2);
  dialog.oncancel=event=>{event.preventDefault();close(found.size===2);};
  move({x:322,y:245});dialog.showModal();
};
