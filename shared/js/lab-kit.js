/* ============================================================
   СОТА — Общий кит мини-игр лабораторий Э и РЭУ
   Единый оверлей, прогресс, подтверждение выхода, утилиты.
   Подключается ТОЛЬКО на страницах специальностей «Э» и «РЭУ».
   ============================================================ */
'use strict';
(function(){
  if (window.LabKit) return;

  function h(tag, cls, html){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function shuffle(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---- Живые эффекты: звук, конфетти, похвала, тряска ----
     Делают любую мини-игру на ките «ожившей» без правок самих игр. */
  let audioCtx = null;
  function tone(freq, t0, dur, type, vol){
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.05, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function sfx(kind){
    try{
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t = audioCtx.currentTime;
      if (kind === 'click') tone(620, t, 0.06, 'square', 0.025);
      else if (kind === 'good'){ tone(660, t, 0.1, 'sine', 0.05); tone(880, t + 0.08, 0.14, 'sine', 0.05); }
      else if (kind === 'bad'){ tone(200, t, 0.16, 'sawtooth', 0.04); tone(150, t + 0.1, 0.18, 'sawtooth', 0.04); }
      else if (kind === 'win'){
        [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.22, 'triangle', 0.06));
      }
    } catch(e){ /* звук — украшение, не обязанность */ }
  }
  const PRAISES = [
    '🔥 Круто!', '⚡ Есть контакт!', '🔧 Как настоящий наладчик!',
    '💡 Точно в цель!', '🎯 Метко!', '🛠️ Мастер!', '✨ Блестяще!', '🚀 Поехали!'
  ];
  function praise(card){
    const p = h('div', 'lab-praise', PRAISES[Math.floor(Math.random() * PRAISES.length)]);
    card.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
  function confetti(root){
    const box = h('div', 'lab-confetti');
    const colors = ['#5eead4', '#a78bfa', '#f59e0b', '#4fd69f', '#f472b6', '#60a5fa'];
    for (let i = 0; i < 44; i++){
      const bit = document.createElement('i');
      bit.style.left = Math.random() * 100 + '%';
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = (Math.random() * 0.35) + 's';
      bit.style.animationDuration = (1 + Math.random() * 0.8) + 's';
      bit.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      box.appendChild(bit);
    }
    root.appendChild(box);
    setTimeout(() => box.remove(), 2200);
  }
  function shake(card){
    card.classList.remove('shake');
    void card.offsetWidth; // перезапуск анимации
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 420);
  }

  /**
   * Создаёт оверлей мини-игры.
   * @param {Object} opts
   *   theme     'e' | 'reu'
   *   tag       мелкая подпись над заголовком (оборудование)
   *   title     заголовок
   *   objective цель задания
   *   steps     число этапов для индикатора (необязательно)
   *   onCancel  колбэк выхода (−15 света)
   *   onDone    колбэк успеха (bonus:number)
   */
  function create(opts){
    opts = opts || {};
    const theme = opts.theme || 'e';
    const state = { closed: false, finished: false, confirm: false, inert: false };
    const previousFocus = document.activeElement;

    const root = h('div', 'lab-overlay lab-theme-' + theme);
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');

    const card = h('section', 'lab-card');
    const head = h('div', 'lab-head');
    const info = h('div', 'lab-headinfo');
    if (opts.tag) info.appendChild(h('small', 'lab-tag', opts.tag));
    info.appendChild(h('h2', 'lab-title', opts.title || 'Мини-игра'));
    if (opts.objective) info.appendChild(h('p', 'lab-obj', opts.objective));

    const exitBtn = h('button', 'lab-exit', '✕');
    exitBtn.type = 'button';
    exitBtn.title = 'Выйти из мини-игры (−15 света)';
    exitBtn.setAttribute('aria-label', 'Выйти из мини-игры: минус 15 света');
    head.append(info, exitBtn);

    const progress = h('div', 'lab-progress');
    progress.hidden = !opts.steps;
    const pText = h('span', 'lab-progress-text', '');
    const pTrack = h('span', 'lab-progress-track');
    const pBar = h('i', 'lab-progress-fill');
    pTrack.appendChild(pBar);
    progress.append(pText, pTrack);

    const body = h('div', 'lab-body');
    card.append(head, progress, body);
    root.appendChild(card);
    document.body.appendChild(root);

    // Подсказки для абитуриентов: пошагово «что делать и как»
    if (Array.isArray(opts.howto) && opts.howto.length){
      const howto = h('div', 'lab-howto');
      howto.appendChild(h('div', 'lab-howto-title', 'Как выполнить'));
      const ol = h('ol', 'lab-howto-list');
      opts.howto.forEach((s) => ol.appendChild(h('li', null, s)));
      howto.appendChild(ol);
      body.appendChild(howto);
    }
    let hintEl = null;
    if (opts.hint){
      const hintBtn = h('button', 'lab-hint-btn', '✔ Скрыть подсказку');
      hintBtn.type = 'button';
      hintBtn.setAttribute('aria-expanded', 'true');
      hintEl = h('p', 'lab-hint');
      // Подсказка сразу открыта: абитуриент понимает задание с первого взгляда.
      hintEl.hidden = false;
      hintEl.textContent = opts.hint;
      hintBtn.onclick = () => {
        const willOpen = hintEl.hidden;
        hintEl.hidden = !willOpen;
        hintBtn.setAttribute('aria-expanded', String(willOpen));
        hintBtn.textContent = willOpen ? '✔ Скрыть подсказку' : '❔ Подсказка';
      };
      body.append(hintBtn, hintEl);
    }

    // ---- Живые эффекты поверх любой мини-игры на ките ----
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b && !b.disabled && !b.classList.contains('lab-exit')) sfx('click');
    }, true);
    // Реакция на результат: похвала/тряска по классу блока обратной связи.
    const fxObserver = new MutationObserver((muts) => {
      for (const m of muts){
        for (const n of m.addedNodes){
          if (n.nodeType !== 1) continue;
          const fb = n.classList && n.classList.contains('lab-feedback') ? n : null;
          if (!fb) continue;
          if (fb.classList.contains('ok')){ sfx('good'); praise(card); }
          else if (fb.classList.contains('bad')){ sfx('bad'); shake(card); }
        }
        if (m.type === 'attributes' && m.target.classList && m.target.classList.contains('lab-feedback')){
          if (m.target.classList.contains('ok')){ sfx('good'); praise(card); }
          else if (m.target.classList.contains('bad')){ sfx('bad'); shake(card); }
        }
      }
    });
    fxObserver.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    const api = {
      root, card, body,
      setProgress(done, total){
        const t = total || opts.steps || 1;
        pText.textContent = 'Этап ' + Math.min(done + 1, t) + ' из ' + t;
        pBar.style.width = Math.round((done / t) * 100) + '%';
      },
      setHint(text){
        if (!hintEl) return;
        hintEl.textContent = text;
      },
      finish(points){
        if (state.closed || state.finished) return;
        state.finished = true; state.closed = true;
        sfx('win');
        confetti(root);
        const bonus = points == null ? 100 : points;
        setTimeout(() => {
          root.remove();
          if (previousFocus && previousFocus.isConnected) previousFocus.focus();
          opts.onDone && opts.onDone(bonus);
        }, 900);
      },
      close(){
        if (state.closed) return;
        state.closed = true;
        root.remove();
        if (previousFocus && previousFocus.isConnected) previousFocus.focus();
      },
      requestExit(){
        if (state.closed || state.confirm) return;
        state.confirm = true;
        const box = h('div', 'lab-confirm');
        box.setAttribute('role', 'alertdialog');
        box.setAttribute('aria-modal', 'true');
        box.innerHTML =
          '<div class="lab-confirm-box">' +
          '<h3>Выйти из мини-игры?</h3>' +
          '<p>Вы потеряете <b>15 света</b>. Незавершённое задание начнётся заново.</p>' +
          '<div class="lab-confirm-actions">' +
          '<button type="button" class="lab-btn lab-btn-ghost lab-cancel">Отмена</button>' +
          '<button type="button" class="lab-btn lab-btn-danger lab-accept">Выйти</button>' +
          '</div></div>';
        state.inert = true;
        const cancelBtn = box.querySelector('.lab-cancel');
        const acceptBtn = box.querySelector('.lab-accept');
        const closeConfirm = (accepted) => {
          box.remove();
          state.confirm = false; state.inert = false;
          if (accepted){
            state.closed = true;
            root.remove();
            if (previousFocus && previousFocus.isConnected) previousFocus.focus();
            opts.onCancel && opts.onCancel();
          } else {
            cancelBtn.focus();
          }
        };
        cancelBtn.onclick = () => closeConfirm(false);
        acceptBtn.onclick = () => closeConfirm(true);
        box.addEventListener('keydown', (e) => {
          if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); closeConfirm(false); }
          else if (e.key === 'Tab'){
            if (e.shiftKey && document.activeElement === cancelBtn){ e.preventDefault(); acceptBtn.focus(); }
            else if (!e.shiftKey && document.activeElement === acceptBtn){ e.preventDefault(); cancelBtn.focus(); }
          }
        });
        root.appendChild(box);
        cancelBtn.focus();
      },
      isClosed(){ return state.closed; }
    };

    exitBtn.onclick = () => api.requestExit();
    root.addEventListener('keydown', (e) => {
      if (state.confirm) return;
      if (e.key === 'Escape'){ e.preventDefault(); api.requestExit(); return; }
      if (e.key !== 'Tab') return;
      const items = [...root.querySelectorAll('button:not(:disabled), [tabindex]:not([tabindex="-1"])')]
        .filter(n => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    });

    if (opts.steps) api.setProgress(0, opts.steps);
    return api;
  }

  /* Совместимая «комната-игра» (на случай если движок ждёт MINI_GAMES) */
  window.LabKit = { create, shuffle, h };
})();
