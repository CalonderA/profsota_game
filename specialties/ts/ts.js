window.MINI_GAMES = window.MINI_GAMES || {};
window.registerMinigame = window.registerMinigame || function(id, cfg){ window.MINI_GAMES[id] = cfg; };
window.STATION_RENDERERS = window.STATION_RENDERERS || {};
window.registerStationRenderer = window.registerStationRenderer || function(spec, fn){ window.STATION_RENDERERS[spec] = fn; };
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
    btn.onclick = () => closeFloorEvent(won);
    el('bypassBanner').classList.remove('hidden');
    bypassGame.closeTimer = setTimeout(() => closeFloorEvent(won), BYPASS_CFG.CLOSE_DELAY_MS);
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
    btn.onclick = () => closeFloorEvent(won);
    el('exchangerBanner').classList.remove('hidden');
    exchangerGame.closeTimer = setTimeout(() => closeFloorEvent(won), EXCHANGER_CFG.CLOSE_DELAY_MS);
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
      if (idx === 0) btn.classList.add('is-inlet');
      if (idx === 8) btn.classList.add('is-outlet');
      btn.id = 'ptile_' + idx;
      btn.setAttribute('aria-label', 'Повернуть трубу');
      btn.innerHTML = pipeSvgMarkup(cell.type)
        + (idx === 0 ? '<span class="pipe-port pipe-port-in" aria-hidden="true">🔥 ВХОД ➔</span>' : '')
        + (idx === 8 ? '<span class="pipe-port pipe-port-out" aria-hidden="true">➔ ВЫХОД 🏢</span>' : '');
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
    btn.onclick = () => closeFloorEvent(won);
    el('pipeBanner').classList.remove('hidden');
    pipeGame.closeTimer = setTimeout(() => closeFloorEvent(won), PIPES_CFG.CLOSE_DELAY_MS);
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
    /* ============================================================
     2.5D Отрисовка оборудования ТС (в точности по референсу)
     0: Контрольно-измерительные приборы (КИП)
     1: Теплогенерирующее и насосное оборудование (насосы)
     2: Котельные установки и системы теплоснабжения (котел)
     3: Трубопроводы и арматура (монтаж и наладка)
     4: Теплообменное оборудование и теплотехника (теплообменник)
     ============================================================ */
  function drawTSStation(type, done, hard, now, seed){
    const drawBench = (w) => {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-w/2 - 2, 18, w + 4, 5);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-w/2 + 4, 3, w - 8, 16);
      // Тумбы
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-w/2 + 2, 3, 22, 16);
      ctx.fillRect(w/2 - 24, 3, 22, 16);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-w/2 + 4, 5, 18, 4); ctx.fillRect(-w/2 + 4, 11, 18, 5);
      ctx.fillRect(w/2 - 22, 5, 18, 4); ctx.fillRect(w/2 - 22, 11, 18, 5);
      // Столешница
      ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.roundRect(-w/2, -7, w, 11, 2); ctx.fill();
      ctx.fillStyle = '#64748b'; ctx.fillRect(-w/2, 1, w, 3);
      ctx.fillStyle = '#334155'; ctx.fillRect(-w/2 + 2, -5, w - 4, 5);
    };

    if (type === 0){
      // 0. КОНТРОЛЬНО-ИЗМЕРИТЕЛЬНЫЕ ПРИБОРЫ (КИП) (слева вверху)
      // Доска со схемой теплового узла
      ctx.fillStyle = '#0b1320'; ctx.fillRect(-54, -44, 108, 28);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1; ctx.strokeRect(-54, -44, 108, 28);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-44, -34); ctx.lineTo(38, -34); ctx.lineTo(38, -22); ctx.lineTo(-44, -22); ctx.closePath();
      ctx.stroke();

      drawBench(116);

      // Жёлтый переносной газоанализатор слева
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.roundRect(-48, -26, 15, 20, 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-46, -24, 11, 6);
      // Большой стрелочный манометр
      ctx.fillStyle = '#64748b'; ctx.fillRect(-24, -14, 3, 9);
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(-22.5, -21, 9, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(-22.5, -21); ctx.lineTo(-18, -25); ctx.stroke();

      // Два синих дифманометра по центру
      [-6, 8].forEach(dx => {
        ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(dx, -23, 11, 17, 2); ctx.fill();
        ctx.fillStyle = '#020617'; ctx.fillRect(dx + 2, -20, 7, 5);
      });

      // Квадратный монитор тепловой телеметрии справа
      ctx.fillStyle = '#1e293b'; ctx.fillRect(24, -29, 28, 23);
      ctx.strokeStyle = '#64748b'; ctx.strokeRect(24, -29, 28, 23);
      ctx.fillStyle = '#021814'; ctx.fillRect(26, -27, 24, 17);
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < 22; i++){
        const wx = 27 + i;
        const wy = -18 + Math.sin(i * 0.4 + now * 0.008 + seed) * 4;
        if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
    }
    else if (type === 1){
      // 1. ТЕПЛОГЕНЕРИРУЮЩЕЕ И НАСОСНОЕ ОБОРУДОВАНИЕ (по центру вверху)
      drawBench(120);

      // Магистрали подачи (красная) и обратки (синяя)
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-52, -32, 82, 6);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(-52, -8, 82, 5);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-38, -32, 5, 29);
      ctx.fillRect(-6, -32, 5, 29);
      ctx.fillRect(22, -32, 5, 29);

      // Два больших манометра сверху слева
      [-42, -26].forEach(mx => {
        ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(mx, -38, 6, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1; ctx.stroke();
        ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(mx, -38); ctx.lineTo(mx + 3, -41); ctx.stroke();
      });

      // Центробежные насосы (зелёно-синий слева и синий справа)
      ctx.fillStyle = '#0d9488'; ctx.beginPath(); ctx.roundRect(-44, -22, 22, 18, 3); ctx.fill();
      ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.arc(-33, -13, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.roundRect(0, -22, 20, 18, 3); ctx.fill();
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(10, -13, 6.5, 0, Math.PI*2); ctx.fill();

      // Красные штурвалы задвижек на байпасе
      [-14, 14].forEach(vx => {
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.ellipse(vx, -36, 7, 3, 0, 0, Math.PI*2); ctx.fill();
      });

      // Шкаф управления насосами справа
      ctx.fillStyle = '#475569'; ctx.fillRect(34, -40, 20, 35);
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.strokeRect(34, -40, 20, 35);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(38, -35, 4, 4);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(45, -35, 4, 4);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(37, -26, 14, 8);
    }
    else if (type === 2){
      // 2. КОТЕЛЬНЫЕ УСТАНОВКИ И СИСТЕМЫ ТЕПЛОСНАБЖЕНИЯ (справа вверху)
      // Бетонный постамент с жёлтым ограждением
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-60, 6, 120, 14);
      ctx.fillStyle = '#334155'; ctx.fillRect(-60, 4, 120, 4);
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-56, 4); ctx.lineTo(-56, -4); ctx.lineTo(56, -4); ctx.lineTo(56, 4); ctx.stroke();

      // Вертикальный пульт управления котлом слева
      ctx.fillStyle = '#475569'; ctx.fillRect(-54, -40, 24, 44);
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.2; ctx.strokeRect(-54, -40, 24, 44);
      ctx.fillStyle = '#041d38'; ctx.fillRect(-50, -34, 16, 12);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-48, -31, 12, 2);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(-48, -18, 4, 4);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-41, -18, 4, 4);

      // Красные и оранжевые трубы подачи над котлом
      ctx.fillStyle = '#ea580c'; ctx.fillRect(-44, -48, 40, 5);
      ctx.fillStyle = '#dc2626'; ctx.fillRect(-20, -48, 5, 16);

      // Толстый серебристый дымоход вверх
      ctx.fillStyle = '#64748b'; ctx.fillRect(28, -56, 16, 30);
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.strokeRect(28, -56, 16, 30);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(27, -42, 18, 3);

      // Массивный цилиндрический котёл
      const boilW = 84, boilH = 40;
      ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.roundRect(-24, -36, boilW, boilH, 8); ctx.fill();
      ctx.strokeStyle = hard ? '#c084fc' : (done ? '#10b981' : '#f97316');
      ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(-16, -33, boilW - 16, 5);

      // Красная газовая горелка спереди и светящееся окно топки
      ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.roundRect(-30, -20, 24, 20, 3); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(-6, -15, 11, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke();
      const fPulse = Math.sin(now * 0.01 + seed) * 2.5;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath(); ctx.moveTo(-12, -9); ctx.quadraticCurveTo(-6, -24 + fPulse, 0, -9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.moveTo(-10, -10); ctx.quadraticCurveTo(-6, -20 + fPulse, -2, -10); ctx.closePath(); ctx.fill();

      // Символ пламени на корпусе котла
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.moveTo(24, -10); ctx.quadraticCurveTo(30, -26, 36, -10); ctx.closePath(); ctx.fill();
    }
    else if (type === 3){
      // 3. ТРУБОПРОВОДЫ И АРМАТУРА (МОНТАЖ И НАЛАДКА) (слева внизу)
      drawBench(120);

      // П-образный узел стального трубопровода над верстаком
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-52, -32, 60, 7);
      ctx.fillRect(-52, -32, 7, 25);
      ctx.fillRect(2, -32, 7, 20);
      ctx.fillRect(2, -17, 48, 7);
      ctx.fillRect(43, -17, 7, 10);
      // Фланцы с болтами
      ctx.fillStyle = '#475569';
      [-40, -14, 18, 38].forEach(fx => ctx.fillRect(fx, -35, 4, 13));

      // Красные штурвалы задвижек (сверху и на нижней трубе)
      [[-24, -39], [16, -24]].forEach(([vx, vy]) => {
        ctx.fillStyle = '#1e293b'; ctx.fillRect(vx - 1.5, vy, 3, 7);
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.ellipse(vx, vy, 9, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1; ctx.stroke();
      });

      // Жёлтые контрольные датчики на трубе справа
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(26, -29, 8, 12);
      ctx.fillRect(36, -29, 8, 12);
      // Трубный ключ на столешнице
      ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-40, -2); ctx.lineTo(-18, -2); ctx.stroke();
    }
    else {
      // 4. ТЕПЛООБМЕННОЕ ОБОРУДОВАНИЕ И ТЕПЛОТЕХНИКА (справа внизу)
      drawBench(120);

      // Синий пластинчатый теплообменник слева
      ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(-50, -34, 26, 30, 3); ctx.fill();
      ctx.strokeStyle = hard ? '#c084fc' : (done ? '#10b981' : '#38bdf8');
      ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      for (let px = -45; px < -28; px += 3.5){
        ctx.fillRect(px, -30, 1.8, 22);
      }

      // Белый секционный радиатор по центру
      ctx.fillStyle = '#f1f5f9';
      for (let rx = -16; rx <= 14; rx += 6){
        ctx.beginPath(); ctx.roundRect(rx, -28, 4.5, 22, 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.8; ctx.stroke();
      }

      // Медно-красные трубы обвязки сверху
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-38, -42, 74, 5);
      ctx.fillRect(-38, -42, 5, 10);
      ctx.fillRect(31, -42, 5, 18);

      // Серый тепловычислитель с экраном справа
      ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.roundRect(26, -30, 26, 24, 3); ctx.fill();
      ctx.fillStyle = '#042f2e'; ctx.fillRect(30, -26, 18, 10);
      ctx.fillStyle = '#34d399'; ctx.fillRect(32, -23, 14, 2.5);
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(34, -12, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(41, -12, 2, 0, Math.PI*2); ctx.fill();
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
if (window.registerStationRenderer) {
  registerStationRenderer('ts', drawTSStation);
}
