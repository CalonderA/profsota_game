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
// ИНТЕРЬЕР ЛАБОРАТОРИИ РЭУ (11.02.16) — «тёплая радиомонтажная мастерская»
// Медь и янтарь, плакаты-платы на стенах, банки с компонентами.
// ==================================================================
const R_COL = {
  floor: ['#2b241e', '#241e19', '#312821', '#272019'],
  bench: '#a3876a', benchDark: '#3f3327',
  violet: '#f5a623', teal: '#f5a623', tealDark: '#a35f1f',
  amber: '#f5a623', silk: '#f2e7d8'
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
    g.fillStyle = '#100c08'; g.fillRect(0, 43, 44, 1); g.fillRect(43, 0, 1, 44);
    g.fillStyle = '#463829'; g.fillRect(0, 0, 44, 1);
    // Точечная структура линолеума
    for (let i = 0; i < 26; i++){
      g.fillStyle = i % 4 ? '#5b4a3455' : '#0a070577';
      g.fillRect(3 + (n + i * 11) % 38, 3 + (n * 3 + i * 9) % 38, 1, 1);
    }
    // Следы пайки и «дорожки»
    if (n % 3 === 0){
      g.fillStyle = '#f5a6231b'; g.fillRect(0, 15, 44, 1); g.fillRect(0, 30, 44, 1);
      g.fillRect(20, 15, 1, 16);
      g.fillStyle = '#a35f1f77';
      g.beginPath(); g.arc(20, 15, 2, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(20, 30, 2, 0, Math.PI * 2); g.fill();
    }
    if (n % 5 === 0){ g.fillStyle = '#f5a62314'; g.fillRect(0, 21, 44, 2); }
    rFloorCache.set(key, tile);
  }
  ctx.drawImage(tile, x * 44, y * 44);
  // Медная шина заземления вдоль боковых стен
  if (x === 1 || x === 21){
    const px = x === 1 ? 4 : 37;
    ctx.fillStyle = '#1a1008'; ctx.fillRect(px, y * 44, 4, 44);
    ctx.fillStyle = '#d98a3a'; ctx.fillRect(px, y * 44, 4, 2);
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(px, y * 44 + 22, 4, 2);
  }
}

function drawReuWall(x, y){
  if (y < 2) return;
  const px = x * 44;
  if (y === 14){
    // Плинтус с медной шиной и крепежом
    rBox(px, y * 44, 44, 12, 12, '#332a20', '#171209');
    rRect(px, y * 44 + 2, 44, 2, '#d98a3a');
    rRect(px, y * 44 + 4, 44, 2, '#8a5a2b');
    for (let i = 0; i < 44; i += 8) rRect(px + i + 3, y * 44 + 7, 3, 3, '#463829');
  } else {
    rRect(px, y * 44, 44, 44, '#1d1710');
    rRect(px, y * 44, 44, 1, '#2b2217');
    const cx = px + (x === 0 ? 36 : 4);
    // Кабельный канал
    rRect(cx, y * 44, 6, 44, '#120d08');
    rRect(cx, y * 44, 6, 2, '#b3622f');
    rRect(cx, y * 44 + 22, 6, 2, '#b3622f');
    // Розеточный блок
    rRect(cx - 3, y * 44 + 14, 12, 12, '#2e2519');
    rRect(cx, y * 44 + 16, 3, 3, '#f5a623');
    rRect(cx + 6, y * 44 + 16, 3, 3, '#e0d5b8');
  }
}

