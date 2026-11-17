/* ============================================================
   СОТА — Модуль специальности E (13.02.13)
   Электрооборудование и электрохозяйство
   Файл для независимой разработки команды
   ============================================================ */
'use strict';

// Отрисовщик специализированного оборудования в 2.5D цеху
function drawEStation(type, done, hard, now, seed){
  // Заглушка: базовое отображение оборудования
  const deskW = 56, dropH = 14;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-deskW / 2, 4, deskW, dropH);
  ctx.fillStyle = done ? '#10b981' : (hard ? '#c084fc' : '#38bdf8');
  ctx.fillRect(-deskW / 2, -14, deskW, 16);
}

// Регистрация отрисовщика
if (window.registerStationRenderer){
  registerStationRenderer('e', drawEStation);
}
