/* ============================================================
   СОТА — Красивые мини-игры-задания для Э и РЭУ (в стиле игр «П»).
   Этапы: карточка задания + фишки-ответы + пропуски + памятка.
   Подключается ТОЛЬКО на страницах специальностей «Э» и «РЭУ».
   ============================================================ */
'use strict';
(function(){
  if (window.openTaskGame) return;

  function shuffle(a){
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }
  function esc(s){
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /**
   * Красивая мини-игра «фишки → пропуски».
   * opts = {
   *   theme: 'e' | 'reu',
   *   icon:  HTML/SVG для шапки (или короткий эмодзи),
   *   title, intro,
   *   memo:  [[термин, описание], …] — кнопка «Памятка»,
   *   steps: [{
   *     title, task,
   *     art:   HTML-иллюстрация (необязательно),
   *     slots: [{ label, answer }],
   *     chips: [строка | {label, sub}],
   *     chipsLabel,
   *     success: 'Верно! …'
   *   }],
   *   onDone(points), onCancel()
   * }
   */
  window.openTaskGame = function(opts){
    opts = opts || {};
    let stage = 0, mistakes = 0, solved = false, closed = false, done = false;
    const previousFocus = document.activeElement;
    const theme = opts.theme === 'reu' ? 'reu' : 'e';

    const overlay = document.createElement('div');
    overlay.className = 'tg-overlay tg-' + theme;
    overlay.innerHTML =
      '<section class="tg-game" role="dialog" aria-modal="true" aria-labelledby="tgTitle">' +
        '<div class="tg-scroll">' +
          '<button type="button" class="tg-exit" title="Выйти из мини-игры (−15 света)" aria-label="Выйти из мини-игры: минус 15 света">✕</button>' +
          '<header class="tg-head">' +
            '<span class="tg-icon" aria-hidden="true">' + (opts.icon || '🛠️') + '</span>' +
            '<div class="tg-heading">' +
              '<h2 id="tgTitle">' + esc(opts.title || 'Задание') + '</h2>' +
              (opts.intro ? '<p class="tg-intro">' + esc(opts.intro) + '</p>' : '') +
            '</div>' +
            '<span class="tg-progress"></span>' +
          '</header>' +
          '<div class="tg-stage-title"></div>' +
          '<p class="tg-task"></p>' +
          '<div class="tg-art" hidden></div>' +
          '<div class="tg-board"></div>' +
          '<p class="tg-feedback" role="status" aria-live="polite"></p>' +
          '<div class="tg-bank"><p class="tg-bank-label"></p><div class="tg-choices" role="group"></div>' +
            '<small>Нажмите на фишку, затем на пропуск можно нажать, чтобы очистить.</small></div>' +
          '<footer class="tg-actions">' +
            '<button type="button" class="tg-btn tg-ghost tg-memo-btn">📖 Памятка</button>' +
            '<span class="tg-actions-spacer"></span>' +
            '<button type="button" class="tg-btn tg-ghost tg-reset">⟳ Сбросить</button>' +
            '<button type="button" class="tg-btn tg-primary tg-check">✓ Проверить</button>' +
            '<button type="button" class="tg-btn tg-primary tg-next" hidden>Следующий этап →</button>' +
          '</footer>' +
          '<div class="tg-exit-row"><small>Выход по крестику или Escape: −15 света. Практика начнётся заново.</small></div>' +
        '</div>' +
        '<dialog class="tg-memo" aria-labelledby="tgMemoTitle">' +
          '<header class="tg-memo-head"><h2 id="tgMemoTitle">Памятка</h2>' +
          '<button type="button" class="tg-btn tg-ghost tg-memo-back">К заданию</button></header>' +
          '<dl class="tg-memo-list" tabindex="0"></dl>' +
        '</dialog>' +
      '</section>';
    document.body.appendChild(overlay);

    const q = (s) => overlay.querySelector(s);
    const stageTitle = q('.tg-stage-title'), taskEl = q('.tg-task'), artEl = q('.tg-art'),
      board = q('.tg-board'), feedback = q('.tg-feedback'), bank = q('.tg-choices'),
      bankLabel = q('.tg-bank-label'), check = q('.tg-check'), next = q('.tg-next'),
      reset = q('.tg-reset'), progress = q('.tg-progress'), memo = q('.tg-memo'),
      memoList = q('.tg-memo-list');

    let slots = [], values = [], active = 0;

    function renderMemo(){
      memoList.replaceChildren();
      (opts.memo || []).forEach((row) => {
        const wrap = document.createElement('div');
        const dt = document.createElement('dt'); dt.textContent = row[0];
        const dd = document.createElement('dd'); dd.textContent = row[1];
        wrap.append(dt, dd);
        memoList.appendChild(wrap);
      });
      memoList.scrollTop = 0;
    }
    q('.tg-memo-btn').onclick = () => { renderMemo(); memo.showModal(); };
    q('.tg-memo-back').onclick = () => memo.close();
    memo.addEventListener('close', () => q('.tg-check').focus({ preventScroll: true }));
    memo.addEventListener('keydown', (e) => e.stopPropagation());

    function leave(){
      if (closed || done) return;
      overlay.classList.add('tg-confirm-open');
      const box = document.createElement('div');
      box.className = 'tg-confirm';
      box.setAttribute('role', 'alertdialog');
      box.innerHTML =
        '<div class="tg-confirm-box"><h3>Выйти из мини-игры?</h3>' +
        '<p>Вы потеряете <b>15 света</b>. Незавершённое задание начнётся заново.</p>' +
        '<div class="tg-confirm-actions">' +
        '<button type="button" class="tg-btn tg-ghost tg-cancel">Отмена</button>' +
        '<button type="button" class="tg-btn tg-danger tg-accept">Выйти</button>' +
        '</div></div>';
      overlay.appendChild(box);
      const cancelBtn = box.querySelector('.tg-cancel'), acceptBtn = box.querySelector('.tg-accept');
      const close = (accepted) => {
        box.remove(); overlay.classList.remove('tg-confirm-open');
        if (accepted){
          closed = true; overlay.remove();
          if (previousFocus && previousFocus.isConnected) previousFocus.focus();
          opts.onCancel && opts.onCancel();
        } else cancelBtn.focus();
      };
      cancelBtn.onclick = () => close(false);
      acceptBtn.onclick = () => close(true);
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(false); }
      });
      cancelBtn.focus();
    }
    q('.tg-exit').onclick = leave;

    function sync(){
      slots.forEach((slot, i) => {
        slot.classList.toggle('filled', !!values[i]);
        slot.classList.toggle('active', i === active && !solved);
        slot.textContent = values[i]
          ? (slot.classList.contains('tg-hotslot') ? '✓' : values[i])
          : slot.dataset.hold;
      });
      [...bank.querySelectorAll('.tg-chip')].forEach((chip) => {
        const used = values.includes(chip.dataset.value);
        chip.disabled = solved || used;
        chip.classList.toggle('used', used);
      });
      const allFilled = values.every((v) => v);
      check.hidden = solved;
      check.disabled = !allFilled;
      next.hidden = !solved;
      reset.disabled = solved;
    }

    function setFeedback(text, kind){
      feedback.textContent = text;
      feedback.className = 'tg-feedback' + (kind ? ' ' + kind : '');
    }

    // «Живая» картинка: перерисовывается, когда заполнены точки.
    function renderArt(){
      const st = opts.steps[stage];
      const img = artEl.querySelector('.tg-art-img');
      if (!img) return;
      img.innerHTML = typeof st.art === 'function' ? st.art(values.slice()) : (st.art || '');
    }

    function load(){
      solved = false; slots = []; values = (opts.steps[stage].slots || []).map(() => ''); active = 0;
      const step = opts.steps[stage];
      progress.textContent = 'Этап ' + (stage + 1) + ' / ' + opts.steps.length;
      stageTitle.textContent = step.title || '';
      taskEl.textContent = step.task || '';

      // Слоты прямо на картинке (hotspots) — как в интерактивных схемах.
      const useHotspots = Array.isArray(step.hotspots) && step.hotspots.length === step.slots.length;
      board.replaceChildren();
      board.style.display = useHotspots ? 'none' : '';

      function slotClick(btn){
        if (solved || closed) return;
        const i = slots.indexOf(btn);
        if (values[i]){ values[i] = ''; active = i; setFeedback('Точка очищена. Выберите другую фишку.'); }
        else { active = i; setFeedback('Теперь нажмите фишку снизу.'); }
        sync(); renderArt();
      }

      if (step.art || useHotspots){
        artEl.hidden = false;
        artEl.replaceChildren();
        const pic = document.createElement('div');
        pic.className = 'tg-art-pic';
        const img = document.createElement('div');
        img.className = 'tg-art-img';
        pic.appendChild(img);
        if (useHotspots){
          step.hotspots.forEach((hs, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tg-slot-btn tg-hotslot';
            btn.dataset.hold = hs.hold || '＋';
            btn.title = step.slots[i].label;
            btn.setAttribute('aria-label', step.slots[i].label);
            btn.style.left = (hs.x || 50) + '%';
            btn.style.top = (hs.y || 50) + '%';
            if (hs.w) btn.style.minWidth = hs.w + 'px';
            btn.onclick = () => slotClick(btn);
            pic.appendChild(btn);
            slots.push(btn);
          });
        }
        artEl.appendChild(pic);
      } else {
        artEl.hidden = true;
        artEl.replaceChildren();
      }

      if (!useHotspots){
        step.slots.forEach((slotDef) => {
          const wrap = document.createElement('div');
          wrap.className = 'tg-slot';
          const label = document.createElement('span');
          label.className = 'tg-slot-label'; label.textContent = slotDef.label;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'tg-slot-btn';
          btn.dataset.hold = 'Выбрать…';
          btn.setAttribute('aria-label', slotDef.label);
          btn.onclick = () => slotClick(btn);
          slots.push(btn);
          wrap.append(label, btn);
          board.appendChild(wrap);
        });
      }
      renderArt();
      bank.replaceChildren();
      bankLabel.textContent = step.chipsLabel || 'Варианты';
      shuffle(step.chips.map((c) => typeof c === 'string' ? { label: c } : c)).forEach((chip) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tg-chip';
        b.dataset.value = chip.label;
        b.innerHTML =
          (chip.svg ? '<span class="tg-chip-svg" aria-hidden="true">' + chip.svg + '</span>' : '') +
          '<span class="tg-chip-label">' + esc(chip.label) + '</span>' +
          (chip.sub ? '<span class="tg-chip-sub">' + esc(chip.sub) + '</span>' : '');
        b.onclick = () => {
          if (solved || closed || b.disabled) return;
          if (values.includes(chip.label)){
            values[values.indexOf(chip.label)] = '';
          }
          values[active] = chip.label;
          const empty = values.findIndex((v) => !v);
          active = empty === -1 ? active : empty;
          setFeedback(values.every((v) => v) ? 'Все пропуски заполнены — жмите «Проверить».' : 'Заполните следующий пропуск.');
          sync();
          renderArt();
        };
        bank.appendChild(b);
      });
      setFeedback('Прочитайте задание и выберите фишки для пропусков. Подсказка — в «Памятке».');
      sync();
      overlay.querySelector('.tg-scroll').scrollTop = 0;
    }

    reset.onclick = () => {
      if (solved || closed) return;
      values = values.map(() => '');
      slots.forEach((s) => s.classList.remove('incorrect'));
      active = 0;
      setFeedback('Пропуски очищены.');
      sync();
      renderArt();
    };

    check.onclick = () => {
      if (solved || closed) return;
      const step = opts.steps[stage];
      const wrong = values.map((v, i) => v !== step.slots[i].answer);
      slots.forEach((s, i) => s.classList.toggle('incorrect', wrong[i]));
      if (wrong.some(Boolean)){
        mistakes++;
        setFeedback('Есть ошибки! Подумайте ещё: ' + (step.slots[wrong.indexOf(true)].hint || step.hint || 'перечитайте задание.'), 'bad');
        const firstWrong = slots[wrong.indexOf(true)];
        if (firstWrong) firstWrong.focus({ preventScroll: true });
        sync();
        return;
      }
      solved = true;
      slots.forEach((s) => { s.classList.remove('incorrect'); s.classList.add('correct'); });
      const last = stage === opts.steps.length - 1;
      setFeedback((step.success || 'Верно!') + (last ? ' +' + Math.max(50, 200 - mistakes * 25) + ' очков' : ''), 'ok');
      next.textContent = last ? 'Вернуться в лабораторию →' : 'Следующий этап →';
      sync();
      next.focus({ preventScroll: true });
    };

    next.onclick = () => {
      if (!solved || closed) return;
      if (stage < opts.steps.length - 1){ stage++; load(); return; }
      done = closed = true;
      const points = Math.max(50, 200 - mistakes * 25);
      overlay.remove();
      if (previousFocus && previousFocus.isConnected) previousFocus.focus();
      opts.onDone && opts.onDone(points);
    };

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape'){ e.preventDefault(); leave(); return; }
      if (e.key !== 'Tab') return;
      const items = [...overlay.querySelectorAll('button:not(:disabled):not([hidden]), dl[tabindex]')]
        .filter((n) => n.getClientRects().length);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    });

    load();
    return {
      close(){
        if (closed) return;
        closed = true;
        overlay.remove();
        if (previousFocus && previousFocus.isConnected) previousFocus.focus();
      },
      isClosed(){ return closed; }
    };
  };
})();