function drawReuBackWall(now){
  const wallH = 88;
  // Тёплые деревянно-стальные панели
  rRect(0, 0, VW, wallH, '#191310');
  for (let x = 0; x < VW; x += 56){
    rRect(x, 0, 2, wallH, '#2a2018');
    rRect(x + 3, 12, 48, 1, '#33281d');
    rRect(x + 3, 54, 48, 1, '#33281d');
    rRect(x + 7, 5, 2, 2, '#4a3c2c'); rRect(x + 45, 5, 2, 2, '#4a3c2c');
    rRect(x + 7, 71, 2, 2, '#4a3c2c'); rRect(x + 45, 71, 2, 2, '#4a3c2c');
  }
  rRect(0, 80, VW, 8, '#0e0a07');
  rRect(0, 80, VW, 2, '#4a3c2c');
  // Верхний кабель-лоток с пучком
  rRect(0, 0, VW, 10, '#0e0a07');
  rRect(0, 10, VW, 4, '#4a3c2c');
  rRect(0, 14, VW, 1, '#6b5a3f');
  ctx.lineWidth = 2;
  [['#f5a623', 3], ['#e0d5b8', 6], ['#d98a3a', 9]].forEach((row) => {
    ctx.strokeStyle = row[0];
    ctx.beginPath(); ctx.moveTo(0, row[1]); ctx.lineTo(VW, row[1]); ctx.stroke();
  });

  rGlow(506, 40, 300, '#f5a6231c');

  // ---- Центральная вывеска ----
  rBox(300, 12, 412, 42, 6, '#2e2519', '#150f0a');
  rRect(306, 16, 400, 34, '#120c08');
  rRect(306, 16, 400, 2, '#f5a623');
  rText('РАДИОМАСТЕРСКАЯ', 506, 40, 22, '#f7c97e', 'center');
  rText('11.02.16 · ЭЛЕКТРОННЫЕ ПРИБОРЫ И УСТРОЙСТВА', 506, 55, 8, '#c08f4e', 'center');

  // ---- Плакат-плата под вывеской (тёмный холст с дорожками) ----
  rBox(336, 60, 340, 18, 4, '#3f382c', '#1d1710');
  rRect(342, 62, 328, 14, '#0d2b1a');
  // Медные дорожки и «контактные площадки»
  rRect(348, 66, 90, 1, '#2f8a5b');
  rRect(348, 70, 140, 1, '#2f8a5b');
  rRect(390, 66, 1, 6, '#2f8a5b');
  rRect(470, 66, 1, 8, '#2f8a5b');
  rRect(520, 70, 1, 4, '#2f8a5b');
  for (let i = 0; i < 10; i++) rRect(350 + i * 32, 64, 3, 3, i % 2 ? '#f5a623' : '#e0d5b8');
  rText('ПРИНЦИП: СНАЧАЛА СХЕМА — ПОТОМ ПАЙКА', 506, 74, 8, '#7fbf9a', 'center');

  // Прожекторы по краям вывески
  [288, 716].forEach((lx) => {
    rRect(lx, 10, 10, 44, '#241c13');
    rRect(lx + 2, 14, 6, 36, '#120d08');
    rRect(lx + 3, 22, 4, 22, '#f5a623');
    rGlow(lx + 5, 34, 56, '#f5a6232c');
  });

  // ---- Слева: полка с банками компонентов ----
  rBox(28, 14, 152, 56, 8, '#332a1e', '#171209');
  rRect(34, 20, 140, 44, '#100b07');
  // Две полки с банками
  for (let row = 0; row < 2; row++){
    rRect(38, 40 + row * 20, 130, 3, '#4a3c2c');
    for (let j = 0; j < 9; j++){
      const colors = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2b7fc4', '#8e44ad'];
      const jx = 42 + j * 14, jy = 24 + row * 20;
      rRect(jx, jy + 8, 10, 9, colors[(j + row * 3) % 6]);
      rRect(jx + 2, jy + 5, 6, 3, '#8a7a5a');
    }
  }
  rText('R · C · L · D — ПО СОРТАМ', 104, 78, 8, '#c9a468', 'center');

  // ---- Справа: лабораторный блок питания ----
  rBox(820, 16, 168, 56, 8, '#2e2519', '#150f0a');
  rRect(826, 21, 156, 38, '#100c08');
  rText('13.8 В · 5 А', 904, 40, 15, '#f5a623', 'center');
  rText('BP-31 · СТАБИЛИЗИРОВАН', 904, 56, 8, '#a3873f', 'center');
  rGlow(904, 38, 74, '#f5a6231c');
  for (let i = 0; i < 5; i++) rRect(838 + i * 8, 46, 4, 8, i < 3 ? '#f5a623' : '#6b5423');
}

