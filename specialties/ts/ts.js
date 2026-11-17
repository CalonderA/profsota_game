/* ============================================================
   СОТА — Логика специальности ТС (13.02.02 Теплоснабжение)
   Мини-игры: Сборка теплотрассы, Аварийный байпас, Балансировка теплообменника
   2.5D Станки: drawTSStation
   ============================================================ */

  /* ============================================================
     Мини-игра «Аварийный байпас теплосети» (bypass)
     ============================================================ */
  const BYPASS_CFG = {
    TIME_MS: 25000,
    REWARD: 200,
    CLOSE_DELAY_MS: 1500
  };

  const bypassGame = {
    active: false,
    phase: 'idle',
    deadline: 0,
    rafId: 0,
    closeTimer: null,
    step: 1,
    valves: {
      bypass: false,
      inlet: true,
      outlet: true,
      drain: false
    }
  };

  function cleanupBypass(){
    bypassGame.active = false;
    bypassGame.phase = 'idle';
    if (bypassGame.rafId){ cancelAnimationFrame(bypassGame.rafId); bypassGame.rafId = 0; }
    if (bypassGame.closeTimer){ clearTimeout(bypassGame.closeTimer); bypassGame.closeTimer = null; }
  }

  function startBypassEvent(){
    cleanupBypass();
    bypassGame.active = true;
    bypassGame.phase = 'intro';
    bypassGame.step = 1;
    bypassGame.valves = { bypass: false, inlet: true, outlet: true, drain: false };

    updateBypassUI();
    updateBypassTimerUI(BYPASS_CFG.TIME_MS);

    el('bypassBannerTitle').textContent = 'Аварийное переключение на байпас';
    el('bypassBannerText').textContent =
      'На магистрали теплосети возник свищ! Откройте байпасную линию в обход аварии, перекройте вход и выход повреждённого участка и сбросьте давление через дренаж! Награда: +' + BYPASS_CFG.REWARD + ' очков.';
    const btn = el('bypassStartBtn');
    btn.textContent = 'Начать переключение';
    btn.onclick = beginBypassActive;

    el('bypassBanner').classList.remove('hidden');
    el('bypassScreen').classList.remove('hidden');

    initBypassControlsOnce();
  }

  function updateBypassUI(){
    const { bypass, inlet, outlet, drain } = bypassGame.valves;
    const vB = el('valveBypass');
    const vI = el('valveInlet');
    const vO = el('valveOutlet');
    const vD = el('valveDrain');

    if (vB){
      vB.className = 'valve-btn ' + (bypass ? 'opened' : 'closed');
      el('valveBypassText').textContent = 'Задвижка 1 (Байпас): ' + (bypass ? 'ОТКРЫТА' : 'ЗАКРЫТА');
    }
    if (vI){
      vI.className = 'valve-btn ' + (inlet ? 'opened' : 'closed');
      el('valveInletText').textContent = 'Задвижка 2 (Вход): ' + (inlet ? 'ОТКРЫТА' : 'ЗАКРЫТА');
    }
    if (vO){
      vO.className = 'valve-btn ' + (outlet ? 'opened' : 'closed');
      el('valveOutletText').textContent = 'Задвижка 3 (Выход): ' + (outlet ? 'ОТКРЫТА' : 'ЗАКРЫТА');
    }
    if (vD){
      vD.className = 'valve-btn ' + (drain ? 'opened' : 'closed');
      el('valveDrainText').textContent = 'Клапан 4 (Дренаж): ' + (drain ? 'ОТКРЫТ' : 'ЗАКРЫТ');
    }

    const mainLine = el('mainLine');
    const leakInd = el('leakIndicator');
    if (mainLine && leakInd){
      if (!inlet && !outlet && drain){
        mainLine.className = 'bypass-pipe bypass-main safe';
        leakInd.innerHTML = '<span style="font-size:20px;color:#10b981">✔</span><span style="font-size:10.5px;color:#10b981;font-weight:700">УЧАСТОК ОБЕЗВРЕЖЕН</span>';
      } else {
        mainLine.className = 'bypass-pipe bypass-main danger';
        leakInd.innerHTML = '<span class="leak-steam">💨</span><span class="leak-alert">СВИЩ ТРУБЫ / УТЕЧКА</span>';
      }
    }

    const st = el('bypassStatus');
    if (st){
      const stepTexts = [
        '',
        'Шаг 1/4: Откройте задвижку байпаса',
        'Шаг 2/4: Перекройте подачу (вход)',
        'Шаг 3/4: Перекройте обратку (выход)',
        'Шаг 4/4: Откройте дренажный клапан',
        'Авария ликвидирована!'
      ];
      st.textContent = stepTexts[bypassGame.step] || 'Ликвидация аварии';
    }
  }

  let bypassInitialized = false;
  function initBypassControlsOnce(){
    if (bypassInitialized) return;
    bypassInitialized = true;

    el('valveBypass').addEventListener('click', () => {
      if (!bypassGame.active || bypassGame.phase !== 'playing') return;
      if (bypassGame.step === 1){
        bypassGame.valves.bypass = true;
        bypassGame.step = 2;
        sfx.good();
        tone(520, 0.08, 'sine', 0.05);
        toast('Байпас открыт! Циркуляция района сохранена.');
        updateBypassUI();
      } else if (!bypassGame.valves.bypass){
        toast('Сначала нужно открыть байпас!');
      }
    });

    el('valveInlet').addEventListener('click', () => {
      if (!bypassGame.active || bypassGame.phase !== 'playing') return;
      if (bypassGame.step === 2){
        bypassGame.valves.inlet = false;
        bypassGame.step = 3;
        sfx.good();
        tone(480, 0.08, 'sine', 0.05);
        toast('Вход перекрыт!');
        updateBypassUI();
      } else if (bypassGame.step < 2){
        sfx.bad();
        flash = 0.2; flashColor = '255,100,100';
        toast('Осторожно! Нельзя глушить вход до открытия байпаса — опасность гидроудара!');
      }
    });

    el('valveOutlet').addEventListener('click', () => {
      if (!bypassGame.active || bypassGame.phase !== 'playing') return;
      if (bypassGame.step === 3){
        bypassGame.valves.outlet = false;
        bypassGame.step = 4;
        sfx.good();
        tone(440, 0.08, 'sine', 0.05);
        toast('Выход перекрыт!');
        updateBypassUI();
      } else if (bypassGame.step < 3){
        toast('Сначала выполните предыдущие шаги переключения!');
      }
    });

    el('valveDrain').addEventListener('click', () => {
      if (!bypassGame.active || bypassGame.phase !== 'playing') return;
      if (bypassGame.step === 4){
        bypassGame.valves.drain = true;
        bypassGame.step = 5;
        sfx.good();
        tone(600, 0.12, 'triangle', 0.05);
        updateBypassUI();
        finishBypass(true);
      } else {
        toast('Дренаж открывается только после полной отсечки аварийного участка!');
      }
    });
  }

  function beginBypassActive(){
    if (!bypassGame.active || bypassGame.phase !== 'intro') return;
    el('bypassBanner').classList.add('hidden');
    bypassGame.phase = 'playing';
    bypassGame.deadline = performance.now() + BYPASS_CFG.TIME_MS;
    bypassGame.rafId = requestAnimationFrame(tickBypassTimer);
  }

  function tickBypassTimer(now){
    if (!bypassGame.active || bypassGame.phase !== 'playing') return;
    const left = bypassGame.deadline - now;
    updateBypassTimerUI(left);
    if (left <= 0){
      finishBypass(false);
      return;
    }
    bypassGame.rafId = requestAnimationFrame(tickBypassTimer);
  }

  function updateBypassTimerUI(msLeft){
    const bar = el('bypassTimerBar');
    const txt = el('bypassTimerText');
    if (!bar || !txt) return;
    const sec = (Math.max(0, msLeft) / 1000).toFixed(1) + ' с';
    txt.textContent = sec;
    const pct = clamp(msLeft / BYPASS_CFG.TIME_MS, 0, 1) * 100;
    bar.style.width = pct.toFixed(1) + '%';
  }

  function finishBypass(won){
    if (!bypassGame.active || bypassGame.phase === 'done') return;
    bypassGame.phase = 'done';
    cancelAnimationFrame(bypassGame.rafId); bypassGame.rafId = 0;

    if (won){
      score += BYPASS_CFG.REWARD;
      fuel = Math.min(100, fuel + 20);
      updateHUD();
      if (sfx.combo) sfx.combo();
      else if (sfx.good) sfx.good();
      flash = 0.55; flashColor = '34,197,94';

      el('bypassBannerTitle').textContent = 'Аварийный участок надёжно изолирован!';
      el('bypassBannerText').textContent =
        'Байпас держит циркуляцию теплоносителя, гидроудар предотвращён, давление сброшено. Награда: +' + BYPASS_CFG.REWARD + ' очков.';
    } else {
      updateBypassTimerUI(0);
      if (sfx.bad) sfx.bad();
      flash = 0.35; flashColor = '255,110,90';
      el('bypassBannerTitle').textContent = 'Время ликвидации истекло';
      el('bypassBannerText').textContent =
        'Сработала централизованная автоматика отключения (+0 очков). Смена в цеху продолжается.';
    }

    const btn = el('bypassStartBtn');
    btn.textContent = 'Продолжить смену';
    btn.onclick = closeFloorEvent;
    el('bypassBanner').classList.remove('hidden');
    bypassGame.closeTimer = setTimeout(closeFloorEvent, BYPASS_CFG.CLOSE_DELAY_MS);
  }


  /* ============================================================
     Мини-игра «Балансировка теплообменника» (exchanger)
     ============================================================ */
  const EXCHANGER_CFG = {
    TIME_MS: 25000,
    REWARD: 200,
    CLOSE_DELAY_MS: 1500
  };

  const exchangerGame = {
    active: false,
    phase: 'idle',
    deadline: 0,
    rafId: 0,
    closeTimer: null,
    isCounterflow: false,
    flowRate: 35,
    kpd: 52
  };

  function cleanupExchanger(){
    exchangerGame.active = false;
    exchangerGame.phase = 'idle';
    if (exchangerGame.rafId){ cancelAnimationFrame(exchangerGame.rafId); exchangerGame.rafId = 0; }
    if (exchangerGame.closeTimer){ clearTimeout(exchangerGame.closeTimer); exchangerGame.closeTimer = null; }
  }

  function startExchangerEvent(){
    cleanupExchanger();
    exchangerGame.active = true;
    exchangerGame.phase = 'intro';
    exchangerGame.isCounterflow = false;
    exchangerGame.flowRate = 35;

    el('flowRateSlider').value = 35;
    el('flowRateVal').textContent = '35%';
    el('flowModeBtn').textContent = 'Переключить на ПРОТИВОТОК';
    el('flowModeBadge').textContent = 'Схема: ПРЯМОТОК (КПД снижен)';
    el('flowModeBadge').className = 'flow-mode-badge';

    recalcExchangerKpd();
    updateExchangerTimerUI(EXCHANGER_CFG.TIME_MS);

    el('exchangerBannerTitle').textContent = 'Балансировка пластинчатого теплообменника';
    el('exchangerBannerText').textContent =
      'Теплообменный пункт работает неэффективно. Переключите схему циркуляции на ПРОТИВОТОК и настройте расход теплоносителя (75%–85%), чтобы достичь расчётного КПД ≥95%! Награда: +' + EXCHANGER_CFG.REWARD + ' очков.';
    const btn = el('exchangerStartBtn');
    btn.textContent = 'Начать балансировку';
    btn.onclick = beginExchangerActive;

    el('exchangerBanner').classList.remove('hidden');
    el('exchangerScreen').classList.remove('hidden');

    initExchangerControlsOnce();
  }

  function recalcExchangerKpd(){
    const modeBase = exchangerGame.isCounterflow ? 55 : 30;
    const diff = Math.abs(exchangerGame.flowRate - 80);
    const flowContrib = Math.max(5, 45 - diff * 0.85);
    exchangerGame.kpd = Math.min(100, Math.round(modeBase + flowContrib));

    const st = el('exchangerStatus');
    const txt = el('exchangerKpdText');
    const bar = el('exchangerKpdBar');
    const lockBtn = el('exchangerLockBtn');

    const isGood = exchangerGame.kpd >= 95;
    if (st) st.textContent = 'КПД: ' + exchangerGame.kpd + '% ' + (isGood ? '(Оптимально ✔)' : '(Требуется настройка)');
    if (txt){
      txt.textContent = exchangerGame.kpd + '% ' + (isGood ? '✔ ОПТИМАЛЬНО' : '(Цель: ≥ 95%)');
      txt.style.color = isGood ? '#10b981' : (exchangerGame.kpd >= 80 ? '#f59e0b' : '#ef4444');
    }
    if (bar){
      bar.style.width = exchangerGame.kpd + '%';
      bar.style.background = isGood ? '#10b981' : (exchangerGame.kpd >= 80 ? '#f59e0b' : '#ef4444');
    }
    if (lockBtn){
      if (isGood){
        lockBtn.classList.remove('disabled');
        lockBtn.disabled = false;
      } else {
        lockBtn.classList.add('disabled');
        lockBtn.disabled = true;
      }
    }
  }

  let exchangerInitialized = false;
  function initExchangerControlsOnce(){
    if (exchangerInitialized) return;
    exchangerInitialized = true;

    el('flowModeBtn').addEventListener('click', () => {
      if (!exchangerGame.active || exchangerGame.phase !== 'playing') return;
      exchangerGame.isCounterflow = !exchangerGame.isCounterflow;
      tone(580, 0.08, 'triangle', 0.04);
      if (exchangerGame.isCounterflow){
        el('flowModeBtn').textContent = 'Переключить на ПРЯМОТОК';
        el('flowModeBadge').textContent = 'Схема: ПРОТИВОТОК (Высокий теплосъём ✔)';
        el('flowModeBadge').className = 'flow-mode-badge counter';
      } else {
        el('flowModeBtn').textContent = 'Переключить на ПРОТИВОТОК';
        el('flowModeBadge').textContent = 'Схема: ПРЯМОТОК (КПД снижен)';
        el('flowModeBadge').className = 'flow-mode-badge';
      }
      recalcExchangerKpd();
    });

    el('flowRateSlider').addEventListener('input', (e) => {
      if (!exchangerGame.active || exchangerGame.phase !== 'playing') return;
      const v = parseInt(e.target.value, 10) || 0;
      exchangerGame.flowRate = v;
      el('flowRateVal').textContent = v + '%';
      recalcExchangerKpd();
    });

    el('exchangerLockBtn').addEventListener('click', () => {
      if (!exchangerGame.active || exchangerGame.phase !== 'playing') return;
      if (exchangerGame.kpd >= 95){
        finishExchanger(true);
      }
    });
  }

  function beginExchangerActive(){
    if (!exchangerGame.active || exchangerGame.phase !== 'intro') return;
    el('exchangerBanner').classList.add('hidden');
    exchangerGame.phase = 'playing';
    exchangerGame.deadline = performance.now() + EXCHANGER_CFG.TIME_MS;
    exchangerGame.rafId = requestAnimationFrame(tickExchangerTimer);
  }

  function tickExchangerTimer(now){
    if (!exchangerGame.active || exchangerGame.phase !== 'playing') return;
    const left = exchangerGame.deadline - now;
    updateExchangerTimerUI(left);
    if (left <= 0){
      finishExchanger(false);
      return;
    }
    exchangerGame.rafId = requestAnimationFrame(tickExchangerTimer);
  }

  function updateExchangerTimerUI(msLeft){
    const bar = el('exchangerTimerBar');
    const txt = el('exchangerTimerText');
    if (!bar || !txt) return;
    const sec = (Math.max(0, msLeft) / 1000).toFixed(1) + ' с';
    txt.textContent = sec;
    const pct = clamp(msLeft / EXCHANGER_CFG.TIME_MS, 0, 1) * 100;
    bar.style.width = pct.toFixed(1) + '%';
  }

  function finishExchanger(won){
    if (!exchangerGame.active || exchangerGame.phase === 'done') return;
    exchangerGame.phase = 'done';
    cancelAnimationFrame(exchangerGame.rafId); exchangerGame.rafId = 0;

    if (won){
      score += EXCHANGER_CFG.REWARD;
      fuel = Math.min(100, fuel + 20);
      updateHUD();
      if (sfx.combo) sfx.combo();
      else if (sfx.good) sfx.good();
      flash = 0.55; flashColor = '34,197,94';

      el('exchangerBannerTitle').textContent = 'Теплообменник сбалансирован с КПД ' + exchangerGame.kpd + '%!';
      el('exchangerBannerText').textContent =
        'Схема противотока и точный расход обеспечили идеальную передачу тепла без потерь. Награда: +' + EXCHANGER_CFG.REWARD + ' очков.';
    } else {
      updateExchangerTimerUI(0);
      if (sfx.bad) sfx.bad();
      flash = 0.35; flashColor = '255,110,90';
      el('exchangerBannerTitle').textContent = 'Время балансировки истекло';
      el('exchangerBannerText').textContent =
        'Теплопункт оставлен на базовом режиме с пониженным КПД (+0 очков). Смена в цеху продолжается.';
    }

    const btn = el('exchangerStartBtn');
    btn.textContent = 'Продолжить смену';
    btn.onclick = closeFloorEvent;
    el('exchangerBanner').classList.remove('hidden');
    exchangerGame.closeTimer = setTimeout(closeFloorEvent, EXCHANGER_CFG.CLOSE_DELAY_MS);
  }



  /* ============================================================
     Мини-игра «Сборка теплотрассы» (поворот труб для ТС)
     ============================================================ */
  const PIPES_CFG = {
    TIME_MS: 25000,
    REWARD: 200,
    CLOSE_DELAY_MS: 1500
  };

  const pipeGame = {
    active: false,
    phase: 'idle',
    deadline: 0,
    grid: [],
    rafId: 0,
    closeTimer: null
  };

  function getPipeOpenings(type, rot){
    if (type === 'straight'){
      return (rot % 2 === 0)
        ? [false, true, false, true]
        : [true, false, true, false];
    }
    switch(rot % 4){
      case 0: return [true, true, false, false];
      case 1: return [false, true, true, false];
      case 2: return [false, false, true, true];
      case 3: return [true, false, false, true];
    }
    return [false, false, false, false];
  }

  function pipeSvgMarkup(type){
    if (type === 'straight'){
      return `<svg viewBox="0 0 60 60" aria-hidden="true">
        <rect x="0" y="22" width="60" height="16" fill="#37474f" stroke="#212121" stroke-width="1.5"/>
        <rect x="0" y="26" width="60" height="8" fill="#ff7043" opacity="0.9"/>
        <line x1="0" y1="28" x2="60" y2="28" stroke="#ffe0b2" stroke-width="2"/>
        <rect x="3" y="19" width="6" height="22" fill="#1b2228" rx="1"/>
        <rect x="51" y="19" width="6" height="22" fill="#1b2228" rx="1"/>
      </svg>`;
    } else {
      return `<svg viewBox="0 0 60 60" aria-hidden="true">
        <path d="M 30,0 L 30,30 L 60,30" fill="none" stroke="#37474f" stroke-width="16" stroke-linecap="square"/>
        <path d="M 30,0 L 30,30 L 60,30" fill="none" stroke="#ff7043" stroke-width="8" opacity="0.9"/>
        <path d="M 30,0 L 30,30 L 60,30" fill="none" stroke="#ffe0b2" stroke-width="2"/>
        <rect x="19" y="3" width="22" height="6" fill="#1b2228" rx="1"/>
        <rect x="51" y="19" width="6" height="22" fill="#1b2228" rx="1"/>
      </svg>`;
    }
  }

  function cleanupPipes(){
    pipeGame.active = false;
    pipeGame.phase = 'idle';
    if (pipeGame.rafId){ cancelAnimationFrame(pipeGame.rafId); pipeGame.rafId = 0; }
    clearTimeout(pipeGame.closeTimer); pipeGame.closeTimer = null;
    const gridEl = el('pipeGrid');
    if (gridEl) gridEl.innerHTML = '';
  }

  function startPipeEvent(){
    cleanupPipes();
    pipeGame.active = true;
    pipeGame.phase = 'intro';

    el('pipeStatus').textContent = 'Контур: разомкнут';
    el('pipeStatus').className = 'pipe-pill status';
    updatePipeTimerUI(PIPES_CFG.TIME_MS);

    el('pipeBannerTitle').textContent = 'Собери контур теплотрассы!';
    el('pipeBannerText').textContent =
      'Трубы теплоснабжения перепутаны. Кликай по сегментам, поворачивай трубы и соедини котельную (слева вверху) с теплопунктом дома (справа внизу)! Награда: +' + PIPES_CFG.REWARD + ' очков.';
    const btn = el('pipeStartBtn');
    btn.textContent = 'Начать сборку';
    btn.onclick = beginPipesActive;

    el('pipeBanner').classList.remove('hidden');
    el('pipeScreen').classList.remove('hidden');

    generatePipeGrid();
  }

  function beginPipesActive(){
    if (!pipeGame.active || pipeGame.phase !== 'intro') return;
    el('pipeBanner').classList.add('hidden');
    pipeGame.phase = 'playing';
    pipeGame.deadline = performance.now() + PIPES_CFG.TIME_MS;
    pipeGame.rafId = requestAnimationFrame(tickPipeTimer);
    checkPipeConnections();
  }

  function updatePipeTimerUI(msLeft){
    const bar = el('pipeTimerBar');
    const txt = el('pipeTimerText');
    const sec = (Math.max(0, msLeft) / 1000).toFixed(1) + ' с';
    txt.textContent = sec;
    const pct = clamp((msLeft / PIPES_CFG.TIME_MS) * 100, 0, 100);
    bar.style.width = pct + '%';
    const stateCls = pct <= 30 ? ' low' : (pct <= 55 ? ' warn' : '');
    bar.className = 'pipe-timer-fill' + stateCls;
    txt.className = 'pipe-pill timer' + (pct <= 30 ? ' low' : '');
  }

  function tickPipeTimer(now){
    if (!pipeGame.active || pipeGame.phase !== 'playing') return;
    const left = pipeGame.deadline - now;
    updatePipeTimerUI(left);
    if (left <= 0){
      finishPipes(false);
      return;
    }
    pipeGame.rafId = requestAnimationFrame(tickPipeTimer);
  }

  function generatePipeGrid(){
    const layouts = [
      [
        { t:'straight', target:0 }, { t:'corner', target:1 }, { t:'corner', target:3 },
        { t:'straight', target:0 }, { t:'straight', target:1 }, { t:'straight', target:1 },
        { t:'corner', target:0 }, { t:'corner', target:0 }, { t:'straight', target:0 }
      ],
      [
        { t:'corner', target:1 }, { t:'straight', target:0 }, { t:'corner', target:2 },
        { t:'corner', target:0 }, { t:'straight', target:0 }, { t:'corner', target:1 },
        { t:'corner', target:3 }, { t:'straight', target:1 }, { t:'corner', target:3 }
      ],
      [
        { t:'straight', target:0 }, { t:'straight', target:0 }, { t:'corner', target:2 },
        { t:'corner', target:0 }, { t:'corner', target:1 }, { t:'straight', target:1 },
        { t:'straight', target:1 }, { t:'straight', target:0 }, { t:'corner', target:0 }
      ]
    ];

    const pick = layouts[Math.floor(Math.random() * layouts.length)];
    pipeGame.grid = pick.map((cell, idx) => {
      const scramble = Math.floor(Math.random() * 3) + 1;
      const rot = (cell.target + scramble) % 4;
      return {
        r: Math.floor(idx / 3),
        c: idx % 3,
        type: cell.t,
        targetRot: cell.target,
        rot: rot
      };
    });

    renderPipeGridDOM();
  }

  function renderPipeGridDOM(){
    const gridEl = el('pipeGrid');
    gridEl.innerHTML = '';
    pipeGame.grid.forEach((cell, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pipe-tile';
      btn.id = 'ptile_' + idx;
      btn.setAttribute('aria-label', 'Повернуть трубу');
      btn.innerHTML = pipeSvgMarkup(cell.type);
      const svg = btn.querySelector('svg');
      svg.style.transform = `rotate(${cell.rot * 90}deg)`;

      btn.addEventListener('click', () => {
        if (!pipeGame.active || pipeGame.phase !== 'playing') return;
        cell.rot = (cell.rot + 1) % 4;
        svg.style.transform = `rotate(${cell.rot * 90}deg)`;
        tone(300 + (cell.r * 3 + cell.c) * 45, 0.08, 'triangle', 0.05);
        checkPipeConnections();
      });

      gridEl.appendChild(btn);
    });
  }

  function checkPipeConnections(){
    const g = pipeGame.grid;
    const connected = new Set();
    const q = [];

    const startCell = g[0];
    const startOpen = getPipeOpenings(startCell.type, startCell.rot);
    if (startOpen[3]){
      connected.add(0);
      q.push(0);
    }

    const oppositeDir = [2, 3, 0, 1];

    while (q.length > 0){
      const currIdx = q.shift();
      const curr = g[currIdx];
      const open = getPipeOpenings(curr.type, curr.rot);

      const neighbors = [
        { dir: 0, r: curr.r - 1, c: curr.c, idx: currIdx - 3 },
        { dir: 1, r: curr.r, c: curr.c + 1, idx: currIdx + 1 },
        { dir: 2, r: curr.r + 1, c: curr.c, idx: currIdx + 3 },
        { dir: 3, r: curr.r, c: curr.c - 1, idx: currIdx - 1 }
      ];

      for (const n of neighbors){
        if (n.r < 0 || n.r > 2 || n.c < 0 || n.c > 2) continue;
        if (connected.has(n.idx)) continue;
        if (!open[n.dir]) continue;

        const nextCell = g[n.idx];
        const nextOpen = getPipeOpenings(nextCell.type, nextCell.rot);
        if (nextOpen[oppositeDir[n.dir]]){
          connected.add(n.idx);
          q.push(n.idx);
        }
      }
    }

    g.forEach((c, idx) => {
      const tileEl = el('ptile_' + idx);
      if (tileEl){
        tileEl.classList.toggle('flowing', connected.has(idx));
      }
    });

    const exitCellNode = g[8];
    const exitOpen = getPipeOpenings(exitCellNode.type, exitCellNode.rot);
    const won = connected.has(8) && exitOpen[1];

    if (won){
      el('pipeStatus').textContent = 'Контур: СОЕДИНЁН!';
      el('pipeStatus').className = 'pipe-pill status connected';
      finishPipes(true);
    } else {
      el('pipeStatus').textContent = 'Контур: разомкнут';
      el('pipeStatus').className = 'pipe-pill status';
    }
  }

  function finishPipes(won){
    if (!pipeGame.active || pipeGame.phase === 'done') return;
    pipeGame.phase = 'done';
    cancelAnimationFrame(pipeGame.rafId); pipeGame.rafId = 0;

    if (won){
      score += PIPES_CFG.REWARD;
      updateHUD();
      sfx.good();
      flash = 0.5; flashColor = '255,140,80';
      el('pipeBannerTitle').textContent = 'Контур теплотрассы собран!';
      el('pipeBannerText').textContent = 'Горячая вода пошла в дома! Награда за сборку: +' + PIPES_CFG.REWARD + ' очков.';
    } else {
      updatePipeTimerUI(0);
      sfx.bad();
      flash = 0.35; flashColor = '255,110,90';
      el('pipeBannerTitle').textContent = 'Время вышло — контур не собран';
      el('pipeBannerText').textContent = 'Таймер 25.0 с истёк (+0 очков). Теплотрасса перезапущена в аварийном режиме.';
    }

    const btn = el('pipeStartBtn');
    btn.textContent = 'Дальше';
    btn.onclick = closeFloorEvent;
    el('pipeBanner').classList.remove('hidden');
    pipeGame.closeTimer = setTimeout(closeFloorEvent, PIPES_CFG.CLOSE_DELAY_MS);
  }

  function crystalSvgMarkup(violet){
    const gradId = violet ? 'cgV' : 'cgC';
    const c1 = violet ? '#f4e9ff' : '#d9fbff';
    const c2 = violet ? '#b98bff' : '#63d8f0';
    const c3 = violet ? '#5a34a8' : '#2a7ea0';
    return `<svg viewBox="-12 -15 24 28" aria-hidden="true">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="48%" stop-color="${c2}"/>
          <stop offset="100%" stop-color="${c3}"/>
        </linearGradient>
      </defs>
      <polygon points="0,-13 8,-3 4,11 -4,11 -8,-3" fill="url(#${gradId})" stroke="rgba(235,252,255,0.75)" stroke-width="0.9"/>
      <line x1="0" y1="-13" x2="-2" y2="11" stroke="rgba(255,255,255,0.6)" stroke-width="0.8"/>
    </svg>`;
  }


  /* ============================================================
     2.5D Отрисовка оборудования ТС (Теплоснабжение)
     ============================================================ */
  function drawTSStation(type, done, hard, now, seed){
    if (type === 2){
      // 3 ВЫСОКИХ ШКАФА ДИСПЕТЧЕРИЗАЦИИ И СКАДА ТЕПЛОСЕТЕЙ
      const rackW = 26, rackH = 48;
      const offsets = [-28, 0, 28];

      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.beginPath(); ctx.ellipse(0, 20, 44, 9, 0, 0, Math.PI * 2); ctx.fill();

      offsets.forEach((ox, idx) => {
        ctx.fillStyle = '#1e1b18';
        ctx.beginPath(); ctx.roundRect(ox - rackW / 2, -rackH / 2, rackW, rackH, 3); ctx.fill();
        ctx.strokeStyle = hard ? '#c084fc' : (done ? '#10b981' : '#f97316');
        ctx.lineWidth = 1.4; ctx.stroke();

        ctx.fillStyle = '#33271e';
        ctx.fillRect(ox - rackW / 2 + 3, -rackH / 2 + 3, rackW - 6, 4);

        for (let row = 0; row < 5; row++){
          const ry = -rackH / 2 + 10 + row * 7;
          ctx.fillStyle = '#29211b';
          ctx.fillRect(ox - rackW / 2 + 3, ry, rackW - 6, 5);

          const ledCols = ['#ef4444', '#f97316', '#22c55e', '#38bdf8'];
          const col = ledCols[(row + idx) % ledCols.length];
          const blink = Math.sin(now * 0.007 + seed + row * 1.5 + idx * 2) > -0.2;
          ctx.fillStyle = blink ? col : '#0d0b09';
          ctx.fillRect(ox - rackW / 2 + 5, ry + 1.5, 2.5, 2);
          ctx.fillRect(ox - rackW / 2 + 9, ry + 1.5, 2.5, 2);
        }

        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(ox - rackW / 2 + 2, -rackH / 2 + 2, 4, rackH - 4);
      });
    } else if (type === 1){
      // ПЛАСТИНЧАТЫЙ ТЕПЛООБМЕННИК (ИТП)
      const w = 46, h = 32;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath(); ctx.ellipse(0, 16, 24, 7, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#0369a1';
      ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 4); ctx.fill();
      ctx.strokeStyle = hard ? '#c084fc' : (done ? '#10b981' : '#38bdf8');
      ctx.lineWidth = 1.6; ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      for (let i = -w / 2 + 8; i < w / 2 - 8; i += 4){
        ctx.fillRect(i, -h / 2 + 6, 2, h - 12);
      }

      const bolts = [
        [-w / 2 + 4, -h / 2 + 4], [w / 2 - 6, -h / 2 + 4],
        [-w / 2 + 4, h / 2 - 6], [w / 2 - 6, h / 2 - 6]
      ];
      bolts.forEach(([bx, by]) => {
        ctx.fillStyle = '#f1f5f9'; ctx.fillRect(bx, by, 3, 3);
      });

      ctx.fillStyle = '#ef4444'; ctx.fillRect(-w / 2 - 7, -h / 2 + 8, 8, 6);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(-w / 2 - 7, h / 2 - 14, 8, 6);

      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(-w / 2 - 4, -h / 2 + 3, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1; ctx.stroke();
    } else if (type === 5){
      // СЛЕСАРНЫЙ ВЕРСТАК ТЕПЛОТЕХНИКА С ТИСКАМИ И ТРУБНЫМИ КЛЮЧАМИ
      const w = 54, dropH = 14;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-w / 2, 4, w, dropH);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-w / 2, 4, 5, dropH);
      ctx.fillRect(w / 2 - 5, 4, 5, dropH);

      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.roundRect(-w / 2, -8, w, 14, 3); ctx.fill();
      ctx.fillStyle = '#64748b'; ctx.fillRect(-w / 2, 4, w, 2);

      // Слесарные тиски
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-w / 2 + 3, -16, 12, 10);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(-w / 2 + 5, -14, 8, 4);
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-w / 2 + 9, -20); ctx.lineTo(-w / 2 + 9, -8); ctx.stroke();

      // Трубные ключи
      ctx.fillStyle = '#dc2626'; ctx.fillRect(-6, -4, 18, 3);
      ctx.fillStyle = '#334155'; ctx.fillRect(10, -5, 4, 5);
      ctx.fillStyle = '#ea580c'; ctx.fillRect(-2, 0, 14, 2.5);

      // Рулон чертежа теплосети
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.ellipse(18, -3, 6, 2.5, Math.PI * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 0.8; ctx.stroke();
    } else if (type === 3){
      // СДВОЕННЫЕ ЦЕНТРОБЕЖНЫЕ НАСОСЫ ТЕПЛОСЕТИ (НА РАМЕ)
      const w = 50, h = 26;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath(); ctx.ellipse(0, 16, 24, 7, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#1e2633';
      ctx.beginPath(); ctx.roundRect(-w / 2, 4, w, 10, 2); ctx.fill();
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.stroke();

      // Насос 1 (зеленый)
      ctx.fillStyle = '#059669'; ctx.beginPath(); ctx.roundRect(-20, -10, 16, 16, 3); ctx.fill();
      ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(-12, -2, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#047857'; ctx.fillRect(-22, -10, 3, 16);

      // Насос 2 (синий)
      ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(4, -10, 16, 16, 3); ctx.fill();
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(12, -2, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0369a1'; ctx.fillRect(2, -10, 3, 16);

      // Трубы подачи и обратки
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-w / 2 + 2, -16, w - 4, 5);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(-w / 2 + 2, 0, w - 4, 4);

      // Манометры
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.arc(-12, -20, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(12, -20, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 0.8; ctx.stroke();
    } else {
      // ПУЛЬТ ОПЕРАТОРА ТЕПЛОСЕТЕЙ С МОНИТОРАМИ
      const deskW = 56, dropH = 14;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.roundRect(-10, -26, 20, 14, 4); ctx.fill();
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.ellipse(0, -12, 9, 4, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-deskW / 2, 4, deskW, dropH);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-deskW / 2, 4, 4, dropH);
      ctx.fillRect(deskW / 2 - 4, 4, 4, dropH);

      ctx.fillStyle = '#334155';
      ctx.beginPath(); ctx.roundRect(-deskW / 2, -8, deskW, 14, 3); ctx.fill();
      ctx.fillStyle = '#475569'; ctx.fillRect(-deskW / 2, 4, deskW, 2);

      // Экран с мнемосхемой теплотрассы
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-17, -26, 22, 17);
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 1; ctx.strokeRect(-17, -26, 22, 17);
      ctx.fillStyle = '#18120e'; ctx.fillRect(-15, -24, 18, 13);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-13, -16); ctx.lineTo(-6, -16); ctx.lineTo(-2, -20); ctx.lineTo(1, -20); ctx.stroke();
      ctx.strokeStyle = '#0284c7';
      ctx.beginPath(); ctx.moveTo(-13, -19); ctx.lineTo(-9, -19); ctx.lineTo(-5, -23); ctx.stroke();
      ctx.fillStyle = '#475569'; ctx.fillRect(-8, -9, 4, 4);

      // Вспомогательный экран
      ctx.fillStyle = '#0f172a'; ctx.fillRect(8, -24, 16, 15);
      ctx.fillStyle = '#1e1610'; ctx.fillRect(9, -23, 14, 13);
      ctx.fillStyle = '#fb923c'; ctx.fillRect(11, -17, 10, 1.5);
      ctx.fillStyle = '#475569'; ctx.fillRect(14, -9, 4, 3);

      // Цветок
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.roundRect(22, -5, 5, 6, 1); ctx.fill();
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(24.5, -7, 3.5, 0, Math.PI * 2); ctx.fill();
    }
  }

/* ============================================================
   Регистрация мини-игр и 2.5D оборудования ТС
   ============================================================ */
if (window.registerMinigame) {
  registerMinigame('pipes',     { name: 'сборка контура теплотрассы', start: startPipeEvent, cleanup: cleanupPipes });
  registerMinigame('bypass',    { name: 'аварийный байпас теплосети', start: startBypassEvent, cleanup: cleanupBypass });
  registerMinigame('exchanger', { name: 'балансировка пластинчатого теплообменника', start: startExchangerEvent, cleanup: cleanupExchanger });
}
// Модуль загружается до common.js: сохраняем отрисовщик в реестре напрямую.
window.STATION_RENDERERS = window.STATION_RENDERERS || {};
window.STATION_RENDERERS.ts = drawTSStation;
