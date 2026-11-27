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
   МИНИ-ИГРЫ РЭУ — играбельные симуляторы (openPlayGame):
   монтаж платы с подачей питания, омметр-верстак, осциллограф
   с живой развёрткой и зондами, чтение сигнала, 3D-модуль.
   ------------------------------------------------------------------ */
const rPts = (mistakes) => Math.max(50, 200 - mistakes * 25);

/* ---- Игра 1. Монтаж печатной платы: поставь компоненты и включи ---- */
function openReuBoard(done, cancel){
  const comps = [
    { id: 'R1', name: 'Резистор', cls: 'mini-res', slot: 0, hint: 'ограничивает ток' },
    { id: 'C1', name: 'Конденсатор', cls: 'mini-cap', slot: 1, hint: 'сглаживает пульсации' },
    { id: 'D1', name: 'Диод', cls: 'mini-diod', slot: 2, hint: 'ток в одну сторону' },
    { id: 'U1', name: 'Микросхема', cls: 'mini-u', slot: 3, hint: 'программа устройства' }
  ];
  let mistakes = 0, placed = 0, sel = null;

  return window.openPlayGame({
    theme: 'reu',
    icon: '🧩',
    title: 'Монтаж печатной платы',
    intro: 'Поставь компоненты на посадочные места платы (R — резистор, C — конденсатор…) и подай питание!',
    memo: [
      ['R', 'Резистор — ограничивает ток.'],
      ['C', 'Конденсатор — сглаживает пульсации питания.'],
      ['D', 'Диод — пропускает ток только в одну сторону.'],
      ['U', 'Микросхема — «мозг», исполняет программу.']
    ],
    build(area, api){
      area.innerHTML =
        '<div class="tg-pcb-scene">' +
          '<div class="tg-pcb" id="pbBoard">' +
            '<div class="padslot">' +
              comps.map((c) => '<button type="button" class="tg-padslot" data-pad="' + c.id + '"><b>' + c.id + '</b><small>' + c.hint + '</small></button>').join('') +
            '</div>' +
            '<button type="button" class="tg-btn-big tg-btn-start power-sw" id="pbPower" hidden>⚡ ПОДАТЬ ПИТАНИЕ</button>' +
          '</div>' +
          '<div class="tg-e-tray" style="flex-direction:column">' +
            comps.map((c) => '<button type="button" class="tg-comp ' + c.cls + '" data-comp="' + c.id + '"><span class="mini"></span>' + c.id + ' · ' + c.name + '</button>').join('') +
          '</div>' +
        '</div>';
      const board = area.querySelector('#pbBoard');
      comps.forEach((c) => {
        const btn = area.querySelector('[data-comp="' + c.id + '"]');
        btn.onclick = () => {
          if (sel) area.querySelector('[data-comp="' + sel.id + '"]').classList.remove('sel');
          sel = c;
          btn.classList.add('sel');
          api.feedback('Взято: ' + c.id + ' · ' + c.name + '. Нажми площадку ' + c.id + ' на плате.');
        };
      });
      area.querySelectorAll('.tg-padslot').forEach((pad) => {
        pad.onclick = () => {
          const id = pad.dataset.pad;
          if (!sel){ api.feedback('Сначала возьми компонент справа.', 'bad'); return; }
          if (sel.id !== id){
            mistakes++;
            api.bad('Не та площадка: буква обозначения — тип детали. «' + id + '» — это ' + ({ R: 'резистор', C: 'конденсатор', D: 'диод', U: 'микросхема' })[id[0]] + '.');
            return;
          }
          pad.innerHTML = '<span class="comp-placed"><span class="mini ' + sel.cls + '"></span>✔ ' + sel.id + '</span>';
          pad.disabled = true;
          area.querySelector('[data-comp="' + sel.id + '"]').disabled = true;
          sel = null;
          placed++;
          api.setProgress(placed, 4);
          api.sfx('place');
          api.feedback('Припаяно ' + placed + ' из 4.');
          if (placed === 4){
            area.querySelector('#pbPower').hidden = false;
            api.feedback('Плата собрана! Подавай питание.');
          }
        };
      });
      area.querySelector('#pbPower').onclick = () => {
        board.classList.add('lit');
        api.sfx('power');
        api.ok('Плата под напряжением — устройство работает!');
        setTimeout(() => api.finish(rPts(mistakes)), 1100);
      };
    },
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 2. Омметр-верстак: собери резистор и измерь ---- */
function openReuResistor(done, cancel){
  const colorHex = { '0': '#1c1c1c', '1': '#6b4423', '2': '#c0392b', '3': '#e67e22', '4': '#f1c40f', '5': '#27ae60', '6': '#2b7fc4', '7': '#8e44ad', '8': '#95a5a6', '9': '#ecf0f1' };
  const colorName = { '0': 'чёрный', '1': 'коричневый', '2': 'красный', '3': 'оранжевый', '4': 'жёлтый', '5': 'зелёный', '6': 'синий', '7': 'фиолетовый', '8': 'серый', '9': 'белый' };
  const targets = [
    { om: 470, label: '470 Ом' }, { om: 1000, label: '1 кОм' }, { om: 2200, label: '2,2 кОм' },
    { om: 4700, label: '4,7 кОм' }, { om: 10000, label: '10 кОм' }, { om: 22000, label: '22 кОм' }
  ];
  const target = targets[Math.floor(Math.random() * targets.length)];
  const bands = [null, null, null];
  const bandPct = [43.5, 50, 56.5];

  function fmt(om){
    if (om >= 1000){
      const k = om / 1000;
      return (k % 1 ? k.toFixed(1).replace('.', ',') : String(k)) + ' кОм';
    }
    return om + ' Ом';
  }
  function value(){
    if (bands[0] == null || bands[1] == null || bands[2] == null) return null;
    return (Number(bands[0]) * 10 + Number(bands[1])) * Math.pow(10, Number(bands[2]));
  }
  // Подсказка-шпаргалка: какие три цвета нажать, чтобы получить цель.
  const hint = (() => {
    let d = target.om, m = 0;
    while (d > 99){ d /= 10; m++; }
    d = Math.round(d);
    return { tens: String(Math.floor(d / 10)), ones: String(d % 10), mult: String(m) };
  })();

  return window.openPlayGame({
    theme: 'reu',
    icon: '🌈',
    title: 'Резисторный верстак с омметром',
    intro: 'Собери резистор ' + target.label + ': нажми три цвета из подсказки — омметр сразу подтвердит.',
    memo: [
      ['Полосы', '1-я и 2-я — цифры числа, 3-я — сколько нулей дописать (множитель ×10ⁿ).'],
      ['Пример', 'красный-красный-красный: 2, 2, ×100 → 2200 Ом = 2,2 кОм.'],
      ['Омметр', 'Живой: меняешь полосу — значение пересчитывается. Собери ровно ' + target.label + '.']
    ],
    build(area, api){
      const bandBtns = bandPct.map((x, i) =>
        '<button type="button" class="tg-band" data-band="' + i + '" style="left:' + x + '%;top:52%" title="Полоса ' + (i + 1) + ' — нажми, чтобы снять"></button>'
      ).join('');
      const chip = (digit, extra) =>
        '<span><span class="sw" style="background:' + colorHex[digit] + '"></span>' + digit + ' · ' + colorName[digit] + (extra || '') + '</span>';
      area.innerHTML =
        '<div class="tg-bench">' +
          '<div class="tg-ohm-scr">' +
            '<div class="tg-ohm-val" id="ohVal">— · — · —</div>' +
            '<div class="tg-ohm-target">ЦЕЛЬ: ' + target.label + '</div>' +
          '</div>' +
          '<div class="tg-ohm-hint">Нажми по порядку: ' +
            chip(hint.tens) + ' <b>→</b> ' + chip(hint.ones) + ' <b>→</b> ' + chip(hint.mult, ' (множитель ×10' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(hint.mult)] + ')') +
          '</div>' +
          '<div class="tg-res-wrap"><span class="pic">' +
            '<svg viewBox="0 0 340 110" width="340">' +
              '<line x1="16" y1="55" x2="86" y2="55" stroke="#c9ced8" stroke-width="5"/>' +
              '<line x1="254" y1="55" x2="324" y2="55" stroke="#c9ced8" stroke-width="5"/>' +
              '<rect x="86" y="32" width="168" height="46" rx="21" fill="#e8d6a8" stroke="#b39c60" stroke-width="2"/>' +
            '</svg>' + bandBtns +
          '</span></div>' +
          '<div class="tg-rack">' +
            Object.keys(colorHex).map((d) =>
              '<button type="button" class="tg-colorbtn" data-digit="' + d + '"><span class="sw" style="background:' + colorHex[d] + '"></span><small>' + d + ' · ' + colorName[d] + '</small></button>'
            ).join('') +
          '</div>' +
        '</div>';
      const val = area.querySelector('#ohVal');

      function render(){
        bandBtns;
        area.querySelectorAll('.tg-band').forEach((b, i) => {
          b.style.background = bands[i] != null ? colorHex[bands[i]] : '#2a2f38';
          b.style.borderStyle = bands[i] != null ? 'solid' : 'dashed';
        });
        const v = value();
        if (v == null){
          val.textContent = '— · — · —';
          val.classList.remove('ok');
        } else {
          val.textContent = fmt(v);
          const match = v === target.om;
          val.classList.toggle('ok', match);
          if (match){
            api.ok('Точно! Омметр показывает ' + fmt(v) + ' — это ' + target.label + '.');
            setTimeout(() => api.finish(160), 1000);
          }
        }
      }
      area.querySelectorAll('.tg-colorbtn').forEach((btn) => {
        btn.onclick = () => {
          const idx = bands.findIndex((b) => b == null);
          if (idx === -1){ api.feedback('Все три полосы заняты — сними одну нажатием.', 'bad'); return; }
          bands[idx] = btn.dataset.digit;
          api.sfx('place');
          render();
        };
      });
      area.querySelectorAll('.tg-band').forEach((b, i) => {
        b.onclick = () => {
          if (bands[i] == null) return;
          bands[i] = null;
          api.sfx('click');
          render();
        };
      });
      render();
    },
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 3. Осциллограф с зондами: живая развёртка ---- */
function openReuScope(done, cancel){
  const points = [
    { id: 'gen', name: 'Генератор', shape: 'sin', hint: 'плавные волны' },
    { id: 'pwm', name: 'ШИМ-выход', shape: 'square', hint: 'ступеньки' },
    { id: 'sawp', name: 'Развёртка', shape: 'saw', hint: 'зубья пилы' },
    { id: 'vcc', name: 'Питание', shape: 'dc', hint: 'ровная линия' }
  ];
  const shapes = [
    { id: 'sin', label: 'Синусоида' }, { id: 'square', label: 'Меандр' },
    { id: 'saw', label: 'Пила' }, { id: 'dc', label: 'Постоянное' }
  ];
  let mistakes = 0, active = 0, phase = 0, raf = 0, solvedN = 0;
  const labeled = {};

  return window.openPlayGame({
    theme: 'reu',
    icon: '📈',
    title: 'Осциллограф: щупы и формы сигналов',
    intro: 'Тыкай щупом в точки схемы — экран покажет живой сигнал. Определи форму каждой точки.',
    memo: [
      ['Синусоида', 'Плавные волны.'],
      ['Меандр', 'Резкие ступеньки вверх-вниз.'],
      ['Пила', 'Подъём и резкий спад.'],
      ['Постоянное', 'Ровная линия — питание.']
    ],
    build(area, api){
      area.innerHTML =
        '<div class="tg-scope-scene">' +
          '<div class="tg-scope-frame"><canvas id="scCv" width="460" height="240"></canvas></div>' +
          '<div class="tg-probe-pads">' +
            points.map((p) => '<button type="button" class="tg-probe" data-point="' + p.id + '"><span class="led"></span>' + p.name + '</button>').join('') +
          '</div>' +
        '</div>' +
        '<div class="tg-shapes">' +
          shapes.map((s) => '<button type="button" class="tg-shapebtn" data-shape="' + s.id + '">' + s.label + '</button>').join('') +
        '</div>';
      const cv = area.querySelector('#scCv');
      const pads = area.querySelectorAll('.tg-probe');
      const SH = shapes.find((s) => s.id === 'sin'); void SH;

      function setActive(i){
        active = i;
        pads.forEach((b, j) => b.classList.toggle('probed', j === i));
        const p = points[i];
        api.feedback(labeled[p.id] ? '«' + p.name + '» уже определена.' : 'Щуп на «' + p.name + '». Какая это форма?');
      }
      pads.forEach((b, j) => { b.onclick = () => setActive(j); });
      setActive(0);

      function draw(){
        const g = cv.getContext('2d');
        const W = cv.width, H = cv.height, pad = 14;
        g.fillStyle = '#04120f';
        g.fillRect(0, 0, W, H);
        g.strokeStyle = '#123f36';
        for (let i = 1; i < 10; i++){
          const x = pad + ((W - 2 * pad) / 10) * i;
          g.beginPath(); g.moveTo(x, pad); g.lineTo(x, H - pad); g.stroke();
        }
        for (let j = 1; j < 5; j++){
          const y = pad + ((H - 2 * pad) / 5) * j;
          g.beginPath(); g.moveTo(pad, y); g.lineTo(W - pad, y); g.stroke();
        }
        const mid = H / 2;
        g.strokeStyle = '#2a5f52';
        g.beginPath(); g.moveTo(pad, mid); g.lineTo(W - pad, mid); g.stroke();
        const p = points[active];
        const col = labeled[p.id] ? '#4fd69f' : '#f5b95a';
        g.strokeStyle = col;
        g.lineWidth = 2.5;
        g.shadowColor = col;
        g.shadowBlur = 10;
        g.beginPath();
        const N = 160, amp = (H - 2 * pad) * 0.32;
        for (let i = 0; i <= N; i++){
          const t = i / N;
          let v;
          const ph = t * 3 + phase;
          if (p.shape === 'square') v = Math.sin(ph * Math.PI * 2) >= 0 ? 1 : -1;
          else if (p.shape === 'saw'){ const fr = ph % 1; v = 2 * fr - 1; }
          else if (p.shape === 'dc') v = 0.42;
          else v = Math.sin(ph * Math.PI * 2);
          const x = pad + t * (W - 2 * pad);
          const y = mid - v * amp;
          if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
        g.shadowBlur = 0;
        g.fillStyle = '#7fbf9a';
        g.font = 'bold 12px monospace';
        g.fillText('ЩУП: ' + p.name.toUpperCase(), pad + 6, pad + 14);
      }
      function loop(){
        if (api.isClosed()) return;
        phase = (phase + 0.012) % 1;
        draw();
        raf = requestAnimationFrame(loop);
      }
      loop();
      api.onClose(() => { if (raf) cancelAnimationFrame(raf); });

      area.querySelectorAll('.tg-shapebtn').forEach((btn) => {
        btn.onclick = () => {
          const p = points[active];
          if (labeled[p.id]){ api.feedback('Эта точка уже определена. Выбери другую.'); return; }
          if (btn.dataset.shape === p.shape){
            labeled[p.id] = true;
            solvedN++;
            pads[active].classList.add('done');
            pads[active].querySelector('.led');
            api.setProgress(solvedN, points.length);
            api.ok('Верно: «' + p.name + '» — ' + btn.textContent + '!');
            if (solvedN === points.length){
              setTimeout(() => api.finish(rPts(mistakes)), 1000);
            } else {
              const next = points.findIndex((x) => !labeled[x.id]);
              setTimeout(() => setActive(next), 700);
            }
          } else {
            mistakes++;
            btn.classList.add('wrong');
            setTimeout(() => btn.classList.remove('wrong'), 450);
            api.bad('Неверно: «' + p.name + '» — не ' + btn.textContent.toLowerCase() + '. Посмотри на экран: ' + p.hint + '.');
          }
        };
      });
    },
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 4. Чтение осциллограммы: живой сигнал ---- */
function openReuGenerator(done, cancel){
  const rnd = (n) => 1 + Math.floor(Math.random() * n);
  const rounds = [];
  for (let i = 0; i < 3; i++){
    let amp = rnd(4), freq = rnd(4);
    if (i === 1 && amp === rounds[0].amp && freq === rounds[0].freq) freq = (freq % 4) + 1;
    rounds.push({ amp, freq });
  }
  const amps = [1, 2, 3, 4], freqs = [1, 2, 3, 4];
  let round = 0, mistakes = 0, phase = 0, raf = 0;
  let guess = { amp: null, freq: null };

  return window.openPlayGame({
    theme: 'reu',
    icon: '🖥️',
    title: 'Чтение осциллограммы',
    intro: 'Сигнал бежит по экрану. Считай клеточки: вверх — амплитуда (В), один период — частота (кГц).',
    memo: [
      ['Амплитуда', 'Клеточки от средней линии вверх до вершины — вольты.'],
      ['Частота', 'Клеточки одного периода (от горба до горба) — килогерцы.'],
      ['Пример', 'Вершина 2 клетки, период 3 клетки → 2 В, 3 кГц.']
    ],
    build(area, api){
      area.innerHTML =
        '<div class="tg-scope-scene">' +
          '<div class="tg-scope-frame"><canvas id="gnCv" width="500" height="260"></canvas></div>' +
          '<div>' +
            '<p class="tg-progress" style="position:static" id="gnTask"></p>' +
            '<div class="tg-shapes">' +
              amps.map((a) => '<button type="button" class="tg-shapebtn" data-amp="' + a + '">' + a + ' В</button>').join('') +
            '</div>' +
            '<div class="tg-shapes" style="margin-top:9px">' +
              freqs.map((f) => '<button type="button" class="tg-shapebtn" data-freq="' + f + '">' + f + ' кГц</button>').join('') +
            '</div>' +
            '<button type="button" class="tg-btn-big tg-btn-start" id="gnCheck" style="width:100%;margin-top:10px">✓ ПРОВЕРИТЬ</button>' +
          '</div>' +
        '</div>';
      const cv = area.querySelector('#gnCv');
      const task = area.querySelector('#gnTask');

      function pickRound(){
        guess = { amp: null, freq: null };
        api.setProgress(round, rounds.length);
        task.textContent = 'Сигнал ' + (round + 1) + ' из ' + rounds.length + ' — сколько клеток в высоту и в ширину?';
        api.feedback('Считай клетки на живом сигнале и жми кнопки.');
      }
      pickRound();

      function draw(){
        const r = rounds[round];
        if (!r) return; // игра завершена — рисовать нечего
        const g = cv.getContext('2d');
        const W = cv.width, H = cv.height, pad = 20;
        const DIV_X = 12, DIV_Y = 8;
        g.fillStyle = '#04120f';
        g.fillRect(0, 0, W, H);
        g.strokeStyle = '#123f36';
        for (let i = 0; i <= DIV_X; i++){
          const x = pad + ((W - 2 * pad) / DIV_X) * i;
          g.beginPath(); g.moveTo(x, pad); g.lineTo(x, H - pad); g.stroke();
        }
        for (let j = 0; j <= DIV_Y; j++){
          const y = pad + ((H - 2 * pad) / DIV_Y) * j;
          g.beginPath(); g.moveTo(pad, y); g.lineTo(W - pad, y); g.stroke();
        }
        const mid = H / 2, cellY = (H - 2 * pad) / DIV_Y, cellX = (W - 2 * pad) / DIV_X;
        g.strokeStyle = '#2a5f52';
        g.beginPath(); g.moveTo(pad, mid); g.lineTo(W - pad, mid); g.stroke();
        const cycles = DIV_X / r.freq;
        const col = '#f5b95a';
        g.strokeStyle = col; g.lineWidth = 2.5; g.shadowColor = col; g.shadowBlur = 10;
        g.beginPath();
        const N = 200;
        for (let i = 0; i <= N; i++){
          const t = i / N;
          const v = Math.sin((t * cycles + phase) * Math.PI * 2);
          const x = pad + t * (W - 2 * pad);
          const y = mid - v * r.amp * cellY;
          if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
        g.shadowBlur = 0;
        g.fillStyle = '#c9b88a';
        g.font = 'bold 12px monospace';
        g.fillText('1 клетка = 1 В · 1 клетка = 1 кГц', pad + 6, pad + 16);
      }
      function loop(){
        if (api.isClosed()) return;
        phase = (phase + 0.01) % 1;
        draw();
        raf = requestAnimationFrame(loop);
      }
      loop();
      api.onClose(() => { if (raf) cancelAnimationFrame(raf); });

      function syncBtns(){
        area.querySelectorAll('[data-amp]').forEach((b) => {
          b.style.borderColor = guess.amp === Number(b.dataset.amp) ? 'var(--tg-accent)' : '';
          b.style.background = guess.amp === Number(b.dataset.amp) ? 'color-mix(in srgb, var(--tg-accent) 18%, #10151e)' : '';
        });
        area.querySelectorAll('[data-freq]').forEach((b) => {
          b.style.borderColor = guess.freq === Number(b.dataset.freq) ? 'var(--tg-accent)' : '';
          b.style.background = guess.freq === Number(b.dataset.freq) ? 'color-mix(in srgb, var(--tg-accent) 18%, #10151e)' : '';
        });
      }
      area.querySelectorAll('[data-amp]').forEach((b) => {
        b.onclick = () => { guess.amp = Number(b.dataset.amp); syncBtns(); api.feedback('Амплитуда: ' + b.dataset.amp + ' В. Теперь частота.'); };
      });
      area.querySelectorAll('[data-freq]').forEach((b) => {
        b.onclick = () => { guess.freq = Number(b.dataset.freq); syncBtns(); api.feedback('Частота: ' + b.dataset.freq + ' кГц. Жми «Проверить».'); };
      });
      area.querySelector('#gnCheck').onclick = () => {
        const r = rounds[round];
        if (guess.amp == null || guess.freq == null){
          api.bad('Выбери и амплитуду, и частоту.');
          return;
        }
        if (guess.amp === r.amp && guess.freq === r.freq){
          round++;
          api.ok('Верно: ' + r.amp + ' В и ' + r.freq + ' кГц!');
          if (round >= rounds.length){
            setTimeout(() => api.finish(rPts(mistakes)), 1000);
          } else {
            setTimeout(() => { syncBtns(); pickRound(); }, 700);
          }
        } else {
          mistakes++;
          api.bad('Не сходится. Считай только клетки: вверх от средней линии — амплитуда, от горба до горба — период.');
        }
      };
    },
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 5. 3D-сборка электронного модуля ---- */
function openReu3D(done, cancel){
  const parts = [
    { id: 'R1', name: 'Резистор', face: 0 },
    { id: 'C1', name: 'Конденсатор', face: 1 },
    { id: 'D1', name: 'Диод', face: 2 },
    { id: 'U1', name: 'Микроконтроллер', face: 3 }
  ];
  const faces = [
    { title: 'ОГРАНИЧЕНИЕ ТОКА', task: 'Не даёт току превысить безопасный уровень' },
    { title: 'ПИТАНИЕ', task: 'Сглаживает пульсации напряжения' },
    { title: 'ЗАЩИТА', task: 'Не пускает ток в обратном направлении' },
    { title: 'УПРАВЛЕНИЕ', task: 'Исполняет программу устройства' }
  ];
  let mistakes = 0, placed = 0, sel = null, angle = 0;

  return window.openPlayGame({
    theme: 'reu',
    icon: '🛰️',
    title: '3D-сборка электронного модуля',
    intro: 'Вращай модуль кнопками ◀ ▶, читай функции на гранях и ставь компоненты в отсеки.',
    memo: [
      ['Резистор', 'Ограничивает ток.'],
      ['Конденсатор', 'Сглаживает пульсации питания.'],
      ['Диод', 'Защита от обратного тока.'],
      ['Микроконтроллер', 'Исполняет программу — «мозг».']
    ],
    build(area, api){
      area.innerHTML =
        '<div class="tg-cube-wrap">' +
          '<div class="tg-cube-persp"><div class="tg-cube" id="cbCube">' +
            faces.map((f, i) =>
              '<button type="button" class="face" data-face="' + i + '" style="transform:rotateY(' + (i * 90) + 'deg) translateZ(110px)">' +
                '<small>ОТСЕК ' + (i + 1) + '</small><b>' + f.title + '</b><span class="slot">' + f.task + '</span>' +
              '</button>'
            ).join('') +
            '<div class="face cap" style="transform:rotateX(90deg) translateZ(110px)">🔌</div>' +
            '<div class="face cap" style="transform:rotateX(-90deg) translateZ(110px)">СОТА</div>' +
          '</div></div>' +
          '<div class="tg-cube-controls">' +
            '<button type="button" class="tg-rotbtn" id="cbL">◀</button>' +
            '<button type="button" class="tg-rotbtn" id="cbR">▶</button>' +
          '</div>' +
        '</div>' +
        '<div class="tg-e-tray">' +
          parts.map((p) => '<button type="button" class="tg-comp" data-part="' + p.id + '"><span class="mini" style="background:#c9b88a"></span>' + p.id + ' · ' + p.name + '</button>').join('') +
        '</div>';
      const cube = area.querySelector('#cbCube');
      function apply(){ cube.style.transform = 'rotateX(-14deg) rotateY(' + angle + 'deg)'; }
      apply();
      area.querySelector('#cbL').onclick = () => { angle -= 90; apply(); };
      area.querySelector('#cbR').onclick = () => { angle += 90; apply(); };

      parts.forEach((p) => {
        area.querySelector('[data-part="' + p.id + '"]').onclick = (e) => {
          if (sel) area.querySelector('[data-part="' + sel.id + '"]').classList.remove('sel');
          sel = p;
          e.currentTarget.classList.add('sel');
          api.feedback('Взято: ' + p.name + '. Найди его отсек — вращай модуль.');
        };
      });
      area.querySelectorAll('.face[data-face]').forEach((face) => {
        face.onclick = () => {
          const idx = Number(face.dataset.face);
          if (!sel){ api.feedback('Сначала возьми компонент снизу.', 'bad'); return; }
          if (sel.face !== idx){
            mistakes++;
            face.classList.add('miss');
            setTimeout(() => face.classList.remove('miss'), 450);
            api.bad('Не сюда: ' + sel.name + ' не делает «' + faces[idx].title.toLowerCase() + '». Функция отсека подсказывает ответ.');
            return;
          }
          face.classList.add('filled');
          face.querySelector('.slot').textContent = '✔ ' + sel.id + ' · ' + sel.name;
          face.disabled = true;
          area.querySelector('[data-part="' + sel.id + '"]').disabled = true;
          sel = null;
          placed++;
          api.setProgress(placed, 4);
          api.sfx('place');
          api.feedback('Установлено ' + placed + ' из 4.');
          if (placed === 4){
            api.ok('Модуль собран — можно подавать питание!');
            setTimeout(() => api.finish(rPts(mistakes)), 1000);
          }
        };
      });
    },
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
