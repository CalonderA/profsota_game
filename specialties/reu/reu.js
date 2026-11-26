/* ============================================================
   СОТА — Модуль специальности РЭУ (11.02.16)
   Электронные приборы и устройства.
   Интерьер лаборатории радиоэлектроники + 5 интерактивных игр:
     1) Сборка печатного модуля (монтаж компонентов по обозначениям)
     2) Расшифровка маркировки резистора (цветовые полосы)
     3) Осциллограф: распознавание формы сигнала
     4) Осциллограф: чтение амплитуды и частоты сигнала по сетке
     5) 3D-сборка электронного модуля (CSS 3D)
   ============================================================ */
'use strict';

/* ------------------------------------------------------------------
   ДАННЫЕ СПЕЦИАЛЬНОСТИ
   ------------------------------------------------------------------ */
const REU_NAMES = [
  'Монтаж · Сборка печатного модуля',
  'Компоненты · Маркировка резистора',
  'Осциллограф · Форма сигнала',
  'Осциллограф · Чтение сигнала',
  '3D-стенд · Сборка электронного модуля'
];

const REU_STATIONS = [
  { x: 5,  y: 6,  type: 0 },
  { x: 16, y: 6,  type: 1 },
  { x: 5,  y: 10, type: 2 },
  { x: 16, y: 10, type: 3 },
  { x: 11, y: 11, type: 4 }
];

// Мебель и стеллажи занимают клетки, оставляя свободный подход к станкам.
function setupReuMap(m){
  const block = (x, y, w, h) => {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++)
        if (m[j] && i > 0 && i < 22 && j > 1 && j < 14) m[j][i] = 1;
  };
  // Верхний ряд: стеллажи с приборами, ящики компонентов, серверный шкаф
  block(2, 2, 6, 2);
  block(9, 2, 5, 2);
  block(16, 2, 5, 2);
  // Рабочие столы за станциями
  block(4, 5, 3, 1);
  block(15, 5, 3, 1);
  block(4, 9, 3, 1);
  block(15, 9, 3, 1);
  // Антистатические стойки по углам
  block(1, 12, 2, 1);
  block(20, 12, 2, 1);
}

/* ------------------------------------------------------------------
   ОТРИСОВКА ИНТЕРЬЕРА ЛАБОРАТОРИИ РЭУ
   ------------------------------------------------------------------ */