function drawReuProps(now){
  // Тёплые световые пятна
  rGlow(180, 150, 210, '#f5a62314');
  rGlow(506, 150, 230, '#f5a62316');
  rGlow(860, 150, 210, '#f5a62314');
  rGlow(506, 440, 250, '#f5a6230c');

  const ty = 2 * 44;

  // ---- Стеллаж с монтажными коробами слева (x 2..7) ----
  for (let i = 0; i < 3; i++){
    const cx = 2 * 44 + 8 + i * 88;
    rRect(cx + 4, ty + 64, 80, 10, '#05070c99');
    rBox(cx, ty - 4, 80, 54, 24, '#4a4136', '#221c14');
    rRect(cx + 6, ty + 2, 68, 40, '#120d08');
    for (let s = 0; s < 3; s++){
      rRect(cx + 10, ty + 6 + s * 13, 60, 10, '#2b2318');
      rRect(cx + 14, ty + 9 + s * 13, 12, 4, ['#f5a623', '#e0d5b8', '#d98a3a'][s]);
      for (let m = 0; m < 4; m++) rRect(cx + 32 + m * 10, ty + 8 + s * 13, 7, 6, '#1a130c');
      rRect(cx + 64, ty + 8 + s * 13, 4, 4, '#f5a623');
    }
    rGlow(cx + 40, ty + 20, 40, '#f5a62314');
  }

  // ---- Банки компонентов по центру (x 9..13) ----
  const jx = 9 * 44;
  rRect(jx + 10, ty + 70, 200, 12, '#05070c99');
  rBox(jx + 12, ty + 20, 196, 46, 24, '#544636', '#2a2218');
  rRect(jx + 20, ty + 26, 180, 38, '#120d08');
  for (let row = 0; row < 4; row++){
    for (let c = 0; c < 6; c++){
      const colors = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2b7fc4', '#8e44ad'];
      rRect(jx + 26 + c * 29, ty + 30 + row * 9, 25, 7, '#120d08');
      rRect(jx + 26 + c * 29, ty + 30 + row * 9, 25, 3, colors[(row + c) % 6]);
    }
  }
  rText('КОМПОНЕНТЫ R / C / L / D', jx + 110, ty + 16, 9, '#e8cf9a', 'center');
  rGlow(jx + 110, ty + 46, 90, '#f5a62314');

  // ---- Инструментальная стойка справа (x 16..20) ----
  const sx = 16 * 44;
  rRect(sx + 16, ty + 62, 152, 12, '#05070c99');
  rBox(sx + 16, ty, 148, 56, 24, '#463b2e', '#221c14');
  rRect(sx + 24, ty + 6, 132, 44, '#120d08');
  for (let r = 0; r < 4; r++){
    rRect(sx + 30, ty + 10 + r * 11, 120, 8, '#26201a');
    rRect(sx + 34, ty + 12 + r * 11, 40 + r * 12, 3, ['#f5a623', '#e0d5b8', '#d98a3a', '#8a5a2b'][r]);
    rRect(sx + 130, ty + 12 + r * 11, 4, 4, r % 2 ? '#f5a623' : '#4a3c2c');
  }
  for (let k = 0; k < 6; k++) rRect(sx + 36 + k * 17, ty + 46, 11, 2, '#0e0a07');
  rGlow(sx + 90, ty + 30, 60, '#f5a62314');

  // ---- Рабочие столы за станками (y = 5 и y = 9) ----
  const benches = [[4, 5], [15, 5], [4, 9], [15, 9]];
  benches.forEach((b, i) => {
    const px = b[0] * 44, py = b[1] * 44;
    rRect(px - 4, py + 50, 136, 8, '#05070c99');
    rBox(px - 6, py + 12, 140, 24, 16, '#a3876a', '#3f3327');
    // Антистатический коврик с клеммами
    rRect(px + 4, py + 15, 120, 18, '#0e5b48');
    rRect(px + 4, py + 15, 120, 2, '#1c8a67');
    for (let d = 0; d < 6; d++) rRect(px + 12 + d * 19, py + 28, 3, 3, '#0a3f31');
    // Паяльная станция с жалом
    rRect(px + 14, py + 13, 28, 9, '#2b2318');
    rRect(px + 18, py + 15, 20, 2, '#f5a623');
    rRect(px + 44, py + 14, 10, 3, '#c7ccd6');
    rRect(px + 52, py + 14, 6, 2, '#c0392b');
    // Мини-осциллограф с живой развёрткой
    rRect(px + 88, py + 12, 34, 13, '#221c14');
    rRect(px + 92, py + 14, 26, 9, '#04120f');
    rDrawScope(ctx, px + 92, py + 14, 26, 9, (i % 2) ? 'square' : 'sine', (now / 700 + i) % 1, '#f5c069');
    if (i % 2 === 0) rText('ESD', px + 8, py + 40, 8, '#8a7a5a');
    rGlow(px + 100, py + 20, 42, '#f5a62312');
  });

  // ---- Катушки припоя по углам ----
  [[1, 12], [20, 12]].forEach((c, i) => {
    const dx = c[0] * 44 + 44, dy = c[1] * 44 + 22;
    rRect(dx - 20, dy + 16, 40, 6, '#05070c99');
    ctx.beginPath(); ctx.arc(dx, dy, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#3a3226'; ctx.fill();
    ctx.strokeStyle = '#f5a623'; ctx.lineWidth = 2; ctx.stroke();
    for (let k = 0; k < 3; k++){
      ctx.beginPath(); ctx.arc(dx, dy, 11 - k * 3, 0, Math.PI * 2);
      ctx.strokeStyle = k % 2 ? '#c9b88a' : '#f5a623'; ctx.lineWidth = 1; ctx.stroke();
    }
    rText(i ? 'Sn' : 'Pb', dx, dy + 4, 9, '#e8dcc0', 'center');
  });

  // ---- Разметка на полу ----
  rText('РАДИОМОНТАЖ · ТОЧНОСТЬ И АККУРАТНОСТЬ', 506, 540, 13, '#4a3c2c', 'center');
  rText('ПАЙКА БЕЗ СПЕШКИ', 506, 562, 10, '#5c4a30', 'center');
}

/* ------------------------------------------------------------------
   ОТРИСОВКА СТАНКА РЭУ
   ------------------------------------------------------------------ */
function drawReuStation(type, done, hard, now, seed){
  const accent = done ? '#4fd69f' : (hard ? '#f0b46a' : '#e8a24e');
  rGlow(0, -6, 78, done ? '#48d8a41f' : '#e8a24e22');

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
      ctx.strokeStyle = '#f5b95a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-30 + i * 30, 12); ctx.lineTo(-30 + i * 30, 5); ctx.strokeStyle = '#c7ccd6'; ctx.stroke();
    }
    rRect(-52, -36, 104, 2, accent);
  } else {
    // 3D-стенд сборки: проектор и голографический модуль
    rRect(-58, 44, 120, 14, '#070a11a0');
    rBox(-46, 44, 92, 12, 12, '#232b38', '#12171f');
    rGlow(0, -24, 58, '#e8a24e2e');
    rBox(-32, 8, 64, 32, 10, '#3c4658', '#1b222d');
    rRect(-26, 14, 52, 4, '#071410');
    rText('3D-МОНТАЖ', 0, 30, 9, '#e8a24e', 'center');
    rRect(-30, 20, 3, 3, '#f5b95a'); rRect(27, 20, 3, 3, '#e8a24e');
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
    quad([top[0], top[1], bot[1], bot[0]], '#e8a24e26', '#e8a24ecc');
    quad([top[1], top[2], bot[2], bot[1]], '#f5b95a1a', '#e8a24e99');
    quad(top, '#f0cf9a33', '#f0cf9a');
    rRect(-7, -24 - s * 0.5 + 3, 6, 6, '#f5b95a');
    rRect(3, -24 - s * 0.5 + 8, 6, 6, '#e8a24e');
    rRect(-46, 42, 92, 2, accent);
  }
}

