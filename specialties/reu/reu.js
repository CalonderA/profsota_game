/* ============================================================
   СОТА — Модуль специальности REU (11.02.16)
   Электронные приборы и устройства
   Файл для независимой разработки команды
   ============================================================ */
'use strict';

// Отрисовщик специализированного оборудования в 2.5D цеху
function drawREUStation(type, done, hard, now, seed){
  // Заглушка: базовое отображение оборудования
  const deskW = 56, dropH = 14;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-deskW / 2, 4, deskW, dropH);
  ctx.fillStyle = done ? '#10b981' : (hard ? '#c084fc' : '#38bdf8');
  ctx.fillRect(-deskW / 2, -14, deskW, 16);
}

// Регистрация отрисовщика
if (window.registerStationRenderer){
  registerStationRenderer('reu', drawREUStation);
}
