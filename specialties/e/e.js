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
// ИНТЕРЬЕР ЭЛЕКТРОУЧАСТКА (13.02.13)
// Индустриальная подстанция: сталь, янтарный неон, зоны опасности,
// силовое оборудование с живой индикацией.
// ==================================================================
const E_COL = {
  floor: ['#252a33', '#1f242c', '#282d37', '#222730'],
  steel: '#3a4453', steelDark: '#1a212c',
  amber: '#f5a623', amber2: '#ffd166',
  hazard: '#f2c94c', hazardDark: '#17171a',
  copper: '#c98a3a', red: '#e0483a', cyan: '#5fd0e0', ok: '#6ef0b6'
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
    g.fillStyle = '#0d1117'; g.fillRect(0, 43, 44, 1); g.fillRect(43, 0, 1, 44);
    g.fillStyle = '#454e5c'; g.fillRect(0, 0, 44, 1);
    g.fillStyle = '#525b6a';
    g.fillRect(3, 3, 1, 1); g.fillRect(40, 3, 1, 1); g.fillRect(3, 40, 1, 1); g.fillRect(40, 40, 1, 1);
    // Стружка, царапины и искры
    for (let i = 0; i < 18; i++){
      g.fillStyle = i % 3 ? '#8ea0bb22' : '#05070c55';
      g.fillRect(2 + (n + i * 13) % 40, 2 + (n * 3 + i * 7) % 40, i % 5 === 0 ? 3 : 1, 1);
    }
    if (n % 7 === 0){ g.fillStyle = '#0a0806aa'; g.beginPath(); g.ellipse(16 + n % 12, 24, 6, 3, 0, 0, Math.PI * 2); g.fill(); }
    if (n % 5 === 0){ g.fillStyle = '#f5a62318'; g.fillRect(0, 20, 44, 2); }
    eFloorCache.set(key, tile);
  }
  ctx.drawImage(tile, x * 44, y * 44);
  // Технологический кабель-канал вдоль боковых стен
  if (x === 1 || x === 21){
    const px = x * 44 + (x === 1 ? 2 : 36);
    ctx.fillStyle = '#2a2113'; ctx.fillRect(px, y * 44, 6, 44);
    ctx.fillStyle = E_COL.amber; ctx.globalAlpha = 0.5;
    ctx.fillRect(px, y * 44, 6, 2);
    ctx.globalAlpha = 1;
  }
  // Разметка проезда по оси цеха
  if (y === 4 || y === 8){
    ctx.globalAlpha = 0.14; ctx.fillStyle = E_COL.amber;
    ctx.fillRect(x * 44 + 18, y * 44, 8, 44);
    ctx.globalAlpha = 1;
  }
}

function drawEWall(x, y){
  if (y < 2) return;
  const px = x * 44, py = y * 44;
  if (y === 14){
    // Защитный отбойник с жёлто-чёрной разметкой
    eBox(px, py, 44, 12, 12, '#3a3524', '#141310');
    for (let i = 0; i < 44; i += 11){
      eRect(px + i, py + 1, 6, 11, E_COL.hazard);
      eRect(px + i + 6, py + 1, 5, 11, E_COL.hazardDark);
    }
    eRect(px, py, 44, 1, '#5a5333');
  } else {
    eRect(px, py, 44, 44, '#161c26');
    eRect(px, py, 44, 1, '#232c39');
    eRect(px + (x === 0 ? 40 : 2), py, 2, 44, '#0f141c');
    // Янтарный короб-провод вдоль стены
    const cx = px + (x === 0 ? 34 : 8);
    eRect(cx, py, 4, 44, '#2a2113');
    eRect(cx, py, 4, 3, E_COL.amber);
    eRect(cx, py + 20, 4, 3, E_COL.amber);
    // Распределительная коробка
    eRect(cx - 4, py + 16, 12, 10, '#2a3340');
    eRect(cx - 2, py + 18, 8, 2, E_COL.copper);
  }
}