window.STATION_RENDERERS = window.STATION_RENDERERS || {};
window.STATION_RENDERERS.reu = drawReuStation;

/* ------------------------------------------------------------------
   МИНИ-ИГРЫ РЭУ — красивые задания-карточки с интерактивными схемами
   (движок task-game.js: точки-пропуски прямо на картинке)
   ------------------------------------------------------------------ */

/* SVG-волна: период занимает ровно freqCells клеточек, в кадре 2 периода */
function rWaveSvg(type, freqCells, ampCells, color){
  const ch = 18, cv = 11;
  const periods = 2, waveW = periods * freqCells * ch;
  const W = waveW + 2 * ch, H = 100, mid = 50;
  const pts = [];
  const N = 240;
  for (let i = 0; i <= N; i++){
    const t = i / N;
    let v;
    if (type === 'square') v = Math.sin(t * periods * Math.PI * 2) >= 0 ? 1 : -1;
    else if (type === 'saw'){ const fr = (t * periods) % 1; v = 2 * fr - 1; }
    else v = Math.sin(t * periods * Math.PI * 2);
    const x = ch + t * waveW;
    const y = mid - v * ampCells * cv;
    pts.push((i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1));
  }
  let grid = '';
  for (let i = 0; i <= waveW / ch; i++) grid += '<line x1="' + (ch + i * ch) + '" y1="4" x2="' + (ch + i * ch) + '" y2="' + (H - 4) + '" stroke="#1b3b34"/>';
  for (let j = -4; j <= 4; j++){
    const gy = mid + j * cv;
    if (gy < 4 || gy > H - 4) continue;
    grid += '<line x1="' + ch + '" y1="' + gy + '" x2="' + (W - ch) + '" y2="' + gy + '" stroke="' + (j === 0 ? '#2a5f52' : '#1b3b34') + '"/>';
  }
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + Math.min(W * 2.2, 340) + '" height="' + Math.round(Math.min(W * 2.2, 340) * H / W) + '">' +
    '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#04120f"/>' + grid +
    '<path d="' + pts.join(' ') + '" fill="none" stroke="' + (color || '#f5b95a') + '" stroke-width="2.5"/>' +
  '</svg>';
}
function rWaveChip(type, freqCells, ampCells){
  const ch = 9, cv = 5;
  const periods = 2, waveW = periods * freqCells * ch;
  const W = waveW + 2 * ch, H = 26, mid = 13;
  const pts = [];
  const N = 120;
  for (let i = 0; i <= N; i++){
    const t = i / N;
    let v;
    if (type === 'square') v = Math.sin(t * periods * Math.PI * 2) >= 0 ? 1 : -1;
    else if (type === 'saw'){ const fr = (t * periods) % 1; v = 2 * fr - 1; }
    else v = Math.sin(t * periods * Math.PI * 2);
    const x = ch + t * waveW;
    const y = mid - v * ampCells * cv;
    pts.push((i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1));
  }
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + H + '" rx="4" fill="#04120f"/><line x1="0" y1="' + mid + '" x2="' + W + '" y2="' + mid + '" stroke="#1c5c4c"/><path d="' + pts.join(' ') + '" fill="none" stroke="#f5b95a" stroke-width="2"/></svg>';
}

