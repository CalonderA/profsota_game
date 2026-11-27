/* ============================================================
   СОТА — Модуль специальности Э (13.02.13)
   Электрооборудование и электрохозяйство.
   Интерьер электроучастка + 5 интерактивных мини-игр:
     1) Сборка распределительного щита
     2) Электромонтаж розетки (L / N / PE)
     3) Поиск неисправности мультиметром
     4) Пуск электродвигателя (звезда-треугольник)
     5) 3D-сборка электрошкафа (CSS 3D)
   ============================================================ */
'use strict';

/* ------------------------------------------------------------------
   ДАННЫЕ СПЕЦИАЛЬНОСТИ
   ------------------------------------------------------------------ */
const E_NAMES = [
  'Щит · Сборка распределительного щита',
  'Розетка · Электромонтаж линии',
  'Диагностика · Поиск неисправности',
  'Привод · Пуск электродвигателя',
  '3D-стенд · Сборка электрошкафа'
];

const E_STATIONS = [
  { x: 5,  y: 6,  type: 0 },
  { x: 16, y: 6,  type: 1 },
  { x: 5,  y: 10, type: 2 },
  { x: 16, y: 10, type: 3 },
  { x: 11, y: 11, type: 4 }
];

// Мебель и оборудование занимают клетки, оставляя свободный подход к станкам.
function setupEMap(m){
  const block = (x, y, w, h) => {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++)
        if (m[j] && i > 0 && i < 22 && j > 1 && j < 14) m[j][i] = 1;
  };
  // Верхний ряд: шкафы КРУ, трансформаторная ячейка, кабельные конструкции
  block(2, 2, 6, 2);
  block(9, 2, 5, 2);
  block(16, 2, 5, 2);
  // Оборудование за станками
  block(4, 5, 3, 1);
  block(15, 5, 3, 1);
  block(4, 9, 3, 1);
  block(15, 9, 3, 1);
  // Уголки: барабаны с кабелем
  block(1, 12, 2, 1);
  block(20, 12, 2, 1);
}

/* ------------------------------------------------------------------
   ОТРИСОВКА ИНТЕРЬЕРА ЭЛЕКТРОУЧАСТКА
   ------------------------------------------------------------------ */