const rGlowCache = new Map();
function rGlow(x, y, r, color){
  const key = r + ':' + color;
  let lamp = rGlowCache.get(key);
  if (!lamp){
    lamp = document.createElement('canvas');
    lamp.width = lamp.height = r * 2;
    const g = lamp.getContext('2d');
    const light = g.createRadialGradient(r, r, 0, r, r, r);
    light.addColorStop(0, color);
    light.addColorStop(1, 'transparent');
    g.fillStyle = light;
    g.fillRect(0, 0, r * 2, r * 2);
    rGlowCache.set(key, lamp);
  }
  ctx.drawImage(lamp, Math.round(x - r), Math.round(y - r));
}
function rRect(x, y, w, h, c){ ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function rText(t, x, y, size, c, align){
  ctx.font = 'bold ' + size + 'px monospace';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = c || '#e7edf6';
  ctx.fillText(t, x, y);
}
function rBox(x, y, w, h, depth, top, front){
  rRect(x + 5, y + 8, w, h + depth, '#05070ca0');
  rRect(x, y, w, h, top);
  rRect(x, y + h, w, depth, front);
  rRect(x, y, w, 2, '#9aa6bd');
  rRect(x + w - 3, y + 2, 3, h + depth - 2, '#0c111b');
}
function rCable(points, color){
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.stroke();
}

// Мини-осциллограф: рисует форму сигнала в указанном прямоугольнике
function rDrawScope(g, x, y, w, h, shape, phase, color){
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#04120f'; g.fillRect(x, y, w, h);
  // Сетка
  g.strokeStyle = '#123f36'; g.lineWidth = 1;
  for (let i = 1; i < 8; i++){
    const gx = x + (w / 8) * i;
    g.beginPath(); g.moveTo(gx, y); g.lineTo(gx, y + h); g.stroke();
  }
  for (let i = 1; i < 5; i++){
    const gy = y + (h / 5) * i;
    g.beginPath(); g.moveTo(x, gy); g.lineTo(x + w, gy); g.stroke();
  }
  // Осевая линия
  g.strokeStyle = '#1c5c4c';
  g.beginPath(); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
  // Луч
  const col = color || '#5eead4';
  g.strokeStyle = col; g.lineWidth = 2; g.shadowColor = col; g.shadowBlur = 8;
  g.beginPath();
  const mid = y + h / 2, amp = h * 0.34;
  const N = 120;
  for (let i = 0; i <= N; i++){
    const t = i / N;
    const px = x + t * w;
    let v;
    if (shape === 'square') v = (t * 3 + phase) % 1 < 0.5 ? 1 : -1;
    else if (shape === 'saw') v = 2 * (((t * 3 + phase) % 1)) - 1;
    else if (shape === 'dc') v = 0.35;
    else v = Math.sin((t * 3 + phase) * Math.PI * 2);
    const py = mid - v * amp;
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.stroke();
  g.restore();
}

// ==================================================================
// ИНТЕРЬЕР ЛАБОРАТОРИИ РЭУ (11.02.16)
// Печатные платы, бирюзовые дорожки, фиолетовый неон, антистатика.
// ==================================================================
const R_COL = {
  floor: ['#222a33', '#1d242d', '#262e38', '#202730'],
  bench: '#8e9bb0', benchDark: '#39424f',
  violet: '#a78bfa', teal: '#5eead4', tealDark: '#1c8a67',
  amber: '#f59e0b', silk: '#e7edf6'
};

const rFloorCache = new Map();
function drawReuFloor(x, y){
  const key = x + ',' + y;
  let tile = rFloorCache.get(key);
  if (!tile){
    tile = document.createElement('canvas');
    tile.width = tile.height = 44;
    const g = tile.getContext('2d');
    const n = (x * 5261 + y * 2447) % 97;
    g.fillStyle = R_COL.floor[(x + y * 2) % 4];
    g.fillRect(0, 0, 44, 44);
    // Фаска плит
    g.fillStyle = '#11161e'; g.fillRect(0, 43, 44, 1); g.fillRect(43, 0, 1, 44);
    g.fillStyle = '#39424f'; g.fillRect(0, 0, 44, 1);
    // Антистатическая точечная структура
    for (let i = 0; i < 26; i++){
      g.fillStyle = i % 4 ? '#4b5d7055' : '#0a0e1477';
      g.fillRect(3 + (n + i * 11) % 38, 3 + (n * 3 + i * 9) % 38, 1, 1);
    }
    // «Печатные дорожки» с переходными отверстиями
    if (n % 3 === 0){
      g.fillStyle = '#5eead42b'; g.fillRect(0, 15, 44, 1); g.fillRect(0, 30, 44, 1);
      g.fillRect(20, 15, 1, 16);
      g.fillStyle = '#1c8a6777';
      g.beginPath(); g.arc(20, 15, 2, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(20, 30, 2, 0, Math.PI * 2); g.fill();
    }
    if (n % 5 === 0){ g.fillStyle = '#a78bfa22'; g.fillRect(0, 21, 44, 2); }
    rFloorCache.set(key, tile);
  }
  ctx.drawImage(tile, x * 44, y * 44);
  // Заземляющая шина (жёлто-зелёная) вдоль боковых стен
  if (x === 1 || x === 21){
    const px = x === 1 ? 4 : 37;
    ctx.fillStyle = '#0e1a12'; ctx.fillRect(px, y * 44, 4, 44);
    ctx.fillStyle = '#d9c33a'; ctx.fillRect(px, y * 44, 4, 2);
    ctx.fillStyle = '#3fbf7a'; ctx.fillRect(px, y * 44 + 22, 4, 2);
  }
}

function drawReuWall(x, y){
  if (y < 2) return;
  const px = x * 44;
  if (y === 14){
    // Плинтус с заземляющей шиной и крепежом
    rBox(px, y * 44, 44, 12, 12, '#1c2331', '#0c1018');
    rRect(px, y * 44 + 2, 44, 2, '#d9c33a');
    rRect(px, y * 44 + 4, 44, 2, '#3fbf7a');
    for (let i = 0; i < 44; i += 8) rRect(px + i + 3, y * 44 + 7, 3, 3, '#39424f');
  } else {
    rRect(px, y * 44, 44, 44, '#141b26');
    rRect(px, y * 44, 44, 1, '#212b3a');
    const cx = px + (x === 0 ? 36 : 4);
    // Кабельный канал
    rRect(cx, y * 44, 6, 44, '#0f151f');
    rRect(cx, y * 44, 6, 2, '#5b4f9a');
    rRect(cx, y * 44 + 22, 6, 2, '#5b4f9a');
    // Розеточный блок
    rRect(cx - 3, y * 44 + 14, 12, 12, '#26303d');
    rRect(cx, y * 44 + 16, 3, 3, '#5eead4');
    rRect(cx + 6, y * 44 + 16, 3, 3, '#a78bfa');
  }
}

function drawReuBackWall(now){
  const wallH = 88;
  // Панельные швы и заклёпки
  rRect(0, 0, VW, wallH, '#0f1622');
  for (let x = 0; x < VW; x += 56){
    rRect(x, 0, 2, wallH, '#1c2534');
    rRect(x + 3, 12, 48, 1, '#26313f');
    rRect(x + 3, 54, 48, 1, '#26313f');
    rRect(x + 7, 5, 2, 2, '#3b4660'); rRect(x + 45, 5, 2, 2, '#3b4660');
    rRect(x + 7, 71, 2, 2, '#3b4660'); rRect(x + 45, 71, 2, 2, '#3b4660');
  }
  rRect(0, 80, VW, 8, '#080d15');
  rRect(0, 80, VW, 2, '#3b4660');
  // Верхний кабель-лоток с пучком
  rRect(0, 0, VW, 10, '#0a0f18');
  rRect(0, 10, VW, 4, '#3b4660');
  rRect(0, 14, VW, 1, '#556180');
  ctx.lineWidth = 2;
  [['#a78bfa', 3], ['#5eead4', 6], ['#f59e0b', 9]].forEach((row) => {
    ctx.strokeStyle = row[0];
    ctx.beginPath(); ctx.moveTo(0, row[1]); ctx.lineTo(VW, row[1]); ctx.stroke();
  });

  rGlow(506, 40, 300, '#a78bfa1c');

  // ---- Центральная вывеска ----
  rBox(300, 12, 412, 42, 6, '#1d2432', '#0f141f');
  rRect(306, 16, 400, 34, '#0a0f18');
  rRect(306, 16, 400, 2, '#a78bfa');
  rText('ЛАБОРАТОРИЯ РЭУ', 506, 40, 22, '#c4b5fd', 'center');
  rText('11.02.16 · ЭЛЕКТРОННЫЕ ПРИБОРЫ И УСТРОЙСТВА', 506, 55, 8, '#8b7fd0', 'center');

  // ---- Большой осциллограф под вывеской ----
  rBox(336, 60, 340, 18, 4, '#3c4658', '#1c2432');
  rRect(342, 62, 328, 14, '#061410');
  rDrawScope(ctx, 342, 62, 328, 14, 'sine', (now / 900) % 1, '#5eead4');

  // Прожекторы по краям вывески
  [288, 716].forEach((lx) => {
    rRect(lx, 10, 10, 44, '#171e2b');
    rRect(lx + 2, 14, 6, 36, '#0b1019');
    rRect(lx + 3, 22, 4, 22, '#a78bfa');
    rGlow(lx + 5, 34, 56, '#a78bfa2c');
  });

  // ---- Слева: измерительный рек RACK-01 ----
  rBox(28, 14, 152, 56, 8, '#232b3a', '#12171f');
  rRect(34, 20, 140, 44, '#0b1018');
  for (let row = 0; row < 5; row++){
    rRect(40, 24 + row * 8, 128, 6, '#1b2431');
    for (let c = 0; c < 12; c++){
      const on = ((row * 7 + c * 3 + Math.floor(now / 400)) % 4) === 0;
      rRect(44 + c * 10, 25 + row * 8, 4, 4, on ? '#5eead4' : '#284038');
    }
  }
  rText('RACK-01', 104, 78, 8, '#7f8da0', 'center');

  // ---- Знак защиты от статики ----
  rBox(736, 22, 62, 48, 6, '#1a2230', '#0d121b');
  rRect(741, 26, 52, 40, '#0a0f18');
  ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(767, 30); ctx.lineTo(783, 46); ctx.lineTo(767, 62); ctx.lineTo(751, 46);
  ctx.closePath(); ctx.stroke();
  rRect(763, 42, 8, 8, '#5eead4');
  rText('ESD', 767, 78, 8, '#7fbfb0', 'center');

  // ---- Справа: генератор сигналов ----
  rBox(820, 16, 168, 56, 8, '#1c2432', '#0e131b');
  rRect(826, 21, 156, 38, '#07120c');
  rText('1.000 кГц', 904, 40, 15, '#5eead4', 'center');
  rText('SIG GEN · SIN · 2 Vpp', 904, 56, 8, '#4fbfa6', 'center');
  rGlow(904, 38, 74, '#5eead41c');
  for (let i = 0; i < 5; i++) rRect(838 + i * 8, 46, 4, 8, i < 3 ? '#5eead4' : '#1c5c4c');
}

function drawReuProps(now){
  // Световые пятна от ламп и подсветки приборов
  rGlow(180, 150, 210, '#a78bfa14');
  rGlow(506, 150, 230, '#5eead414');
  rGlow(860, 150, 210, '#a78bfa14');
  rGlow(506, 440, 250, '#a78bfa0e');

  const ty = 2 * 44;

  // ---- Стеллаж с блоками питания слева (x 2..7) ----
  for (let i = 0; i < 3; i++){
    const cx = 2 * 44 + 8 + i * 88;
    rRect(cx + 4, ty + 64, 80, 10, '#05070c99');
    rBox(cx, ty - 4, 80, 54, 24, '#3c4658', '#1b222d');
    rRect(cx + 6, ty + 2, 68, 40, '#0d131c');
    for (let s = 0; s < 3; s++){
      rRect(cx + 10, ty + 6 + s * 13, 60, 10, '#232c39');
      rRect(cx + 14, ty + 9 + s * 13, 12, 4, ['#f59e0b', '#5eead4', '#a78bfa'][s]);
      for (let m = 0; m < 4; m++) rRect(cx + 32 + m * 10, ty + 8 + s * 13, 7, 6, '#141c27');
      rRect(cx + 64, ty + 8 + s * 13, 4, 4, '#5eead4');
    }
    rGlow(cx + 40, ty + 20, 40, '#a78bfa14');
  }

  // ---- Ящики компонентов по центру (x 9..13) ----
  const jx = 9 * 44;
  rRect(jx + 10, ty + 70, 200, 12, '#05070c99');
  rBox(jx + 12, ty + 20, 196, 46, 24, '#4a5568', '#232b38');
  rRect(jx + 20, ty + 26, 180, 38, '#0d131c');
  for (let row = 0; row < 4; row++){
    for (let c = 0; c < 6; c++){
      const colors = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2b7fc4', '#8e44ad'];
      rRect(jx + 26 + c * 29, ty + 30 + row * 9, 25, 7, '#0d131c');
      rRect(jx + 26 + c * 29, ty + 30 + row * 9, 25, 3, colors[(row + c) % 6]);
    }
  }
  rText('КОМПОНЕНТЫ R / C / L / D', jx + 110, ty + 16, 9, '#c3b6f0', 'center');
  rGlow(jx + 110, ty + 46, 90, '#5eead414');

  // ---- Измерительная стойка справа (x 16..20) ----
  const sx = 16 * 44;
  rRect(sx + 16, ty + 62, 152, 12, '#05070c99');
  rBox(sx + 16, ty, 148, 56, 24, '#39424f', '#1b222d');
  rRect(sx + 24, ty + 6, 132, 44, '#0d131c');
  for (let r = 0; r < 4; r++){
    rRect(sx + 30, ty + 10 + r * 11, 120, 8, '#1c2534');
    rRect(sx + 34, ty + 12 + r * 11, 40 + r * 12, 3, ['#5eead4', '#a78bfa', '#5eead4', '#f59e0b'][r]);
    rRect(sx + 130, ty + 12 + r * 11, 4, 4, r % 2 ? '#5eead4' : '#284038');
  }
  for (let k = 0; k < 6; k++) rRect(sx + 36 + k * 17, ty + 46, 11, 2, '#0a1017');
  rGlow(sx + 90, ty + 30, 60, '#5eead414');

  // ---- Рабочие столы за станками (y = 5 и y = 9) ----
  const benches = [[4, 5], [15, 5], [4, 9], [15, 9]];
  benches.forEach((b, i) => {
    const px = b[0] * 44, py = b[1] * 44;
    rRect(px - 4, py + 50, 136, 8, '#05070c99');
    rBox(px - 6, py + 12, 140, 24, 16, '#8e9bb0', '#39424f');
    // Антистатический коврик с клеммами заземления
    rRect(px + 4, py + 15, 120, 18, '#0e5b48');
    rRect(px + 4, py + 15, 120, 2, '#1c8a67');
    for (let d = 0; d < 6; d++) rRect(px + 12 + d * 19, py + 28, 3, 3, '#0a3f31');
    // Паяльная станция с жалом
    rRect(px + 14, py + 13, 28, 9, '#232c39');
    rRect(px + 18, py + 15, 20, 2, '#f59e0b');
    rRect(px + 44, py + 14, 10, 3, '#c7ccd6');
    rRect(px + 52, py + 14, 6, 2, '#c0392b');
    // Осциллограф с живой развёрткой
    rRect(px + 88, py + 12, 34, 13, '#1b222d');
    rRect(px + 92, py + 14, 26, 9, '#04120f');
    rDrawScope(ctx, px + 92, py + 14, 26, 9, (i % 2) ? 'square' : 'sine', (now / 700 + i) % 1, '#5eead4');
    if (i % 2 === 0) rText('ESD', px + 8, py + 40, 8, '#7c8794');
    rGlow(px + 100, py + 20, 42, '#5eead412');
  });

  // ---- Катушки припоя по углам ----
  [[1, 12], [20, 12]].forEach((c, i) => {
    const dx = c[0] * 44 + 44, dy = c[1] * 44 + 22;
    rRect(dx - 20, dy + 16, 40, 6, '#05070c99');
    ctx.beginPath(); ctx.arc(dx, dy, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#2b3442'; ctx.fill();
    ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 2; ctx.stroke();
    for (let k = 0; k < 3; k++){
      ctx.beginPath(); ctx.arc(dx, dy, 11 - k * 3, 0, Math.PI * 2);
      ctx.strokeStyle = k % 2 ? '#9fb0c6' : '#5eead4'; ctx.lineWidth = 1; ctx.stroke();
    }
    rText(i ? 'Sn' : 'Pb', dx, dy + 4, 9, '#c7d0dd', 'center');
  });

  // ---- Разметка на полу ----
  rText('ОТЕЧЕСТВЕННАЯ РАДИОЭЛЕКТРОНИКА', 506, 540, 13, '#39424f', 'center');
  rText('БЕРЕГИ ПРИБОР ОТ СТАТИКИ', 506, 562, 10, '#3d4660', 'center');
}

/* ------------------------------------------------------------------
   ОТРИСОВКА СТАНКА РЭУ
   ------------------------------------------------------------------ */
function drawReuStation(type, done, hard, now, seed){
  const accent = done ? '#4fd69f' : (hard ? '#c084fc' : '#a78bfa');
  rGlow(0, -6, 78, done ? '#48d8a41f' : '#a78bfa22');

  if (type === 0){
    // Печатная плата на держателе
    rRect(-60, 44, 122, 14, '#070a11a0');
    rBox(-58, 44, 116, 12, 14, '#39424f', '#1b222d');
    rBox(-46, -30, 92, 70, 8, '#0e5b48', '#0a3f31');
    // Дорожки и компоненты
    for (let i = 0; i < 4; i++) rRect(-40 + i * 22, -24, 16, 10, '#0d131c');
    for (let i = 0; i < 4; i++) rRect(-38 + i * 22, -21, 12, 4, ['#c0392b', '#e67e22', '#f1c40f', '#2b7fc4'][i]);
    for (let i = 0; i < 5; i++) rRect(-40 + i * 18, 4, 12, 6, '#1c8a67');
    rRect(-46, -30, 92, 2, accent);
    rRect(38, -26, 4, 18, '#c7ccd6');
  } else if (type === 1){
    // Ящик компонентов + резистор на столе
    rRect(-60, 44, 128, 14, '#070a11a0');
    rBox(-60, 2, 120, 30, 14, '#8e9bb0', '#39424f');
    rRect(-52, 8, 104, 18, '#0d131c');
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 6; c++)
        rRect(-48 + c * 17, 10 + r * 6, 14, 4, ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2b7fc4', '#8e44ad'][(r + c) % 6]);
    // Крупный резистор-макет
    ctx.fillStyle = '#d8c48c';
    ctx.beginPath(); ctx.roundRect(-34, -38, 68, 20, 10); ctx.fill();
    ctx.strokeStyle = '#b39c60'; ctx.lineWidth = 2; ctx.stroke();
    ['#c0392b', '#e67e22', '#f1c40f'].forEach((c, i) => rRect(-22 + i * 14, -38, 6, 20, c));
    rCable([-50, -28, -34, -28], '#9aa6bd');
    rCable([34, -28, 50, -28], '#9aa6bd');
    rRect(-60, 0, 120, 2, accent);
  } else if (type === 2){
    // Осциллограф на стойке
    rRect(-58, 44, 120, 14, '#070a11a0');
    rBox(-58, 4, 116, 30, 14, '#39424f', '#1b222d');
    rBox(-44, -40, 88, 56, 8, '#4a5568', '#232b38');
    rRect(-38, -34, 76, 38, '#061410');
    rDrawScope(ctx, -38, -34, 76, 38, 'sine', (now / 800) % 1, accent);
    for (let i = 0; i < 3; i++) rRect(-38 + i * 26, 8, 20, 6, '#1c2534');
    rRect(-58, 2, 116, 2, accent);
  } else if (type === 3){
    // Генератор сигналов с ручками настройки
    rRect(-56, 44, 116, 14, '#070a11a0');
    rBox(-44, 44, 88, 12, 12, '#232b38', '#12171f');
    rBox(-52, -36, 104, 64, 8, '#3c4658', '#1b222d');
    rRect(-44, -30, 88, 22, '#071410');
    rText('1.00 кГц', 0, -15, 11, accent, 'center');
    // Ручки
    for (let i = 0; i < 3; i++){
      ctx.beginPath(); ctx.arc(-30 + i * 30, 12, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#0d131c'; ctx.fill();
      ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-30 + i * 30, 12); ctx.lineTo(-30 + i * 30, 5); ctx.strokeStyle = '#c7ccd6'; ctx.stroke();
    }
    rRect(-52, -36, 104, 2, accent);
  } else {
    // 3D-стенд сборки: проектор и голографический модуль
    rRect(-58, 44, 120, 14, '#070a11a0');
    rBox(-46, 44, 92, 12, 12, '#232b38', '#12171f');
    rGlow(0, -24, 58, '#a78bfa2e');
    rBox(-32, 8, 64, 32, 10, '#3c4658', '#1b222d');
    rRect(-26, 14, 52, 4, '#071410');
    rText('3D-МОНТАЖ', 0, 30, 9, '#a78bfa', 'center');
    rRect(-30, 20, 3, 3, '#5eead4'); rRect(27, 20, 3, 3, '#a78bfa');
    // Изометрический куб-голограмма
    const s = 26;
    const top = [[0, -24 - s], [s, -24 - s * 0.5], [0, -24], [-s, -24 - s * 0.5]];
    const bot = top.map((p) => [p[0], p[1] + s]);
    const quad = (pts, fill, stroke) => {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      if (fill){ ctx.fillStyle = fill; ctx.fill(); }
      if (stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = 1.6; ctx.stroke(); }
    };
    quad([top[0], top[1], bot[1], bot[0]], '#a78bfa26', '#a78bfacc');
    quad([top[1], top[2], bot[2], bot[1]], '#5eead41a', '#a78bfa99');
    quad(top, '#c4b5fd33', '#c4b5fd');
    rRect(-7, -24 - s * 0.5 + 3, 6, 6, '#5eead4');
    rRect(3, -24 - s * 0.5 + 8, 6, 6, '#a78bfa');
    rRect(-46, 42, 92, 2, accent);
  }
}

window.STATION_RENDERERS = window.STATION_RENDERERS || {};
window.STATION_RENDERERS.reu = drawReuStation;

/* ------------------------------------------------------------------
   МИНИ-ИГРЫ РЭУ
   ------------------------------------------------------------------ */
const RKit = window.LabKit;

function rTile(dev, cls){
  const b = RKit.h('button', 'lab-tile' + (cls ? ' ' + cls : ''));
  b.type = 'button';
  b.dataset.id = dev.id;
  b.setAttribute('aria-pressed', 'false');
  b.appendChild(RKit.h('strong', null, dev.name));
  if (dev.note) b.appendChild(RKit.h('span', null, dev.note));
  return b;
}
function rPointsOf(mistakes, base){
  return Math.max(base, 240 - mistakes * 25);
}

/* ---- Игра 1. Сборка печатного модуля ---- */
function openReuBoard(done, cancel){
  const components = [
    { id: 'R1', name: 'Резистор 10 кОм', note: 'ограничивает ток в цепи' },
    { id: 'C1', name: 'Конденсатор 100 мкФ', note: 'сглаживает пульсации питания' },
    { id: 'D1', name: 'Диод 1N4007', note: 'защита от обратного тока' },
    { id: 'U1', name: 'Микросхема ATmega', note: 'управляющий контроллер' }
  ];
  const pads = [
    { id: 'R1', hint: 'R — резистор' },
    { id: 'C1', hint: 'C — конденсатор' },
    { id: 'D1', hint: 'D — диод' },
    { id: 'U1', hint: 'U — микросхема' }
  ];
  let mistakes = 0, solved = 0, selected = null;

  const ui = RKit.create({
    theme: 'reu',
    tag: 'Монтаж · печатная плата',
    title: 'Сборка печатного модуля',
    objective: 'Установите компоненты на посадочные места платы по их обозначениям (R, C, D, U). Выберите компонент слева, затем нажмите соответствующую площадку.',
    howto: [
      'Выберите компонент в списке слева — плитка подсветится.',
      'Найдите на плате площадку с нужным обозначением (R1, C1, D1 или U1).',
      'Нажмите на площадку, чтобы установить компонент.',
      'Заполните все 4 позиции — плата собрана.'
    ],
    hint: 'Первая буква обозначения = тип элемента: R — резистор, C — конденсатор, D — диод, U — микросхема.',
    steps: 4,
    onDone: done, onCancel: cancel
  });

  const feedback = RKit.h('p', 'lab-feedback');
  const columns = RKit.h('div', 'lab-columns');

  const leftCol = RKit.h('div');
  leftCol.appendChild(RKit.h('h3', 'lab-col-title', 'Компоненты'));
  const tray = RKit.h('div', 'lab-tray');
  RKit.shuffle(components).forEach((dev) => {
    const t = rTile(dev);
    t.onclick = () => {
      selected = dev.id;
      tray.querySelectorAll('.lab-tile').forEach((n) => n.setAttribute('aria-pressed', String(n.dataset.id === dev.id)));
      feedback.className = 'lab-feedback';
      feedback.textContent = 'Выбрано: ' + dev.name + '. Найдите площадку с нужным обозначением.';
    };
    tray.appendChild(t);
  });
  leftCol.appendChild(tray);

  const rightCol = RKit.h('div');
  rightCol.appendChild(RKit.h('h3', 'lab-col-title', 'Печатная плата'));
  const board = RKit.h('div', 'lab-board');
  const grid = RKit.h('div', 'lab-board-grid');
  RKit.shuffle(pads).forEach((pad) => {
    const s = RKit.h('button', 'lab-slot');
    s.type = 'button';
    s.appendChild(RKit.h('strong', null, pad.id));
    s.appendChild(RKit.h('small', null, 'площадка'));
    s.onclick = () => mount(s, pad);
    grid.appendChild(s);
  });
  board.appendChild(grid);
  rightCol.appendChild(board);

  columns.append(leftCol, rightCol);
  ui.body.append(columns, feedback);

  function mount(slot, pad){
    if (ui.isClosed() || slot.classList.contains('correct')) return;
    if (!selected){
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Сначала выберите компонент из списка слева.';
      return;
    }
    const dev = components.find((d) => d.id === selected);
    if (dev.id === pad.id){
      slot.classList.add('correct');
      slot.querySelector('strong').textContent = pad.id + ' ✓';
      slot.querySelector('small').textContent = dev.name;
      slot.disabled = true;
      tray.querySelector('[data-id="' + dev.id + '"]').disabled = true;
      selected = null;
      solved++;
      ui.setProgress(solved, pads.length);
      feedback.className = 'lab-feedback ok';
      feedback.textContent = 'Верно: ' + dev.name + ' встал на позицию ' + pad.id + '.';
      if (solved === pads.length){
        board.classList.add('built');
        feedback.textContent += ' Плата собрана — можно подавать питание!';
        setTimeout(() => ui.finish(rPointsOf(mistakes, 60)), 650);
      }
    } else {
      mistakes++;
      slot.classList.add('incorrect');
      setTimeout(() => slot.classList.remove('incorrect'), 400);
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Не та позиция: ' + dev.name + ' не ставится в ' + pad.id + '. ' + pad.hint + '.';
    }
  }
  return ui;
}

/* ---- Игра 2. Расшифровка маркировки резистора ---- */
function openReuResistor(done, cancel){
  const COLORS = [
    { id: 'black',  name: 'Чёрный',      val: 0, hex: '#1c1c1c' },
    { id: 'brown',  name: 'Коричневый',  val: 1, hex: '#6b4423' },
    { id: 'red',    name: 'Красный',     val: 2, hex: '#c0392b' },
    { id: 'orange', name: 'Оранжевый',   val: 3, hex: '#e67e22' },
    { id: 'yellow', name: 'Жёлтый',      val: 4, hex: '#f1c40f' },
    { id: 'green',  name: 'Зелёный',     val: 5, hex: '#27ae60' },
    { id: 'blue',   name: 'Синий',       val: 6, hex: '#2b7fc4' },
    { id: 'violet', name: 'Фиолетовый',  val: 7, hex: '#8e44ad' }
  ];
  // Белый и серый в подбор не входят: на плашках их легко спутать друг с другом.
  // Только «круглые» номиналы: множитель ×100…×10 000, чтобы пересчитывать меньше.
  const TARGETS = [
    { label: '470 Ом',  bands: ['yellow', 'violet', 'brown'] },
    { label: '1 кОм',   bands: ['brown', 'black', 'red'] },
    { label: '2,2 кОм', bands: ['red', 'red', 'red'] },
    { label: '4,7 кОм', bands: ['yellow', 'violet', 'red'] },
    { label: '10 кОм',  bands: ['brown', 'black', 'orange'] },
    { label: '22 кОм',  bands: ['red', 'red', 'orange'] }
  ];
  const target = TARGETS[Math.floor(Math.random() * TARGETS.length)];
  // Затем ВСЕГО три цвета на каждую полосу — выбрать один из трёх, а не из десяти.
  // Правильный цвет всегда в наборе, ещё два — случайные.
  function optionsFor(bandIdx){
    const RIGHT = COLORS.find((c) => c.id === target.bands[bandIdx]);
    const others = COLORS.filter((c) => c.id !== RIGHT.id);
    const two = [];
    while (two.length < 2){
      const c = others[Math.floor(Math.random() * others.length)];
      if (two.every((x) => x.id !== c.id)) two.push(c);
    }
    return RKit.shuffle([RIGHT, two[0], two[1]]);
  }
  const bandLabels = ['1-я полоса', '2-я полоса', 'множитель'];
  let mistakes = 0;
  const chosen = [null, null, null];
  const solved = [false, false, false];
  let band = 0;

  const ui = RKit.create({
    theme: 'reu',
    tag: 'Компоненты · цветовая маркировка',
    title: 'Расшифровка маркировки резистора',
    objective: 'Подберите цветовые полосы так, чтобы получить резистор ' + target.label + '. Первые две полосы задают цифры, третья — множитель ×1000 или ×100.',
    howto: [
      'Справа на табло написан нужный номинал: ' + target.label + '.',
      'У каждой полосы — свой набор из трёх цветов. На каждом цвете подписана его цифра.',
      'Выберите цвет для 1-й полосы, затем для 2-й и для 3-й (множителя).',
      'Если ошиблись — неверные полосы подсветятся и очистятся, верные останутся.'
    ],
    hint: 'Прочитайте две цифры и допишите нули: красный-красный-красный = 2, 2, ×100 = 2200 Ом = 2,2 кОм. В каждой полосе только три цвета — просто сравните цифры на них с номиналом.',
    steps: 3,
    onDone: done, onCancel: cancel
  });

  const feedback = RKit.h('p', 'lab-feedback');
  ui.body.appendChild(RKit.h('p', 'lab-note', 'Третья полоса — множитель: красный ×100, оранжевый ×1000. Например, 2 · 2 · ×100 = 2200 Ом = 2,2 кОм.'));

  // Макет резистора
  const res = RKit.h('div', 'lab-resistor');
  const leadL = RKit.h('div', 'lead');
  const body = RKit.h('div', 'body');
  const bands = RKit.h('div', 'bands');
  const bandEls = bandLabels.map(() => {
    const b = RKit.h('div', 'band');
    bands.appendChild(b);
    return b;
  });
  body.appendChild(bands);
  const leadR = RKit.h('div', 'lead');
  res.append(leadL, body, leadR);
  ui.body.appendChild(res);

  const targetLine = RKit.h('p', 'lab-note', 'Нужно собрать: ' + target.label);
  targetLine.style.textAlign = 'center';
  targetLine.style.color = '#5eead4';
  targetLine.style.fontSize = '18px';
  targetLine.style.fontWeight = '700';
  ui.body.appendChild(targetLine);

  const title = RKit.h('h3', 'lab-col-title', 'Выберите цвет для: ' + bandLabels[0]);
  title.style.textAlign = 'center';
  ui.body.appendChild(title);

  // Свой набор из трёх цветов для каждой полосы — так абитуриенту
  // не приходится держать в голове всю таблицу десяти цветов.
  const bandRows = [0, 1, 2].map((idx) => {
    const row = RKit.h('div', 'lab-swatches');
    row.style.display = 'none';
    const opts = optionsFor(idx);
    const els = opts.map((c) => {
      const s = RKit.h('button', 'lab-swatch');
      s.type = 'button';
      s.title = c.name + ' (' + c.val + ')';
      s.setAttribute('aria-label', c.name + ' = ' + c.val);
      s.setAttribute('aria-pressed', 'false');
      s.style.background = c.hex;
      // Подпись цифры прямо на цвете — чтобы абитуриент сразу видел значение.
      const num = RKit.h('span', 'lab-swatch-num', String(c.val));
      num.style.color = c.val <= 1 ? '#d7dde6' : '#0b0d12';
      s.appendChild(num);
      const lbl = RKit.h('span', 'lab-swatch-num', c.name);
      lbl.style.font = '10px sans-serif';
      lbl.style.alignItems = 'flex-end';
      lbl.style.paddingBottom = '3px';
      lbl.style.color = c.val <= 1 ? '#d7dde6' : '#0b0d12';
      s.appendChild(lbl);
      s.onclick = () => pick(c);
      row.appendChild(s);
      return s;
    });
    row.style.gridTemplateColumns = 'repeat(' + els.length + ', minmax(0, 1fr))';
    ui.body.appendChild(row);
    return { row, els, opts };
  });
  ui.body.appendChild(feedback);

  // Показываем набор только для текущей нерешённой полосы.
  function syncSwatches(){
    bandRows.forEach((r, idx) => {
      r.row.style.display = idx === band && !solved[idx] ? '' : 'none';
      r.els.forEach((s, i) => s.setAttribute('aria-pressed', String(r.opts[i].id === chosen[idx])));
    });
  }

  // Помечаем полосу как решённую: зелёная рамка + блокировка смены.
  function lockBand(i){
    bandEls[i].style.outline = '2px solid #27ae60';
    bandEls[i].style.outlineOffset = '1px';
    solved[i] = true;
  }
  function clearBand(i){
    bandEls[i].style.background = '#3a3a3a';
    bandEls[i].style.outline = 'none';
    chosen[i] = null;
    solved[i] = false;
  }
  // Переход к первой нерешённой полосе.
  function gotoUnsolved(){
    const idx = solved.findIndex((s) => !s);
    band = idx === -1 ? 0 : idx;
    title.textContent = 'Выберите цвет для: ' + bandLabels[band];
    syncSwatches();
  }

  function pick(color){
    if (ui.isClosed()) return;
    // Если текущая полоса уже решена — прыгаем на нерешённую.
    if (solved[band]){
      gotoUnsolved();
      if (solved.every(Boolean)) return;
    }
    chosen[band] = color.id;
    bandEls[band].style.background = color.hex;
    feedback.className = 'lab-feedback';
    feedback.textContent = bandLabels[band] + ': ' + color.name + ' (' + color.val + ').';
    // Если остались незаполненные полосы — переходим к следующей.
    const nextEmpty = chosen.findIndex((c) => c == null);
    if (nextEmpty !== -1){
      band = nextEmpty;
      title.textContent = 'Выберите цвет для: ' + bandLabels[band];
      syncSwatches();
      return;
    }
    // Все три полосы заданы — проверяем каждую по отдельности.
    title.textContent = 'Проверка маркировки…';
    syncSwatches();
    let wrongCount = 0;
    for (let i = 0; i < 3; i++){
      if (chosen[i] === target.bands[i]){
        if (!solved[i]) lockBand(i);
      } else {
        wrongCount++;
        clearBand(i);
      }
    }
    if (wrongCount === 0){
      feedback.className = 'lab-feedback ok';
      feedback.textContent = 'Верно! Маркировка соответствует ' + target.label + '.';
      ui.setProgress(3, 3);
      setTimeout(() => ui.finish(rPointsOf(mistakes, 70)), 700);
    } else {
      mistakes++;
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Неверно выбрано полос: ' + wrongCount + '. Зелёные оставляем, неверные — закрашиваем заново.';
      gotoUnsolved();
    }
  }
  feedback.textContent = 'Выберите цвет для 1-й полосы. В наборе три цвета — вам нужен тот, чья цифра подходит под номинал.';
  syncSwatches();
  return ui;
}

/* ---- Игра 3. Осциллограф: распознавание формы сигнала ---- */
function openReuScope(done, cancel){
  const points = [
    { id: 'gen', name: 'Генератор', shape: 'square' },
    { id: 'amp', name: 'Выход усилителя', shape: 'sine' },
    { id: 'pwm', name: 'ШИМ-выход', shape: 'square' },
    { id: 'saw', name: 'Развёртка', shape: 'saw' }
  ];
  const shapes = [
    { id: 'sine', label: 'Синусоида' },
    { id: 'square', label: 'Прямоугольный' },
    { id: 'saw', label: 'Пила' },
    { id: 'dc', label: 'Постоянное' }
  ];
  let mistakes = 0, solved = 0;
  const active = { id: points[0].id };
  const labeled = {};

  const ui = RKit.create({
    theme: 'reu',
    tag: 'Измерения · осциллограф',
    title: 'Определение формы сигнала',
    objective: 'Снимите сигнал с каждой контрольной точки цепи и определите его форму. Переключайте точку, затем выбирайте тип сигнала.',
    howto: [
      'Выберите контрольную точку (генератор, усилитель, ШИМ, развёртка).',
      'Посмотрите форму сигнала на экране осциллографа.',
      'Выберите подходящий тип справа: синусоида, прямоугольный, пила или постоянное.',
      'Определите все точки цепи.'
    ],
    hint: 'Ориентиры: плавные волны — синусоида; резкие ступеньки вверх-вниз — прямоугольник; наклонная «пила» — линейная развёртка.',
    steps: points.length,
    onDone: done, onCancel: cancel
  });

  const feedback = RKit.h('p', 'lab-feedback');
  const columns = RKit.h('div', 'lab-columns');

  // Левая колонка: экран осциллографа
  const leftCol = RKit.h('div');
  leftCol.appendChild(RKit.h('h3', 'lab-col-title', 'Экран осциллографа'));
  const wrap = RKit.h('div', 'lab-scope-wrap');
  const cv = document.createElement('canvas');
  cv.className = 'lab-scope';
  cv.width = 520; cv.height = 240;
  wrap.appendChild(cv);
  const read = RKit.h('div', 'lab-scope-read');
  const readPoint = RKit.h('span', null, 'Точка: —');
  read.appendChild(readPoint);
  leftCol.append(wrap, read);
  leftCol.appendChild(RKit.h('p', 'lab-note', 'Ниже выберите контрольную точку пробы — прибор покажет сигнал на экране.'));

  const pts = RKit.h('div', 'lab-points');
  points.forEach((p) => {
    const b = RKit.h('button', 'lab-point');
    b.type = 'button';
    b.appendChild(RKit.h('strong', null, p.name));
    b.onclick = () => setActive(p, b);
    pts.appendChild(b);
  });
  leftCol.appendChild(pts);

  // Правая колонка: выбор формы
  const rightCol = RKit.h('div');
  rightCol.appendChild(RKit.h('h3', 'lab-col-title', 'Тип сигнала'));
  const shapeBox = RKit.h('div', 'lab-tray');
  shapes.forEach((sh) => {
    const b = RKit.h('button', 'lab-tile');
    b.type = 'button';
    b.appendChild(RKit.h('strong', null, sh.label));
    b.onclick = () => check(sh, b);
    shapeBox.appendChild(b);
  });
  rightCol.appendChild(shapeBox);
  columns.append(leftCol, rightCol);
  ui.body.append(columns, feedback);

  let phase = 0, raf = 0;
  function frame(){
    if (ui.isClosed()){ raf = 0; return; }
    phase = (phase + 0.01) % 1;
    const p = points.find((k) => k.id === active.id);
    rDrawScope(cv.getContext('2d'), 0, 0, cv.width, cv.height, p ? p.shape : 'dc', phase, '#5eead4');
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function setActive(p, btn){
    active.id = p.id;
    readPoint.textContent = 'Точка: ' + p.name;
    pts.querySelectorAll('.lab-point').forEach((n) => n.classList.remove('probed'));
    btn.classList.add('probed');
    feedback.className = 'lab-feedback';
    feedback.textContent = labeled[p.id] ? 'Сигнал уже определён как «' + shapes.find((s) => s.id === labeled[p.id]).label + '».' : 'Сигнал снят с точки «' + p.name + '». Определите его форму.';
  }
  setActive(points[0], pts.firstChild);

  function check(sh, btn){
    if (ui.isClosed()) return;
    const p = points.find((k) => k.id === active.id);
    if (labeled[p.id]){
      feedback.className = 'lab-feedback';
      feedback.textContent = 'Эта точка уже определена. Переключитесь на другую.';
      return;
    }
    if (sh.id === p.shape){
      labeled[p.id] = sh.id;
      solved++;
      ui.setProgress(solved, points.length);
      feedback.className = 'lab-feedback ok';
      feedback.textContent = 'Верно: «' + p.name + '» — ' + sh.label + '.';
      const next = points.find((k) => !labeled[k.id]);
      if (solved === points.length){
        feedback.textContent = 'Все контрольные точки определены верно.';
        setTimeout(() => ui.finish(rPointsOf(mistakes, 75)), 700);
      } else if (next){
        const nb = pts.querySelectorAll('.lab-point')[points.indexOf(next)];
        setActive(next, nb);
      }
    } else {
      mistakes++;
      btn.classList.add('dragging');
      setTimeout(() => btn.classList.remove('dragging'), 350);
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Неверно: сигнал «' + p.name + '» имеет другую форму. Сравните с экраном.';
    }
  }
  return ui;
}

/* ---- Игра 4. Осциллограф: чтение сигнала по сетке ---- */
function openReuGenerator(done, cancel){
  const AMPS = [
    { id: '1', name: '1 В' },
    { id: '2', name: '2 В' },
    { id: '3', name: '3 В' },
    { id: '4', name: '4 В' }
  ];
  const FREQS = [
    { id: '1', name: '1 кГц' },
    { id: '2', name: '2 кГц' },
    { id: '3', name: '3 кГц' },
    { id: '4', name: '4 кГц' }
  ];
  // Шкалы прибора: по вертикали 1 клетка = 1 В, по горизонтали 1 клетка = 0,1 мс.
  const V_PER_DIV = 1;
  const MS_PER_DIV = 0.1;
  const DIV_X = 10;   // горизонтальных делений → окно развёртки = 1 мс
  const DIV_Y = 10;   // вертикальных делений

  // Задания: 3 случайных сигнала. Форма всегда одна — синусоида,
  // чтобы не отвлекать от самого замера. Амплитуда 1–4 В, частота 1–4 кГц:
  // на экране это ровно 1, 2, 3 или 4 клетки — считать ничего не нужно.
  const combos = [];
  AMPS.forEach((a) => FREQS.forEach((f) => {
    combos.push({ shape: 'sin', amp: a.id, freq: f.id });
  }));
  for (let i = combos.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [combos[i], combos[j]] = [combos[j], combos[i]];
  }
  const rounds = combos.slice(0, 3);
  let round = 0, mistakes = 0;
  // Что игрок успел прочитать с экрана.
  let guess = { amp: null, freq: null };

  const ui = RKit.create({
    theme: 'reu',
    tag: 'Измерения · осциллограф',
    title: 'Чтение осциллограммы',
    objective: 'На экране — синусоида с генератора. Прибор уже настроен: посмотрите, сколько клеток волна занимает в высоту и в ширину, и выберите ответ. Ручки трогать не нужно.',
    howto: [
      'Амплитуда: сколько клеточек от центра экрана вверх до вершины волны — столько вольт.',
      'Частота: сколько клеточек занимает один период волны — столько килогерц.',
      'Например: волна поднимается на 2 клетки вверх → 2 В, а один период занимает 3 клетки → 3 кГц.',
      'Выберите ответы справа и нажмите «Проверить». Прочитайте все 3 сигнала.'
    ],
    hint: 'Просто посчитайте клетки: по вертикали от центра до верхушки — это вольты, по горизонтали от горба до горба — это килогерцы. Выбор всегда один из четырёх.',
    steps: rounds.length,
    onDone: done, onCancel: cancel
  });

  const feedback = RKit.h('p', 'lab-feedback');
  const columns = RKit.h('div', 'lab-columns');

  // ----- Левая колонка: осциллограф -----
  const leftCol = RKit.h('div');
  leftCol.appendChild(RKit.h('h3', 'lab-col-title', 'Экран осциллографа'));
  const wrap = RKit.h('div', 'lab-scope-wrap');
  const cv = document.createElement('canvas');
  cv.className = 'lab-scope';
  cv.width = 560; cv.height = 320;
  wrap.appendChild(cv);
  leftCol.appendChild(wrap);

  // Подписи шкал прибора под экраном.
  const scaleNote = RKit.h('p', 'lab-note', 'Развёртка: 1 клетка = 0,1 мс (окно 1 мс) · Канал: 1 клетка = 1 В');
  scaleNote.style.textAlign = 'center';
  scaleNote.style.color = '#5eead4';
  leftCol.appendChild(scaleNote);

  // ----- Правая колонка: ввод считанных значений -----
  const rightCol = RKit.h('div');
  const task = RKit.h('p', 'lab-note');
  task.style.textAlign = 'center';
  task.style.color = '#a78bfa';
  task.style.fontSize = '15px';
  rightCol.appendChild(task);

  rightCol.appendChild(RKit.h('h3', 'lab-col-title', 'Амплитуда'));
  const ampRow = RKit.h('div', 'lab-points');
  const ampBtns = {};
  AMPS.forEach((a) => {
    const b = RKit.h('button', 'lab-point');
    b.type = 'button';
    b.appendChild(RKit.h('strong', null, a.name));
    b.onclick = () => { guess.amp = a.id; sync(); };
    ampBtns[a.id] = b;
    ampRow.appendChild(b);
  });
  rightCol.appendChild(ampRow);

  rightCol.appendChild(RKit.h('h3', 'lab-col-title', 'Частота'));
  const freqRow = RKit.h('div', 'lab-points');
  const freqBtns = {};
  FREQS.forEach((f) => {
    const b = RKit.h('button', 'lab-point');
    b.type = 'button';
    b.appendChild(RKit.h('strong', null, f.name));
    b.onclick = () => { guess.freq = f.id; sync(); };
    freqBtns[f.id] = b;
    freqRow.appendChild(b);
  });
  rightCol.appendChild(freqRow);

  const applyBtn = RKit.h('button', 'lab-btn lab-btn-primary', 'Проверить');
  applyBtn.type = 'button';
  rightCol.appendChild(applyBtn);

  columns.append(leftCol, rightCol);
  ui.body.append(columns, feedback);

  // ----- Отрисовка осциллограммы (стабильная развёртка, как по триггеру) -----
  function draw(){
    const g = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const pad = 18;
    const px = pad, py = pad, pw = W - pad * 2, ph = H - pad * 2;
    const r = rounds[round - 1];

    g.save();
    g.fillStyle = '#04120f'; g.fillRect(0, 0, W, H);

    // Сетка с рамкой
    g.strokeStyle = '#123f36'; g.lineWidth = 1;
    for (let i = 0; i <= DIV_X; i++){
      const gx = px + (pw / DIV_X) * i;
      g.beginPath(); g.moveTo(gx, py); g.lineTo(gx, py + ph); g.stroke();
    }
    for (let i = 0; i <= DIV_Y; i++){
      const gy = py + (ph / DIV_Y) * i;
      g.beginPath(); g.moveTo(px, gy); g.lineTo(px + pw, gy); g.stroke();
    }
    // Средняя линия (нулевой уровень)
    g.strokeStyle = '#2a5f52';
    g.beginPath(); g.moveTo(px, py + ph / 2); g.lineTo(px + pw, py + ph / 2); g.stroke();

    // Сигнал: амплитуда и число периодов строго по шкалам прибора.
    // Крест делителей (нулевой уровень) — центр сетки, сигнал стоим на нём,
    // поэтому амплитуда — ровно число клеток от центра до вершины.
    const ampDiv = Number(r.amp) / V_PER_DIV;                    // делений от оси
    const cycles = Number(r.freq) * MS_PER_DIV * DIV_X;          // периодов на окне
    const mid = py + ph / 2;
    const divY = ph / DIV_Y;
    const col = '#5eead4';
    g.strokeStyle = col; g.lineWidth = 2.5; g.shadowColor = col; g.shadowBlur = 10;
    g.beginPath();
    const N = 600;
    for (let i = 0; i <= N; i++){
      const t = i / N;
      const arg = t * cycles * Math.PI * 2;
      let v;
      // Меандр = ±1: 4 В ↔ 2 клетки вверх, 10 В ↔ 5 клеток вверх.
      if (r.shape === 'square') v = Math.sin(arg) >= 0 ? 1 : -1;
      else if (r.shape === 'saw'){ const fr = ((arg / (Math.PI * 2)) % 1 + 1) % 1; v = 2 * fr - 1; }
      else v = Math.sin(arg);
      const gx = px + t * pw;
      const gy = mid - v * ampDiv * divY;
      if (i === 0) g.moveTo(gx, gy); else g.lineTo(gx, gy);
    }
    g.stroke();
    g.restore();
  }

  function sync(){
    Object.keys(ampBtns).forEach((k) => {
      const on = k === guess.amp;
      ampBtns[k].setAttribute('aria-pressed', String(on));
      ampBtns[k].classList.toggle('picked', on);
    });
    Object.keys(freqBtns).forEach((k) => {
      const on = k === guess.freq;
      freqBtns[k].setAttribute('aria-pressed', String(on));
      freqBtns[k].classList.toggle('picked', on);
    });
    // Подсказка о текущем выборе под кнопками.
    const aName = guess.amp ? AMPS.find((x) => x.id === guess.amp).name : '—';
    const fName = guess.freq ? FREQS.find((x) => x.id === guess.freq).name : '—';
    if (guess.amp || guess.freq){
      feedback.className = 'lab-feedback';
      feedback.textContent = 'Выбрано: амплитуда ' + aName + ', частота ' + fName + '. Если совпадает с экраном — жмите «Проверить».';
    }
    draw();
  }

  function setRound(){
    round++;
    guess = { amp: null, freq: null };
    ui.setProgress(round - 1, rounds.length);
    task.textContent = 'Сигнал ' + round + ' из ' + rounds.length + ' — сколько клеток в высоту и в ширину?';
    feedback.className = 'lab-feedback';
    feedback.textContent = 'Посмотрите на экран: амплитуда — клетки вверх, частота — клетки одного периода. Выберите ответы и нажмите «Проверить».';
    sync();
  }
  setRound();

  applyBtn.onclick = () => {
    if (ui.isClosed()) return;
    if (guess.amp == null || guess.freq == null){
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Выберите и амплитуду, и частоту — потом проверяйте.';
      return;
    }
    const r = rounds[round - 1];
    if (guess.amp === r.amp && guess.freq === r.freq){
      const aName = AMPS.find((x) => x.id === r.amp).name;
      const fName = FREQS.find((x) => x.id === r.freq).name;
      feedback.className = 'lab-feedback ok';
      feedback.textContent = 'Верно: волна поднимается на ' + aName + ' и период ' + fName + '.';
      ui.setProgress(round, rounds.length);
      if (round >= rounds.length){
        feedback.textContent = 'Все сигналы прочитаны верно. Осциллограф освоен!';
        setTimeout(() => ui.finish(rPointsOf(mistakes, 70)), 700);
      } else {
        setTimeout(setRound, 650);
      }
    } else {
      mistakes++;
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Пока не сходится. Считайте только клетки: вверх от центра до верхушки — амплитуда, от горба до горба — период.';
    }
  };
  return ui;
}

/* ---- Игра 5. 3D-сборка электронного модуля ---- */
function openReu3D(done, cancel){
  const parts = [
    { id: 'R1', name: 'Резистор 10 кОм',      note: 'ограничивает ток' },
    { id: 'C1', name: 'Конденсатор 100 мкФ',  note: 'сглаживает пульсации' },
    { id: 'D1', name: 'Диод 1N4007',          note: 'защита от обратного тока' },
    { id: 'U1', name: 'Микроконтроллер ATmega', note: 'управление устройством' }
  ];
  const sectors = [
    { id: 'R1', title: 'ОГРАНИЧЕНИЕ ТОКА', task: 'Не даёт току превысить безопасный уровень' },
    { id: 'C1', title: 'ПИТАНИЕ',          task: 'Сглаживает пульсации напряжения питания' },
    { id: 'D1', title: 'ЗАЩИТА',           task: 'Не пропускает ток в обратном направлении' },
    { id: 'U1', title: 'УПРАВЛЕНИЕ',       task: 'Исполняет программу устройства' }
  ];
  let selected = null, solved = 0, mistakes = 0, angle = 0;

  const ui = RKit.create({
    theme: 'reu',
    tag: '3D-стенд · сборка модуля',
    title: '3D-сборка электронного модуля',
    objective: 'Соберите модуль: подберите каждому отсеку корпуса подходящий компонент. Выберите компонент, вращайте 3D-модуль стрелками и нажмите на нужную грань.',
    howto: [
      'Выберите компонент в списке снизу — плитка подсветится.',
      'Кнопками ◀ ▶ вращайте 3D-модуль, чтобы увидеть все четыре грани-отсека.',
      'Прочитайте, какую функцию выполняет отсек, и нажмите на грань, если туда ставится выбранный компонент.',
      'Соберите все 4 отсека — модуль готов к проверке.'
    ],
    hint: 'Соотносите функцию и элемент: ток ограничивает резистор, пульсации сглаживает конденсатор, от обратного тока защищает диод, а программу исполняет микроконтроллер.',
    steps: 4,
    onDone: done, onCancel: cancel
  });

  const shuffled = RKit.shuffle(sectors).map((s, i) => Object.assign({}, s, { rot: i * 90 }));
  const feedback = RKit.h('p', 'lab-feedback');
  const faces = [];

  const scene = RKit.h('div', 'lab-scene3d');
  const cube = RKit.h('div', 'lab-cube3d');
  shuffled.forEach((sec) => {
    const face = RKit.h('div', 'lab-face3d');
    face.style.transform = 'rotateY(' + sec.rot + 'deg) translateZ(95px)';
    const inner = RKit.h('div', 'lab-face-inner');
    inner.appendChild(RKit.h('small', null, 'Отсек · поверните к себе'));
    inner.appendChild(RKit.h('strong', null, sec.title));
    inner.appendChild(RKit.h('div', 'lab-face-slot', sec.task));
    face.appendChild(inner);
    face.onclick = () => install(sec, inner);
    cube.appendChild(face);
    faces.push({ sec, inner, filled: false });
  });
  const capTop = RKit.h('div', 'lab-face3d');
  capTop.style.transform = 'rotateX(90deg) translateZ(95px)';
  capTop.appendChild(RKit.h('div', 'lab-face-inner lab-cap-inner', '🔌'));
  const capBot = RKit.h('div', 'lab-face3d');
  capBot.style.transform = 'rotateX(-90deg) translateZ(95px)';
  capBot.appendChild(RKit.h('div', 'lab-face-inner lab-cap-inner', 'СОТА'));
  cube.append(capTop, capBot);
  scene.appendChild(cube);

  function applyRot(){ cube.style.transform = 'rotateX(-14deg) rotateY(' + angle + 'deg)'; }
  applyRot();

  const controls = RKit.h('div', 'lab-scene-controls');
  const left = RKit.h('button', 'lab-rotbtn', '◀');
  left.type = 'button'; left.setAttribute('aria-label', 'Повернуть модуль влево');
  const right = RKit.h('button', 'lab-rotbtn', '▶');
  right.type = 'button'; right.setAttribute('aria-label', 'Повернуть модуль вправо');
  left.onclick = () => { angle -= 90; applyRot(); };
  right.onclick = () => { angle += 90; applyRot(); };
  controls.append(left, right);

  const caption = RKit.h('p', 'lab-scene-caption', 'Сейчас перед вами одна грань-отсек. Вращайте модуль, чтобы найти нужную.');
  const trayTitle = RKit.h('h3', 'lab-col-title', 'Компоненты для установки');
  const tray = RKit.h('div', 'lab-tray');
  RKit.shuffle(parts).forEach((p) => {
    const t = RKit.h('button', 'lab-tile');
    t.type = 'button'; t.dataset.id = p.id;
    t.setAttribute('aria-pressed', 'false');
    t.appendChild(RKit.h('strong', null, p.id + ' · ' + p.name));
    t.appendChild(RKit.h('span', null, p.note));
    t.onclick = () => {
      if (t.disabled) return;
      selected = p.id;
      tray.querySelectorAll('.lab-tile').forEach((n) => n.setAttribute('aria-pressed', String(n.dataset.id === p.id)));
      feedback.className = 'lab-feedback';
      feedback.textContent = 'Выбрано: ' + p.name + '. Найдите подходящий отсек.';
    };
    tray.appendChild(t);
  });

  ui.body.append(scene, controls, caption, trayTitle, tray, feedback);

  function install(sec, inner){
    if (ui.isClosed()) return;
    const st = faces.find((f) => f.sec === sec);
    if (st.filled){
      feedback.className = 'lab-feedback';
      feedback.textContent = 'Этот отсек уже собран.';
      return;
    }
    if (!selected){
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Сначала выберите компонент в списке ниже.';
      return;
    }
    const part = parts.find((p) => p.id === selected);
    if (part.id === sec.id){
      st.filled = true;
      solved++;
      inner.classList.add('filled', 'pop');
      setTimeout(() => inner.classList.remove('pop'), 420);
      inner.querySelector('.lab-face-slot').textContent = '✔ ' + part.id + ' ' + part.name;
      const tile = tray.querySelector('[data-id="' + part.id + '"]');
      if (tile){ tile.disabled = true; tile.setAttribute('aria-pressed', 'false'); }
      selected = null;
      ui.setProgress(solved, 4);
      feedback.className = 'lab-feedback ok';
      feedback.textContent = 'Верно! ' + part.name + ' установлен в отсек «' + sec.title + '».';
      if (solved === faces.length){
        feedback.textContent += ' Модуль собран — можно проверять!';
        setTimeout(() => ui.finish(rPointsOf(mistakes, 90)), 800);
      }
    } else {
      mistakes++;
      inner.classList.add('miss');
      setTimeout(() => inner.classList.remove('miss'), 440);
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Не сюда: ' + part.name + ' не выполняет функцию «' + sec.task + '».';
    }
  }

  return ui;
}

/* ---- Диспетчер станций РЭУ ---- */
window.startReuStation = function(type, floor, done, cancel){
  if (type === 0) return openReuBoard(done, cancel);
  if (type === 1) return openReuResistor(done, cancel);
  if (type === 2) return openReuScope(done, cancel);
  if (type === 3) return openReuGenerator(done, cancel);
  if (type === 4) return openReu3D(done, cancel);
  return openReuBoard(done, cancel);
};