/* Осциллограмма с выносками измерений: амплитуда ? и период ? */
function rWaveMeasured(freqCells, ampCells){
  const base = rWaveSvg('sine', freqCells, ampCells);
  // выноски поверх: скобка амплитуды слева и скобка периода сверху
  const ampH = ampCells * 11;
  const perW = freqCells * 18;
  return base.replace('<path',
    '<path d="M10 ' + (50 - ampH) + ' h-6 M10 50 h-10 M10 ' + (50 + ampH) + ' h-6 M6 ' + (50 - ampH) + ' v' + (ampH * 2) + '" stroke="#8ea3b8" stroke-width="1.5" fill="none"/>' +
    '<text x="2" y="49" fill="#cfe0f2" font-size="9" font-family="monospace">A?</text>' +
    '<path d="M' + (18 + perW) + ' 6 v-5 M18 6 v-5 M18 3 h' + perW + '" stroke="#8ea3b8" stroke-width="1.5" fill="none"/>' +
    '<text x="' + (18 + perW / 2 - 8) + '" y="10" fill="#cfe0f2" font-size="9" font-family="monospace">T?</text><path');
}

/* Резистор с полосами: собранные полосы закрашиваются вживую */
function rResistorLive(bands){
  const colorHex = { '0': '#1c1c1c', '1': '#6b4423', '2': '#c0392b', '3': '#e67e22', '4': '#f1c40f', '5': '#27ae60', '6': '#2b7fc4', '7': '#8e44ad', x100: '#c0392b', x1000: '#e67e22', x10: '#6b4423' };
  const bandX = [148, 170, 192];
  const bandRects = bandX.map((x, i) => {
    const b = bands[i];
    return '<rect x="' + x + '" y="32" width="11" height="46" rx="2" fill="' + (b ? (colorHex[b] || '#3a3a3a') : '#3a3a3a') + '"' + (b ? '' : ' stroke="#7d92ae" stroke-dasharray="4 3"') + '/>';
  }).join('');
  return '<svg viewBox="0 0 340 110" width="340">' +
    '<line x1="16" y1="55" x2="86" y2="55" stroke="#c9ced8" stroke-width="5"/>' +
    '<line x1="254" y1="55" x2="324" y2="55" stroke="#c9ced8" stroke-width="5"/>' +
    '<rect x="86" y="32" width="168" height="46" rx="21" fill="#e8d6a8" stroke="#b39c60" stroke-width="2"/>' +
    bandRects +
    '<text x="170" y="100" fill="#7f93ad" font-size="10" text-anchor="middle" font-family="monospace">1-я · 2-я · МНОЖИТЕЛЬ</text>' +
  '</svg>';
}
function rBandChipSvg(hex){
  return '<svg viewBox="0 0 52 24" width="44" height="20"><rect x="0" y="2" width="52" height="20" rx="4" fill="' + hex + '"/></svg>';
}

/* Печатная плата с 4 посадочными местами */
function rSvgBoard(){
  return '<svg viewBox="0 0 340 170" width="340">' +
    '<rect x="14" y="14" width="312" height="142" rx="10" fill="#0d3a22" stroke="#1c8a67" stroke-width="2"/>' +
    // дорожки
    '<path d="M30 30 H140 M30 45 H200 M310 30 H240 M310 140 H120 M40 140 H90" stroke="#2f8a5b" stroke-width="2" fill="none"/>' +
    '<circle cx="30" cy="30" r="3" fill="#f5b95a"/><circle cx="310" cy="140" r="3" fill="#f5b95a"/>' +
    // посадочные места
    [64, 138, 212, 286].map((px, i) =>
      '<rect x="' + (px - 28) + '" y="58" width="56" height="52" rx="6" fill="#0a2b18" stroke="#48b98c" stroke-dasharray="5 3"/>' +
      '<text x="' + px + '" y="80" fill="#8fd8b8" font-size="13" text-anchor="middle" font-family="monospace">' + ['R1', 'C1', 'D1', 'U1'][i] + '</text>' +
      '<text x="' + px + '" y="97" fill="#5f9f7f" font-size="8" text-anchor="middle" font-family="monospace">' + ['ток', 'пульсации', 'обратный ток', 'программа'][i] + '</text>'
    ).join('') +
    '<text x="170" y="150" fill="#7fbf9a" font-size="10" text-anchor="middle" font-family="monospace">ПЕЧАТНАЯ ПЛАТА · ПОСАДОЧНЫЕ МЕСТА</text>' +
  '</svg>';
}

