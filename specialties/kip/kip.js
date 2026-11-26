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
    const drawBench = (w, leftPedestal = true, rightPedestal = true) => {
      // Тень на полу
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-w/2 - 2, 18, w + 4, 5);
      // Нижняя стенка / опора
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-w/2 + 4, 3, w - 8, 16);
      // Тумбы с ящиками
      if (leftPedestal){
        ctx.fillStyle = '#1e293b'; ctx.fillRect(-w/2 + 2, 3, 24, 16);
        ctx.fillStyle = '#334155'; ctx.fillRect(-w/2 + 4, 5, 20, 4); ctx.fillRect(-w/2 + 4, 11, 20, 5);
        ctx.fillStyle = '#94a3b8'; ctx.fillRect(-w/2 + 11, 6.5, 6, 1); ctx.fillRect(-w/2 + 11, 13, 6, 1);
      }
      if (rightPedestal){
        ctx.fillStyle = '#1e293b'; ctx.fillRect(w/2 - 26, 3, 24, 16);
        ctx.fillStyle = '#334155'; ctx.fillRect(w/2 - 24, 5, 20, 4); ctx.fillRect(w/2 - 24, 11, 20, 5);
        ctx.fillStyle = '#94a3b8'; ctx.fillRect(w/2 - 17, 6.5, 6, 1); ctx.fillRect(w/2 - 17, 13, 6, 1);
      }
      // Столешница (2.5D торец + верхняя плоскость)
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.roundRect(-w/2, -7, w, 11, 2); ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-w/2, 1, w, 3);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-w/2 + 2, -5, w - 4, 5);
    };

    if (type === 0){
      // 0. КОНТРОЛЬНО-ИЗМЕРИТЕЛЬНЫЕ ПРИБОРЫ (слева вверху)
      // Настенная P&ID-доска сзади
      ctx.fillStyle = '#0b1320'; ctx.fillRect(-54, -44, 108, 28);
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.4; ctx.strokeRect(-54, -44, 108, 28);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-46, -33); ctx.lineTo(-24, -33); ctx.lineTo(-16, -38); ctx.lineTo(4, -38);
      ctx.moveTo(-24, -33); ctx.lineTo(-24, -24); ctx.lineTo(-6, -24);
      ctx.stroke();
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(32, -31, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(32, -31); ctx.lineTo(36, -34); ctx.stroke();

      drawBench(116, true, true);

      // Широкоформатный осциллограф слева
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-52, -28, 38, 24);
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.strokeRect(-52, -28, 38, 24);
      ctx.fillStyle = '#021814'; ctx.fillRect(-49, -25, 26, 16);
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 24; i++){
        const wx = -48 + i;
        const wy = -17 + Math.sin(i * 0.48 + now * 0.008 + seed) * 5;
        if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
      // Ручки осциллографа
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-20, -24, 3, 3); ctx.fillRect(-20, -18, 3, 3); ctx.fillRect(-20, -12, 3, 3);

      // Блок питания и частотомер по центру
      ctx.fillStyle = '#334155'; ctx.fillRect(-10, -25, 28, 20);
      ctx.strokeStyle = '#64748b'; ctx.strokeRect(-10, -25, 28, 20);
      ctx.fillStyle = '#020617'; ctx.fillRect(-7, -22, 22, 8);
      ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center';
      ctx.fillText('24.0V', 4, -16);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(-6, -11, 3, 3);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(0, -11, 3, 3);

      // Два жёлтых мультиметра справа и провода щупов
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.roundRect(22, -23, 14, 18, 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(24, -21, 10, 5);
      ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.roundRect(39, -20, 12, 15, 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(41, -18, 8, 4);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(26, -5); ctx.quadraticCurveTo(16, 6, 4, -2); ctx.stroke();
      ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(31, -5); ctx.quadraticCurveTo(22, 8, 12, -1); ctx.stroke();
    }
    else if (type === 1){
      // 1. ДИАГНОСТИКА И НАЛАДКА ОБОРУДОВАНИЯ (по центру вверху)
      // Настенный перфорированный щит с инструментом
      ctx.fillStyle = '#161e2e'; ctx.fillRect(-54, -46, 108, 30);
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.3; ctx.strokeRect(-54, -46, 108, 30);
      // Развешанные ключи, отвёртки и пассатижи
      [-44, -36, -28, -20, 18, 26, 34, 42].forEach((ix, idx) => {
        ctx.fillStyle = idx < 4 ? '#cbd5e1' : '#94a3b8';
        ctx.fillRect(ix, -40, 2.5, 16);
        ctx.fillStyle = idx % 2 === 0 ? '#ef4444' : '#eab308';
        ctx.fillRect(ix - 1, -43, 4.5, 5);
      });

      drawBench(116, true, true);

      // Портативный осциллограф слева
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-50, -25, 22, 19);
      ctx.fillStyle = '#022c22'; ctx.fillRect(-48, -23, 18, 11);
      ctx.strokeStyle = '#34d399'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(-47, -18); ctx.lineTo(-42, -21); ctx.lineTo(-37, -14); ctx.lineTo(-31, -18); ctx.stroke();

      // Широкоформатный монитор SCADA по центру с клавиатурой
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-22, -32, 42, 25);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.3; ctx.strokeRect(-22, -32, 42, 25);
      ctx.fillStyle = '#061325'; ctx.fillRect(-20, -30, 38, 21);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 34; i++){
        const wx = -18 + i;
        const wy = -20 + Math.sin(i * 0.35 + now * 0.007) * 5;
        if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
      // Клавиатура
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-16, -5, 28, 4);

      // Жёлтый мультиметр и стенд испытания справа
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.roundRect(24, -22, 13, 16, 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(26, -20, 9, 5);
      ctx.fillStyle = '#334155'; ctx.fillRect(40, -27, 14, 21);
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(47, -21, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(43, -15, 8, 5);
    }
    else if (type === 2){
      // 2. ИСПОЛНИТЕЛЬНЫЕ МЕХАНИЗМЫ И ПРИВОДЫ (справа вверху)
      // Массивное основание под стеклянной камерой
      drawBench(120, true, true);

      // Трубы уходящие вверх из камеры
      ctx.fillStyle = '#475569';
      ctx.fillRect(-42, -52, 6, 12);
      ctx.fillRect(36, -52, 6, 12);

      // Прозрачная стеклянная камера с неоновой синей рамкой сверху
      const boxW = 112, boxH = 44;
      ctx.fillStyle = 'rgba(12, 20, 36, 0.72)';
      ctx.fillRect(-boxW/2, -46, boxW, boxH);
      ctx.strokeStyle = hard ? '#c084fc' : (done ? '#10b981' : '#38bdf8');
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-boxW/2, -46, boxW, boxH);
      // Верхняя световая полоса бокса
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(-boxW/2 + 2, -45, boxW - 4, 3);
      // Блики стекла
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(-boxW/2 + 8, -42); ctx.lineTo(-boxW/2 + 28, -42);
      ctx.lineTo(-boxW/2 + 12, -4); ctx.lineTo(-boxW/2 + 4, -4);
      ctx.fill();

      // Внутренний жёлто-синий трубопровод с фланцами
      ctx.fillStyle = '#eab308'; ctx.fillRect(-48, -22, 52, 8);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(4, -22, 44, 8);
      ctx.fillStyle = '#64748b';
      [-40, -20, 0, 22, 40].forEach(fx => ctx.fillRect(fx, -25, 4.5, 14));

      // Синий шкафчик привода слева
      ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.roundRect(-48, -36, 18, 28, 2); ctx.fill();
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-44, -32, 10, 6);

      // Электропривод с красным маховиком по центру
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.roundRect(-10, -34, 20, 20, 3); ctx.fill();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, -35, 7.5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1.2; ctx.stroke();

      // Белый манометр и синий датчик расхода справа
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(20, -32, 6.5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(20, -32); ctx.lineTo(23, -35); ctx.stroke();
      ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(33, -38, 16, 16, 3); ctx.fill();
      ctx.fillStyle = '#34d399'; ctx.fillRect(36, -33, 10, 5);
    }
    else if (type === 3){
      // 3. ДАТЧИКИ И ИЗМЕРИТЕЛЬНЫЕ СИСТЕМЫ (слева внизу)
      drawBench(120, true, true);

      // Объёмная П-образная трубная обвязка из нержавейки
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-50, -18, 100, 6);
      ctx.fillRect(-50, -34, 6, 28);
      ctx.fillRect(44, -34, 6, 28);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-52, -36, 24, 5);
      // Фланцы
      ctx.fillStyle = '#cbd5e1';
      [-46, -24, 0, 24, 42].forEach(fx => ctx.fillRect(fx, -20, 4, 10));

      // Два массивных синих датчика давления (Метран / Rosemount)
      [-28, 14].forEach(sx => {
        ctx.fillStyle = '#64748b'; ctx.fillRect(sx + 5, -26, 3, 8);
        ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.roundRect(sx - 2, -40, 17, 15, 3); ctx.fill();
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#042f2e'; ctx.beginPath(); ctx.arc(sx + 6.5, -32.5, 4.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#34d399'; ctx.fillRect(sx + 4, -33.5, 5, 2);
      });

      // Цифровой терминал-расходомер по центру
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-9, -31, 20, 15);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.2; ctx.strokeRect(-9, -31, 20, 15);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-6, -27, 14, 3);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(-6, -21, 8, 2);

      // Вертикальная стеклянная колонна-ротаметр справа
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)'; ctx.fillRect(34, -40, 8, 24);
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.strokeRect(34, -40, 8, 24);
      const bobY = -28 + Math.sin(now * 0.005 + seed) * 4;
      ctx.fillStyle = '#facc15'; ctx.fillRect(35.5, bobY, 5, 3);
    }
    else {
      // 4. ЭЛЕКТРИЧЕСКИЕ СХЕМЫ И ЩИТНОЕ ОБОРУДОВАНИЕ (справа внизу)
      drawBench(120, true, false);

      // Раскрытый двухстворчатый шкаф автоматики слева-центр
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(-54, -42, 60, 38, 3); ctx.fill();
      ctx.strokeStyle = hard ? '#c084fc' : (done ? '#10b981' : '#f59e0b');
      ctx.lineWidth = 1.5; ctx.stroke();
      // Внутренние DIN-рейки с цветными автоматами и клеммами
      ctx.fillStyle = '#475569';
      ctx.fillRect(-50, -34, 52, 2.5);
      ctx.fillRect(-50, -23, 52, 2.5);
      ctx.fillRect(-50, -12, 52, 2.5);
      // Модули ПЛК и автоматы
      ctx.fillStyle = '#0284c7'; ctx.fillRect(-48, -38, 14, 9);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(-32, -38, 10, 9);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-20, -38, 8, 9);
      ctx.fillStyle = '#64748b'; ctx.fillRect(-10, -38, 10, 9);
      // Нижний ряд клемм и светодиоды
      const blink = Math.sin(now * 0.008 + seed) > 0;
      ctx.fillStyle = blink ? '#22c55e' : '#0f172a'; ctx.fillRect(-46, -37, 2.5, 2.5);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-41, -37, 2.5, 2.5);
      ctx.fillStyle = '#eab308'; ctx.fillRect(-48, -27, 24, 7);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-20, -27, 18, 7);

      // Раскрытый инженерный ноутбук по центру на столе
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-12, -20, 28, 16);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1; ctx.strokeRect(-12, -20, 28, 16);
      ctx.fillStyle = '#041d38'; ctx.fillRect(-10, -18, 24, 12);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(0, -12); ctx.lineTo(4, -15); ctx.lineTo(12, -15); ctx.stroke();
      ctx.fillStyle = '#475569'; ctx.fillRect(-14, -4, 32, 4);

      // Высокий серый силовой шкаф справа
      ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.roundRect(24, -40, 32, 58, 3); ctx.fill();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#334155'; ctx.fillRect(28, -35, 24, 24);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(44, -22, 3, 6);
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(34, -30, 2, 0, Math.PI*2); ctx.fill();
    }
  }


/* ============================================================
   Регистрация мини-игр и 2.5D оборудования КИПиА
   ============================================================ */
if (window.registerMinigame) {
  registerMinigame('calib', { name: 'калибровка токовой петли 4–20 мА', start: startCalibEvent, cleanup: cleanupCalib });
  registerMinigame('wires', { name: 'монтаж клеммной схемы КИПиА', start: startWiresEvent, cleanup: cleanupWires });
  registerMinigame('pid',   { name: 'настройка ПИД-регулятора давления', start: startPidEvent, cleanup: cleanupPid });
}
if (window.registerStationRenderer) {
  registerStationRenderer('kip', drawKIPStation);
}