const eGlowCache = new Map();
function eGlow(x, y, r, color){
  const key = r + ':' + color;
  let lamp = eGlowCache.get(key);
  if (!lamp){
    lamp = document.createElement('canvas');
    lamp.width = lamp.height = r * 2;
    const g = lamp.getContext('2d');
    const light = g.createRadialGradient(r, r, 0, r, r, r);
    light.addColorStop(0, color);
    light.addColorStop(1, 'transparent');
    g.fillStyle = light;
    g.fillRect(0, 0, r * 2, r * 2);
    eGlowCache.set(key, lamp);
  }
  ctx.drawImage(lamp, Math.round(x - r), Math.round(y - r));
}
function eRect(x, y, w, h, c){ ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function eText(t, x, y, size, c, align){
  ctx.font = 'bold ' + size + 'px monospace';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = c || '#e7edf6';
  ctx.fillText(t, x, y);
}
function eBox(x, y, w, h, depth, top, front){
  eRect(x + 5, y + 8, w, h + depth, '#05070ca0');
  eRect(x, y, w, h, top);
  eRect(x, y + h, w, depth, front);
  eRect(x, y, w, 2, '#8b98ad');
  eRect(x + w - 3, y + 2, 3, h + depth - 2, '#0c111b');
}
function eCable(points, color){
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.stroke();
}

// ==================================================================
// ИНТЕРЬЕР ЭЛЕКТРОУЧАСТКА (13.02.13) — «диспетчерский зал энергосети»
// Холодный синий металл, циановые экраны, живая схема сети на стене.
// ==================================================================
const E_COL = {
  floor: ['#232b3a', '#1e2531', '#28303f', '#212936'],
  bench: '#71809a', benchDark: '#2e3745',
  violet: '#8fb7e8', teal: '#5fd0e0', tealDark: '#1f7f96',
  amber: '#5fd0e0', hazard: '#f2c94c', hazardDark: '#17171a',
  copper: '#d98a3a', red: '#e0483a', cyan: '#5fd0e0', ok: '#7be0a6'
};

const eFloorCache = new Map();
function drawEFloor(x, y){
  const key = x + ',' + y;
  let tile = eFloorCache.get(key);
  if (!tile){
    tile = document.createElement('canvas');
    tile.width = tile.height = 44;
    const g = tile.getContext('2d');
    const n = (x * 6151 + y * 3571) % 89;
    g.fillStyle = E_COL.floor[(x + y * 3) % 4];
    g.fillRect(0, 0, 44, 44);
    // Стыки стальных плит и заклёпки
    g.fillStyle = '#0c1118'; g.fillRect(0, 43, 44, 1); g.fillRect(43, 0, 1, 44);
    g.fillStyle = '#3f4a5c'; g.fillRect(0, 0, 44, 1);
    g.fillStyle = '#4d5870';
    g.fillRect(3, 3, 1, 1); g.fillRect(40, 3, 1, 1); g.fillRect(3, 40, 1, 1); g.fillRect(40, 40, 1, 1);
    // Потёртости и блики полировки
    for (let i = 0; i < 16; i++){
      g.fillStyle = i % 3 ? '#9fb4d018' : '#060a1255';
      g.fillRect(2 + (n + i * 13) % 40, 2 + (n * 3 + i * 7) % 40, i % 5 === 0 ? 3 : 1, 1);
    }
    if (n % 6 === 0){ g.fillStyle = '#5fd0e012'; g.fillRect(0, 20, 44, 2); }
    eFloorCache.set(key, tile);
  }
  ctx.drawImage(tile, x * 44, y * 44);
  // Циановый кабель-канал вдоль боковых стен
  if (x === 1 || x === 21){
    const px = x * 44 + (x === 1 ? 2 : 36);
    ctx.fillStyle = '#10222b'; ctx.fillRect(px, y * 44, 6, 44);
    ctx.fillStyle = E_COL.cyan; ctx.globalAlpha = 0.55;
    ctx.fillRect(px, y * 44, 6, 2);
    ctx.globalAlpha = 1;
  }
  // Светодиодная полоса-навигация по оси цеха
  if (y === 4 || y === 8){
    ctx.globalAlpha = 0.13; ctx.fillStyle = E_COL.cyan;
    ctx.fillRect(x * 44 + 18, y * 44, 8, 44);
    ctx.globalAlpha = 1;
  }
}

function drawEWall(x, y){
  if (y < 2) return;
  const px = x * 44, py = y * 44;
  if (y === 14){
    // Отбойник с жёлто-чёрной разметкой
    eBox(px, py, 44, 12, 12, '#39362a', '#15130d');
    for (let i = 0; i < 44; i += 11){
      eRect(px + i, py + 1, 6, 11, E_COL.hazard);
      eRect(px + i + 6, py + 1, 5, 11, E_COL.hazardDark);
    }
    eRect(px, py, 44, 1, '#5a5433');
  } else {
    eRect(px, py, 44, 44, '#131a26');
    eRect(px, py, 44, 1, '#1f2a3a');
    eRect(px + (x === 0 ? 40 : 2), py, 2, 44, '#0e1420');
    // Циановый короб-провод вдоль стены
    const cx = px + (x === 0 ? 34 : 8);
    eRect(cx, py, 4, 44, '#10222b');
    eRect(cx, py, 4, 3, E_COL.cyan);
    eRect(cx, py + 20, 4, 3, E_COL.cyan);
    // Распределительная коробка
    eRect(cx - 4, py + 16, 12, 10, '#1e2a3a');
    eRect(cx - 2, py + 18, 8, 2, E_COL.tealDark);
  }
}

function drawEBackWall(now){
  const wallH = 88;
  // Стальные панели с швами и заклёпками
  eRect(0, 0, VW, wallH, '#0d1420');
  for (let x = 0; x < VW; x += 58){
    eRect(x, 0, 2, wallH, '#1d2839');
    eRect(x + 3, 13, 50, 1, '#26334a');
    eRect(x + 3, 55, 50, 1, '#26334a');
    eRect(x + 7, 6, 2, 2, '#3c4c68'); eRect(x + 47, 6, 2, 2, '#3c4c68');
    eRect(x + 7, 72, 2, 2, '#3c4c68'); eRect(x + 47, 72, 2, 2, '#3c4c68');
  }
  // Цоколь
  eRect(0, 80, VW, 8, '#080d15');
  eRect(0, 80, VW, 2, '#3a4a64');
  // Верхний кабельный лоток с пучком
  eRect(0, 0, VW, 10, '#080d15');
  eRect(0, 10, VW, 4, '#44536c');
  eRect(0, 14, VW, 1, '#5c6f8e');
  ctx.lineWidth = 2;
  [['#5fd0e0', 3], ['#e0483a', 6], ['#7be0a6', 9]].forEach((row) => {
    ctx.strokeStyle = row[0];
    ctx.beginPath(); ctx.moveTo(0, row[1]); ctx.lineTo(VW, row[1]); ctx.stroke();
  });

  // Холодное зарево экранов
  eGlow(506, 40, 300, '#5fd0e01c');

  // ---- Центральная вывеска ----
  eBox(300, 12, 412, 42, 7, '#20303f', '#0c1420');
  eRect(306, 16, 400, 34, '#081019');
  eRect(306, 16, 400, 2, '#5fd0e0');
  eText('ЭНЕРГОДИСПЕТЧЕР', 506, 40, 22, '#9fe4f2', 'center');
  eText('13.02.13 · ЭЛЕКТРООБОРУДОВАНИЕ И ЭЛЕКТРОХОЗЯЙСТВО', 506, 55, 8, '#5fa8c8', 'center');

  // Прожекторы по краям вывески
  [288, 716].forEach((lx) => {
    eRect(lx, 10, 10, 44, '#151e2c');
    eRect(lx + 2, 14, 6, 36, '#0a1019');
    eRect(lx + 3, 22, 4, 22, '#5fd0e0');
    eGlow(lx + 5, 34, 58, '#5fd0e030');
  });

  // ---- Знак электробезопасности слева ----
  eBox(42, 16, 110, 58, 6, '#2a2a16', '#151508');
  eRect(47, 20, 100, 50, '#1c1808');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(93, 24); ctx.lineTo(138, 62); ctx.lineTo(48, 62); ctx.closePath();
  ctx.fillStyle = '#f2c94c'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#0d0d10'; ctx.stroke();
  ctx.fillStyle = '#0d0d10';
  ctx.beginPath();
  ctx.moveTo(99, 28); ctx.lineTo(106, 44); ctx.lineTo(97, 44); ctx.lineTo(102, 56);
  ctx.lineTo(86, 41); ctx.lineTo(95, 41); ctx.closePath(); ctx.fill();
  ctx.restore();
  eText('ОПАСНО · 380 В', 97, 78, 7, '#c9b13a', 'center');

  // ---- Аварийная кнопка «СТОП» ----
  eBox(742, 18, 62, 54, 7, '#3a2226', '#1a0f12');
  eRect(747, 22, 52, 46, '#160c0e');
  ctx.beginPath(); ctx.arc(773, 40, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#c0392b'; ctx.fill();
  ctx.strokeStyle = '#e8c44a'; ctx.lineWidth = 4; ctx.stroke();
  ctx.beginPath(); ctx.arc(773, 40, 5, 0, Math.PI * 2); ctx.fillStyle = '#7d2018'; ctx.fill();
  eGlow(773, 40, 34, '#e0483a26');
  eText('СТОП', 773, 70, 8, '#e8b23a', 'center');

  // ---- Экран нагрузки справа (живой график) ----
  eBox(826, 16, 160, 56, 8, '#16301f', '#08140d');
  eRect(832, 21, 148, 38, '#05140b');
  for (let b = 0; b < 12; b++){
    const h = 6 + Math.abs(Math.sin(now / 700 + b * 1.3)) * 22;
    eRect(838 + b * 11, 52 - h, 7, h, b % 3 === 2 ? '#5fd0e0' : '#1f6f5a');
  }
  eText('НАГРУЗКА · МВт', 906, 30, 8, '#7be0a6', 'center');
  eGlow(906, 40, 78, '#48d8a420');

  // ---- Живая однолинейная схема сети под вывеской ----
  eBox(336, 60, 340, 18, 4, '#3c5068', '#1a2735');
  eRect(342, 63, 328, 12, '#0a1220');
  eRect(346, 69, 320, 1, '#3c6f86');
  const nodes = [352, 402, 452, 502, 552, 602, 652];
  nodes.forEach((nx, i) => {
    const pulse = 0.5 + 0.5 * Math.sin(now / 400 + i * 1.1);
    eRect(nx, 65, 12, 8, '#153042');
    eRect(nx + 3, 67, 6, 4, pulse > 0.5 ? '#5fd0e0' : '#1f5f78');
    eGlow(nx + 6, 69, 10 + pulse * 6, '#5fd0e022');
  });
}

function drawEProps(now){
  // Световые пятна от экранов и ламп
  eGlow(160, 150, 210, '#5fd0e014');
  eGlow(506, 150, 240, '#5fd0e01a');
  eGlow(860, 150, 210, '#5fd0e014');
  eGlow(506, 440, 250, '#5fd0e00c');

  const ty = 2 * 44;

  // ---- Трансформаторная ячейка ТМ-100 (x 9..13, y 2..3) ----
  const tx = 9 * 44;
  eRect(tx + 12, ty + 70, 176, 12, '#05070c99');
  // Ограждение с жёлто-чёрной разметкой
  [tx + 14, tx + 184].forEach((fx) => {
    eRect(fx, ty + 24, 5, 48, '#3a3524');
    for (let k = 0; k < 48; k += 12) eRect(fx, ty + 24 + k, 5, 6, E_COL.hazard);
  });
  // Бак трансформатора с радиаторными рёбрами
  eBox(tx + 26, ty + 28, 148, 42, 24, '#6d7a8e', '#26303f');
  for (let i = 0; i < 8; i++) eRect(tx + 32 + i * 17, ty + 28, 6, 42, '#34404f');
  // Вводы-изоляторы сверху
  for (let i = 0; i < 3; i++){
    eRect(tx + 56 + i * 44, ty + 12, 8, 18, '#8a93a2');
    eRect(tx + 54 + i * 44, ty + 8, 12, 5, '#c9d2dc');
    eGlow(tx + 60 + i * 44, ty + 8, 22, '#5fd0e02e');
  }
  // Маслоуказатель и шильдик
  eRect(tx + 128, ty + 38, 10, 26, '#0d141d');
  eRect(tx + 130, ty + 40, 6, 16, E_COL.copper);
  eRect(tx + 34, ty + 34, 28, 14, '#1f2a37');
  eText('ТМ-100', tx + 48, ty + 44, 7, '#b7d2c9', 'center');
  eText('ЯЧЕЙКА · 10 кВ', tx + 98, ty + 82, 8, '#8ea3bd', 'center');

  // ---- Шкафы КРУ слева (x 2..7, y 2..3) ----
  for (let i = 0; i < 3; i++){
    const cx = 2 * 44 + 8 + i * 88;
    eRect(cx + 4, ty + 66, 82, 10, '#05070c99');
    eBox(cx, ty - 4, 82, 56, 24, '#546278', '#1f2938');
    eRect(cx + 6, ty + 2, 70, 40, '#0c1320');
    for (let r = 0; r < 4; r++){
      const on = (r + i) % 2 === 0;
      eRect(cx + 12, ty + 6 + r * 9, 58, 6, '#233850');
      eRect(cx + 16, ty + 8 + r * 9, 42, 1, on ? '#5fd0e0' : '#3c6f86');
      for (let d = 0; d < 4; d++) eRect(cx + 60 - d * 5, ty + 7 + r * 9, 2, 4, on ? '#7be0a6' : '#2c3e58');
    }
    eRect(cx + 36, ty + 46, 16, 4, '#b7c9d8');
    eText('КРУ-' + (i + 1), cx + 41, ty + 64, 8, '#8ea3bd', 'center');
    eGlow(cx + 41, ty + 20, 46, '#5fd0e016');
  }

  // ---- Кабельные барабаны справа (x 16..20, y 2..3) ----
  for (let i = 0; i < 2; i++){
    const dx = 16 * 44 + 34 + i * 100, dy = ty + 42;
    eRect(dx - 34, dy + 30, 68, 8, '#05070c99');
    ctx.beginPath(); ctx.arc(dx, dy, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#2b3140'; ctx.fill();
    ctx.strokeStyle = '#4a5871'; ctx.lineWidth = 3; ctx.stroke();
    for (let k = 0; k < 4; k++){
      ctx.beginPath(); ctx.arc(dx, dy, 26 - k * 5, 0, Math.PI * 2);
      ctx.strokeStyle = k % 2 ? '#5f8fb0' : '#38506e'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(dx, dy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#4a5871'; ctx.fill();
    eGlow(dx, dy, 42, '#5fd0e012');
  }
  eText('КАТУШКИ · КГ 3×2,5', 16 * 44 + 84, ty + 88, 8, '#8ea3bd', 'center');

  // ---- Верстаки за станциями (y = 5 и y = 9) ----
  const benches = [[4, 5], [15, 5], [4, 9], [15, 9]];
  benches.forEach((b, i) => {
    const px = b[0] * 44, py = b[1] * 44;
    eRect(px - 4, py + 50, 136, 8, '#05070c99');
    eBox(px - 6, py + 12, 140, 24, 16, '#71809a', '#2e3745');
    for (let k = 0; k < 4; k++) eRect(px - 2, py + 18 + k * 5, 132, 1, '#3a4456');
    // Мультиметр с индикацией
    eRect(px + 10, py + 14, 30, 12, '#1d2430');
    eRect(px + 14, py + 17, 22, 6, '#0d1a14');
    eRect(px + 16, py + 19, 12 + (i % 2) * 6, 1, '#6ef0b6');
    // Ящик с инструментом и отвёртки
    eRect(px + 88, py + 12, 30, 12, '#253044');
    eRect(px + 92, py + 14, 22, 3, '#5fd0e0');
    eRect(px + 52, py + 13, 4, 10, '#c0392b');
    eRect(px + 58, py + 13, 4, 10, '#7be0a6');
    eText('VDE', px + 6, py + 40, 8, '#7c8794');
    eGlow(px + 26, py + 20, 42, '#5fd0e00e');
  });

  // ---- Кабельные барабаны в нижних углах ----
  [[1, 12], [20, 12]].forEach((c, i) => {
    const dx = c[0] * 44 + 44, dy = c[1] * 44 + 22;
    eRect(dx - 24, dy + 20, 48, 8, '#05070c99');
    ctx.beginPath(); ctx.arc(dx, dy, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#2b3140'; ctx.fill();
    ctx.strokeStyle = '#5f8fb0'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(dx, dy, 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#38506e'; ctx.lineWidth = 2; ctx.stroke();
    eText(i ? 'КГ' : 'ВВГ', dx, dy + 4, 8, '#c9d4de', 'center');
  });

  // ---- Диэлектрический коврик перед стендом монтажа ----
  eRect(10 * 44 + 2, 11 * 44 + 2, 92, 38, '#141a22');
  eRect(10 * 44 + 2, 11 * 44 + 2, 92, 2, E_COL.hazard);
  eRect(10 * 44 + 2, 11 * 44 + 38, 92, 2, E_COL.hazard);

  // ---- Полупрозрачная разметка на полу ----
  eText('ЭНЕРГОБЛОК · 380 В', 506, 540, 13, '#3a4558', 'center');
  eText('БЕРЕГИСЬ НАПРЯЖЕНИЯ', 506, 562, 10, '#2f3d55', 'center');
}

/* ------------------------------------------------------------------
   ОТРИСОВКА СТАНКА Э
   ------------------------------------------------------------------ */
function eMonitor(x, y, kind, now){
  eGlow(x + 22, y + 22, 46, kind === 'meter' ? '#5fd0e026' : '#5fd0e01f');
  eBox(x, y, 46, 34, 8, '#4a5568', '#11161f');
  eRect(x + 4, y + 5, 38, 25, '#0a1420');
  if (kind === 'meter'){
    eRect(x + 6, y + 7, 34, 9, '#0d1a14');
    eText('2 3 0 V', x + 39, y + 14, 9, '#6ef0b6', 'right');
    eRect(x + 6, y + 19, 34, 9, '#0d1a14');
    eText('L N PE', x + 12, y + 26, 8, '#7bb8e6');
  } else {
    for (let i = 0; i < 3; i++){
      eRect(x + 6, y + 8 + i * 6, 20 + i * 4, 1, ['#c98a3a', '#5fd0e0', '#c98a3a'][i]);
    }
    eRect(x + 30, y + 22, 8, 5, '#6ef0b6');
  }
}

function drawEStation(type, done, hard, now, seed){
  const accent = done ? '#4fd69f' : (hard ? '#c084fc' : '#5fd0e0');
  eGlow(0, -6, 78, done ? '#48d8a41f' : '#5fd0e022');

  if (type === 0){
    // Распределительный щит на стойке
    eRect(-58, 44, 118, 14, '#070a11a0');
    eBox(-56, 44, 112, 12, 14, '#3a4048', '#1a1e26');
    eBox(-48, -40, 96, 82, 12, '#5b6472', '#232b38');
    eRect(-42, -34, 84, 70, '#0c121b');
    // DIN-рейка с автоматами
    for (let mod = 0; mod < 4; mod++){
      eRect(-34 + mod * 20, -26, 16, 34, '#2b3a52');
      eRect(-32 + mod * 20, -22, 12, 6, '#c98a3a');
      eRect(-30 + mod * 20, -12, 8, 3, mod < 2 ? '#5fd0e0' : '#7be0a6');
    }
    eRect(-42, 16, 84, 16, '#141b26');
    eText('QF1  QS', -38, 28, 8, '#8ea3b8');
    eRect(-48, -40, 96, 2, accent);
    // Ручка дверцы
    eRect(40, -6, 4, 22, '#c7ccd6');
  } else if (type === 1){
    // Верстак с розеткой, выключателем и проводами
    eRect(-60, 44, 128, 14, '#070a11a0');
    eBox(-60, 2, 120, 30, 14, '#9a8a6a', '#403826');
    for (let k = 0; k < 4; k++) eRect(-54, 10 + k * 6, 108, 1, '#5b4f38');
    // Механизм розетки с тремя клеммами
    eBox(-40, -34, 34, 36, 6, '#e9edf2', '#c3cad4');
    eRect(-36, -30, 26, 28, '#f7fafd');
    eRect(-26, -22, 6, 6, '#3a3a3a'); eRect(-16, -22, 6, 6, '#3a3a3a');
    eRect(-26, -8, 6, 6, '#c9a13a'); eRect(-16, -8, 6, 6, '#c9a13a');
    // Клубок проводов L/N/PE
    eCable([2, -22, 26, -18, 40, -4], '#8a5a2b');
    eCable([2, -10, 30, -10, 44, 4], '#2b6fa8');
    eCable([2, 2, 28, 0, 44, 12], '#7ba33a');
    eRect(-58, 0, 116, 2, accent);
  } else if (type === 2){
    // Стол диагностики: мультиметр, щупы, схема
    eRect(-58, 44, 120, 14, '#070a11a0');
    eBox(-58, 4, 116, 30, 14, '#7a8697', '#2b3442');
    eRect(-52, 10, 104, 2, '#9fb0c6');
    eMonitor(-24, -38, 'meter', now);
    // Щупы (красный и чёрный)
    eCable([-40, -34, -48, -10, -44, 6], '#c0392b');
    eCable([-38, -34, -30, -12, -26, 6], '#202733');
    eRect(14, -22, 30, 20, '#1d2430');
    eRect(18, -18, 22, 3, '#5fd0e0');
    eRect(18, -12, 16, 3, '#7be0a6');
    eRect(-58, 2, 116, 2, accent);
  } else if (type === 3){
    // Электродвигатель с клеммной коробкой
    eRect(-56, 44, 116, 14, '#070a11a0');
    eBox(-44, 44, 88, 12, 12, '#2a3040', '#141821');
    ctx.beginPath(); ctx.ellipse(0, 6, 40, 32, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#5b6472'; ctx.fill();
    ctx.strokeStyle = '#2b3442'; ctx.lineWidth = 3; ctx.stroke();
    for (let i = 0; i < 10; i++){
      ctx.save(); ctx.translate(0, 6); ctx.rotate(i * Math.PI / 5);
      eRect(-3, -30, 6, 20, '#3a4250'); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 6, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#232b38'; ctx.fill();
    eBox(-18, -34, 36, 20, 6, '#2b3442', '#171d28');
    eText('M', 0, -20, 12, '#5fd0e0', 'center');
    eCable([18, -30, 40, -34, 46, -12, 40, 8], '#c0392b');
    eRect(-44, 42, 88, 2, accent);
  } else {
    // 3D-стенд монтажа: проектор и голографический куб
    eRect(-58, 44, 120, 14, '#070a11a0');
    eBox(-46, 44, 92, 12, 12, '#2a3040', '#141821');
    eGlow(0, -24, 58, '#5fd0e02e');
    eBox(-32, 8, 64, 32, 10, '#39424f', '#1b222d');
    eRect(-26, 14, 52, 4, '#0d1a14');
    eText('3D-МОНТАЖ', 0, 30, 9, '#5fd0e0', 'center');
    eRect(-30, 20, 3, 3, '#5fd0e0'); eRect(27, 20, 3, 3, '#7be0a6');
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
    quad([top[0], top[1], bot[1], bot[0]], '#5fd0e026', '#5fd0e0cc');
    quad([top[1], top[2], bot[2], bot[1]], '#7be0a61a', '#5fd0e099');
    quad(top, '#7be0a633', '#7be0a6');
    eRect(-7, -24 - s * 0.5 + 3, 6, 6, '#5fd0e0');
    eRect(3, -24 - s * 0.5 + 8, 6, 6, '#7be0a6');
    eRect(-46, 42, 92, 2, accent);
  }
}

window.STATION_RENDERERS = window.STATION_RENDERERS || {};
window.STATION_RENDERERS.e = drawEStation;

/* ------------------------------------------------------------------
   МИНИ-ИГРЫ Э — красивые задания-карточки с интерактивными схемами
   (движок task-game.js: точки-пропуски прямо на картинке)
   ------------------------------------------------------------------ */

/* ---------- SVG-иллюстрации ---------- */

/* Щит с DIN-рейкой: 4 посадочных места под автоматы */
function eSvgPanel(){
  return '<svg viewBox="0 0 340 150" width="340">' +
    '<rect x="20" y="14" width="300" height="122" rx="10" fill="#182234" stroke="#3c4c6c" stroke-width="2"/>' +
    '<rect x="34" y="28" width="272" height="26" fill="#0d1420" stroke="#2c3850"/>' +
    '<text x="170" y="45" fill="#8ea3b8" font-size="11" text-anchor="middle" font-family="monospace">ВВОД 380 В</text>' +
    '<rect x="34" y="64" width="272" height="46" rx="4" fill="#0a0f1a" stroke="#2c3850"/>' +
    '<rect x="34" y="106" width="272" height="5" fill="#3c4c6c"/>' +
    [62, 124, 186, 248].map((mx, i) =>
      '<rect x="' + (mx - 26) + '" y="70" width="52" height="34" rx="4" fill="#1b2a3c" stroke="#48587a" stroke-dasharray="4 3"/>' +
      '<rect x="' + (mx - 12) + '" y="76" width="24" height="9" rx="2" fill="#0d1522"/>' +
      '<text x="' + mx + '" y="102" fill="#5f7f9a" font-size="10" text-anchor="middle" font-family="monospace">№' + (i + 1) + '</text>'
    ).join('') +
    '<text x="170" y="130" fill="#7f93ad" font-size="10" text-anchor="middle" font-family="monospace">ДИН-РЕЙКА · СТАВЬ ПО ПОРЯДКУ</text>' +
  '</svg>';
}

/* Розетка: клеммы PE / L / N + живой провод выбранного цвета */
function eSvgSocketLive(wireColor, connectedPos, highlight){
  // connectedPos: 'L' | 'N' | 'PE' | null — рисует провод, когда фишка поставлена
  const term = { L: [96, 108], N: [244, 108], PE: [170, 52] };
  let wire = '';
  if (connectedPos && term[connectedPos]){
    const [tx, ty] = term[connectedPos];
    wire = '<path d="M18 ' + ty + ' C 50 ' + ty + ', 60 ' + ty + ', ' + (tx - 14) + ' ' + ty + '" fill="none" stroke="' + wireColor + '" stroke-width="9" stroke-linecap="round"/>' +
      '<circle cx="' + (tx - 14) + '" cy="' + ty + '" r="6" fill="' + wireColor + '"/>';
  }
  const hl = highlight && term[highlight]
    ? '<circle cx="' + term[highlight][0] + '" cy="' + term[highlight][1] + '" r="20" fill="none" stroke="#f5a623" stroke-dasharray="5 4" stroke-width="2"/>'
    : '';
  return '<svg viewBox="0 0 340 170" width="340">' +
    '<rect x="60" y="16" width="220" height="140" rx="22" fill="#e9edf2" stroke="#c3cad4" stroke-width="2"/>' +
    '<rect x="72" y="28" width="196" height="116" rx="16" fill="#f7fafd"/>' +
    // клеммы-гнёзда
    '<rect x="140" y="36" width="60" height="26" rx="6" fill="#dfe5ec" stroke="#b9c2cf"/>' +
    '<text x="170" y="53" fill="#8b94a1" font-size="10" text-anchor="middle" font-family="monospace">PE</text>' +
    '<rect x="76" y="92" width="46" height="30" rx="6" fill="#dfe5ec" stroke="#b9c2cf"/>' +
    '<text x="99" y="111" fill="#8b94a1" font-size="10" text-anchor="middle" font-family="monospace">L</text>' +
    '<rect x="218" y="92" width="46" height="30" rx="6" fill="#dfe5ec" stroke="#b9c2cf"/>' +
    '<text x="241" y="111" fill="#8b94a1" font-size="10" text-anchor="middle" font-family="monospace">N</text>' +
    hl + wire +
    '<text x="18" y="' + (connectedPos ? term[connectedPos][1] - 12 : 90) + '" fill="#8ea3b8" font-size="10" font-family="monospace">провод →</text>' +
  '</svg>';
}

/* Мультиметр: поворотный диск режимов */
function eSvgDial(active){
  // активная позиция подсвечивается жёлтым
  const modes = [
    { id: 'V', x: 96, y: 96, label: 'V~' },
    { id: 'R', x: 170, y: 76, label: 'Ω' },
    { id: 'B', x: 244, y: 96, label: '♪' }
  ];
  const m = modes.find((x) => x.id === active);
  return '<svg viewBox="0 0 340 150" width="340">' +
    '<rect x="60" y="12" width="220" height="126" rx="12" fill="#1d2430" stroke="#3c4a5e" stroke-width="2"/>' +
    '<rect x="78" y="22" width="184" height="34" rx="6" fill="#071510"/>' +
    '<text x="286" y="44" fill="#6ef0b6" font-size="13" text-anchor="end" font-family="monospace">- - -</text>' +
    '<circle cx="170" cy="96" r="34" fill="#10151e" stroke="#46536a" stroke-width="3"/>' +
    '<circle cx="170" cy="96" r="5" fill="#c7ccd6"/>' +
    modes.map((p) =>
      '<circle cx="' + p.x + '" cy="' + p.y + '" r="15" fill="' + (m && m.id === p.id ? '#3a2f10' : '#0d1420') + '" stroke="' + (m && m.id === p.id ? '#f5a623' : '#46536a') + '" stroke-width="2"/>' +
      '<text x="' + p.x + '" y="' + (p.y + 5) + '" fill="' + (m && m.id === p.id ? '#ffd166' : '#8ea3b8') + '" font-size="13" text-anchor="middle" font-family="monospace">' + p.label + '</text>'
    ).join('') +
    (m ? '<line x1="170" y1="96" x2="' + m.x + '" y2="' + m.y + '" stroke="#f5a623" stroke-width="3"/>' : '<line x1="170" y1="96" x2="170" y2="62" stroke="#8ea3b8" stroke-width="3"/>') +
    '<text x="170" y="140" fill="#7f93ad" font-size="9" text-anchor="middle" font-family="monospace">РЕЖИМ · ПОВЕРНИ ДИСК</text>' +
  '</svg>';
}

/* Цепь: автомат → розетки → свет (для поиска обрыва) */
function eSvgChainActive(){
  return '<svg viewBox="0 0 340 130" width="340">' +
    '<rect x="24" y="36" width="86" height="44" rx="8" fill="#182234" stroke="#f5a623" stroke-width="2"/>' +
    '<text x="67" y="54" fill="#e6eef8" font-size="13" text-anchor="middle" font-family="monospace">QF1</text>' +
    '<text x="67" y="70" fill="#9fb0c6" font-size="9" text-anchor="middle" font-family="monospace">ввод</text>' +
    '<line x1="110" y1="58" x2="146" y2="58" stroke="#4b5b7a" stroke-width="2"/>' +
    '<rect x="146" y="36" width="90" height="44" rx="8" fill="#182234" stroke="#3c4c6c"/>' +
    '<text x="191" y="54" fill="#9fb0c6" font-size="11" text-anchor="middle" font-family="monospace">Розетки</text>' +
    '<text x="191" y="70" fill="#5f7f9a" font-size="9" text-anchor="middle" font-family="monospace">0 В · 0 В</text>' +
    '<line x1="236" y1="58" x2="272" y2="58" stroke="#4b5b7a" stroke-width="2"/>' +
    '<rect x="272" y="36" width="54" height="44" rx="8" fill="#182234" stroke="#3c4c6c"/>' +
    '<text x="299" y="54" fill="#9fb0c6" font-size="11" text-anchor="middle" font-family="monospace">Свет</text>' +
    '<text x="299" y="70" fill="#5f7f9a" font-size="9" text-anchor="middle" font-family="monospace">0 В</text>' +
    '<text x="170" y="108" fill="#e0483a" font-size="11" text-anchor="middle" font-family="monospace">ВЕЗДЕ 0 В — ОБРЫВ В НАЧАЛЕ ЦЕПИ?</text>' +
  '</svg>';
}

/* Двигатель + цепочка шагов пуска */
function eSvgMotorChain(){
  return '<svg viewBox="0 0 340 140" width="340">' +
    [40, 118, 196, 274].map((bx, i) =>
      '<rect x="' + (bx - 34) + '" y="30" width="76" height="44" rx="8" fill="#1b2a3c" stroke="#48587a" stroke-dasharray="4 3"/>' +
      '<text x="' + bx + '" y="56" fill="#5f7f9a" font-size="11" text-anchor="middle" font-family="monospace">ШАГ ' + (i + 1) + '</text>'
    ).join('') +
    '<circle cx="170" cy="106" r="24" fill="#182234" stroke="#3c4c6c" stroke-width="3"/>' +
    '<circle cx="170" cy="106" r="6" fill="#0d1420" stroke="#5fd0e0"/>' +
    '<path d="M170 82 v8 M170 122 v8 M146 106 h8 M186 106 h8" stroke="#4b5b7a" stroke-width="3"/>' +
    '<text x="212" y="110" fill="#f5a623" font-size="11" font-family="monospace">M 3~ 380 В</text>' +
  '</svg>';
}

/* Шкаф с 4 отсеками-функциями */
function eSvgCabinet(){
  return '<svg viewBox="0 0 300 190" width="300">' +
    '<rect x="30" y="12" width="240" height="166" rx="10" fill="#182234" stroke="#3c4c6c" stroke-width="2"/>' +
    '<rect x="42" y="24" width="104" height="66" rx="7" fill="#1b2a3c" stroke="#48587a" stroke-dasharray="4 3"/>' +
    '<text x="94" y="52" fill="#7f93ad" font-size="9" text-anchor="middle" font-family="monospace">ПЕРЕГРУЗКА</text>' +
    '<text x="94" y="64" fill="#7f93ad" font-size="9" text-anchor="middle" font-family="monospace">И КЗ</text>' +
    '<rect x="154" y="24" width="104" height="66" rx="7" fill="#1b2a3c" stroke="#48587a" stroke-dasharray="4 3"/>' +
    '<text x="206" y="52" fill="#7f93ad" font-size="9" text-anchor="middle" font-family="monospace">УТЕЧКА</text>' +
    '<text x="206" y="64" fill="#7f93ad" font-size="9" text-anchor="middle" font-family="monospace">ТОКА</text>' +
    '<rect x="42" y="98" width="104" height="66" rx="7" fill="#1b2a3c" stroke="#48587a" stroke-dasharray="4 3"/>' +
    '<text x="94" y="126" fill="#7f93ad" font-size="9" text-anchor="middle" font-family="monospace">УЧЁТ</text>' +
    '<text x="94" y="138" fill="#7f93ad" font-size="9" text-anchor="middle" font-family="monospace">ЭНЕРГИИ</text>' +
    '<rect x="154" y="98" width="104" height="66" rx="7" fill="#1b2a3c" stroke="#48587a" stroke-dasharray="4 3"/>' +
    '<text x="206" y="126" fill="#7f93ad" font-size="9" text-anchor="middle" font-family="monospace">ЗЕМЛЯ</text>' +
    '<text x="206" y="138" fill="#7f93ad" font-size="9" text-anchor="middle" font-family="monospace">В ОДНУ ТОЧКУ</text>' +
    '<rect x="30" y="182" width="240" height="4" fill="#3c4c6c"/>' +
  '</svg>';
}

/* Фишка-цвет провода */
function eWireChipSvg(color){
  return '<svg viewBox="0 0 60 24" width="52" height="21"><path d="M4 12 C 18 2, 42 22, 56 12" fill="none" stroke="' + color + '" stroke-width="8" stroke-linecap="round"/></svg>';
}

/* ---- Игра 1. Сборка распределительного щита ---- */
function openEPanel(done, cancel){
  return window.openTaskGame({
    theme: 'e',
    icon: '⚡',
    title: 'Сборка распределительного щита',
    intro: 'Расставьте аппараты защиты прямо на ДИН-рейке щита.',
    memo: [
      ['QF — автомат', 'Отключает линию при перегрузке и коротком замыкании. Число — ток в амперах: C40 на вводе, C16 розетки, C10 свет.'],
      ['УЗО', 'Защита человека: отключает при утечке 30 мА.'],
      ['PE', 'Жёлто-зелёный проводник заземления — соединяет корпуса с землёй.'],
      ['Порядок', 'Ввод → УЗО → розетки → свет. Контактор и лампа в квартирном щите не нужны.']
    ],
    steps: [
      {
        title: 'Этап 1 · Порядок аппаратов',
        task: 'Нажмите место №1 на рейке, затем фишку аппарата. Соберите весь щит по порядку.',
        art: eSvgPanel(),
        hotspots: [
          { x: 18.2, y: 52 }, { x: 36.5, y: 52 }, { x: 54.7, y: 52 }, { x: 72.9, y: 52 }
        ],
        slots: [
          { label: '№1 · сразу после ввода', answer: 'Вводной автомат C40' },
          { label: '№2 · защита людей', answer: 'УЗО 30 мА' },
          { label: '№3 · линия розеток', answer: 'Автомат C16' },
          { label: '№4 · линия освещения', answer: 'Автомат C10' }
        ],
        chips: [
          { label: 'Вводной автомат C40', sub: 'общее отключение' },
          { label: 'УЗО 30 мА', sub: 'от утечки тока' },
          { label: 'Автомат C16', sub: 'розетки' },
          { label: 'Автомат C10', sub: 'свет' },
          { label: 'Контактор КМ', sub: 'лишний' },
          { label: 'Лампа HL', sub: 'лишняя' }
        ],
        chipsLabel: 'Аппараты щита',
        hint: 'Ввод — УЗО — розетки — свет.',
        success: 'Щит собран правильно!'
      },
      {
        title: 'Этап 2 · Ток групповой линии',
        task: 'Стиральная машина и компьютер в комнате. Какой автомат поставить на линию розеток?',
        art: eSvgDial(null),
        slots: [{ label: 'Автомат линии розеток', answer: 'C16 (16 А)' }],
        chips: [ { label: 'C16 (16 А)' }, { label: 'C10 (10 А)' }, { label: 'C40 (40 А)' } ],
        chipsLabel: 'Номиналы автоматов',
        hint: 'Розеточная группа — 16 А. C10 — для света, а C40 — это ввод всего щита.',
        success: 'Верно: 16 А для розеток.'
      },
      {
        title: 'Этап 3 · Заземление',
        task: 'Каким проводником соединяют корпуса приборов с землёй?',
        slots: [{ label: 'Проводник заземления', answer: 'PE (жёлто-зелёный)' }],
        chips: [
          { label: 'PE (жёлто-зелёный)', svg: eWireChipSvg('#7ba33a') },
          { label: 'N (голубой)', svg: eWireChipSvg('#2b6fa8') },
          { label: 'L (коричневый)', svg: eWireChipSvg('#8a5a2b') }
        ],
        chipsLabel: 'Провода',
        hint: 'PE — жёлто-зелёный, N — голубой, L — коричневый. Земля — это всегда PE.',
        success: 'Отлично, корпуса заземлены!'
      }
    ],
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 2. Электромонтаж розетки ---- */
function openESocket(done, cancel){
  const stages = [
    { pos: 'L', wire: '#8a5a2b', name: 'Коричневый', answer: 'L — фаза', hs: { x: 28, y: 63 }, title: 'Этап 1 · Фаза' },
    { pos: 'N', wire: '#2b6fa8', name: 'Голубой', answer: 'N — ноль', hs: { x: 72, y: 63 }, title: 'Этап 2 · Ноль' },
    { pos: 'PE', wire: '#7ba33a', name: 'Жёлто-зелёный', answer: 'PE — земля', hs: { x: 50, y: 29 }, title: 'Этап 3 · Земля' }
  ];
  return window.openTaskGame({
    theme: 'e',
    icon: '🔌',
    title: 'Электромонтаж розетки',
    intro: 'Подключите провода прямо на клеммах розетки. Перепутаете — будет авария!',
    memo: [
      ['L — фаза', 'Коричневый провод. «Рабочий» провод под напряжением.'],
      ['N — ноль', 'Голубой провод. Обратный провод цепи.'],
      ['PE — земля', 'Жёлто-зелёный провод. Защита: соединяет корпуса с землёй.']
    ],
    steps: stages.map((s, i) => ({
      title: s.title,
      task: 'Куда подключается ' + s.name.toLowerCase() + ' провод? Нажмите на клемму на розетке.',
      art: (vals) => eSvgSocketLive(s.wire, vals[0] === s.answer ? s.pos : null, s.pos),
      hotspots: [s.hs],
      slots: [{ label: 'Клемма ' + s.name.toLowerCase() + ' провода', answer: s.answer }],
      chips: [ { label: 'L — фаза' }, { label: 'N — ноль' }, { label: 'PE — земля' } ],
      chipsLabel: 'Клеммы',
      hint: i === 0 ? 'Коричневый — всегда фаза L.' : i === 1 ? 'Голубой — ноль N (Neutral).' : 'Жёлто-зелёный — защитная земля PE.',
      success: 'Провод подключён верно!'
    })),
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 3. Поиск неисправности мультиметром ---- */
function openEMeter(done, cancel){
  return window.openTaskGame({
    theme: 'e',
    icon: '🔍',
    title: 'Поиск неисправности мультиметром',
    intro: 'Розетки не работают. Пройдите диагностику: поверните диск прибора и найдите обрыв.',
    memo: [
      ['V~ — напряжение', 'Режим измерения переменного напряжения. В розетке должно быть ~230 В.'],
      ['Ω — сопротивление', 'Обрыв цепи — «∞», бесконечность.'],
      ['Прозвонка ♪', 'Пищит, если цепь целая. Удобно искать обрыв при снятом питании.'],
      ['Правило обрыва', '0 В сразу везде = обрыв в самом начале цепи.']
    ],
    steps: [
      {
        title: 'Этап 1 · Режим прибора',
        task: 'Проверяем: есть ли в розетках напряжение. Нажмите нужный режим на диске.',
        art: eSvgDial(null),
        hotspots: [ { x: 28, y: 64 } ],
        slots: [{ label: 'Режим мультиметра', answer: 'V~ (напряжение)' }],
        chips: [ { label: 'V~ (напряжение)' }, { label: 'Ω (сопротивление)' }, { label: 'Прозвонка' } ],
        chipsLabel: 'Режимы',
        hint: 'Живую розетку проверяют напряжением — V~.',
        success: 'Диск на V~. Прибор готов.'
      },
      {
        title: 'Этап 2 · Где обрыв',
        task: 'Мультиметр показывает 0 В во всех точках. Нажмите на схеме элемент, который сломан.',
        art: eSvgChainActive(),
        hotspots: [ { x: 19.7, y: 44 } ],
        slots: [{ label: 'Неисправный элемент', answer: 'Вводной автомат QF1' }],
        chips: [ { label: 'Вводной автомат QF1' }, { label: 'Вторая розетка' }, { label: 'Светильник' } ],
        chipsLabel: 'Элементы цепи',
        hint: '0 В сразу везде = питание пропало в самом начале цепи.',
        success: 'Точно! Обрыв на вводе — поэтому гаснет всё.'
      },
      {
        title: 'Этап 3 · Проверка без питания',
        task: 'Питание сняли. Каким режимом быстрее всего найти обрыв провода? Нажмите на диске.',
        art: eSvgDial(null),
        hotspots: [ { x: 71.8, y: 64 } ],
        slots: [{ label: 'Режим поиска обрыва', answer: 'Прозвонка' }],
        chips: [ { label: 'Прозвонка' }, { label: 'V~ (напряжение)' }, { label: 'A (ток)' } ],
        chipsLabel: 'Режимы',
        hint: 'Прозвонка пищит на целой цепи. Молчит — значит обрыв.',
        success: 'Диагностика завершена — неисправность найдена!'
      }
    ],
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 4. Пуск электродвигателя ---- */
function openEMotor(done, cancel){
  return window.openTaskGame({
    theme: 'e',
    icon: '⚙️',
    title: 'Пуск электродвигателя',
    intro: 'Расставьте шаги пуска прямо на схеме — не спалите двигатель!',
    memo: [
      ['Пуск «звездой»', 'Обмотки звездой: пусковой ток меньше в ~1,7 раза. Разгон мягкий.'],
      ['Переход в «треугольник»', 'После разгона — полная мощность.'],
      ['Цепь управления', 'Кнопки и катушки питаются отдельно, обычно 24 В — это безопасность.']
    ],
    steps: [
      {
        title: 'Этап 1 · Последовательность пуска',
        task: 'Нажмите «ШАГ 1» на схеме, затем фишку. Заполните все четыре шага.',
        art: eSvgMotorChain(),
        hotspots: [
          { x: 11.8, y: 37 }, { x: 34.7, y: 37 }, { x: 57.6, y: 37 }, { x: 80.6, y: 37 }
        ],
        slots: [
          { label: 'Шаг 1', answer: 'Вводной автомат QF1' },
          { label: 'Шаг 2', answer: 'Питание цепи управления' },
          { label: 'Шаг 3', answer: 'Пуск «звездой»' },
          { label: 'Шаг 4', answer: 'Переход в «треугольник»' }
        ],
        chips: [
          { label: 'Вводной автомат QF1' },
          { label: 'Питание цепи управления' },
          { label: 'Пуск «звездой»' },
          { label: 'Переход в «треугольник»' },
          { label: 'Сразу «треугольник»', sub: 'лишний' }
        ],
        chipsLabel: 'Шаги',
        hint: 'Сначала питание, потом управление, звезда — и лишь затем треугольник.',
        success: 'Двигатель запущен по инструкции!'
      },
      {
        title: 'Этап 2 · Зачем «звезда»?',
        task: 'Почему двигатель сначала пускают «звездой»?',
        art: eSvgMotorChain(),
        slots: [{ label: 'Причина пуска звездой', answer: 'Меньше пусковой ток' }],
        chips: [ { label: 'Меньше пусковой ток' }, { label: 'Быстрее разгон' }, { label: 'Громче работает' } ],
        chipsLabel: 'Варианты',
        hint: 'Большой пусковой ток греет провода и просаживает сеть. Звезда его снижает.',
        success: 'Верно: звезда бережёт сеть и двигатель.'
      }
    ],
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 5. Сборка электрошкафа ---- */
function openE3D(done, cancel){
  return window.openTaskGame({
    theme: 'e',
    icon: '🗄️',
    title: 'Сборка электрошкафа',
    intro: 'Нажмите отсек на шкафу и поставьте туда аппарат, который решает его задачу.',
    memo: [
      ['Автомат QF', 'Защита от перегрузки и короткого замыкания.'],
      ['УЗО', 'Защита человека: отключает при утечке 30 мА.'],
      ['Счётчик', 'Учитывает электроэнергию, кВт·ч.'],
      ['Шина PE', 'Собирает все провода заземления в одну точку.']
    ],
    steps: [
      {
        title: 'Этап · Функции аппаратов',
        task: 'Четыре отсека шкафа подписаны задачами. Поставьте в каждый нужный аппарат.',
        art: eSvgCabinet(),
        hotspots: [
          { x: 31.3, y: 30 }, { x: 68.7, y: 30 }, { x: 31.3, y: 69 }, { x: 68.7, y: 69 }
        ],
        slots: [
          { label: 'Отсек «Перегрузка и КЗ»', answer: 'Автомат QF' },
          { label: 'Отсек «Утечка тока»', answer: 'УЗО' },
          { label: 'Отсек «Учёт энергии»', answer: 'Счётчик' },
          { label: 'Отсек «Земля»', answer: 'Шина PE' }
        ],
        chips: [
          { label: 'Автомат QF' }, { label: 'УЗО' }, { label: 'Счётчик' }, { label: 'Шина PE' },
          { label: 'Розетка', sub: 'лишняя' }, { label: 'Лампа', sub: 'лишняя' }
        ],
        chipsLabel: 'Аппараты шкафа',
        hint: 'КЗ и перегрузка — автомат. Утечка — УЗО. Учёт — счётчик. Земля — шина PE.',
        success: 'Шкаф укомплектован — можно подавать напряжение!'
      }
    ],
    onDone: done, onCancel: cancel
  });
}

/* ---- Диспетчер станций Э ---- */
window.startEStation = function(type, floor, done, cancel){
  if (type === 0) return openEPanel(done, cancel);
  if (type === 1) return openESocket(done, cancel);
  if (type === 2) return openEMeter(done, cancel);
  if (type === 3) return openEMotor(done, cancel);
  if (type === 4) return openE3D(done, cancel);
  return openEPanel(done, cancel);
};