/* Модуль: 4 отсека-функции на корпусе */
function rSvgModule(){
  return '<svg viewBox="0 0 300 190" width="300">' +
    '<rect x="30" y="12" width="240" height="166" rx="10" fill="#182234" stroke="#3c4c6c" stroke-width="2"/>' +
    '<rect x="30" y="12" width="240" height="166" rx="10" fill="none" stroke="#f5b95a33"/>' +
    [ ['ОГРАНИЧЕНИЕ ТОКА', 42, 24], ['ПИТАНИЕ', 154, 24], ['ЗАЩИТА', 42, 98], ['УПРАВЛЕНИЕ', 154, 98] ].map((c, i) =>
      '<rect x="' + c[1] + '" y="' + c[2] + '" width="104" height="66" rx="7" fill="#1b2a3c" stroke="#48587a" stroke-dasharray="4 3"/>' +
      '<text x="' + (c[1] + 52) + '" y="' + (c[2] + 32) + '" fill="#c9b88a" font-size="9" text-anchor="middle" font-family="monospace">' + c[0] + '</text>' +
      '<text x="' + (c[1] + 52) + '" y="' + (c[2] + 48) + '" fill="#5f7f9a" font-size="8" text-anchor="middle" font-family="monospace">ОТСЕК ' + (i + 1) + '</text>'
    ).join('') +
    '<circle cx="150" cy="90" r="10" fill="#0d1420" stroke="#f5b95a"/>' +
  '</svg>';
}