function drawEBackWall(now){
  const wallH = 88;
  // Стальные панели с швами и заклёпками
  eRect(0, 0, VW, wallH, '#0e131c');
  for (let x = 0; x < VW; x += 58){
    eRect(x, 0, 2, wallH, '#1b2230');
    eRect(x + 3, 13, 50, 1, '#232c3c');
    eRect(x + 3, 55, 50, 1, '#232c3c');
    eRect(x + 7, 6, 2, 2, '#3c4658'); eRect(x + 47, 6, 2, 2, '#3c4658');
    eRect(x + 7, 72, 2, 2, '#3c4658'); eRect(x + 47, 72, 2, 2, '#3c4658');
  }
  // Цоколь
  eRect(0, 80, VW, 8, '#080c13');
  eRect(0, 80, VW, 2, '#3a4254');
  // Верхний кабельный лоток с пучком проводки
  eRect(0, 0, VW, 10, '#080c13');
  eRect(0, 10, VW, 4, '#4a5568');
  eRect(0, 14, VW, 1, '#5e6c82');
  ctx.lineWidth = 2;
  [['#e0483a', 3], ['#5fd0e0', 6], ['#c98a3a', 9]].forEach((row) => {
    ctx.strokeStyle = row[0];
    ctx.beginPath(); ctx.moveTo(0, row[1]); ctx.lineTo(VW, row[1]); ctx.stroke();
  });

  // Тёплое неоновое зарево участка
  eGlow(506, 40, 300, '#f5a6231e');

  // ---- Центральная вывеска ----
  eBox(300, 12, 412, 42, 7, '#26313f', '#0e141d');
  eRect(306, 16, 400, 34, '#0a0f17');
  eRect(306, 16, 400, 2, '#ffd166');
  eText('ЭЛЕКТРОУЧАСТОК', 506, 40, 22, '#ffd166', 'center');
  eText('13.02.13 · ЭЛЕКТРООБОРУДОВАНИЕ И ЭЛЕКТРОХОЗЯЙСТВО', 506, 55, 8, '#e8b23a', 'center');

  // Прожекторы по краям вывески
  [288, 716].forEach((lx) => {
    eRect(lx, 10, 10, 44, '#1a222e');
    eRect(lx + 2, 14, 6, 36, '#0c121a');
    eRect(lx + 3, 22, 4, 22, '#ffd166');
    eGlow(lx + 5, 34, 58, '#f5a62330');
  });

  // ---- Знак электробезопасности слева ----
  eBox(42, 16, 110, 58, 6, '#2a2116', '#160f08');
  eRect(47, 20, 100, 50, '#1c1508');
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
  eText('ОПАСНО · 380 В', 97, 78, 7, '#c9a13a', 'center');

  // ---- Аварийная кнопка «СТОП» ----
  eBox(742, 18, 62, 54, 7, '#3a2226', '#1a0f12');
  eRect(747, 22, 52, 46, '#160c0e');
  ctx.beginPath(); ctx.arc(773, 40, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#c0392b'; ctx.fill();
  ctx.strokeStyle = '#e8c44a'; ctx.lineWidth = 4; ctx.stroke();
  ctx.beginPath(); ctx.arc(773, 40, 5, 0, Math.PI * 2); ctx.fillStyle = '#7d2018'; ctx.fill();
  eGlow(773, 40, 34, '#e0483a26');
  eText('СТОП', 773, 70, 8, '#e8b23a', 'center');

  // ---- Табло напряжения справа ----
  eBox(826, 16, 160, 56, 8, '#16301f', '#08140d');
  eRect(832, 21, 148, 38, '#05140b');
  eText('380 / 220 В', 906, 42, 16, '#7be0a6', 'center');
  eText('ВВОД · ЩИТ №1 · ВКЛ', 906, 58, 8, '#5fbf88', 'center');
  eGlow(906, 40, 78, '#48d8a420');
  // Индикация трёх фаз
  ['#e0483a', '#f2c94c', '#5fd0e0'].forEach((c, i) => {
    eRect(844 + i * 11, 24, 7, 7, '#0a1a12');
    eRect(845 + i * 11, 25, 5, 5, c);
  });

  // ---- Однолинейная схема под вывеской ----
  eBox(336, 60, 340, 18, 4, '#4a5568', '#232b3a');
  eRect(342, 63, 328, 12, '#0c1018');
  eRect(346, 69, 320, 1, '#c98a3a');
  for (let i = 0; i < 7; i++){
    eRect(360 + i * 44, 65, 14, 8, '#2b3a52');
    eRect(363 + i * 44, 67, 8, 1, i % 2 ? '#5fd0e0' : '#7be0a6');
  }
}

function drawEProps(now){
  // Световые пятна от прожекторов и ламп
  eGlow(160, 150, 210, '#f5a62316');
  eGlow(506, 150, 240, '#f5a6231a');
  eGlow(860, 150, 210, '#f5a62316');
  eGlow(506, 440, 250, '#f5a6230e');

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
  eBox(tx + 26, ty + 28, 148, 42, 24, '#7c8064', '#2b3040');
  for (let i = 0; i < 8; i++) eRect(tx + 32 + i * 17, ty + 28, 6, 42, '#3d4250');
  // Вводы-изоляторы сверху
  for (let i = 0; i < 3; i++){
    eRect(tx + 56 + i * 44, ty + 12, 8, 18, '#8a8f9c');
    eRect(tx + 54 + i * 44, ty + 8, 12, 5, '#c9cfd8');
    eGlow(tx + 60 + i * 44, ty + 8, 22, '#f5a62333');
  }
  // Маслоуказатель и шильдик
  eRect(tx + 128, ty + 38, 10, 26, '#0d141d');
  eRect(tx + 130, ty + 40, 6, 16, E_COL.copper);
  eRect(tx + 34, ty + 34, 28, 14, '#222a37');
  eText('ТМ-100', tx + 48, ty + 44, 7, '#d7c98a', 'center');
  eText('ЯЧЕЙКА · 10 кВ', tx + 98, ty + 82, 8, '#9aa6bd', 'center');

  // ---- Шкафы КРУ слева (x 2..7, y 2..3) ----
  for (let i = 0; i < 3; i++){
    const cx = 2 * 44 + 8 + i * 88;
    eRect(cx + 4, ty + 66, 82, 10, '#05070c99');
    eBox(cx, ty - 4, 82, 56, 24, '#5c6779', '#222a37');
    eRect(cx + 6, ty + 2, 70, 40, '#0d141d');
    for (let r = 0; r < 4; r++){
      const on = (r + i) % 2 === 0;
      eRect(cx + 12, ty + 6 + r * 9, 58, 6, '#2b3a52');
      eRect(cx + 16, ty + 8 + r * 9, 42, 1, on ? '#5fd0e0' : '#c98a3a');
      for (let d = 0; d < 4; d++) eRect(cx + 60 - d * 5, ty + 7 + r * 9, 2, 4, on ? '#7be0a6' : '#33415a');
    }
    eRect(cx + 36, ty + 46, 16, 4, '#d7c98a');
    eText('КРУ-' + (i + 1), cx + 41, ty + 64, 8, '#9aa6bd', 'center');
    eGlow(cx + 41, ty + 20, 46, '#5fd0e014');
  }

  // ---- Кабельные барабаны справа (x 16..20, y 2..3) ----
  for (let i = 0; i < 2; i++){
    const dx = 16 * 44 + 34 + i * 100, dy = ty + 42;
    eRect(dx - 34, dy + 30, 68, 8, '#05070c99');
    ctx.beginPath(); ctx.arc(dx, dy, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#3a2f1c'; ctx.fill();
    ctx.strokeStyle = '#6b5a34'; ctx.lineWidth = 3; ctx.stroke();
    for (let k = 0; k < 4; k++){
      ctx.beginPath(); ctx.arc(dx, dy, 26 - k * 5, 0, Math.PI * 2);
      ctx.strokeStyle = k % 2 ? '#c9a13a' : '#8a6a1f'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(dx, dy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#6b5a34'; ctx.fill();
    eGlow(dx, dy, 42, '#c98a3a14');
  }
  eText('КАТУШКИ · КГ 3×2,5', 16 * 44 + 84, ty + 88, 8, '#9aa6bd', 'center');

  // ---- Верстаки за станциями (y = 5 и y = 9) ----
  const benches = [[4, 5], [15, 5], [4, 9], [15, 9]];
  benches.forEach((b, i) => {
    const px = b[0] * 44, py = b[1] * 44;
    eRect(px - 4, py + 50, 136, 8, '#05070c99');
    eBox(px - 6, py + 12, 140, 24, 16, '#9a8a6a', '#403826');
    for (let k = 0; k < 4; k++) eRect(px - 2, py + 18 + k * 5, 132, 1, '#5b4f38');
    // Мультиметр с индикацией
    eRect(px + 10, py + 14, 30, 12, '#1d2430');
    eRect(px + 14, py + 17, 22, 6, '#0d1a14');
    eRect(px + 16, py + 19, 12 + (i % 2) * 6, 1, '#6ef0b6');
    // Ящик с инструментом и отвёртки
    eRect(px + 88, py + 12, 30, 12, '#2a3040');
    eRect(px + 92, py + 14, 22, 3, '#c98a3a');
    eRect(px + 52, py + 13, 4, 10, '#c0392b');
    eRect(px + 58, py + 13, 4, 10, '#7be0a6');
    eText('VDE', px + 6, py + 40, 8, '#7c8794');
    eGlow(px + 26, py + 20, 42, '#f5a6230e');
  });

  // ---- Кабельные барабаны в нижних углах ----
  [[1, 12], [20, 12]].forEach((c, i) => {
    const dx = c[0] * 44 + 44, dy = c[1] * 44 + 22;
    eRect(dx - 24, dy + 20, 48, 8, '#05070c99');
    ctx.beginPath(); ctx.arc(dx, dy, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#3a2f1c'; ctx.fill();
    ctx.strokeStyle = '#c9a13a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(dx, dy, 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#8a6a1f'; ctx.lineWidth = 2; ctx.stroke();
    eText(i ? 'КГ' : 'ВВГ', dx, dy + 4, 8, '#c9cfd8', 'center');
  });

  // ---- Диэлектрический коврик перед стендом монтажа ----
  eRect(10 * 44 + 2, 11 * 44 + 2, 92, 38, '#171b22');
  eRect(10 * 44 + 2, 11 * 44 + 2, 92, 2, E_COL.hazard);
  eRect(10 * 44 + 2, 11 * 44 + 38, 92, 2, E_COL.hazard);

  // ---- Полупрозрачная разметка на полу ----
  eText('ЭЛЕКТРОЩИТ · 380 В', 506, 540, 13, '#3d4656', 'center');
  eText('НЕ ТРОГАЙ · ОПАСНО', 506, 562, 10, '#4a3a12', 'center');
}

/* ------------------------------------------------------------------
   ОТРИСОВКА СТАНКА Э
   ------------------------------------------------------------------ */
function eMonitor(x, y, kind, now){
  eGlow(x + 22, y + 22, 46, kind === 'meter' ? '#f5a62326' : '#5fd0e01f');
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
  const accent = done ? '#4fd69f' : (hard ? '#c084fc' : '#f5a623');
  eGlow(0, -6, 78, done ? '#48d8a41f' : '#f5a62322');

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
    eText('M', 0, -20, 12, '#f5a623', 'center');
    eCable([18, -30, 40, -34, 46, -12, 40, 8], '#c0392b');
    eRect(-44, 42, 88, 2, accent);
  } else {
    // 3D-стенд монтажа: проектор и голографический куб
    eRect(-58, 44, 120, 14, '#070a11a0');
    eBox(-46, 44, 92, 12, 12, '#2a3040', '#141821');
    eGlow(0, -24, 58, '#f5a6232e');
    eBox(-32, 8, 64, 32, 10, '#39424f', '#1b222d');
    eRect(-26, 14, 52, 4, '#0d1a14');
    eText('3D-МОНТАЖ', 0, 30, 9, '#f5a623', 'center');
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
    quad([top[0], top[1], bot[1], bot[0]], '#f5a62326', '#f5a623cc');
    quad([top[1], top[2], bot[2], bot[1]], '#ffd1661a', '#f5a62399');
    quad(top, '#ffd16633', '#ffd166');
    eRect(-7, -24 - s * 0.5 + 3, 6, 6, '#5fd0e0');
    eRect(3, -24 - s * 0.5 + 8, 6, 6, '#7be0a6');
    eRect(-46, 42, 92, 2, accent);
  }
}

window.STATION_RENDERERS = window.STATION_RENDERERS || {};
window.STATION_RENDERERS.e = drawEStation;

/* ------------------------------------------------------------------
   МИНИ-ИГРЫ Э
   ------------------------------------------------------------------ */
const EKit = window.LabKit;

function eTile(dev, cls){
  const b = EKit.h('button', 'lab-tile' + (cls ? ' ' + cls : ''));
  b.type = 'button';
  b.dataset.id = dev.id;
  b.setAttribute('aria-pressed', 'false');
  b.appendChild(EKit.h('strong', null, dev.name));
  if (dev.note) b.appendChild(EKit.h('span', null, dev.note));
  return b;
}
function ePointsOf(mistakes, base){
  return Math.max(base, 220 - mistakes * 25);
}

/* ---- Игра 1. Сборка распределительного щита ---- */
function openEPanel(done, cancel){
  const devices = [
    { id: 'main',  name: 'Вводной автомат C40', note: '2P · общее отключение щита' },
    { id: 'rcd',   name: 'УЗО 30 мА',           note: 'защита от утечки тока' },
    { id: 'sock',  name: 'Автомат «Розетки» C16', note: 'групповая линия 16 А' },
    { id: 'light', name: 'Автомат «Освещение» C10', note: 'групповая линия 10 А' }
  ];
  const order = ['main', 'rcd', 'sock', 'light'];
  const slotDefs = [
    { label: '№1 · от ввода' },
    { label: '№2' },
    { label: '№3' },
    { label: '№4 · к нагрузке' }
  ];
  let mistakes = 0, solved = 0, selected = null;

  const ui = EKit.create({
    theme: 'e',
    tag: 'Распределительный щит · оборудование',
    title: 'Сборка распределительного щита',
    objective: 'Расставьте аппараты на DIN-рейку в правильном порядке: от ввода питания к линиям нагрузки. Сначала выберите аппарат, затем слот на рейке.',
    howto: [
      'Выберите аппарат в списке «Аппараты в наличии» — плитка подсветится.',
      'Нажмите на слот DIN-рейки, чтобы поставить в него аппарат.',
      'Порядок строго от ввода к нагрузке: вводной автомат → УЗО → линия розеток → линия освещения.',
      'Заполните все 4 слота — щит собран.'
    ],
    hint: 'Правило щита: начинаем с общего вводного автомата, затем идёт УЗО (защита от утечки), и только потом автоматы групп нагрузки.',
    steps: 4,
    onDone: done, onCancel: cancel
  });

  const feedback = EKit.h('p', 'lab-feedback');
  const columns = EKit.h('div', 'lab-columns');
  const leftCol = EKit.h('div');
  leftCol.appendChild(EKit.h('h3', 'lab-col-title', 'Аппараты в наличии'));
  const tray = EKit.h('div', 'lab-tray');
  EKit.shuffle(devices).forEach((dev) => {
    const t = eTile(dev);
    t.onclick = () => {
      selected = dev.id;
      tray.querySelectorAll('.lab-tile').forEach((n) => n.setAttribute('aria-pressed', String(n.dataset.id === dev.id)));
      feedback.className = 'lab-feedback';
      feedback.textContent = 'Выбрано: ' + dev.name + '. Нажмите слот на рейке.';
    };
    tray.appendChild(t);
  });
  leftCol.appendChild(tray);

  const rightCol = EKit.h('div');
  rightCol.appendChild(EKit.h('h3', 'lab-col-title', 'DIN-рейка щита'));
  const rail = EKit.h('div', 'lab-rail');
  const railSlots = EKit.h('div', 'lab-rail-slots');
  const slotEls = slotDefs.map((sd, i) => {
    const s = EKit.h('button', 'lab-slot');
    s.type = 'button';
    s.appendChild(EKit.h('small', null, sd.label));
    s.appendChild(EKit.h('strong', null, 'пусто'));
    s.onclick = () => place(s, i);
    railSlots.appendChild(s);
    return s;
  });
  rail.appendChild(railSlots);
  rightCol.appendChild(rail);

  columns.append(leftCol, rightCol);
  ui.body.append(columns, feedback);

  function place(slot, index){
    if (ui.isClosed() || slot.classList.contains('correct')) return;
    if (!selected){
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Сначала выберите аппарат из списка слева.';
      return;
    }
    const dev = devices.find((d) => d.id === selected);
    if (dev.id === order[index]){
      slot.classList.add('correct');
      slot.querySelector('strong').textContent = dev.name;
      slot.querySelector('small').textContent = dev.note;
      slot.disabled = true;
      tray.querySelector('[data-id="' + dev.id + '"]').disabled = true;
      selected = null;
      solved++;
      ui.setProgress(solved, 4);
      feedback.className = 'lab-feedback ok';
      feedback.textContent = 'Верно: ' + dev.name + ' установлен в слот ' + slotDefs[index].label + '.';
      if (solved === order.length){
        rail.classList.add('built');
        feedback.textContent += ' Щит собран. Осталось подать напряжение!';
        setTimeout(() => ui.finish(ePointsOf(mistakes, 60)), 650);
      }
    } else {
      mistakes++;
      slot.classList.add('incorrect');
      setTimeout(() => slot.classList.remove('incorrect'), 400);
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Не по порядку: ' + dev.name + ' ставится не сюда. Соблюдайте порядок «ввод → защита → группы».';
    }
  }
  return ui;
}

/* ---- Игра 2. Электромонтаж розетки ---- */
function openESocket(done, cancel){
  const wires = [
    { id: 'pe', name: 'Жёлто-зелёный провод', note: 'заземляющий PE' },
    { id: 'n',  name: 'Синий провод',         note: 'рабочий ноль N' },
    { id: 'l',  name: 'Коричневый провод',    note: 'фаза L' }
  ];
  const terms = [
    { id: 'l',  name: 'L',  sub: 'фаза',      dot: '#8a5a2b' },
    { id: 'n',  name: 'N',  sub: 'ноль',      dot: '#2b6fa8' },
    { id: 'pe', name: 'PE', sub: 'заземление', dot: '#7ba33a' }
  ];
  let mistakes = 0, solved = 0, selected = null, deenergized = false;

  const ui = EKit.create({
    theme: 'e',
    tag: 'Розеточная линия · монтаж',
    title: 'Электромонтаж розетки',
    objective: 'Сначала обесточьте линию, затем подключите провода к клеммам розетки: фаза L, рабочий ноль N и заземление PE.',
    howto: [
      'Переключите автомат в положение «отключено» — под напряжением работать запрещено.',
      'Выберите провод в списке слева (цвет подсказывает назначение).',
      'Нажмите на клемму розетки, куда этот провод подключается.',
      'Подключите все три провода: L, N и PE.'
    ],
    hint: 'Коричневый = фаза L, синий = рабочий ноль N, жёлто-зелёный = заземление PE.',
    onDone: done, onCancel: cancel
  });

  const feedback = EKit.h('p', 'lab-feedback');

  // Шаг безопасности
  const safety = EKit.h('div', 'lab-switch-row');
  const sw = EKit.h('button', 'lab-switch');
  sw.type = 'button';
  sw.setAttribute('aria-pressed', 'false');
  sw.appendChild(EKit.h('i'));
  const safetyText = EKit.h('div');
  safetyText.appendChild(EKit.h('strong', null, 'Автомат в щите: ПОД НАПРЯЖЕНИЕМ'));
  safetyText.appendChild(EKit.h('div', null, 'Нажмите переключатель, чтобы обесточить линию перед монтажом'));
  safety.append(sw, safetyText);
  sw.onclick = () => {
    deenergized = !deenergized;
    sw.classList.toggle('on', deenergized);
    sw.setAttribute('aria-pressed', String(deenergized));
    safety.classList.toggle('ok', deenergized);
    safety.classList.toggle('bad', !deenergized);
    safetyText.firstChild.textContent = deenergized ? 'Автомат отключён: НАПРЯЖЕНИЯ НЕТ' : 'Автомат в щите: ПОД НАПРЯЖЕНИЕМ';
    feedback.className = 'lab-feedback';
    feedback.textContent = deenergized ? 'Линия обесточена — можно монтировать.' : 'Опасно! Линия под напряжением 230 В.';
  };

  const columns = EKit.h('div', 'lab-columns');
  const leftCol = EKit.h('div');
  leftCol.appendChild(EKit.h('h3', 'lab-col-title', 'Провода'));
  const tray = EKit.h('div', 'lab-tray');
  EKit.shuffle(wires).forEach((w) => {
    const t = eTile(w);
    t.onclick = () => {
      selected = w.id;
      tray.querySelectorAll('.lab-tile').forEach((n) => n.setAttribute('aria-pressed', String(n.dataset.id === w.id)));
      feedback.className = 'lab-feedback';
      feedback.textContent = 'Выбрано: ' + w.name + ' (' + w.note + '). Нажмите клемму.';
    };
    tray.appendChild(t);
  });
  leftCol.appendChild(tray);

  const rightCol = EKit.h('div');
  rightCol.appendChild(EKit.h('h3', 'lab-col-title', 'Клеммы розетки'));
  const socket = EKit.h('div', 'lab-socket');
  const termEls = terms.map((tm) => {
    const s = EKit.h('button', 'lab-slot');
    s.type = 'button';
    const dot = EKit.h('span', 'term-dot');
    dot.style.background = tm.dot;
    s.append(dot, EKit.h('strong', null, tm.name), EKit.h('small', null, tm.sub));
    s.onclick = () => connect(s, tm);
    socket.appendChild(s);
    return s;
  });
  rightCol.appendChild(socket);

  columns.append(leftCol, rightCol);
  ui.body.append(safety, columns, feedback);

  function connect(slot, term){
    if (ui.isClosed() || slot.classList.contains('correct')) return;
    if (!deenergized){
      mistakes++;
      slot.classList.add('incorrect');
      setTimeout(() => slot.classList.remove('incorrect'), 400);
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Стоп! Сначала отключите автомат — работать под напряжением запрещено.';
      return;
    }
    if (!selected){
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Сначала выберите провод слева.';
      return;
    }
    const wire = wires.find((w) => w.id === selected);
    if (wire.id === term.id){
      slot.classList.add('correct');
      slot.querySelector('strong').textContent = term.name + ' ✓';
      slot.querySelector('small').textContent = wire.name;
      slot.disabled = true;
      tray.querySelector('[data-id="' + wire.id + '"]').disabled = true;
      selected = null;
      solved++;
      feedback.className = 'lab-feedback ok';
      feedback.textContent = term.name + ' — ' + wire.note + ' подключён верно.';
      if (solved === terms.length){
        feedback.textContent = 'Розетка подключена: L, N и PE на своих местах. Можно подавать напряжение!';
        setTimeout(() => ui.finish(ePointsOf(mistakes, 60)), 650);
      }
    } else {
      mistakes++;
      slot.classList.add('incorrect');
      setTimeout(() => slot.classList.remove('incorrect'), 400);
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Неверно: ' + wire.name + ' — это не ' + term.name + '. Проверьте назначение провода по цвету.';
    }
  }
  return ui;
}

/* ---- Игра 3. Поиск неисправности мультиметром ---- */
function openEMeter(done, cancel){
  const points = [
    { id: 'av',   name: 'Автомат QF1', kind: 'feeder' },
    { id: 'r1',   name: 'Розетка №1',  kind: 'branch' },
    { id: 'r2',   name: 'Розетка №2',  kind: 'branch' },
    { id: 'lamp', name: 'Светильник',  kind: 'load' }
  ];
  // Неисправный элемент выбирается случайно — каждый раз новая поломка.
  const faultId = points[Math.floor(Math.random() * points.length)].id;
  const modes = [
    { id: 'v',  label: 'V~ напряжение' },
    { id: 'r',  label: 'Ω сопротивление' },
    { id: 'b',  label: '🅞 прозвонка' }
  ];
  // Нормальные показания (цепь исправна)
  const okV = { av: '230 В', r1: '230 В', r2: '230 В', lamp: '230 В' };
  const okR = { av: '0,0 Ом', r1: '0,2 Ом', r2: '0,2 Ом', lamp: '18 Ом' };
  const okB = { av: 'есть сигнал', r1: 'есть сигнал', r2: 'есть сигнал', lamp: 'есть сигнал' };
  // Показания неисправной точки зависят от её роли в цепи.
  const readings = {
    v: { av: '0 В', r1: '0 В', r2: '0 В', lamp: '0 В' },
    r: { av: 'обрыв ∞', r1: 'обрыв ∞', r2: 'обрыв ∞', lamp: 'обрыв ∞' },
    b: { av: 'нет сигнала', r1: 'нет сигнала', r2: 'нет сигнала', lamp: 'нет сигнала' }
  };
  const faultPt = points.find((p) => p.id === faultId);
  points.forEach((p) => {
    if (p.id === faultId){
      readings.v[p.id]  = '0 В';
      readings.r[p.id]  = 'обрыв ∞';
      readings.b[p.id]  = 'нет сигнала';
      return;
    }
    // Если сгорел вводной автомат — питание пропадает везде ниже по цепи.
    if (faultPt.kind === 'feeder' && p.kind !== 'feeder'){
      readings.v[p.id] = '0 В';
      readings.r[p.id] = 'обрыв ∞';
      readings.b[p.id] = 'нет сигнала';
      return;
    }
    // Остальные точки исправны.
    readings.v[p.id] = okV[p.id];
    readings.r[p.id] = okR[p.id];
    readings.b[p.id] = okB[p.id];
  });
  let mistakes = 0, mode = 'v';

  const ui = EKit.create({
    theme: 'e',
    tag: 'Диагностика · мультиметр',
    title: 'Поиск неисправности в розеточной группе',
    objective: 'Жалоба: часть розеточной группы не работает. Переключайте режим мультиметра, замеряйте точки и найдите неисправный элемент — каждый раз он разный.',
    howto: [
      'Выберите режим мультиметра слева: V~ (напряжение), Ω (сопротивление) или 🅞 (прозвонка).',
      'Нажмите точки схемы справа — прибор покажет показание (в одну точку зондируется только текущая).',
      'Сравните показания: у исправных точек они одинаковые, у неисправной — 0 В, «обрыв ∞» и «нет сигнала».',
      'Отметьте неисправный элемент в блоке «Определите неисправность».'
    ],
    hint: 'Признак обрыва: в прозвонке «нет сигнала», сопротивление «обрыв ∞», а напряжение 0 В. Если сгорел вводной автомат — 0 В будет сразу на всех точках ниже по цепи.',
    onDone: done, onCancel: cancel
  });

  const layout = EKit.h('div', 'lab-columns');
  const leftCol = EKit.h('div');
  leftCol.appendChild(EKit.h('h3', 'lab-col-title', 'Мультиметр'));
  const meter = EKit.h('div', 'lab-meter');
  const screen = EKit.h('div', 'lab-meter-screen dead', '--- ---');
  const modesRow = EKit.h('div', 'lab-modes');
  const modeBtns = modes.map((m) => {
    const b = EKit.h('button', 'lab-mode', m.label);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(m.id === mode));
    b.onclick = () => {
      mode = m.id;
      modeBtns.forEach((n) => n.setAttribute('aria-pressed', String(n === b)));
      screen.className = 'lab-meter-screen dead';
      screen.textContent = '--- ---';
    };
    modesRow.appendChild(b);
    return b;
  });
  meter.append(screen, modesRow);
  leftCol.appendChild(meter);
  leftCol.appendChild(EKit.h('p', 'lab-note', 'Сначала выберите режим, затем нажмите точку схемы — прибор покажет значение. Найденную неисправность отметьте в правой колонке.'));

  const rightCol = EKit.h('div');
  rightCol.appendChild(EKit.h('h3', 'lab-col-title', 'Схема розеточной группы'));
  const pts = EKit.h('div', 'lab-points');
  points.forEach((p) => {
    const b = EKit.h('button', 'lab-point');
    b.type = 'button';
    b.appendChild(EKit.h('strong', null, p.name));
    b.onclick = () => {
      screen.className = 'lab-meter-screen';
      screen.textContent = readings[mode][p.id];
      pts.querySelectorAll('.lab-point').forEach((n) => n.classList.remove('probed'));
      b.classList.add('probed');
    };
    pts.appendChild(b);
  });
  rightCol.appendChild(pts);

  const decideTitle = EKit.h('h3', 'lab-col-title', 'Определите неисправность');
  decideTitle.style.marginTop = '16px';
  rightCol.appendChild(decideTitle);
  const decide = EKit.h('div', 'lab-points');
  const candidates = points.map((p) => ({ id: p.id, name: 'Неисправно: ' + p.name }));
  const faultExplanation = {
    av: 'Верно! Сгорел вводной автомат QF1 — обрыв фазы на вводе, отсюда 0 В сразу на всех точках ниже по цепи.',
    r1: 'Верно! Обрыв в розетке №1 — нулевой проводник отвалился, цепь разорвана, отсюда 0 В и «обрыв ∞».',
    r2: 'Верно! Обрыв в розетке №2 — нулевой проводник отвалился, цепь разорвана, отсюда 0 В и «обрыв ∞».',
    lamp: 'Верно! Перегорел светильник — спираль лампы в обрыв, отсюда 0 В и «нет сигнала» в прозвонке.'
  };
  EKit.shuffle(candidates).forEach((c) => {
    const b = EKit.h('button', 'lab-point');
    b.type = 'button';
    b.appendChild(EKit.h('strong', null, c.name));
    b.onclick = () => {
      if (c.id === faultId){
        b.classList.add('probed');
        feedback.className = 'lab-feedback ok';
        feedback.textContent = faultExplanation[faultId];
        setTimeout(() => ui.finish(ePointsOf(mistakes, 80)), 900);
      } else {
        mistakes++;
        b.classList.add('picked');
        setTimeout(() => b.classList.remove('picked'), 400);
        feedback.className = 'lab-feedback bad';
        feedback.textContent = 'Нет: ' + c.name.replace('Неисправно: ', '') + ' работает нормально. Сверьте показания прибора.';
      }
    };
    decide.appendChild(b);
  });
  rightCol.appendChild(decide);

  const feedback = EKit.h('p', 'lab-feedback');
  layout.append(leftCol, rightCol);
  ui.body.append(layout, feedback);
  return ui;
}

/* ---- Игра 4. Пуск электродвигателя ---- */
function openEMotor(done, cancel){
  const steps = [
    { id: 'qf1',   name: 'Включить вводной автомат QF1',        note: 'питание щита' },
    { id: 'ctrl',  name: 'Подать питание цепи управления',       note: '24 В на схему' },
    { id: 'star',  name: 'Нажать «ПУСК» — включить «звезду»',    note: 'КМ1: пуск' },
    { id: 'delta', name: 'Переключить «звезда → треугольник»',   note: 'КМ2: разгон' },
    { id: 'run',   name: 'Ввести двигатель в рабочий режим',     note: 'КМ3: работа' }
  ];
  let progress = 0, mistakes = 0;

  const ui = EKit.create({
    theme: 'e',
    tag: 'Электропривод · пуск',
    title: 'Прямой пуск электродвигателя «звезда-треугольник»',
    objective: 'Включите двигатель в правильной последовательности. Ошибка в порядке = короткое замыкание, пуск придётся начать заново.',
    howto: [
      'Нажимайте кнопки в правильном порядке пуска двигателя.',
      'Сначала питание: вводной автомат, затем цепь управления.',
      'Затем пуск на «звезде», переключение на «треугольник» и рабочий режим.',
      'Ошибка в порядке = короткое замыкание: прогресс сбрасывается, начинайте заново.'
    ],
    hint: 'Мощный двигатель нельзя включать сразу «треугольником»: сначала пусковой режим «звезда», затем разгон и переключение на «треугольник».',
    steps: steps.length,
    onDone: done, onCancel: cancel
  });

  const feedback = EKit.h('p', 'lab-feedback');
  const seq = EKit.h('div', 'lab-seq');
  const btns = new Map();
  EKit.shuffle(steps).forEach((st) => {
    const b = EKit.h('button', 'lab-btn');
    b.type = 'button';
    b.appendChild(EKit.h('strong', null, st.name));
    b.appendChild(EKit.h('div', null, st.note));
    b.onclick = () => press(st);
    btns.set(st.id, b);
    seq.appendChild(b);
  });

  const motor = EKit.h('div', 'lab-motor');
  const rotor = EKit.h('div', 'rotor');
  const motorLabel = EKit.h('div', null, 'Двигатель: остановлен');
  motor.append(rotor, motorLabel);

  ui.body.append(seq, motor, feedback);

  function press(st){
    if (ui.isClosed()) return;
    const expected = steps[progress];
    const b = btns.get(st.id);
    if (st.id === expected.id){
      b.classList.add('done');
      b.disabled = true;
      progress++;
      ui.setProgress(progress, steps.length);
      feedback.className = 'lab-feedback ok';
      feedback.textContent = 'Шаг ' + progress + ': ' + st.name + '.';
      motorLabel.textContent = progress >= 3 ? 'Двигатель: разгон / вращение' : 'Двигатель: подготовка';
      if (progress >= 3) rotor.classList.add('spin');
      if (progress === steps.length){
        feedback.textContent = 'Пуск завершён! Двигатель вышел на рабочий режим.';
        setTimeout(() => ui.finish(ePointsOf(mistakes, 70)), 700);
      }
    } else {
      mistakes++;
      b.classList.add('wrong');
      setTimeout(() => b.classList.remove('wrong'), 450);
      progress = 0;
      rotor.classList.remove('spin');
      motorLabel.textContent = 'Двигатель: остановлен';
      btns.forEach((n) => { n.classList.remove('done'); n.disabled = false; });
      ui.setProgress(0, steps.length);
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Короткое замыкание! Порядок пуска нарушен. Начните заново с вводного автомата.';
    }
  }
  return ui;
}

/* ---- Игра 5. 3D-сборка электрошкафа ---- */
function openE3D(done, cancel){
  const parts = [
    { id: 'qs',  name: 'Вводной рубильник QS', note: 'главный выключатель' },
    { id: 'rcd', name: 'УЗО 30 мА',            note: 'защита от утечки' },
    { id: 'kwh', name: 'Счётчик кВт·ч',        note: 'учёт электроэнергии' },
    { id: 'c16', name: 'Автомат C16',          note: 'линия 16 А' }
  ];
  const sectors = [
    { id: 'qs',  title: 'ВВОД ПИТАНИЯ', task: 'Сюда приходит кабель 380 В от подстанции' },
    { id: 'rcd', title: 'ЗАЩИТА',       task: 'Спасает человека от тока утечки на землю' },
    { id: 'kwh', title: 'УЧЁТ',         task: 'Считает израсходованные киловатт-часы' },
    { id: 'c16', title: 'ЛИНИЯ 16 А',   task: 'Питает группу розеток' }
  ];
  let selected = null, solved = 0, mistakes = 0, angle = 0;

  const ui = EKit.create({
    theme: 'e',
    tag: '3D-стенд · монтаж шкафа',
    title: '3D-сборка электрошкафа',
    objective: 'Подберите каждому отсеку шкафа подходящий аппарат. Выберите аппарат, вращайте 3D-шкаф стрелками и нажмите на нужную грань.',
    howto: [
      'Выберите аппарат в списке снизу — плитка подсветится.',
      'Кнопками ◀ ▶ вращайте 3D-шкаф, чтобы увидеть все четыре грани-отсека.',
      'Прочитайте, какую задачу решает отсек, и нажмите на грань, если туда ставится выбранный аппарат.',
      'Соберите все 4 отсека — шкаф готов к подаче напряжения.'
    ],
    hint: 'Разложите по порядку «от ввода к нагрузке»: ввод питания → защита от утечки → учёт энергии → отходящая линия.',
    steps: 4,
    onDone: done, onCancel: cancel
  });

  const shuffled = EKit.shuffle(sectors).map((s, i) => Object.assign({}, s, { rot: i * 90 }));
  const feedback = EKit.h('p', 'lab-feedback');
  const faces = [];

  const scene = EKit.h('div', 'lab-scene3d');
  const cube = EKit.h('div', 'lab-cube3d');
  shuffled.forEach((sec) => {
    const face = EKit.h('div', 'lab-face3d');
    face.style.transform = 'rotateY(' + sec.rot + 'deg) translateZ(95px)';
    const inner = EKit.h('div', 'lab-face-inner');
    inner.appendChild(EKit.h('small', null, 'Отсек · поверните к себе'));
    inner.appendChild(EKit.h('strong', null, sec.title));
    inner.appendChild(EKit.h('div', 'lab-face-slot', sec.task));
    face.appendChild(inner);
    face.onclick = () => install(sec, inner);
    cube.appendChild(face);
    faces.push({ sec, inner, filled: false });
  });
  const capTop = EKit.h('div', 'lab-face3d');
  capTop.style.transform = 'rotateX(90deg) translateZ(95px)';
  capTop.appendChild(EKit.h('div', 'lab-face-inner lab-cap-inner', '⚡'));
  const capBot = EKit.h('div', 'lab-face3d');
  capBot.style.transform = 'rotateX(-90deg) translateZ(95px)';
  capBot.appendChild(EKit.h('div', 'lab-face-inner lab-cap-inner', 'СОТА'));
  cube.append(capTop, capBot);
  scene.appendChild(cube);

  function applyRot(){ cube.style.transform = 'rotateX(-14deg) rotateY(' + angle + 'deg)'; }
  applyRot();

  const controls = EKit.h('div', 'lab-scene-controls');
  const left = EKit.h('button', 'lab-rotbtn', '◀');
  left.type = 'button'; left.setAttribute('aria-label', 'Повернуть шкаф влево');
  const right = EKit.h('button', 'lab-rotbtn', '▶');
  right.type = 'button'; right.setAttribute('aria-label', 'Повернуть шкаф вправо');
  left.onclick = () => { angle -= 90; applyRot(); };
  right.onclick = () => { angle += 90; applyRot(); };
  controls.append(left, right);

  const caption = EKit.h('p', 'lab-scene-caption', 'Сейчас перед вами одна грань-отсек. Вращайте шкаф, чтобы найти нужную.');
  const trayTitle = EKit.h('h3', 'lab-col-title', 'Аппараты для установки');
  const tray = EKit.h('div', 'lab-tray');
  EKit.shuffle(parts).forEach((p) => {
    const t = EKit.h('button', 'lab-tile');
    t.type = 'button'; t.dataset.id = p.id;
    t.setAttribute('aria-pressed', 'false');
    t.appendChild(EKit.h('strong', null, p.name));
    t.appendChild(EKit.h('span', null, p.note));
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
      feedback.textContent = 'Сначала выберите аппарат в списке ниже.';
      return;
    }
    const part = parts.find((p) => p.id === selected);
    if (part.id === sec.id){
      st.filled = true;
      solved++;
      inner.classList.add('filled', 'pop');
      setTimeout(() => inner.classList.remove('pop'), 420);
      inner.querySelector('.lab-face-slot').textContent = '✔ ' + part.name;
      const tile = tray.querySelector('[data-id="' + part.id + '"]');
      if (tile){ tile.disabled = true; tile.setAttribute('aria-pressed', 'false'); }
      selected = null;
      ui.setProgress(solved, 4);
      feedback.className = 'lab-feedback ok';
      feedback.textContent = 'Верно! ' + part.name + ' установлен в отсек «' + sec.title + '».';
      if (solved === faces.length){
        feedback.textContent += ' Шкаф собран — можно подавать напряжение!';
        setTimeout(() => ui.finish(ePointsOf(mistakes, 90)), 800);
      }
    } else {
      mistakes++;
      inner.classList.add('miss');
      setTimeout(() => inner.classList.remove('miss'), 440);
      feedback.className = 'lab-feedback bad';
      feedback.textContent = 'Не сюда: ' + part.name + ' не решает задачу «' + sec.task + '».';
    }
  }

  return ui;
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
