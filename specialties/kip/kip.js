/* ============================================================
   СОТА — Логика специальности КИПиА (15.01.31)
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
    if (!svg) return;
    const colors = { vcc: '#ef4444', sig: '#eab308', pe: '#38bdf8' };
    const stroke = colors[wire] || '#38bdf8';

    const leftTerm = document.querySelector(`#wiresScreen .wire-terminal[data-side="left"][data-wire="${wire}"]`);
    const rightTerm = document.querySelector(`#wiresScreen .wire-terminal[data-side="right"][data-wire="${wire}"]`);
    const board = el('wiresBoard');
    if (!leftTerm || !rightTerm || !board) return;

    const bRect = board.getBoundingClientRect();
    const lPin = leftTerm.querySelector('.term-pin') || leftTerm;
    const rPin = rightTerm.querySelector('.term-pin') || rightTerm;
    const lRect = lPin.getBoundingClientRect();
    const rRect = rPin.getBoundingClientRect();

    const x1 = lRect.left + lRect.width/2 - bRect.left;
    const y1 = lRect.top + lRect.height/2 - bRect.top;
    const x2 = rRect.left + rRect.width/2 - bRect.left;
    const y2 = rRect.top + rRect.height/2 - bRect.top;

    const scaleX = 500 / Math.max(1, bRect.width);
    const scaleY = 240 / Math.max(1, bRect.height);
    const sx1 = x1 * scaleX, sy1 = y1 * scaleY;
    const sx2 = x2 * scaleX, sy2 = y2 * scaleY;
    const mx = (sx1 + sx2) / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${sx1} ${sy1} C ${mx} ${sy1}, ${mx} ${sy2}, ${sx2} ${sy2}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', '4.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('opacity', '0.95');
    svg.appendChild(path);
  }

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
    btn.onclick = closeFloorEvent;
    el('wiresBanner').classList.remove('hidden');
    wiresGame.closeTimer = setTimeout(closeFloorEvent, WIRES_CFG.CLOSE_DELAY_MS);
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
    const error = target - pidGame.pressure;
    pidGame.integral = clamp(pidGame.integral + error * dt, -4, 4);
    const deriv = (error - pidGame.lastError) / Math.max(0.001, dt);
    pidGame.lastError = error;

    const u = (pidGame.kp / 50) * error + (pidGame.ki / 50) * pidGame.integral + (pidGame.kd / 35) * deriv;
    
    const kdOptDist = Math.abs(pidGame.kd - 30);
    const waveAmp = Math.max(0.05, Math.min(2.5, kdOptDist * 0.1));
    const disturbance = Math.sin(now * 0.005) * waveAmp;

    pidGame.pressure += (u * 2.2 + disturbance * 0.5) * dt;
    pidGame.pressure = clamp(pidGame.pressure, 1.5, 10.5);

    pidGame.history.push(pidGame.pressure);
    if (pidGame.history.length > 120) pidGame.history.shift();

    const errAbs = Math.abs(pidGame.pressure - target);
    const inTolerance = errAbs <= PID_CFG.TOLERANCE;
    if (inTolerance){
      pidGame.stableDuration += dt;
    } else {
      pidGame.stableDuration = Math.max(0, pidGame.stableDuration - dt * 1.8);
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
    btn.onclick = closeFloorEvent;
    el('pidBanner').classList.remove('hidden');
    pidGame.closeTimer = setTimeout(closeFloorEvent, PID_CFG.CLOSE_DELAY_MS);
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
      btn.onclick = closeFloorEvent;
    }
    if (el('calibBanner')) el('calibBanner').classList.remove('hidden');
    calibGame.closeTimer = setTimeout(closeFloorEvent, CALIB_CFG.CLOSE_DELAY_MS);
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

  function startClickerEvent(){
    startCalibEvent();
  }

  function hideAllMinigameScreens(){
    ['calibScreen','calibBanner','clickerScreen','pipeScreen','pipeBanner',
     'wiresScreen','wiresBanner','pidScreen','pidBanner','bypassScreen','bypassBanner','exchangerScreen','exchangerBanner']
     .forEach(id => { if (el(id)) el(id).classList.add('hidden'); });
  }

  function openCitySelect(){
    cleanupCalib();
    cleanupClicker();
    cleanupPipes();
    cleanupWires();
    cleanupPid();
    cleanupBypass();
    cleanupExchanger();
    state = 'title';
    stopAuto();
    speech = null;
    el('startScreen').classList.add('hidden');
    el('endScreen').classList.add('hidden');
    el('qScreen').classList.add('hidden');
    hideAllMinigameScreens();
    el('cityScreen').classList.remove('hidden');
    buildCities();
  }

  function startGame(city){
    cleanupCalib();
    cleanupClicker();
    cleanupPipes();
    cleanupWires();
    cleanupPid();
    cleanupBypass();
    cleanupExchanger();
    chosenCity = city;
    startKm = city.km;
    completedMines = 0;
    runOre = 0;
    totalMines = minesFor(city.km);
    scheduleRunEvents(totalMines);
    depth = 1;
    score = 0; fuel = 100; hp = 100; answerStreak = 0;
    decks.easy = []; decks.hard = [];
    shake = 0; flash = 0; speech = null;
    newLevel();
    el('endScreen').classList.add('hidden');
    el('qScreen').classList.add('hidden');
    el('startScreen').classList.add('hidden');
    el('cityScreen').classList.add('hidden');
    hideAllMinigameScreens();
    state = 'playing';
    updateHUD();
    const specCfg = SPECS[currentSpec] || SPECS.kip;
    toast(city.name + ' → Соты: ' + city.km + ' км · ' + totalMines + ' ' + plural(totalMines, specCfg.floorName.toLowerCase(), specCfg.floorName.toLowerCase(), specCfg.floorName.toLowerCase()));
  }


  /* ============================================================
     2.5D Отрисовка станков КИПиА
     ============================================================ */
  function drawKIPStation(type, done, hard, now, seed){
    if (type === 2){
      // 3 ВЫСОКИХ ШКАФА АВТОМАТИКИ / СЕРВЕРНЫЕ СТОЙКИ (В ТОЧНОСТИ КАК НА РЕФЕРЕНСЕ!)
      const rackW = 26, rackH = 48;
      const offsets = [-28, 0, 28];

      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.beginPath(); ctx.ellipse(0, 20, 44, 9, 0, 0, Math.PI * 2); ctx.fill();

      offsets.forEach((ox, idx) => {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.roundRect(ox - rackW / 2, -rackH / 2, rackW, rackH, 3); ctx.fill();
        ctx.strokeStyle = hard ? '#c084fc' : (done ? '#10b981' : '#38bdf8');
        ctx.lineWidth = 1.4; ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(ox - rackW / 2 + 3, -rackH / 2 + 3, rackW - 6, 4);

        for (let row = 0; row < 5; row++){
          const ry = -rackH / 2 + 10 + row * 7;
          ctx.fillStyle = '#1e2633';
          ctx.fillRect(ox - rackW / 2 + 3, ry, rackW - 6, 5);

          const ledCols = ['#22c55e', '#38bdf8', '#f59e0b', '#c084fc'];
          const col = ledCols[(row + idx) % ledCols.length];
          const blink = Math.sin(now * 0.007 + seed + row * 1.5 + idx * 2) > -0.2;
          ctx.fillStyle = blink ? col : '#090d16';
          ctx.fillRect(ox - rackW / 2 + 5, ry + 1.5, 2.5, 2);
          ctx.fillRect(ox - rackW / 2 + 9, ry + 1.5, 2.5, 2);
        }

        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(ox - rackW / 2 + 2, -rackH / 2 + 2, 4, rackH - 4);
      });
    } else if (type === 5){
      // КОМАНДНЫЙ СТОЛ ВНИЗУ (С 3 НОУТБУКАМИ И 3 КРЕСЛАМИ, КАК НА РЕФЕРЕНСЕ!)
      const deskW = 92, dropH = 14;

      [-28, 0, 28].forEach(cx => {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.roundRect(cx - 8, -24, 16, 12, 3); ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.ellipse(cx, -11, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      });

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-deskW / 2, 4, deskW, dropH);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-deskW / 2, 4, 4, dropH);
      ctx.fillRect(deskW / 2 - 4, 4, 4, dropH);

      ctx.fillStyle = '#334155';
      ctx.beginPath(); ctx.roundRect(-deskW / 2, -8, deskW, 14, 3); ctx.fill();
      ctx.fillStyle = '#475569'; ctx.fillRect(-deskW / 2, 4, deskW, 2);

      [-28, 0, 28].forEach(lx => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(lx - 8, -6, 16, 8);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(lx - 7, -15, 14, 9);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(lx - 5, -13, 10, 1.5);
      });

      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.roundRect(-16, -6, 6, 6, 1); ctx.fill();
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(-13, -8, 4, 0, Math.PI * 2); ctx.fill();
    } else {
      // 2.5D ЛАБОРАТОРНЫЙ ОСТРОВ КИПиА С МОНИТОРАМИ, МУЛЬТИМЕТРОМ И КРЕСЛОМ
      const deskW = 56, dropH = 14;

      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.roundRect(-10, -26, 20, 14, 4); ctx.fill();
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.ellipse(0, -12, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-deskW / 2, 4, deskW, dropH);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-deskW / 2, 4, 4, dropH);
      ctx.fillRect(deskW / 2 - 4, 4, 4, dropH);

      ctx.fillStyle = '#334155';
      ctx.beginPath(); ctx.roundRect(-deskW / 2, -8, deskW, 14, 3); ctx.fill();
      ctx.fillStyle = '#475569'; ctx.fillRect(-deskW / 2, 4, deskW, 2);

      ctx.fillStyle = '#0f172a'; ctx.fillRect(-deskW / 2 + 2, -2, 8, 18);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-deskW / 2 + 5, 1, 2, 2);

      // Монитор 1
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-17, -26, 22, 17);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1; ctx.strokeRect(-17, -26, 22, 17);
      ctx.fillStyle = '#040914'; ctx.fillRect(-15, -24, 18, 13);

      if (type === 1){
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1;
        ctx.strokeRect(-12, -22, 4, 3);
        ctx.strokeRect(-8, -16, 4, 3);
        ctx.strokeRect(-14, -16, 4, 3);
        ctx.beginPath(); ctx.moveTo(-10, -19); ctx.lineTo(-10, -16); ctx.stroke();
      } else if (type === 3){
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-6, -21); ctx.lineTo(-3, -23); ctx.lineTo(0, -21);
        ctx.lineTo(0, -16); ctx.quadraticCurveTo(-3, -13, -6, -14); ctx.closePath();
        ctx.fill();
      } else {
        ctx.strokeStyle = done ? '#34d399' : (hard ? '#c084fc' : '#38bdf8');
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-14, -17); ctx.lineTo(-10, -21); ctx.lineTo(-6, -16); ctx.lineTo(-2, -19); ctx.lineTo(2, -15);
        ctx.stroke();
      }
      ctx.fillStyle = '#475569'; ctx.fillRect(-8, -9, 4, 4);

      // Монитор 2
      ctx.fillStyle = '#0f172a'; ctx.fillRect(8, -24, 16, 15);
      ctx.fillStyle = '#064e3b'; ctx.fillRect(9, -23, 14, 13);
      ctx.fillStyle = '#34d399'; ctx.fillRect(11, -17, 10, 1.5);
      ctx.fillStyle = '#475569'; ctx.fillRect(14, -9, 4, 3);

      // Мультиметр
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(-24, -4, 7, 10);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-23, -3, 5, 3.5);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-21, 6); ctx.quadraticCurveTo(-18, 12, -14, 7); ctx.stroke();

      // Клавиатура и цветок
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-12, -2, 14, 4);
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.roundRect(22, -5, 5, 6, 1); ctx.fill();
      ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(24.5, -7, 3.5, 0, Math.PI * 2); ctx.fill();
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
// Модуль загружается до common.js: сохраняем отрисовщик в реестре напрямую.
window.STATION_RENDERERS = window.STATION_RENDERERS || {};
window.STATION_RENDERERS.kip = drawKIPStation;