/* ---- Игра 1. Сборка печатного модуля ---- */
function openReuBoard(done, cancel){
  return window.openTaskGame({
    theme: 'reu',
    icon: '🧩',
    title: 'Сборка печатного модуля',
    intro: 'Нажмите посадочное место на плате и поставьте туда компонент.',
    memo: [
      ['R — резистор', 'Ограничивает ток. На плате R1, R2…'],
      ['C — конденсатор', 'Сглаживает пульсации питания. C1, C2…'],
      ['D — диод', 'Ток только в одну сторону — защита. D1…'],
      ['U — микросхема', '«Мозг» устройства. U1…']
    ],
    steps: [
      {
        title: 'Этап · Смонтируйте всю плату',
        task: 'Нажмите площадку на плате, затем фишку компонента. Первая буква обозначения — тип детали.',
        art: rSvgBoard(),
        hotspots: [ { x: 18.8, y: 49 }, { x: 40.6, y: 49 }, { x: 62.4, y: 49 }, { x: 84.1, y: 49 } ],
        slots: [
          { label: 'R1 · ограничивает ток', answer: 'Резистор' },
          { label: 'C1 · сглаживает пульсации', answer: 'Конденсатор' },
          { label: 'D1 · защита от обратного тока', answer: 'Диод' },
          { label: 'U1 · управляющая программа', answer: 'Микросхема' }
        ],
        chips: [ { label: 'Резистор' }, { label: 'Конденсатор' }, { label: 'Диод' }, { label: 'Микросхема' } ],
        chipsLabel: 'Компоненты',
        hint: 'R = резистор, C = конденсатор, D = диод, U = микросхема.',
        success: 'Плата собрана!'
      }
    ],
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 2. Маркировка резистора ---- */
function openReuResistor(done, cancel){
  const colorHex = { '0': '#1c1c1c', '1': '#6b4423', '2': '#c0392b', '3': '#e67e22', '4': '#f1c40f', '5': '#27ae60', '6': '#2b7fc4', '7': '#8e44ad' };
  const colorName = { '0': 'чёрный', '1': 'коричневый', '2': 'красный', '3': 'оранжевый', '4': 'жёлтый', '5': 'зелёный', '6': 'синий', '7': 'фиолетовый' };
  const targets = [
    { label: '2,2 кОм', digits: ['2', '2'], mult: '×100' },
    { label: '1 кОм',   digits: ['1', '0'], mult: '×100' },
    { label: '4,7 кОм', digits: ['4', '7'], mult: '×100' },
    { label: '10 кОм',  digits: ['1', '0'], mult: '×1000' }
  ];
  const target = targets[Math.floor(Math.random() * targets.length)];
  const digitOf = (label) => label ? label[0] : null;
  const digitChips = ['0', '1', '2', '4', '7'].map((d) => ({
    label: d + ' — ' + colorName[d], svg: rBandChipSvg(colorHex[d])
  }));
  const multChips = [
    { label: '×10', sub: 'один ноль', svg: rBandChipSvg('#6b4423') },
    { label: '×100', sub: 'два нуля', svg: rBandChipSvg('#c0392b') },
    { label: '×1000', sub: 'три нуля', svg: rBandChipSvg('#e67e22') }
  ];
  const hsX = [43.5, 50, 56.5];
  return window.openTaskGame({
    theme: 'reu',
    icon: '🌈',
    title: 'Маркировка резистора',
    intro: 'Соберите резистор ' + target.label + ' — прямо на его теле: две цифры и множитель.',
    memo: [
      ['Правило чтения', 'Номинал = цифра · цифра · множитель. 2, 2, ×100 = 2200 Ом = 2,2 кОм.'],
      ['Множитель', 'Третья полоса — сколько нулей дописать: ×100 — два нуля, ×1000 — три нуля.'],
      ['Ом → кОм', '1000 Ом = 1 кОм. 2200 Ом = 2,2 кОм.']
    ],
    steps: [
      {
        title: 'Этап 1 · Первая цифра (' + target.digits[0] + ')',
        task: 'Номинал ' + target.label + ' начинается с цифры ' + target.digits[0] + '. Нажмите 1-ю полосу на резисторе.',
        art: (vals) => rResistorLive([digitOf(vals[0]), null, null]),
        hotspots: [ { x: hsX[0], y: 52 } ],
        slots: [{ label: '1-я полоса — цифра ' + target.digits[0], answer: target.digits[0] + ' — ' + colorName[target.digits[0]] }],
        chips: digitChips,
        chipsLabel: 'Цвета полос (цифра подписана)',
        hint: 'Первая цифра ' + target.label + ' — это ' + target.digits[0] + '.',
        success: 'Первая полоса стоит на месте!'
      },
      {
        title: 'Этап 2 · Вторая цифра (' + target.digits[1] + ')',
        task: 'Вторая цифра номинала — ' + target.digits[1] + '. Нажмите 2-ю полосу.',
        art: (vals) => rResistorLive([target.digits[0], digitOf(vals[0]), null]),
        hotspots: [ { x: hsX[1], y: 52 } ],
        slots: [{ label: '2-я полоса — цифра ' + target.digits[1], answer: target.digits[1] + ' — ' + colorName[target.digits[1]] }],
        chips: digitChips,
        chipsLabel: 'Цвета полос (цифра подписана)',
        hint: 'Число на табло: ' + target.digits[0] + target.digits[1] + '. Вторая цифра — ' + target.digits[1] + '.',
        success: 'Обе цифры на месте!'
      },
      {
        title: 'Этап 3 · Множитель',
        task: 'Допишите нули: ' + target.digits[0] + ' · ' + target.digits[1] + ' · ? = ' + target.label + '. Нажмите 3-ю полосу.',
        art: (vals) => rResistorLive([target.digits[0], target.digits[1], vals[0]]),
        hotspots: [ { x: hsX[2], y: 52 } ],
        slots: [{ label: '3-я полоса — множитель', answer: target.mult }],
        chips: multChips,
        chipsLabel: 'Множители',
        hint: target.digits[0] + ' · ' + target.digits[1] + ' = ' + Number(target.digits[0] + target.digits[1]) + '. Добавьте нулей до ' + target.label.replace(' кОм', '000 Ом') + '.',
        success: 'Готово: резистор ' + target.label + ' собран!'
      }
    ],
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 3. Осциллограф: форма сигнала ---- */
function openReuScope(done, cancel){
  const shapes = [
    { type: 'sine', label: 'Синусоида', title: 'Этап 1 · Плавные волны', hint: 'Круглые плавные горбы — синусоида.' },
    { type: 'square', label: 'Меандр', title: 'Этап 2 · Ступеньки', hint: 'Резкие прямоугольные ступеньки — меандр.' },
    { type: 'saw', label: 'Пила', title: 'Этап 3 · Зубья', hint: 'Медленный подъём и резкий спад — пила.' }
  ];
  return window.openTaskGame({
    theme: 'reu',
    icon: '📈',
    title: 'Определение формы сигнала',
    intro: 'Нажмите на подпись под экраном и выберите название формы.',
    memo: [
      ['Синусоида', 'Плавные волны, как на море. Генератор и усилитель.'],
      ['Меандр', 'Резкие ступеньки вверх-вниз. Цифровой сигнал и ШИМ.'],
      ['Пила', 'Зубья: подъём и резкий спад. Развёртка.']
    ],
    steps: shapes.map((s) => ({
      title: s.title,
      task: 'Как называется сигнал на экране? Нажмите точку под экраном и выберите фишку.',
      art: rWaveSvg(s.type, 2, 2.6),
      hotspots: [ { x: 50, y: 90 } ],
      slots: [{ label: 'Форма сигнала', answer: s.label }],
      chips: [
        { label: 'Синусоида', svg: rWaveChip('sine', 2, 3) },
        { label: 'Меандр', svg: rWaveChip('square', 2, 3) },
        { label: 'Пила', svg: rWaveChip('saw', 2, 3) }
      ],
      chipsLabel: 'Формы сигналов',
      hint: s.hint,
      success: 'Верно, это ' + s.label.toLowerCase() + '!'
    })),
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 4. Осциллограф: чтение сигнала ---- */
function openReuGenerator(done, cancel){
  const rnd = (n) => 1 + Math.floor(Math.random() * n);
  const amp1 = rnd(4), f1 = rnd(4);
  let amp2 = rnd(4), f2 = rnd(4);
  if (amp2 === amp1 && f2 === f1) f2 = (f2 % 4) + 1;
  const ampChips = [1, 2, 3, 4].map((n) => ({ label: n + ' В' }));
  const freqChips = [1, 2, 3, 4].map((n) => ({ label: n + ' кГц' }));
  return window.openTaskGame({
    theme: 'reu',
    icon: '🖥️',
    title: 'Чтение осциллограммы',
    intro: 'На экране скобки-выноски: A? — амплитуда (клетки вверх), T? — период (клетки ширины).',
    memo: [
      ['Амплитуда A?', 'Сколько клеточек от средней линии вверх до вершины — столько вольт.'],
      ['Период T?', 'Сколько клеточек занимает один полный период волны — столько килогерц.'],
      ['Пример', 'Вершина на 2 клетки, период 3 клетки → 2 В, 3 кГц.']
    ],
    steps: [
      {
        title: 'Этап 1 · Считаем клеточки',
        task: 'Нажмите выноску A? и введите амплитуду, затем T? и период.',
        art: rWaveMeasured(f1, amp1),
        hotspots: [ { x: 7, y: 42, hold: 'A?' }, { x: 46, y: 8, hold: 'T?' } ],
        slots: [
          { label: 'Амплитуда (клетки вверх = вольты)', answer: amp1 + ' В' },
          { label: 'Частота (клетки периода = кГц)', answer: f1 + ' кГц' }
        ],
        chips: ampChips.concat(freqChips),
        chipsLabel: 'Ответы',
        hint: 'Вершина выше средней линии на ' + amp1 + ' клет' + (amp1 === 1 ? 'ку' : 'ки') + ', период — ' + f1 + ' клет' + (f1 === 1 ? 'ка' : (f1 < 5 ? 'ки' : 'ок')) + '.',
        success: 'Верно: ' + amp1 + ' В и ' + f1 + ' кГц!'
      },
      {
        title: 'Этап 2 · Ещё сигнал',
        task: 'Новый сигнал на экране. Считайте клеточки по выноскам!',
        art: rWaveMeasured(f2, amp2),
        hotspots: [ { x: 7, y: 42, hold: 'A?' }, { x: 46, y: 8, hold: 'T?' } ],
        slots: [
          { label: 'Амплитуда', answer: amp2 + ' В' },
          { label: 'Частота', answer: f2 + ' кГц' }
        ],
        chips: ampChips.concat(freqChips),
        chipsLabel: 'Ответы',
        hint: 'Высота вершины — ' + amp2 + ' клет' + (amp2 === 1 ? 'ка' : (amp2 < 5 ? 'ки' : 'ок')) + ', период — ' + f2 + ' клет' + (f2 === 1 ? 'ка' : (f2 < 5 ? 'ки' : 'ок')) + '.',
        success: 'Всё верно — осциллограф освоен!'
      }
    ],
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 5. 3D-сборка электронного модуля ---- */
function openReu3D(done, cancel){
  return window.openTaskGame({
    theme: 'reu',
    icon: '🛰️',
    title: '3D-сборка электронного модуля',
    intro: 'Нажмите отсек на корпусе модуля и поставьте компонент, который выполняет его функцию.',
    memo: [
      ['Резистор', 'Ограничивает ток.'],
      ['Конденсатор', 'Сглаживает пульсации питания.'],
      ['Диод', 'Ток только в одну сторону — защита.'],
      ['Микроконтроллер', 'Исполняет программу — «мозг» модуля.']
    ],
    steps: [
      {
        title: 'Этап · Функции отсеков',
        task: 'Четыре отсека подписаны задачами. Поставьте в каждый нужный компонент.',
        art: rSvgModule(),
        hotspots: [
          { x: 31.3, y: 30 }, { x: 68.7, y: 30 }, { x: 31.3, y: 69 }, { x: 68.7, y: 69 }
        ],
        slots: [
          { label: 'Отсек «Ограничение тока»', answer: 'Резистор' },
          { label: 'Отсек «Питание»', answer: 'Конденсатор' },
          { label: 'Отсек «Защита»', answer: 'Диод' },
          { label: 'Отсек «Управление»', answer: 'Микроконтроллер' }
        ],
        chips: [
          { label: 'Резистор' }, { label: 'Конденсатор' }, { label: 'Диод' }, { label: 'Микроконтроллер' },
          { label: 'Транзистор', sub: 'лишний' }, { label: 'Катушка', sub: 'лишняя' }
        ],
        chipsLabel: 'Компоненты',
        hint: 'Ток — резистор, пульсации — конденсатор, обратный ток — диод, программа — микроконтроллер.',
        success: 'Модуль собран — можно подавать питание!'
      }
    ],
    onDone: done, onCancel: cancel
  });
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
