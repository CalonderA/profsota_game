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
   МИНИ-ИГРЫ Э — играбельные симуляторы (openPlayGame):
   щит собирается руками и включается, провода тянутся к розетке,
   мультиметр с щупами, панель пуска двигателя с ротором, шкаф.
   ------------------------------------------------------------------ */
const ePts = (mistakes) => Math.max(50, 200 - mistakes * 25);

/* ---- Игра 1. Сборка распределительного щита: поставь и включи ---- */
function openEPanel(done, cancel){
  const parts = [
    { id: 'c40', name: 'Вводной автомат C40', slot: 0 },
    { id: 'uzo', name: 'УЗО 30 мА', slot: 1 },
    { id: 'c16', name: 'Автомат C16', slot: 2 },
    { id: 'c10', name: 'Автомат C10', slot: 3 },
    { id: 'km',  name: 'Контактор КМ', slot: -1 },
    { id: 'hl',  name: 'Лампа HL', slot: -1 }
  ];
  const slotNames = ['№1 · ввод', '№2 · защита людей', '№3 · розетки', '№4 · свет'];
  let mistakes = 0, placed = 0, sel = null;

  return window.openPlayGame({
    theme: 'e',
    icon: '⚡',
    title: 'Сборка распределительного щита',
    intro: 'Поставь автоматы на ДИН-рейку, затем включи щит — загорится свет!',
    memo: [
      ['Порядок', '№1 вводной автомат → №2 УЗО (защита людей) → №3 розетки C16 → №4 свет C10.'],
      ['УЗО', 'Отключает при утечке 30 мА — защищает человека.'],
      ['Контактор и лампа', 'В квартирном щите не нужны — это лишние детали.']
    ],
    build(area, api){
      area.innerHTML =
        '<div class="tg-e-panel" id="epPanel">' +
          '<div class="tg-e-panel-top">' +
            '<span class="tg-lamp" id="epLamp"></span><b>СЕТЬ</b>' +
            '<button type="button" class="tg-e-main" id="epMain" disabled>ВКЛЮЧИТЬ ЩИТ</button>' +
          '</div>' +
          '<div class="tg-e-rail">' +
            slotNames.map((n, i) => '<button type="button" class="tg-mount" data-slot="' + i + '"><b>' + (i + 1) + '</b><small>' + n + '</small></button>').join('') +
          '</div>' +
          '<div class="tg-e-lamps">' +
            '<label><span class="tg-e-bulb" style="font-size:24px" id="epSock">🔌</span>розетки</label>' +
            '<label><span class="tg-e-bulb" style="font-size:24px" id="epLight">💡</span>свет</label>' +
          '</div>' +
        '</div>' +
        '<div class="tg-e-tray">' +
          parts.map((p) => '<button type="button" class="tg-brk" data-part="' + p.id + '"><span class="mini"></span>' + p.name + '</button>').join('') +
        '</div>';
      const panel = area.querySelector('#epPanel');
      const main = area.querySelector('#epMain');
      const lamp = area.querySelector('#epLamp');

      function pickPart(btn, part){
        if (sel) area.querySelector('[data-part="' + sel.id + '"]').classList.remove('sel');
        sel = part; btn.classList.add('sel');
        api.feedback('Взято: ' + part.name + '. Теперь нажми место №' + (part.slot + 1) + ' на рейке.');
      }
      function mountClick(mount, idx){
        if (!sel){ api.feedback('Сначала возьми автомат снизу.', 'bad'); return; }
        if (sel.slot !== idx){
          mistakes++;
          api.bad('Не сюда: ' + sel.name + ' не подходит на «' + slotNames[idx] + '». Порядок: ввод → УЗО → розетки → свет.');
          mount.classList.add('sel');
          setTimeout(() => mount.classList.remove('sel'), 400);
          return;
        }
        mount.classList.remove('sel');
        mount.innerHTML = '<span class="tg-brk-mod"><span>' + sel.name.split(' ')[0] + '</span></span>';
        mount.disabled = true;
        area.querySelector('[data-part="' + sel.id + '"]').disabled = true;
        sel = null;
        placed++;
        api.setProgress(placed, 4);
        api.sfx('place');
        api.feedback('Установлено ' + placed + ' из 4.');
        if (placed === 4){
          main.disabled = false;
          main.focus({ preventScroll: true });
          api.feedback('Щит собран! Жми «ВКЛЮЧИТЬ ЩИТ».');
        }
      }
      main.onclick = () => {
        lamp.classList.add('lit');
        main.classList.add('on');
        main.textContent = 'ЩИТ ПОД НАПРЯЖЕНИЕМ';
        area.querySelector('#epSock').textContent = '✅';
        const b = area.querySelector('#epLight');
        b.textContent = '💡';
        b.style.filter = 'drop-shadow(0 0 14px #f5a623)';
        api.sfx('power');
        api.ok('Щит под напряжением — розетки и свет работают!');
        setTimeout(() => api.finish(ePts(mistakes)), 1100);
      };
      parts.forEach((p) => {
        const btn = area.querySelector('[data-part="' + p.id + '"]');
        btn.onclick = () => pickPart(btn, p);
      });
      area.querySelectorAll('.tg-mount').forEach((m) => {
        m.onclick = () => mountClick(m, Number(m.dataset.slot));
      });
    },
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 2. Электромонтаж розетки: подключи провода ---- */
function openESocket(done, cancel){
  const wires = [
    { id: 'L', name: 'Коричневый · фаза', color: '#8a5a2b', path: 'M40 286 C 150 286, 250 250, 341 168' },
    { id: 'N', name: 'Голубой · ноль', color: '#2b6fa8', path: 'M40 286 C 170 300, 320 260, 421 168' },
    { id: 'PE', name: 'Жёлто-зелёный · земля', color: '#7ba33a', path: 'M40 286 C 120 200, 240 120, 380 112' }
  ];
  const termPos = { L: [341, 168], N: [421, 168], PE: [380, 112] };
  const termPct = { L: [71, 56], N: [87.7, 56], PE: [79.2, 37.3] };
  let mistakes = 0, connected = 0, sel = null;

  return window.openPlayGame({
    theme: 'e',
    icon: '🔌',
    title: 'Электромонтаж розетки',
    intro: 'Тянем провода к клеммам: возьми провод снизу и нажми клемму на розетке. Потом воткни вилку!',
    memo: [
      ['L — фаза', 'Коричневый провод — «рабочий», под напряжением.'],
      ['N — ноль', 'Голубой — обратный провод цепи.'],
      ['PE — земля', 'Жёлто-зелёный — защита, соединяет корпуса с землёй.']
    ],
    build(area, api){
      area.innerHTML =
        '<div class="tg-socket-scene" id="skScene">' +
          '<svg viewBox="0 0 480 300" preserveAspectRatio="none">' +
            '<rect x="300" y="70" width="160" height="180" rx="18" fill="#e9edf2" stroke="#c3cad4" stroke-width="3"/>' +
            '<rect x="72" y="82" width="196" height="116" rx="0" fill="none"/>' +
            '<rect x="350" y="95" width="60" height="26" rx="6" fill="#dfe5ec" stroke="#b9c2cf"/>' +
            '<rect x="318" y="150" width="46" height="30" rx="6" fill="#dfe5ec" stroke="#b9c2cf"/>' +
            '<rect x="398" y="150" width="46" height="30" rx="6" fill="#dfe5ec" stroke="#b9c2cf"/>' +
            '<text x="380" y="113" fill="#8b94a1" font-size="11" text-anchor="middle" font-family="monospace">PE</text>' +
            '<text x="341" y="169" fill="#8b94a1" font-size="11" text-anchor="middle" font-family="monospace">L</text>' +
            '<text x="421" y="169" fill="#8b94a1" font-size="11" text-anchor="middle" font-family="monospace">N</text>' +
            '<g id="skWires"></g>' +
            '<circle id="skPlugLamp" cx="40" cy="286" r="0" fill="none"/>' +
          '</svg>' +
          wires.map((w) => '<button type="button" class="tg-term" data-term="' + w.id + '" style="left:' + termPct[w.id][0] + '%;top:' + termPct[w.id][1] + '%">' + w.id + '</button>').join('') +
        '</div>' +
        '<div class="tg-plugs">' +
          wires.map((w) => '<button type="button" class="tg-plug" data-wire="' + w.id + '"><span class="pl" style="background:' + w.color + '"></span>' + w.name + '</button>').join('') +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:16px;justify-content:center">' +
          '<div class="tg-e-bulb"><span class="b" id="skBulb">🕯️</span>лампа нагрузки</div>' +
          '<button type="button" class="tg-btn-big tg-btn-start" id="skPlugBtn" disabled>ВСТАВИТЬ ВИЛКУ</button>' +
        '</div>';
      const scene = area.querySelector('#skScene');
      const wiresG = area.querySelector('#skWires');

      area.querySelectorAll('.tg-plug').forEach((btn) => {
        btn.onclick = () => {
          if (sel) area.querySelector('[data-wire="' + sel + '"]').classList.remove('sel');
          sel = wires.find((w) => w.id === btn.dataset.wire);
          btn.classList.add('sel');
          api.feedback('Взято: ' + sel.name + '. Нажми клемму ' + sel.id + ' на розетке.');
        };
      });
      area.querySelectorAll('.tg-term').forEach((btn) => {
        btn.onclick = () => {
          if (!sel){ api.feedback('Сначала возьми провод снизу.', 'bad'); return; }
          if (sel.id !== btn.dataset.term){
            mistakes++;
            api.sfx('spark');
            scene.classList.add('spark');
            setTimeout(() => scene.classList.remove('spark'), 450);
            api.bad('Искра! ' + sel.name + ' не в клемму ' + btn.dataset.term + '. Цвет провода подсказывает клемму.');
            return;
          }
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', sel.path);
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', sel.color);
          path.setAttribute('stroke-width', '9');
          path.setAttribute('stroke-linecap', 'round');
          wiresG.appendChild(path);
          btn.classList.add('filled');
          btn.disabled = true;
          area.querySelector('[data-wire="' + sel.id + '"]').disabled = true;
          sel = null;
          connected++;
          api.sfx('place');
          api.setProgress(connected, 3);
          api.feedback('Подключено ' + connected + ' из 3.');
          if (connected === 3){
            const pb = area.querySelector('#skPlugBtn');
            pb.disabled = false;
            pb.focus({ preventScroll: true });
            api.feedback('Все провода на месте! Втыкай вилку.');
          }
        };
      });
      area.querySelector('#skPlugBtn').onclick = () => {
        const bulb = area.querySelector('#skBulb');
        bulb.textContent = '💡';
        bulb.classList.add('lit');
        api.sfx('power');
        api.ok('Лампа горит — розетка работает на 230 В!');
        setTimeout(() => api.finish(ePts(mistakes)), 1100);
      };
    },
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 3. Поиск неисправности мультиметром: щупы и показания ---- */
function openEMeter(done, cancel){
  const points = [
    { id: 'av', name: 'Автомат QF1', kind: 'feeder' },
    { id: 'r1', name: 'Розетка №1', kind: 'branch' },
    { id: 'r2', name: 'Розетка №2', kind: 'branch' },
    { id: 'lamp', name: 'Светильник', kind: 'load' }
  ];
  const padPct = { av: [15.6, 44], r1: [42.7, 44], r2: [70, 44], lamp: [89.6, 44] };
  const faultId = points[Math.floor(Math.random() * points.length)].id;
  const readings = {
    v: {}, r: {}, b: {}
  };
  points.forEach((p) => {
    const broken = p.id === faultId;
    const downstream = points.find((x) => x.id === faultId).kind === 'feeder';
    const dead = broken || (downstream && p.kind !== 'feeder');
    readings.v[p.id] = dead ? '0 В' : '230 В';
    readings.r[p.id] = dead ? 'обрыв ∞' : (p.kind === 'load' ? '18 Ом' : '0,2 Ом');
    readings.b[p.id] = dead ? 'нет сигнала' : 'есть сигнал';
  });
  const modes = [
    { id: 'v', label: 'V~' },
    { id: 'r', label: 'Ω' },
    { id: 'b', label: '♪' }
  ];
  let mistakes = 0, mode = 'v';

  return window.openPlayGame({
    theme: 'e',
    icon: '🔍',
    title: 'Поиск неисправности мультиметром',
    intro: 'Розетки не работают. Поверни диск, тыкай щупами в точки схемы и найди сломанный элемент.',
    memo: [
      ['V~', 'Напряжение: в исправной точке 230 В.'],
      ['Ω', 'Сопротивление: у обрыва «∞».'],
      ['Прозвонка ♪', 'Пищит на целой цепи.'],
      ['Подсказка', '0 В сразу везде — сломан вводной автомат QF1.']
    ],
    build(area, api){
      area.innerHTML =
        '<div class="tg-meter-wrap">' +
          '<div class="tg-meter-box">' +
            '<div class="tg-meter-scr dead" id="mmScr">- - -</div>' +
            '<div class="tg-meter-modes">' +
              modes.map((m) => '<button type="button" class="tg-modebtn" data-mode="' + m.id + '" aria-pressed="false">' + m.label + '</button>').join('') +
            '</div>' +
            '<small style="color:#8fa2ba">Выбери режим, затем точку на схеме.</small>' +
          '</div>' +
          '<div class="tg-scheme" id="mmScheme">' +
            '<svg viewBox="0 0 480 240" preserveAspectRatio="none">' +
              '<line x1="75" y1="105" x2="205" y2="105" stroke="#4b5b7a" stroke-width="3"/>' +
              '<line x1="205" y1="105" x2="336" y2="105" stroke="#4b5b7a" stroke-width="3"/>' +
              '<line x1="336" y1="105" x2="432" y2="105" stroke="#4b5b7a" stroke-width="3"/>' +
              '<line x1="75" y1="130" x2="75" y2="200" stroke="#4b5b7a" stroke-width="3"/>' +
              '<line x1="432" y1="130" x2="432" y2="200" stroke="#4b5b7a" stroke-width="3"/>' +
              '<rect x="30" y="80" width="90" height="50" rx="8" fill="#182234" stroke="#3c4c6c"/>' +
              '<rect x="160" y="80" width="90" height="50" rx="8" fill="#182234" stroke="#3c4c6c"/>' +
              '<rect x="290" y="80" width="90" height="50" rx="8" fill="#182234" stroke="#3c4c6c"/>' +
              '<rect x="392" y="80" width="80" height="50" rx="8" fill="#182234" stroke="#3c4c6c"/>' +
            '</svg>' +
            points.map((p) => '<button type="button" class="tg-pad" data-pad="' + p.id + '" style="left:' + padPct[p.id][0] + '%;top:' + padPct[p.id][1] + '%">' + p.name + '</button>').join('') +
          '</div>' +
        '</div>' +
        '<div class="tg-replace">' +
          points.map((p) => '<button type="button" class="tg-scene-btn" data-rep="' + p.id + '">🔧 Заменить: ' + p.name + '</button>').join('') +
        '</div>';
      const scr = area.querySelector('#mmScr');
      area.querySelectorAll('.tg-modebtn').forEach((btn) => {
        btn.onclick = () => {
          mode = btn.dataset.mode;
          area.querySelectorAll('.tg-modebtn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          scr.classList.add('dead');
          scr.textContent = '- - -';
          api.feedback('Режим ' + (modes.find((m) => m.id === mode).label) + '. Теперь нажми точку на схеме.');
        };
      });
      area.querySelectorAll('.tg-pad').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.dataset.pad;
          scr.classList.remove('dead');
          scr.textContent = readings[mode][id];
          area.querySelectorAll('.tg-pad').forEach((b) => b.classList.toggle('probed', b === btn));
          const p = points.find((x) => x.id === id);
          api.feedback(p.name + ' · ' + (modes.find((m) => m.id === mode).label) + ': ' + readings[mode][id] + '. Сравни с другими точками.');
        };
      });
      area.querySelectorAll('[data-rep]').forEach((btn) => {
        btn.onclick = () => {
          if (btn.dataset.rep === faultId){
            api.sfx('power');
            api.ok('Верно! Неисправность была в «' + points.find((p) => p.id === faultId).name + '» — заменили, всё заработало!');
            setTimeout(() => api.finish(ePts(mistakes)), 1100);
          } else {
            mistakes++;
            btn.classList.add('wrong');
            setTimeout(() => btn.classList.remove('wrong'), 500);
            api.bad('«' + points.find((p) => p.id === btn.dataset.rep).name + '» исправен. Сверь показания: у неисправной точки 0 В, «обрыв ∞» и нет сигнала.');
          }
        };
      });
    },
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 4. Пуск электродвигателя: панель с ротором ---- */
function openEMotor(done, cancel){
  let mistakes = 0, qf = false, running = false;

  return window.openPlayGame({
    theme: 'e',
    icon: '⚙️',
    title: 'Пуск электродвигателя',
    intro: 'Настоящая панель: автомат → ПУСК (звезда) → переключить на треугольник. Ошибёшься — сработает защита!',
    memo: [
      ['Порядок', '1) Вводной автомат QF1. 2) Кнопка ПУСК — разгон «звездой». 3) Переключить «звезда → треугольник» — полная мощность.'],
      ['Защита', 'ПУСК без автомата или треугольник без разгона — срабатывает защита, всё отключается.'],
      ['Звезда', 'Пусковой ток меньше — двигатель разгоняется мягко.']
    ],
    build(area, api){
      area.innerHTML =
        '<div class="tg-motor-panel" id="moPanel">' +
          '<div class="tg-motor-row">' +
            '<label class="lbl"><span class="tg-lamp" id="moNet"></span>СЕТЬ</label>' +
            '<button type="button" class="tg-e-main" id="moQf">QF1 · ВВОД</button>' +
            '<button type="button" class="tg-btn-big tg-btn-start" id="moStart">ПУСК ▶</button>' +
            '<button type="button" class="tg-btn-big tg-btn-stop" id="moStop">■ СТОП</button>' +
          '</div>' +
          '<div class="tg-motor-row">' +
            '<label class="lbl"><span class="tg-lamp" id="moPusk"></span>ПУСК</label>' +
            '<label class="lbl"><span class="tg-lamp" id="moRun"></span>РАБОТА</label>' +
            '<button type="button" class="tg-e-main" id="moDelta">ЗВЕЗДА → ТРЕУГОЛЬНИК</button>' +
            '<div class="tg-motor-display" id="moDisp">РЕЖИМ: ОЖИДАНИЕ</div>' +
          '</div>' +
          '<div class="tg-motor-row">' +
            '<div class="tg-rotor" id="moRotor"><i></i><i></i><i></i><i></i></div>' +
            '<small style="color:#8fa2ba">ротор двигателя M3~</small>' +
          '</div>' +
        '</div>';
      const rotor = area.querySelector('#moRotor'), disp = area.querySelector('#moDisp'), panel = area.querySelector('#moPanel');
      function trip(msg){
        mistakes++;
        running = false;
        qf = false;
        panel.classList.add('tg-panel-trip');
        setTimeout(() => panel.classList.remove('tg-panel-trip'), 550);
        rotor.classList.remove('spin-slow', 'spin-fast');
        ['moNet', 'moPusk', 'moRun'].forEach((id) => area.querySelector('#' + id).classList.remove('lit'));
        area.querySelector('#moQf').textContent = 'QF1 · ВВОД';
        area.querySelector('#moDelta').textContent = 'ЗВЕЗДА → ТРЕУГОЛЬНИК';
        disp.textContent = 'РЕЖИМ: ЗАЩИТА СРАБОТАЛА';
        api.bad(msg + ' Всё отключено — начни заново: сначала QF1.');
      }
      area.querySelector('#moQf').onclick = () => {
        qf = !qf;
        area.querySelector('#moNet').classList.toggle('lit', qf);
        area.querySelector('#moQf').textContent = qf ? 'QF1 · ВКЛЮЧЕН' : 'QF1 · ВВОД';
        api.feedback(qf ? 'Питание подано. Жми ПУСК.' : 'Автомат выключен.');
      };
      area.querySelector('#moStart').onclick = () => {
        if (running) return;
        if (!qf){ trip('ПУСК без питания!'); return; }
        running = true;
        rotor.classList.add('spin-slow');
        area.querySelector('#moPusk').classList.add('lit');
        disp.textContent = 'РЕЖИМ: ЗВЕЗДА · РАЗГОН';
        api.ok('Двигатель разгоняется «звездой» — пусковой ток маленький. Переключай на треугольник!');
      };
      area.querySelector('#moDelta').onclick = () => {
        if (!qf){ trip('Переключение без питания!'); return; }
        if (!running){ trip('Треугольник сразу после включения — большой пусковой ток!'); return; }
        rotor.classList.remove('spin-slow');
        rotor.classList.add('spin-fast');
        area.querySelector('#moPusk').classList.remove('lit');
        area.querySelector('#moRun').classList.add('lit');
        area.querySelector('#moDelta').textContent = 'ТРЕУГОЛЬНИК · РАБОТА';
        disp.textContent = 'РЕЖИМ: ТРЕУГОЛЬНИК · РАБОТА';
        api.ok('Двигатель на полной мощности — пуск выполнен!');
        setTimeout(() => api.finish(ePts(mistakes)), 1200);
      };
      area.querySelector('#moStop').onclick = () => {
        running = false;
        rotor.classList.remove('spin-slow', 'spin-fast');
        area.querySelector('#moPusk').classList.remove('lit');
        area.querySelector('#moRun').classList.remove('lit');
        disp.textContent = 'РЕЖИМ: ОЖИДАНИЕ';
        api.feedback('Двигатель остановлен.');
      };
    },
    onDone: done, onCancel: cancel
  });
}

/* ---- Игра 5. Сборка электрошкафа: отсеки и аппараты ---- */
function openE3D(done, cancel){
  const devices = [
    { id: 'qf', name: 'Автомат QF', slot: 0 },
    { id: 'uzo', name: 'УЗО', slot: 1 },
    { id: 'meter', name: 'Счётчик', slot: 2 },
    { id: 'pe', name: 'Шина PE', slot: 3 },
    { id: 'sock', name: 'Розетка', slot: -1 },
    { id: 'lamp', name: 'Лампа', slot: -1 }
  ];
  const slots = ['ПЕРЕГРУЗКА И КЗ', 'УТЕЧКА ТОКА', 'УЧЁТ ЭНЕРГИИ', 'ЗЕМЛЯ В ОДНУ ТОЧКУ'];
  let mistakes = 0, placed = 0, sel = null;

  return window.openPlayGame({
    theme: 'e',
    icon: '🗄️',
    title: 'Сборка электрошкафа',
    intro: 'Открой отсек шкафа и поставь аппарат, который решает его задачу. Потом включи рубильник!',
    memo: [
      ['Автомат QF', 'Перегрузка и короткое замыкание.'],
      ['УЗО', 'Утечка тока — защита человека.'],
      ['Счётчик', 'Учёт электроэнергии, кВт·ч.'],
      ['Шина PE', 'Собирает все провода заземления.']
    ],
    build(area, api){
      area.innerHTML =
        '<div class="tg-e-panel">' +
          '<div class="tg-e-panel-top">' +
            '<span class="tg-lamp" id="cabLamp"></span><b>ГОТОВ К ПУСКУ</b>' +
            '<button type="button" class="tg-e-main" id="cabMain" disabled>ПОДАТЬ НАПРЯЖЕНИЕ</button>' +
          '</div>' +
          '<div class="tg-e-rail">' +
            slots.map((s, i) => '<button type="button" class="tg-mount" data-slot="' + i + '"><b>ОТСЕК ' + (i + 1) + '</b><small>' + s + '</small></button>').join('') +
          '</div>' +
        '</div>' +
        '<div class="tg-e-tray">' +
          devices.map((d) => '<button type="button" class="tg-brk" data-part="' + d.id + '"><span class="mini"></span>' + d.name + '</button>').join('') +
        '</div>';
      function pickPart(btn, d){
        if (sel) area.querySelector('[data-part="' + sel.id + '"]').classList.remove('sel');
        sel = d; btn.classList.add('sel');
        api.feedback('Взято: ' + d.name + '. Нажми подходящий отсек.');
      }
      devices.forEach((d) => {
        area.querySelector('[data-part="' + d.id + '"]').onclick = (e) => pickPart(e.currentTarget, d);
      });
      area.querySelectorAll('.tg-mount').forEach((m) => {
        m.onclick = () => {
          const idx = Number(m.dataset.slot);
          if (!sel){ api.feedback('Сначала возьми аппарат снизу.', 'bad'); return; }
          if (sel.slot !== idx){
            mistakes++;
            api.bad('Не сюда: «' + sel.name + '» не решает задачу «' + slots[idx] + '».');
            return;
          }
          m.innerHTML = '<span class="tg-brk-mod"><span>' + sel.name.toUpperCase() + '</span></span>';
          m.disabled = true;
          area.querySelector('[data-part="' + sel.id + '"]').disabled = true;
          sel = null;
          placed++;
          api.setProgress(placed, 4);
          api.sfx('place');
          api.feedback('Установлено ' + placed + ' из 4.');
          if (placed === 4){
            area.querySelector('#cabMain').disabled = false;
            api.feedback('Шкаф укомплектован! Подавай напряжение.');
          }
        };
      });
      area.querySelector('#cabMain').onclick = () => {
        area.querySelector('#cabLamp').classList.add('lit');
        const b = area.querySelector('#cabMain');
        b.classList.add('on');
        b.textContent = 'ШКАФ ПОД НАПРЯЖЕНИЕМ';
        api.sfx('power');
        api.ok('Напряжение подано — шкаф в работе!');
        setTimeout(() => api.finish(ePts(mistakes)), 1100);
      };
    },
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
