window.MINI_GAMES = window.MINI_GAMES || {};
window.registerMinigame = window.registerMinigame || function(id, cfg){ window.MINI_GAMES[id] = cfg; };
window.STATION_RENDERERS = window.STATION_RENDERERS || {};
window.registerStationRenderer = window.registerStationRenderer || function(spec, fn){ window.STATION_RENDERERS[spec] = fn; };
/* ============================================================
   СОТА — Логика специальности КИПиА (15.01.37)
   Мини-игры: Калибровка 4-20 мА, Монтаж клеммной схемы, ПИД-регулятор
   2.5D Станки: drawKIPStation
   ============================================================ */

  const CALIB_CFG = {
    TIME_MS: 25000,
    REWARD: 200,
    TOLERANCE: 0.15,
    POINTS: [
      { target: 4.00, label: 'Точка 1/3: 4.00 мА (Нуль шкалы, 0%)', startVal: 2.80 },
      { target: 12.00, label: 'Точка 2/3: 12.00 мА (Середина, 50%)', startVal: 10.60 },
      { target: 20.00, label: 'Точка 3/3: 20.00 мА (Предел, 100%)', startVal: 21.80 }
    ],
    CLOSE_DELAY_MS: 1500
  };

  const calibGame = {
    active: false,
    pointIndex: 0,
    currentVal: 4.00,
    targetVal: 4.00,
    deadline: 0,
    rafId: 0,
    closeTimer: null
  };

  function cleanupCalib(){
    calibGame.active = false;
    if (calibGame.rafId){ cancelAnimationFrame(calibGame.rafId); calibGame.rafId = 0; }
    if (calibGame.closeTimer){ clearTimeout(calibGame.closeTimer); calibGame.closeTimer = null; }
  }

  /* ============================================================
     Мини-игра «Монтаж схемы КИПиА» (wires)
     ============================================================ */
  const WIRES_CFG = {
    TIME_MS: 25000,
    REWARD: 200,
    CLOSE_DELAY_MS: 1500
  };

  const wiresGame = {
    active: false,
    phase: 'idle',
    deadline: 0,
    rafId: 0,
    closeTimer: null,
    selectedLeft: null,
    connections: new Set()
  };

  function cleanupWires(){
    wiresGame.active = false;
    wiresGame.phase = 'idle';
    if (wiresGame.rafId){ cancelAnimationFrame(wiresGame.rafId); wiresGame.rafId = 0; }
    if (wiresGame.closeTimer){ clearTimeout(wiresGame.closeTimer); wiresGame.closeTimer = null; }
    wiresGame.selectedLeft = null;
    wiresGame.connections.clear();
    const svg = el('wiresSvg');
    if (svg) svg.innerHTML = '';
  }

  function startWiresEvent(){
    cleanupWires();
    wiresGame.active = true;
    wiresGame.phase = 'intro';

    el('wiresStatus').textContent = 'Цепь: 0/3 проводов';
    el('wiresStatus').className = 'calib-pill target';
    updateWiresTimerUI(WIRES_CFG.TIME_MS);

    document.querySelectorAll('#wiresScreen .wire-terminal').forEach(term => {
      term.classList.remove('selected', 'connected');
    });

    el('wiresBannerTitle').textContent = 'Монтаж клеммной схемы КИПиА';
    el('wiresBannerText').textContent =
      'Для ввода нового датчика в эксплуатацию соедините провода линии датчика (+24V, Сигнал 4–20 мА, Экран) с клеммной колодкой шкафа автоматики! Награда: +' + WIRES_CFG.REWARD + ' очков.';
    const btn = el('wiresStartBtn');
    btn.textContent = 'Начать монтаж';
    btn.onclick = beginWiresActive;

    el('wiresBanner').classList.remove('hidden');
    el('wiresScreen').classList.remove('hidden');

    initWiresInteractionsOnce();
  }

  let wiresInitialized = false;
  function initWiresInteractionsOnce(){
    if (wiresInitialized) return;
    wiresInitialized = true;

    const board = el('wiresBoard');
    if (!board) return;

    board.addEventListener('click', (e) => {
      if (!wiresGame.active || wiresGame.phase !== 'playing') return;
      const term = e.target.closest('.wire-terminal');
      if (!term || term.classList.contains('connected')) return;

      const side = term.getAttribute('data-side');
      const wire = term.getAttribute('data-wire');

      if (side === 'left'){
        document.querySelectorAll('#wiresScreen .wire-terminal[data-side="left"]').forEach(t => t.classList.remove('selected'));
        wiresGame.selectedLeft = wire;
        term.classList.add('selected');
        tone(660, 0.05, 'triangle', 0.03);
      } else if (side === 'right'){
        if (!wiresGame.selectedLeft){
          toast('Сначала выберите клемму датчика слева!');
          return;
        }
        if (wiresGame.selectedLeft === wire){
          wiresGame.connections.add(wire);
          sfx.good();
          flash = 0.35; flashColor = '56,189,248';

          const leftTerm = document.querySelector(`#wiresScreen .wire-terminal[data-side="left"][data-wire="${wire}"]`);
          if (leftTerm){ leftTerm.classList.remove('selected'); leftTerm.classList.add('connected'); }
          term.classList.add('connected');
          wiresGame.selectedLeft = null;

          drawConnectedWireSvg(wire);

          const count = wiresGame.connections.size;
          el('wiresStatus').textContent = `Цепь: ${count}/3 проводов`;

          if (count >= 3){
            finishWires(true);
          }
        } else {
          sfx.bad();
          flash = 0.2; flashColor = '255,100,100';
          toast('Неверная клемма! Проверьте маркировку цепи.');
        }
      }
    });
  }

  function drawConnectedWireSvg(wire){
    const svg = el('wiresSvg');
    const board = el('wiresBoard');
    if (!svg || !board) return;
    const bRect = board.getBoundingClientRect();
    const w = Math.max(1, Math.round(bRect.width));
    const h = Math.max(1, Math.round(bRect.height));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const colors = { vcc: '#ef4444', sig: '#eab308', pe: '#38bdf8' };
    const stroke = colors[wire] || '#38bdf8';

    const leftTerm = document.querySelector(`#wiresScreen .wire-terminal[data-side="left"][data-wire="${wire}"]`);
    const rightTerm = document.querySelector(`#wiresScreen .wire-terminal[data-side="right"][data-wire="${wire}"]`);
    if (!leftTerm || !rightTerm) return;

    const lPin = leftTerm.querySelector('.term-pin') || leftTerm;
    const rPin = rightTerm.querySelector('.term-pin') || rightTerm;
    const lRect = lPin.getBoundingClientRect();
    const rRect = rPin.getBoundingClientRect();

    const sx1 = lRect.left + lRect.width/2 - bRect.left;
    const sy1 = lRect.top + lRect.height/2 - bRect.top;
    const sx2 = rRect.left + rRect.width/2 - bRect.left;
    const sy2 = rRect.top + rRect.height/2 - bRect.top;
    const mx = (sx1 + sx2) / 2;

    const oldPath = svg.querySelector(`path[data-wire="${wire}"]`);
    if (oldPath) oldPath.remove();

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('data-wire', wire);
    path.setAttribute('d', `M ${sx1} ${sy1} C ${mx} ${sy1}, ${mx} ${sy2}, ${sx2} ${sy2}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', w < 420 ? '3.5' : '4.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('opacity', '0.95');
    svg.appendChild(path);
  }

  window.addEventListener('resize', () => {
    if (wiresGame.active && wiresGame.connections.size > 0) {
      wiresGame.connections.forEach(w => drawConnectedWireSvg(w));
    }
  });

  function beginWiresActive(){
    if (!wiresGame.active || wiresGame.phase !== 'intro') return;
    el('wiresBanner').classList.add('hidden');
    wiresGame.phase = 'playing';
    wiresGame.deadline = performance.now() + WIRES_CFG.TIME_MS;
    wiresGame.rafId = requestAnimationFrame(tickWiresTimer);
  }

  function tickWiresTimer(now){
    if (!wiresGame.active || wiresGame.phase !== 'playing') return;
    const left = wiresGame.deadline - now;
    updateWiresTimerUI(left);
    if (left <= 0){
      finishWires(false);
      return;
    }
    wiresGame.rafId = requestAnimationFrame(tickWiresTimer);
  }

  function updateWiresTimerUI(msLeft){
    const bar = el('wiresTimerBar');
    const txt = el('wiresTimerText');
    if (!bar || !txt) return;
    const sec = (Math.max(0, msLeft) / 1000).toFixed(1) + ' с';
    txt.textContent = sec;
    const pct = clamp(msLeft / WIRES_CFG.TIME_MS, 0, 1) * 100;
    bar.style.width = pct.toFixed(1) + '%';
  }

  function finishWires(won){
    if (!wiresGame.active || wiresGame.phase === 'done') return;
    wiresGame.phase = 'done';
    cancelAnimationFrame(wiresGame.rafId); wiresGame.rafId = 0;

    if (won){
      score += WIRES_CFG.REWARD;
      fuel = Math.min(100, fuel + 20);
      updateHUD();
      if (sfx.combo) sfx.combo();
      else if (sfx.good) sfx.good();
      flash = 0.55; flashColor = '34,197,94';

      el('wiresBannerTitle').textContent = 'Схема КИПиА собрана безошибочно!';
      el('wiresBannerText').textContent =
        'Все цепи (+24V, AI-1, PE) подключены правильно. Питание подано, сигнал стабилен! Награда: +' + WIRES_CFG.REWARD + ' очков.';
    } else {
      updateWiresTimerUI(0);
      if (sfx.bad) sfx.bad();
      flash = 0.35; flashColor = '255,110,90';
      el('wiresBannerTitle').textContent = 'Время монтажа истекло';
      el('wiresBannerText').textContent =
        'Наладчик подключил ' + wiresGame.connections.size + '/3 проводов (+0 очков). Смена в цеху продолжается.';
    }

    const btn = el('wiresStartBtn');
    btn.textContent = 'Продолжить смену';
    btn.onclick = () => closeFloorEvent(won);
    el('wiresBanner').classList.remove('hidden');
    wiresGame.closeTimer = setTimeout(() => closeFloorEvent(won), WIRES_CFG.CLOSE_DELAY_MS);
  }


  /* ============================================================
     Мини-игра «Настройка ПИД-регулятора» (pid)
     ============================================================ */
  const PID_CFG = {
    TIME_MS: 25000,
    REWARD: 200,
    TARGET_P: 6.0,
    TOLERANCE: 0.45,
    STABILITY_REQUIRED_SEC: 1.5,
    CLOSE_DELAY_MS: 1500
  };

  const pidGame = {
    active: false,
    phase: 'idle',
    deadline: 0,
    rafId: 0,
    closeTimer: null,
    kp: 20,
    ki: 10,
    kd: 5,
    pressure: 3.6,
    integral: 0,
    lastError: 0,
    history: [],
    stableDuration: 0,
    lastFrameTime: 0
  };

  function cleanupPid(){
    pidGame.active = false;
    pidGame.phase = 'idle';
    if (pidGame.rafId){ cancelAnimationFrame(pidGame.rafId); pidGame.rafId = 0; }
    if (pidGame.closeTimer){ clearTimeout(pidGame.closeTimer); pidGame.closeTimer = null; }
  }

  function startPidEvent(){
    cleanupPid();
    pidGame.active = true;
    pidGame.phase = 'intro';
    pidGame.kp = 20; pidGame.ki = 10; pidGame.kd = 5;
    pidGame.pressure = 3.6;
    pidGame.integral = 0;
    pidGame.lastError = PID_CFG.TARGET_P - pidGame.pressure;
    pidGame.history = new Array(120).fill(3.6);
    pidGame.stableDuration = 0;

    syncPidSliderUI('kpSlider', 'kpVal', 20, 45, 55);
    syncPidSliderUI('kiSlider', 'kiVal', 10, 35, 45);
    syncPidSliderUI('kdSlider', 'kdVal', 5, 25, 35);
    updatePidAdvice();

    el('pidLockPct').textContent = '0%';
    el('pidLockBar').style.width = '0%';
    el('pidLockBtn').classList.add('disabled');
    el('pidLockBtn').disabled = true;

    updatePidTimerUI(PID_CFG.TIME_MS);

    el('pidBannerTitle').textContent = 'Настройка ПИД-регулятора давления';
    const btn = el('pidStartBtn');
    btn.textContent = 'Начать настройку';
    btn.onclick = beginPidActive;

    el('pidBanner').classList.remove('hidden');
    el('pidScreen').classList.remove('hidden');

    initPidControlsOnce();
    drawPidScope();
  }

  function syncPidSliderUI(sliderId, valId, val, minOpt, maxOpt){
    const s = el(sliderId);
    const vEl = el(valId);
    if (s) s.value = val;
    if (vEl){
      const inOpt = val >= minOpt && val <= maxOpt;
      vEl.textContent = val + (inOpt ? ' ✔' : '');
      vEl.className = 'pid-val' + (inOpt ? ' good' : '');
    }
  }

  function updatePidAdvice(){
    const adv = el('pidAdviceText');
    if (!adv) return;
    const kpGood = pidGame.kp >= 45 && pidGame.kp <= 55;
    const kiGood = pidGame.ki >= 35 && pidGame.ki <= 45;
    const kdGood = pidGame.kd >= 25 && pidGame.kd <= 35;

    if (kpGood && kiGood && kdGood){
      adv.innerHTML = '<b style="color:#10b981">✔ Все коэффициенты в норме!</b> Колебания подавлены, давление входит в уставку 6.00 бар.';
    } else if (!kdGood){
      adv.textContent = '⚠️ Пульсации контура (волны): сдвиньте Kd в зелёную зону (25–35) для успокоения волн!';
    } else if (!kpGood){
      adv.textContent = '⚠️ Недостаточная сила реакции: сдвиньте Kp в зелёную зону (45–55) для сведения к 6.0 бар!';
    } else if (!kiGood){
      adv.textContent = '⚠️ Остаточная погрешность: сдвиньте Ki в зону (35–45) для точной посадки на уставку!';
    } else {
      adv.textContent = 'Настройте все 3 ползунка в зелёные зоны или нажмите «⚡ Автоподстройка».';
    }
  }

  let pidInitialized = false;
  function initPidControlsOnce(){
    if (pidInitialized) return;
    pidInitialized = true;

    const bindSlider = (id, valId, prop, minOpt, maxOpt) => {
      const s = el(id);
      if (!s) return;
      s.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10) || 0;
        pidGame[prop] = v;
        syncPidSliderUI(id, valId, v, minOpt, maxOpt);
        updatePidAdvice();
      });
    };
    bindSlider('kpSlider', 'kpVal', 'kp', 45, 55);
    bindSlider('kiSlider', 'kiVal', 'ki', 35, 45);
    bindSlider('kdSlider', 'kdVal', 'kd', 25, 35);

    const autoBtn = el('pidAutoBtn');
    if (autoBtn){
      autoBtn.addEventListener('click', () => {
        if (!pidGame.active || pidGame.phase !== 'playing') return;
        pidGame.kp = 50; syncPidSliderUI('kpSlider', 'kpVal', 50, 45, 55);
        pidGame.ki = 40; syncPidSliderUI('kiSlider', 'kiVal', 40, 35, 45);
        pidGame.kd = 30; syncPidSliderUI('kdSlider', 'kdVal', 30, 25, 35);
        updatePidAdvice();
        sfx.good();
        toast('⚡ Автоподстройка АСР выполнена! Параметры: Kp=50, Ki=40, Kd=30.');
      });
    }

    const lockBtn = el('pidLockBtn');
    if (lockBtn){
      lockBtn.addEventListener('click', () => {
        if (!pidGame.active || pidGame.phase !== 'playing') return;
        const err = Math.abs(pidGame.pressure - PID_CFG.TARGET_P);
        if (err <= PID_CFG.TOLERANCE){
          finishPid(true);
        }
      });
    }
  }

  function beginPidActive(){
    if (!pidGame.active || pidGame.phase !== 'intro') return;
    el('pidBanner').classList.add('hidden');
    pidGame.phase = 'playing';
    pidGame.deadline = performance.now() + PID_CFG.TIME_MS;
    pidGame.lastFrameTime = performance.now();
    pidGame.rafId = requestAnimationFrame(tickPidLoop);
  }

  function tickPidLoop(now){
    if (!pidGame.active || pidGame.phase !== 'playing') return;
    const dt = Math.min(0.05, (now - pidGame.lastFrameTime) / 1000);
    pidGame.lastFrameTime = now;

    const target = PID_CFG.TARGET_P;

    // Физическая модель сходимости контура давления:
    // 1. Интегральная составляющая (Ki): устраняет статическую ошибку (смещение от 6.0)
    const kiOffset = (40 - pidGame.ki) * 0.04;
    const effectiveTarget = target + kiOffset;

    // 2. Пропорциональная составляющая (Kp): скорость сведения к уставке
    const convergenceSpeed = Math.max(0.6, (pidGame.kp / 50) * 4.5);
    pidGame.pressure += (effectiveTarget - pidGame.pressure) * Math.min(1.0, dt * convergenceSpeed);

    // 3. Дифференциальная составляющая (Kd): демпфирование автоколебаний (волн)
    const kdDist = Math.abs(pidGame.kd - 30);
    const waveAmp = (kdDist <= 5) ? (kdDist * 0.015) : (0.075 + (kdDist - 5) * 0.08);
    const wave = Math.sin(now * 0.007) * waveAmp;

    const currentDisplayVal = clamp(pidGame.pressure + wave, 1.5, 10.5);

    pidGame.history.push(currentDisplayVal);
    if (pidGame.history.length > 120) pidGame.history.shift();

    const errAbs = Math.abs(currentDisplayVal - target);
    const inTolerance = errAbs <= PID_CFG.TOLERANCE;
    if (inTolerance){
      pidGame.stableDuration += dt;
    } else {
      pidGame.stableDuration = Math.max(0, pidGame.stableDuration - dt * 2.0);
    }

    const pct = clamp(pidGame.stableDuration / PID_CFG.STABILITY_REQUIRED_SEC, 0, 1) * 100;
    el('pidLockPct').textContent = Math.round(pct) + '%';
    el('pidLockBar').style.width = pct + '%';

    const lockBtn = el('pidLockBtn');
    if (lockBtn){
      if (inTolerance){
        lockBtn.classList.remove('disabled');
        lockBtn.disabled = false;
      } else {
        lockBtn.classList.add('disabled');
        lockBtn.disabled = true;
      }
    }

    if (pidGame.stableDuration >= PID_CFG.STABILITY_REQUIRED_SEC){
      finishPid(true);
      return;
    }

    drawPidScope();

    const left = pidGame.deadline - now;
    updatePidTimerUI(left);
    if (left <= 0){
      finishPid(false);
      return;
    }

    pidGame.rafId = requestAnimationFrame(tickPidLoop);
  }

  function drawPidScope(){
    const cv = el('pidScopeCanvas');
    if (!cv) return;
    const g = cv.getContext('2d');
    const w = cv.width, h = cv.height;

    g.fillStyle = '#060b13';
    g.fillRect(0, 0, w, h);

    g.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    g.lineWidth = 1;
    for (let x = 0; x < w; x += 40){
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
    }
    for (let y = 0; y < h; y += 30){
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
    }

    const toY = (bar) => h - (bar / 12) * h;
    const yTop = toY(PID_CFG.TARGET_P + PID_CFG.TOLERANCE);
    const yBot = toY(PID_CFG.TARGET_P - PID_CFG.TOLERANCE);
    const yTarget = toY(PID_CFG.TARGET_P);

    g.fillStyle = 'rgba(16, 185, 129, 0.22)';
    g.fillRect(0, yTop, w, yBot - yTop);

    g.strokeStyle = '#10b981';
    g.lineWidth = 1.5;
    g.setLineDash([5, 5]);
    g.beginPath(); g.moveTo(0, yTarget); g.lineTo(w, yTarget); g.stroke();
    g.setLineDash([]);

    if (pidGame.history.length > 1){
      g.beginPath();
      g.lineWidth = 2.8;
      const curErr = Math.abs(pidGame.pressure - PID_CFG.TARGET_P);
      g.strokeStyle = curErr <= PID_CFG.TOLERANCE ? '#10b981' : (curErr <= 1.0 ? '#38bdf8' : '#f59e0b');

      const step = w / (pidGame.history.length - 1);
      pidGame.history.forEach((val, i) => {
        const x = i * step;
        const y = toY(val);
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      });
      g.stroke();
    }

    const gVal = el('pidGaugeVal');
    const gStab = el('pidStability');
    if (gVal) gVal.textContent = pidGame.pressure.toFixed(2) + ' бар';
    const inTol = Math.abs(pidGame.pressure - PID_CFG.TARGET_P) <= PID_CFG.TOLERANCE;
    if (gStab){
      gStab.textContent = inTol ? 'Стабильно в коридоре уставки ✔' : 'Автоколебания (требуется настройка)';
      gStab.style.color = inTol ? '#10b981' : '#f59e0b';
    }
  }

  function updatePidTimerUI(msLeft){
    const bar = el('pidTimerBar');
    const txt = el('pidTimerText');
    if (!bar || !txt) return;
    const sec = (Math.max(0, msLeft) / 1000).toFixed(1) + ' с';
    txt.textContent = sec;
    const pct = clamp(msLeft / PID_CFG.TIME_MS, 0, 1) * 100;
    bar.style.width = pct.toFixed(1) + '%';
  }

  function finishPid(won){
    if (!pidGame.active || pidGame.phase === 'done') return;
    pidGame.phase = 'done';
    cancelAnimationFrame(pidGame.rafId); pidGame.rafId = 0;

    if (won){
      score += PID_CFG.REWARD;
      fuel = Math.min(100, fuel + 20);
      updateHUD();
      if (sfx.combo) sfx.combo();
      else if (sfx.good) sfx.good();
      flash = 0.55; flashColor = '34,197,94';

      el('pidBannerTitle').textContent = 'ПИД-регулятор настроен оптимально!';
      el('pidBannerText').textContent =
        'Колебания давления устранены, контур надёжно удерживает 6.0 бар. Награда: +' + PID_CFG.REWARD + ' очков.';
    } else {
      updatePidTimerUI(0);
      if (sfx.bad) sfx.bad();
      flash = 0.35; flashColor = '255,110,90';
      el('pidBannerTitle').textContent = 'Время настройки истекло';
      el('pidBannerText').textContent =
        'Контур переведён в аварийное демпфирование (+0 очков). Смена в цеху продолжается.';
    }

    const btn = el('pidStartBtn');
    btn.textContent = 'Продолжить смену';
    btn.onclick = () => closeFloorEvent(won);
    el('pidBanner').classList.remove('hidden');
    pidGame.closeTimer = setTimeout(() => closeFloorEvent(won), PID_CFG.CLOSE_DELAY_MS);
  }


  /* ============================================================
     Логика калибровки токовой петли 4-20 мА (КИПиА)
     ============================================================ */
  function startCalibEvent(){
    cleanupCalib();
    calibGame.active = true;
    calibGame.pointIndex = 0;
    
    // Инициализация первой точки
    loadCalibPoint(0);
    updateCalibTimerUI(CALIB_CFG.TIME_MS);

    el('calibBannerTitle').textContent = 'Калибровка токовой петли 4–20 мА';
    el('calibBannerText').textContent =
      'Промышленный датчик давления выдаёт погрешность. Настройте потенциометром ток петли для 3 контрольных точек (4.0 мА, 12.0 мА, 20.0 мА) в пределах допуска ±0.15 мА и зафиксируйте калибровку!';
    const btn = el('calibStartBtn');
    btn.textContent = 'Начать калибровку';
    btn.onclick = beginCalibActive;

    el('calibBanner').classList.remove('hidden');
    el('calibScreen').classList.remove('hidden');

    initCalibControlsOnce();
    drawCalibMeterGauge();
  }

  function beginCalibActive(){
    if (!calibGame.active) return;
    el('calibBanner').classList.add('hidden');
    calibGame.deadline = performance.now() + CALIB_CFG.TIME_MS;
    calibGame.rafId = requestAnimationFrame(tickCalibTimer);
    onCalibAdjust(calibGame.currentVal);
  }

  function tickCalibTimer(now){
    if (!calibGame.active) return;
    const left = calibGame.deadline - now;
    updateCalibTimerUI(left);
    if (left <= 0){
      finishCalib(false);
      return;
    }
    calibGame.rafId = requestAnimationFrame(tickCalibTimer);
  }

  function updateCalibTimerUI(msLeft){
    const bar = el('calibTimerBar');
    const txt = el('calibTimerText');
    if (!bar || !txt) return;
    const sec = (Math.max(0, msLeft) / 1000).toFixed(1) + ' с';
    txt.textContent = sec;
    const pct = clamp((msLeft / CALIB_CFG.TIME_MS) * 100, 0, 100);
    bar.style.width = pct + '%';
    const stateCls = pct <= 30 ? ' low' : (pct <= 55 ? ' warn' : '');
    bar.className = 'calib-timer-fill' + stateCls;
    txt.className = 'calib-pill timer' + (pct <= 30 ? ' low' : '');
  }

  function loadCalibPoint(idx){
    calibGame.pointIndex = idx;
    const pt = CALIB_CFG.POINTS[idx];
    calibGame.targetVal = pt.target;
    calibGame.currentVal = pt.startVal;

    el('calibTarget').textContent = pt.label.split(' (')[0];
    const slider = el('calibSlider');
    if (slider) slider.value = pt.startVal;

    for (let i = 1; i <= 3; i++){
      const chip = el('calibChip' + i);
      if (!chip) continue;
      if (i - 1 < idx) chip.className = 'calib-pt-chip done';
      else if (i - 1 === idx) chip.className = 'calib-pt-chip active';
      else chip.className = 'calib-pt-chip';
    }

    const lockBtn = el('calibLockBtn');
    if (lockBtn){
      lockBtn.querySelector('span').textContent = 'Зафиксировать калибровку (Точка ' + (idx + 1) + '/3)';
      lockBtn.classList.add('disabled');
      lockBtn.disabled = true;
    }

    onCalibAdjust(pt.startVal);
  }

  let calibControlsInited = false;
  function initCalibControlsOnce(){
    if (calibControlsInited) return;
    calibControlsInited = true;

    // Шаговые кнопки [-1.0, -0.1, +0.1, +1.0]
    document.querySelectorAll('.calib-step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!calibGame.active) return;
        const delta = parseFloat(btn.dataset.step) || 0;
        onCalibAdjust(calibGame.currentVal + delta);
      });
    });

    // Слайдер (потенциометр)
    const slider = el('calibSlider');
    if (slider){
      slider.addEventListener('input', e => {
        if (!calibGame.active) return;
        onCalibAdjust(parseFloat(e.target.value) || 0);
      });
    }

    // Кнопка фиксации точки
    const lockBtn = el('calibLockBtn');
    if (lockBtn){
      lockBtn.addEventListener('click', onCalibLock);
    }
  }

  function onCalibAdjust(val){
    calibGame.currentVal = clamp(Math.round(val * 100) / 100, 0, 24);
    const slider = el('calibSlider');
    if (slider && Math.abs(parseFloat(slider.value) - calibGame.currentVal) > 0.05){
      slider.value = calibGame.currentVal;
    }

    const dig = el('calibDigitalVal');
    if (dig){
      const sVal = calibGame.currentVal.toFixed(2).padStart(5, '0');
      dig.innerHTML = sVal + ' <span class="unit">mA</span>';
    }

    const diff = calibGame.currentVal - calibGame.targetVal;
    const inTolerance = Math.abs(diff) <= CALIB_CFG.TOLERANCE;

    const led = el('calibLed');
    const txt = el('calibStatusText');
    const lockBtn = el('calibLockBtn');

    if (inTolerance){
      if (led) led.className = 'status-led good';
      if (txt){
        const sign = diff >= 0 ? '+' : '';
        txt.innerHTML = '<span style="color:#22c55e">Δ = ' + sign + diff.toFixed(2) + ' мА · В ДОПУСКЕ ✔</span>';
      }
      if (lockBtn){
        lockBtn.classList.remove('disabled');
        lockBtn.disabled = false;
      }
      tone(880, 0.04, 'sine', 0.03);
    } else {
      if (led) led.className = 'status-led bad';
      if (txt){
        const sign = diff >= 0 ? '+' : '';
        txt.innerHTML = '<span style="color:#ef4444">Δ = ' + sign + diff.toFixed(2) + ' мА · РАСКАЛИБРОВКА</span>';
      }
      if (lockBtn){
        lockBtn.classList.add('disabled');
        lockBtn.disabled = true;
      }
    }

    drawCalibMeterGauge();
  }

  function onCalibLock(){
    if (!calibGame.active) return;
    const diff = Math.abs(calibGame.currentVal - calibGame.targetVal);
    if (diff > CALIB_CFG.TOLERANCE) return;

    sfx.good();
    flash = 0.35; flashColor = '56,189,248';

    const chip = el('calibChip' + (calibGame.pointIndex + 1));
    if (chip) chip.className = 'calib-pt-chip done';

    const nextIdx = calibGame.pointIndex + 1;
    if (nextIdx < 3){
      loadCalibPoint(nextIdx);
    } else {
      finishCalib(true);
    }
  }

  function finishCalib(won){
    if (!calibGame.active) return;
    calibGame.active = false;
    cancelAnimationFrame(calibGame.rafId); calibGame.rafId = 0;

    try {
      if (won){
        score += CALIB_CFG.REWARD;
        fuel = Math.min(100, fuel + 20);
        updateHUD();
        if (sfx.combo) sfx.combo();
        else if (sfx.good) sfx.good();
        flash = 0.55; flashColor = '34,197,94';

        el('calibBannerTitle').textContent = 'Калибровка 4-20 мА успешно завершена!';
        el('calibBannerText').textContent =
          'Все 3 контрольные точки настроены с нулевой погрешностью. Награда наладчика: +' + CALIB_CFG.REWARD + ' очков, +20 света.';
      } else {
        updateCalibTimerUI(0);
        if (sfx.bad) sfx.bad();
        flash = 0.35; flashColor = '255,110,90';
        el('calibBannerTitle').textContent = 'Время калибровки истекло';
        el('calibBannerText').textContent =
          'Наладчик зафиксировал ' + calibGame.pointIndex + '/3 точек. Смена в цеху продолжается (+0 очков).';
      }
    } catch (err){
      console.error('finishCalib err:', err);
    }

    const btn = el('calibStartBtn');
    if (btn){
      btn.textContent = 'Продолжить смену';
      btn.onclick = () => closeFloorEvent(won);
    }
    if (el('calibBanner')) el('calibBanner').classList.remove('hidden');
    calibGame.closeTimer = setTimeout(() => closeFloorEvent(won), CALIB_CFG.CLOSE_DELAY_MS);
  }

  function drawCalibMeterGauge(){
    const cv = el('calibMeterCanvas');
    if (!cv) return;
    const g = cv.getContext('2d');
    const w = cv.width, h = cv.height;

    g.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h - 18;
    const r = 135;

    // Фон циферблата
    g.fillStyle = '#0b101b';
    g.beginPath();
    g.arc(cx, cy, r + 15, Math.PI, 0);
    g.closePath();
    g.fill();
    g.strokeStyle = '#1e293b';
    g.lineWidth = 2;
    g.stroke();

    // Зелёный сектор допуска вокруг целевой точки
    const minVal = 0, maxVal = 24;
    const toAngle = v => Math.PI + (v / maxVal) * Math.PI;

    const tMin = Math.max(0, calibGame.targetVal - CALIB_CFG.TOLERANCE);
    const tMax = Math.min(24, calibGame.targetVal + CALIB_CFG.TOLERANCE);
    const a1 = toAngle(tMin), a2 = toAngle(tMax);

    g.save();
    g.fillStyle = 'rgba(34, 197, 94, 0.28)';
    g.beginPath();
    g.arc(cx, cy, r + 2, a1, a2);
    g.arc(cx, cy, r - 30, a2, a1, true);
    g.closePath();
    g.fill();
    g.restore();

    // Дуга шкалы
    g.strokeStyle = '#64748b';
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(cx, cy, r, Math.PI, 0);
    g.stroke();

    // Деления шкалы (0 .. 24 мА)
    for (let v = 0; v <= 24; v += 1){
      const a = toAngle(v);
      const isMajor = (v % 4 === 0);
      const len = isMajor ? 14 : 7;
      const x1 = cx + Math.cos(a) * (r - len);
      const y1 = cy + Math.sin(a) * (r - len);
      const x2 = cx + Math.cos(a) * r;
      const y2 = cy + Math.sin(a) * r;

      g.strokeStyle = isMajor ? '#f8fafc' : '#475569';
      g.lineWidth = isMajor ? 2 : 1;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();

      if (isMajor){
        const tx = cx + Math.cos(a) * (r - 26);
        const ty = cy + Math.sin(a) * (r - 26);
        g.fillStyle = (v === calibGame.targetVal) ? '#38bdf8' : '#94a3b8';
        g.font = 'bold 11px sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(String(v), tx, ty);
      }
    }

    // Маркировка прибора
    g.fillStyle = '#64748b';
    g.font = '9px sans-serif';
    g.textAlign = 'center';
    g.fillText('мА · 4-20 mA · КЛАСС 0.5', cx, cy - 65);
    g.fillStyle = '#0284c7';
    g.font = 'bold 10px sans-serif';
    g.fillText('СОТА КИПиА · КАЛИБРАТОР', cx, cy - 48);

    // Стрелка индикатора
    const needleVal = clamp(calibGame.currentVal, 0, 24);
    const needleA = toAngle(needleVal);

    g.save();
    g.shadowColor = 'rgba(0,0,0,0.6)';
    g.shadowBlur = 6;
    g.strokeStyle = '#ef4444';
    g.lineWidth = 2.8;
    g.beginPath();
    g.moveTo(cx - Math.cos(needleA) * 12, cy - Math.sin(needleA) * 12);
    g.lineTo(cx + Math.cos(needleA) * (r - 4), cy + Math.sin(needleA) * (r - 4));
    g.stroke();

    // Центральная бобышка стрелки
    g.fillStyle = '#334155';
    g.beginPath(); g.arc(cx, cy, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ef4444';
    g.beginPath(); g.arc(cx, cy, 4, 0, Math.PI * 2); g.fill();
    g.restore();
  }




  /* ============================================================
     2.5D Отрисовка станков КИПиА
     ============================================================ */
    /* ============================================================
     2.5D Отрисовка станков КИПиА (в точности по референсу)
     0: Контрольно-измерительные приборы
     1: Диагностика и наладка оборудования
     2: Исполнительные механизмы и приводы (стеклянный бокс)
     3: Датчики и измерительные системы (трубный стенд)
     4: Электрические схемы и щитное оборудование (шкаф автоматики)
     ============================================================ */
  function drawKIPStation(type, done, hard, now, seed){
    const accent = hard ? '#c084fc' : (done ? '#34d399' : '#38bdf8');
    const drawStool = (sx = 0) => {
      ctx.fillStyle = 'rgba(7,11,22,0.55)';
      ctx.beginPath(); ctx.ellipse(sx, 24, 13, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(sx - 11, 21, 22, 2.5);
      ctx.fillStyle = '#090d16'; ctx.fillRect(sx - 12, 22, 3, 2); ctx.fillRect(sx + 9, 22, 3, 2);
      ctx.fillStyle = '#64748b'; ctx.fillRect(sx - 1.5, 13, 3, 9);
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(sx - 11, 6, 22, 9, 3); ctx.fill();
      ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.roundRect(sx - 11, 5, 22, 6, 3); ctx.fill();
      ctx.fillStyle = '#64748b'; ctx.fillRect(sx - 9, 5, 18, 1.5);
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1; ctx.strokeRect(sx - 11, 5, 22, 9);
    };
    const drawBench = (w, leftPedestal = true, rightPedestal = true, withChair = true) => {
      // Мягкая 2.5D тень от стола на полу
      ctx.fillStyle = 'rgba(6,10,20,0.6)';
      ctx.fillRect(-w/2 - 3, 17, w + 8, 6);
      // Тёмный подстольный каркас и опоры
      ctx.fillStyle = '#0b111e';
      ctx.fillRect(-w/2 + 4, 3, w - 8, 16);
      ctx.fillStyle = '#141c2f';
      ctx.fillRect(-w/2 + 4, 15, w - 8, 3);
      // Тумбы с ящиками и чёткой фаской
      const drawPed = (px) => {
        ctx.fillStyle = '#172033'; ctx.fillRect(px, 3, 24, 16);
        ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1; ctx.strokeRect(px, 3, 24, 16);
        ctx.fillStyle = '#293548'; ctx.fillRect(px + 2, 5, 20, 4.5); ctx.fillRect(px + 2, 11, 20, 5.5);
        ctx.fillStyle = '#475569'; ctx.fillRect(px + 2, 5, 20, 1); ctx.fillRect(px + 2, 11, 20, 1);
        ctx.fillStyle = '#cbd5e1'; ctx.fillRect(px + 9, 7, 6, 1); ctx.fillRect(px + 9, 13.5, 6, 1);
      };
      if (leftPedestal) drawPed(-w/2 + 2);
      if (rightPedestal) drawPed(w/2 - 26);
      // 2.5D столешница: верхняя плоскость, передняя грань и LED-кант (в стиле П)
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.roundRect(-w/2, -7, w, 11, 2); ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-w/2 + 2, -6, w - 4, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-w/2 + 2, -7, w - 4, 1.5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-w/2, 1, w, 3.5);
      ctx.fillStyle = accent;
      ctx.fillRect(-w/2 + 4, 2.5, w - 8, 1.3);
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1.1;
      ctx.strokeRect(-w/2, -7, w, 11.5);
      if (withChair) drawStool(0);
    };

    if (type === 0){
      // 0. КОНТРОЛЬНО-ИЗМЕРИТЕЛЬНЫЕ ПРИБОРЫ (слева вверху)
      // Настенная P&ID-доска сзади в стальной раме
      ctx.fillStyle = '#09111f'; ctx.fillRect(-54, -44, 108, 28);
      ctx.strokeStyle = '#050912'; ctx.lineWidth = 2; ctx.strokeRect(-55, -45, 110, 30);
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.2; ctx.strokeRect(-54, -44, 108, 28);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-46, -33); ctx.lineTo(-24, -33); ctx.lineTo(-16, -38); ctx.lineTo(4, -38);
      ctx.moveTo(-24, -33); ctx.lineTo(-24, -24); ctx.lineTo(-6, -24);
      ctx.stroke();
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(32, -31, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(32, -31); ctx.lineTo(36, -34); ctx.stroke();

      drawBench(118, true, true, true);

      // Широкоформатный осциллограф слева
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-52, -28, 38, 22);
      ctx.fillStyle = '#475569'; ctx.fillRect(-52, -28, 38, 2);
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1.2; ctx.strokeRect(-52, -28, 38, 22);
      ctx.fillStyle = '#021814'; ctx.fillRect(-49, -25, 25, 16);
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 23; i++){
        const wx = -48 + i;
        const wy = -17 + Math.sin(i * 0.48 + now * 0.008 + seed) * 5;
        if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-21, -24, 3, 3); ctx.fillRect(-21, -18, 3, 3); ctx.fillRect(-21, -12, 3, 3);

      // Блок питания и частотомер по центру
      ctx.fillStyle = '#293548'; ctx.fillRect(-10, -25, 28, 19);
      ctx.fillStyle = '#475569'; ctx.fillRect(-10, -25, 28, 1.5);
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1.1; ctx.strokeRect(-10, -25, 28, 19);
      ctx.fillStyle = '#020617'; ctx.fillRect(-7, -22, 22, 8);
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center';
      ctx.fillText('24.0V', 4, -16);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(-6, -11, 3, 3);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(0, -11, 3, 3);

      // Два жёлтых мультиметра справа и провода щупов
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.roundRect(22, -23, 14, 17, 2); ctx.fill();
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(24, -21, 10, 5);
      ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.roundRect(39, -20, 12, 14, 2); ctx.fill();
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(41, -18, 8, 4);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(26, -6); ctx.quadraticCurveTo(16, 4, 4, -3); ctx.stroke();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(31, -6); ctx.quadraticCurveTo(22, 5, 12, -2); ctx.stroke();
    }
    else if (type === 1){
      // 1. ДИАГНОСТИКА И НАЛАДКА ОБОРУДОВАНИЯ (по центру вверху)
      // Настенный перфорированный щит с инструментом
      ctx.fillStyle = '#151d2e'; ctx.fillRect(-54, -46, 108, 30);
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1.8; ctx.strokeRect(-54, -46, 108, 30);
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.strokeRect(-53, -45, 106, 28);
      [-44, -36, -28, -20, 18, 26, 34, 42].forEach((ix, idx) => {
        ctx.fillStyle = idx < 4 ? '#cbd5e1' : '#94a3b8';
        ctx.fillRect(ix, -40, 2.5, 16);
        ctx.fillStyle = idx % 2 === 0 ? '#ef4444' : '#eab308';
        ctx.fillRect(ix - 1, -43, 4.5, 5);
      });

      drawBench(118, true, true, true);

      // Портативный осциллограф слева
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-50, -25, 22, 19);
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1.1; ctx.strokeRect(-50, -25, 22, 19);
      ctx.fillStyle = '#022c22'; ctx.fillRect(-48, -23, 18, 11);
      ctx.strokeStyle = '#34d399'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(-47, -18); ctx.lineTo(-42, -21); ctx.lineTo(-37, -14); ctx.lineTo(-31, -18); ctx.stroke();

      // Широкоформатный монитор SCADA по центру с клавиатурой (2.5D рамка как в П)
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-22, -33, 42, 26);
      ctx.fillStyle = '#475569'; ctx.fillRect(-22, -33, 42, 2);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.3; ctx.strokeRect(-22, -33, 42, 26);
      ctx.fillStyle = '#061325'; ctx.fillRect(-20, -30, 38, 21);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 34; i++){
        const wx = -18 + i;
        const wy = -20 + Math.sin(i * 0.35 + now * 0.007) * 5;
        if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-16, -6, 28, 3.5);
      ctx.fillStyle = '#64748b'; ctx.fillRect(-14, -5, 24, 1.5);

      // Жёлтый мультиметр и стенд испытания справа
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.roundRect(24, -22, 13, 16, 2); ctx.fill();
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(26, -20, 9, 5);
      ctx.fillStyle = '#334155'; ctx.fillRect(40, -27, 14, 21);
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1.1; ctx.strokeRect(40, -27, 14, 21);
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(47, -21, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(43, -15, 8, 5);
    }
    else if (type === 2){
      // 2. ИСПОЛНИТЕЛЬНЫЕ МЕХАНИЗМЫ И ПРИВОДЫ (справа вверху)
      drawBench(122, true, true, false);

      ctx.fillStyle = '#475569';
      ctx.fillRect(-42, -51, 6, 10);
      ctx.fillRect(36, -51, 6, 10);

      // Прозрачная стеклянная камера с неоновой синей рамкой сверху
      const boxW = 112, boxH = 42;
      ctx.fillStyle = 'rgba(10, 18, 34, 0.78)';
      ctx.fillRect(-boxW/2, -45, boxW, boxH);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-boxW/2, -45, boxW, boxH);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(-boxW/2 + 2, -44, boxW - 4, 2.5);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(-boxW/2 + 8, -41); ctx.lineTo(-boxW/2 + 28, -41);
      ctx.lineTo(-boxW/2 + 12, -5); ctx.lineTo(-boxW/2 + 4, -5);
      ctx.fill();

      ctx.fillStyle = '#eab308'; ctx.fillRect(-48, -22, 52, 8);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(4, -22, 44, 8);
      ctx.fillStyle = '#64748b';
      [-40, -20, 0, 22, 40].forEach(fx => ctx.fillRect(fx, -25, 4.5, 14));

      ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.roundRect(-48, -36, 18, 28, 2); ctx.fill();
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-44, -32, 10, 6);

      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.roundRect(-10, -34, 20, 20, 3); ctx.fill();
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, -35, 7.5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1.2; ctx.stroke();

      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(20, -32, 6.5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(20, -32); ctx.lineTo(23, -35); ctx.stroke();
      ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(33, -38, 16, 16, 3); ctx.fill();
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#34d399'; ctx.fillRect(36, -33, 10, 5);
    }
    else if (type === 3){
      // 3. ДАТЧИКИ И ИЗМЕРИТЕЛЬНЫЕ СИСТЕМЫ (слева внизу)
      drawBench(122, true, true, true);

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-50, -18, 100, 6);
      ctx.fillRect(-50, -34, 6, 27);
      ctx.fillRect(44, -34, 6, 27);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-52, -36, 24, 5);
      ctx.fillStyle = '#cbd5e1';
      [-46, -24, 0, 24, 42].forEach(fx => ctx.fillRect(fx, -20, 4, 10));

      [-28, 14].forEach(sx => {
        ctx.fillStyle = '#64748b'; ctx.fillRect(sx + 5, -26, 3, 8);
        ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(sx - 2, -40, 17, 15, 3); ctx.fill();
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#042f2e'; ctx.beginPath(); ctx.arc(sx + 6.5, -32.5, 4.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#34d399'; ctx.fillRect(sx + 4, -33.5, 5, 2);
      });

      ctx.fillStyle = '#0f172a'; ctx.fillRect(-9, -31, 20, 15);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.2; ctx.strokeRect(-9, -31, 20, 15);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-6, -27, 14, 3);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(-6, -21, 8, 2);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)'; ctx.fillRect(34, -40, 8, 24);
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.strokeRect(34, -40, 8, 24);
      const bobY = -28 + Math.sin(now * 0.005 + seed) * 4;
      ctx.fillStyle = '#facc15'; ctx.fillRect(35.5, bobY, 5, 3);
    }
    else {
      // 4. ЭЛЕКТРИЧЕСКИЕ СХЕМЫ И ЩИТНОЕ ОБОРУДОВАНИЕ (справа внизу)
      drawBench(122, true, false, false);

      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(-54, -42, 60, 37, 3); ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.fillRect(-50, -34, 52, 2.5);
      ctx.fillRect(-50, -23, 52, 2.5);
      ctx.fillRect(-50, -12, 52, 2.5);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(-48, -38, 14, 9);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(-32, -38, 10, 9);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-20, -38, 8, 9);
      ctx.fillStyle = '#64748b'; ctx.fillRect(-10, -38, 10, 9);
      const blink = Math.sin(now * 0.008 + seed) > 0;
      ctx.fillStyle = blink ? '#22c55e' : '#0f172a'; ctx.fillRect(-46, -37, 2.5, 2.5);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-41, -37, 2.5, 2.5);
      ctx.fillStyle = '#eab308'; ctx.fillRect(-48, -27, 24, 7);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-20, -27, 18, 7);

      ctx.fillStyle = '#0f172a'; ctx.fillRect(-12, -21, 28, 16);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1; ctx.strokeRect(-12, -21, 28, 16);
      ctx.fillStyle = '#041d38'; ctx.fillRect(-10, -19, 24, 12);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-8, -13); ctx.lineTo(0, -13); ctx.lineTo(4, -16); ctx.lineTo(12, -16); ctx.stroke();
      ctx.fillStyle = '#475569'; ctx.fillRect(-14, -5, 32, 3.5);

      ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.roundRect(24, -40, 32, 57, 3); ctx.fill();
      ctx.fillStyle = '#64748b'; ctx.fillRect(26, -40, 28, 2);
      ctx.strokeStyle = '#090d16'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#334155'; ctx.fillRect(28, -35, 24, 24);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(44, -22, 3, 6);
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(34, -30, 2, 0, Math.PI*2); ctx.fill();
    }
  }

  /* ============================================================
     Мини-игра «Диагностика сигнала осциллографом» (scope)
     ============================================================ */
  const SCOPE_CFG = { TIME_MS: 25000, REWARD: 200, CLOSE_DELAY_MS: 1400 };
  const scopeGame = {
    active: false, phase: 'idle',
    targetFreq: 3.0, targetAmp: 3.4,
    freq: 1.5, amp: 1.5,
    deadline: 0, rafId: 0, closeTimer: null
  };

  function cleanupScope(){
    scopeGame.active = false;
    scopeGame.phase = 'idle';
    if (scopeGame.rafId){ cancelAnimationFrame(scopeGame.rafId); scopeGame.rafId = 0; }
    clearTimeout(scopeGame.closeTimer); scopeGame.closeTimer = null;
  }

  function startScopeEvent(){
    cleanupScope();
    scopeGame.active = true;
    scopeGame.phase = 'intro';
    scopeGame.targetFreq = Number((2.0 + Math.random() * 2.4).toFixed(1));
    scopeGame.targetAmp = Number((2.2 + Math.random() * 2.2).toFixed(1));
    scopeGame.freq = 1.4;
    scopeGame.amp = 1.4;

    const fs = el('scopeFreqSlider'), as = el('scopeAmpSlider');
    if (fs) fs.value = scopeGame.freq;
    if (as) as.value = scopeGame.amp;
    if (el('scopeFreqVal')) el('scopeFreqVal').textContent = scopeGame.freq.toFixed(1) + ' Гц';
    if (el('scopeAmpVal')) el('scopeAmpVal').textContent = scopeGame.amp.toFixed(1) + ' В';
    if (el('scopeTargetFreqHint')) el('scopeTargetFreqHint').textContent = `Эталон: ~${scopeGame.targetFreq.toFixed(1)} Гц`;

    const lockBtn = el('scopeLockBtn');
    if (lockBtn){ lockBtn.classList.add('disabled'); lockBtn.disabled = true; }
    updateScopeTimerUI(SCOPE_CFG.TIME_MS);

    if (el('scopeBannerTitle')) el('scopeBannerTitle').textContent = 'Диагностика сигнала осциллографом';
    if (el('scopeBannerText')) el('scopeBannerText').textContent =
      'На стенде диагностики обнаружено искажение сигнала датчика. Подстройте частоту (Гц) и амплитуду (В), чтобы синяя кривая совпала с зелёным эталоном! Награда: +' + SCOPE_CFG.REWARD + ' очков.';
    const btn = el('scopeStartBtn');
    if (btn){ btn.textContent = 'Включить осциллограф'; btn.onclick = beginScopeActive; }

    initScopeControlsOnce();
    if (el('scopeBanner')) el('scopeBanner').classList.remove('hidden');
    if (el('scopeScreen')) el('scopeScreen').classList.remove('hidden');
    drawScopeCanvas(performance.now());
  }

  let scopeControlsInited = false;
  function initScopeControlsOnce(){
    if (scopeControlsInited) return;
    scopeControlsInited = true;
    const fs = el('scopeFreqSlider'), as = el('scopeAmpSlider'), lockBtn = el('scopeLockBtn');
    if (fs) fs.addEventListener('input', e => {
      scopeGame.freq = parseFloat(e.target.value) || 1.5;
      if (el('scopeFreqVal')) el('scopeFreqVal').textContent = scopeGame.freq.toFixed(1) + ' Гц';
    });
    if (as) as.addEventListener('input', e => {
      scopeGame.amp = parseFloat(e.target.value) || 1.5;
      if (el('scopeAmpVal')) el('scopeAmpVal').textContent = scopeGame.amp.toFixed(1) + ' В';
    });
    if (lockBtn) lockBtn.addEventListener('click', () => {
      if (scopeGame.active && scopeGame.phase === 'playing') finishScope(true);
    });
  }

  function beginScopeActive(){
    if (!scopeGame.active || scopeGame.phase !== 'intro') return;
    if (el('scopeBanner')) el('scopeBanner').classList.add('hidden');
    scopeGame.phase = 'playing';
    scopeGame.deadline = performance.now() + SCOPE_CFG.TIME_MS;
    scopeGame.rafId = requestAnimationFrame(tickScope);
  }

  function updateScopeTimerUI(msLeft){
    const bar = el('scopeTimerBar'), txt = el('scopeTimerText');
    if (!bar || !txt) return;
    txt.textContent = (Math.max(0, msLeft) / 1000).toFixed(1) + ' с';
    const pct = clamp((msLeft / SCOPE_CFG.TIME_MS) * 100, 0, 100);
    bar.style.width = pct + '%';
    const st = pct <= 30 ? ' low' : (pct <= 55 ? ' warn' : '');
    bar.className = 'calib-timer-fill' + st;
    txt.className = 'calib-pill timer' + (pct <= 30 ? ' low' : '');
  }

  function tickScope(now){
    if (!scopeGame.active || scopeGame.phase !== 'playing') return;
    const left = scopeGame.deadline - now;
    updateScopeTimerUI(left);
    drawScopeCanvas(now);

    const df = Math.abs(scopeGame.freq - scopeGame.targetFreq);
    const da = Math.abs(scopeGame.amp - scopeGame.targetAmp);
    const match = Math.round(clamp(100 - (df * 28 + da * 22), 0, 100));
    const mv = el('scopeMatchVal'), mn = el('scopeMatchNote'), lockBtn = el('scopeLockBtn');
    if (mv) mv.textContent = match + '%';
    if (mn){
      mn.textContent = match >= 92 ? 'Сигнал синхронизирован!' : 'Подстройте частоту и амплитуду';
      mn.style.color = match >= 92 ? '#34d399' : '#f59e0b';
    }
    if (lockBtn){
      const ready = match >= 92;
      lockBtn.classList.toggle('disabled', !ready);
      lockBtn.disabled = !ready;
    }

    if (left <= 0){ finishScope(false); return; }
    scopeGame.rafId = requestAnimationFrame(tickScope);
  }

  function drawScopeCanvas(now){
    const cv = el('scopeCanvas');
    if (!cv) return;
    const g = cv.getContext('2d');
    const w = cv.width, h = cv.height, cy = h / 2;
    g.fillStyle = '#040911'; g.fillRect(0, 0, w, h);

    g.strokeStyle = 'rgba(56, 189, 248, 0.08)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 28){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 22.5){ g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }

    const phaseShift = now * 0.003;
    // Зелёный эталонный луч
    g.strokeStyle = 'rgba(34, 197, 94, 0.78)'; g.lineWidth = 2.5; g.setLineDash([6, 4]);
    g.beginPath();
    for (let x = 0; x <= w; x += 3){
      const y = cy + Math.sin(x * 0.018 * scopeGame.targetFreq + phaseShift) * (scopeGame.targetAmp * 14);
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke(); g.setLineDash([]);

    // Синий рабочий луч
    g.strokeStyle = '#38bdf8'; g.lineWidth = 3;
    g.beginPath();
    for (let x = 0; x <= w; x += 3){
      const y = cy + Math.sin(x * 0.018 * scopeGame.freq + phaseShift) * (scopeGame.amp * 14);
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }

  function finishScope(won){
    if (!scopeGame.active) return;
    scopeGame.phase = 'done';
    if (scopeGame.rafId){ cancelAnimationFrame(scopeGame.rafId); scopeGame.rafId = 0; }
    if (won){
      score += SCOPE_CFG.REWARD; fuel = Math.min(100, fuel + 20);
      sfx.good(); flash = 0.4; flashColor = '56,189,248';
      updateHUD();
      if (el('scopeBannerTitle')) el('scopeBannerTitle').textContent = 'Сигнал синхронизирован!';
      if (el('scopeBannerText')) el('scopeBannerText').textContent = 'Осциллограмма совпала с эталоном. Награда: +' + SCOPE_CFG.REWARD + ' очков, +20 света.';
    } else {
      sfx.bad(); flash = 0.3; flashColor = '255,100,100';
      if (el('scopeBannerTitle')) el('scopeBannerTitle').textContent = 'Время диагностики истекло';
      if (el('scopeBannerText')) el('scopeBannerText').textContent = 'Не удалось синхронизировать сигнал. Можно повторить диагностику у стенда.';
    }
    const btn = el('scopeStartBtn');
    if (btn){ btn.textContent = 'Продолжить смену'; btn.onclick = () => closeFloorEvent(won); }
    if (el('scopeBanner')) el('scopeBanner').classList.remove('hidden');
    scopeGame.closeTimer = setTimeout(() => closeFloorEvent(won), SCOPE_CFG.CLOSE_DELAY_MS);
  }


  /* ============================================================
     Мини-игра «Проверка цепей мультиметром» (meter)
     ============================================================ */
  const METER_CFG = {
    TIME_MS: 28000,
    REWARD: 200,
    CLOSE_DELAY_MS: 1400
  };
  const METER_POOL = [
    { mode: 'vdc', unit: 'В DC', label: 'V⎓', title: 'Шина питания ПЛК (DC 24 В)', spec: 'Норма: 24.0 В (допуск 22.5–25.5 В)', normVal: '24.1', faultVal: '14.3' },
    { mode: 'ohm', unit: 'Ом', label: 'Ω', title: 'Нагрузочный резистор HART (250 Ом)', spec: 'Норма: 250 Ом (допуск 240–260 Ом)', normVal: '250', faultVal: 'OL' },
    { mode: 'ma', unit: 'мА', label: 'mA', title: 'Выходной ток датчика давления P1', spec: 'Норма: 4.0–20.0 мА (ожидается ~12.0 мА)', normVal: '12.0', faultVal: '1.8' }
  ];

  let meterGame = {
    active: false,
    phase: 'banner',
    step: 0,
    selectedMode: null,
    tasks: [],
    deadline: 0,
    rafId: 0,
    closeTimer: 0
  };

  function cleanupMeter(){
    if (meterGame.rafId) cancelAnimationFrame(meterGame.rafId);
    if (meterGame.closeTimer) clearTimeout(meterGame.closeTimer);
    meterGame.active = false;
    meterGame.rafId = 0;
    meterGame.closeTimer = 0;
  }

  function startMeterEvent(){
    cleanupMeter();
    meterGame.active = true;
    meterGame.phase = 'banner';
    meterGame.step = 0;
    meterGame.selectedMode = null;

    // 3 точки в случайном порядке, минимум 1 с реальным дефектом
    const faultIdx = Math.floor(Math.random() * METER_POOL.length);
    meterGame.tasks = METER_POOL.map((t, i) => ({ ...t, isFault: i === faultIdx }))
      .sort(() => Math.random() - 0.5);

    if (el('meterBannerTitle')) el('meterBannerTitle').textContent = 'Проверка цепей мультиметром';
    if (el('meterBannerText')) el('meterBannerText').textContent = 'На стенде 3 контрольные точки (питание 24 В DC, резистор HART 250 Ом и токовая петля 4–20 мА). Выберите нужный режим мультиметра (V⎓, Ω или mA), сверьте показания с нормой и вынесите вердикт!';
    const btn = el('meterStartBtn');
    if (btn){
      btn.textContent = 'Взять щупы';
      btn.onclick = beginMeterRound;
    }

    document.querySelectorAll('#meterScreen .meter-mode-btn').forEach(b => {
      b.classList.remove('active');
      b.onclick = () => selectMeterMode(b.getAttribute('data-mode'));
    });
    if (el('meterOkBtn')) el('meterOkBtn').onclick = () => submitMeterVerdict(false);
    if (el('meterFaultBtn')) el('meterFaultBtn').onclick = () => submitMeterVerdict(true);

    updateMeterStepUI();
    updateMeterTimerUI(METER_CFG.TIME_MS);
    if (el('meterBanner')) el('meterBanner').classList.remove('hidden');
    if (el('meterScreen')) el('meterScreen').classList.remove('hidden');
  }

  function beginMeterRound(){
    if (!meterGame.active) return;
    if (el('meterBanner')) el('meterBanner').classList.add('hidden');
    meterGame.phase = 'playing';
    meterGame.deadline = performance.now() + METER_CFG.TIME_MS;
    meterGame.rafId = requestAnimationFrame(tickMeter);
  }

  function selectMeterMode(mode){
    if (!meterGame.active || meterGame.phase !== 'playing') return;
    meterGame.selectedMode = mode;
    document.querySelectorAll('#meterScreen .meter-mode-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-mode') === mode);
    });
    try { sfx.step(); } catch(e){}
    updateMeterStepUI();
  }

  function updateMeterStepUI(){
    const task = meterGame.tasks[meterGame.step];
    if (!task) return;
    if (el('meterStepPill')) el('meterStepPill').textContent = 'Точка ' + (meterGame.step + 1) + '/' + meterGame.tasks.length;
    if (el('meterPointTitle')) el('meterPointTitle').textContent = task.title;
    if (el('meterPointSpec')) el('meterPointSpec').textContent = task.spec;

    const lcdVal = el('meterLcdVal');
    const lcdMode = el('meterLcdMode');
    const lcdUnit = el('meterLcdUnit');
    const status = el('meterProbeStatus');
    const okBtn = el('meterOkBtn');
    const faultBtn = el('meterFaultBtn');

    if (!meterGame.selectedMode){
      if (lcdMode) lcdMode.textContent = 'РЕЖИМ: ---';
      if (lcdUnit) lcdUnit.textContent = '—';
      if (lcdVal){ lcdVal.textContent = '----'; lcdVal.className = 'meter-lcd-val idle'; }
      if (status){
        status.textContent = 'Выберите нужный предел измерений на мультиметре слева (V⎓, Ω или mA).';
        status.className = 'meter-probe-status';
      }
      if (okBtn) okBtn.disabled = true;
      if (faultBtn) faultBtn.disabled = true;
      return;
    }

    const modeMeta = { vdc: 'DC V⎓', vrms: 'AC V~', ohm: 'OHM Ω', ma: 'LOOP mA' };
    if (lcdMode) lcdMode.textContent = 'РЕЖИМ: ' + (modeMeta[meterGame.selectedMode] || meterGame.selectedMode);

    if (meterGame.selectedMode !== task.mode){
      if (lcdUnit) lcdUnit.textContent = meterGame.selectedMode === 'vrms' ? 'В AC' : (meterGame.selectedMode === 'ohm' ? 'Ом' : (meterGame.selectedMode === 'ma' ? 'мА' : 'В DC'));
      if (lcdVal){ lcdVal.textContent = '0.00'; lcdVal.className = 'meter-lcd-val idle'; }
      if (status){
        status.textContent = 'Неверный предел измерений! Для этой точки нужен режим ' + task.label + '.';
        status.className = 'meter-probe-status warn';
      }
      if (okBtn) okBtn.disabled = true;
      if (faultBtn) faultBtn.disabled = true;
    } else {
      const val = task.isFault ? task.faultVal : task.normVal;
      if (lcdUnit) lcdUnit.textContent = task.unit;
      if (lcdVal){
        lcdVal.textContent = val;
        lcdVal.className = 'meter-lcd-val' + (task.isFault ? ' fault' : '');
      }
      if (status){
        status.textContent = 'Показания сняты (' + val + (val === 'OL' ? '' : ' ' + task.unit) + '). Сверьте с допуском и выберите вердикт!';
        status.className = 'meter-probe-status ok';
      }
      if (okBtn) okBtn.disabled = false;
      if (faultBtn) faultBtn.disabled = false;
    }
  }

  function submitMeterVerdict(claimFault){
    if (!meterGame.active || meterGame.phase !== 'playing') return;
    const task = meterGame.tasks[meterGame.step];
    if (!task || meterGame.selectedMode !== task.mode) return;

    if (claimFault === task.isFault){
      try { sfx.good(); } catch(e){}
      meterGame.step++;
      meterGame.selectedMode = null;
      document.querySelectorAll('#meterScreen .meter-mode-btn').forEach(b => b.classList.remove('active'));
      if (meterGame.step >= meterGame.tasks.length){
        finishMeter(true);
      } else {
        updateMeterStepUI();
      }
    } else {
      try { sfx.bad(); } catch(e){}
      meterGame.deadline -= 2500;
      const status = el('meterProbeStatus');
      if (status){
        status.textContent = 'Ошибка диагностики (−2.5 с)! Перепроверьте измерение относительно допуска.';
        status.className = 'meter-probe-status warn';
      }
    }
  }

  function updateMeterTimerUI(msLeft){
    const bar = el('meterTimerBar'), txt = el('meterTimerText');
    if (!bar || !txt) return;
    txt.textContent = (Math.max(0, msLeft) / 1000).toFixed(1) + ' с';
    const pct = clamp((msLeft / METER_CFG.TIME_MS) * 100, 0, 100);
    bar.style.width = pct + '%';
    const st = pct <= 30 ? ' low' : (pct <= 55 ? ' warn' : '');
    bar.className = 'calib-timer-fill' + st;
    txt.className = 'calib-pill timer' + (pct <= 30 ? ' low' : '');
  }

  function tickMeter(now){
    if (!meterGame.active || meterGame.phase !== 'playing') return;
    const left = meterGame.deadline - now;
    updateMeterTimerUI(left);
    if (left <= 0){ finishMeter(false); return; }
    meterGame.rafId = requestAnimationFrame(tickMeter);
  }

  function finishMeter(won){
    if (!meterGame.active) return;
    meterGame.phase = 'done';
    if (meterGame.rafId){ cancelAnimationFrame(meterGame.rafId); meterGame.rafId = 0; }
    if (won){
      score += METER_CFG.REWARD; fuel = Math.min(100, fuel + 20);
      sfx.good(); flash = 0.4; flashColor = '56,189,248';
      updateHUD();
      if (el('meterBannerTitle')) el('meterBannerTitle').textContent = 'Все цепи прозвонены!';
      if (el('meterBannerText')) el('meterBannerText').textContent = 'Питание, резистор HART и токовая петля проверены мультиметром. Награда: +' + METER_CFG.REWARD + ' очков, +20 света.';
    } else {
      sfx.bad(); flash = 0.3; flashColor = '255,100,100';
      if (el('meterBannerTitle')) el('meterBannerTitle').textContent = 'Время проверки истекло';
      if (el('meterBannerText')) el('meterBannerText').textContent = 'Не все точки успели прозвонить. Можно повторить диагностику у стенда.';
    }
    const btn = el('meterStartBtn');
    if (btn){ btn.textContent = 'Продолжить смену'; btn.onclick = () => closeFloorEvent(won); }
    if (el('meterBanner')) el('meterBanner').classList.remove('hidden');
    meterGame.closeTimer = setTimeout(() => closeFloorEvent(won), METER_CFG.CLOSE_DELAY_MS);
  }


/* ============================================================
   Регистрация мини-игр и 2.5D оборудования КИПиА
   ============================================================ */
if (window.registerMinigame) {
  registerMinigame('meter', { name: 'проверка цепей мультиметром', start: startMeterEvent, cleanup: cleanupMeter });
  registerMinigame('calib', { name: 'калибровка токовой петли 4–20 мА', start: startCalibEvent, cleanup: cleanupCalib });
  registerMinigame('wires', { name: 'монтаж клеммной схемы КИПиА', start: startWiresEvent, cleanup: cleanupWires });
  registerMinigame('pid',   { name: 'настройка ПИД-регулятора давления', start: startPidEvent, cleanup: cleanupPid });
  registerMinigame('scope', { name: 'диагностика сигнала осциллографом', start: startScopeEvent, cleanup: cleanupScope });
}
if (window.registerStationRenderer) {
  registerStationRenderer('kip', drawKIPStation);
}
