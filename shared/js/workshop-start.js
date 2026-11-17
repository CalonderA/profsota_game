/* Общий запуск производственных комнат КИП и ТС. */
'use strict';
function cleanupClicker(){
  for(const id of ['clickerScreen','clickerBanner']){
    const node=document.getElementById(id);if(node)node.classList.add('hidden');
  }
}
function resetWorkshopScreens(){
  // Очищаем только мини-игры, действительно подключённые к текущей комнате.
  for(const game of Object.values(window.MINI_GAMES||{})){
    if(typeof game.cleanup==='function')game.cleanup();
  }
  cleanupClicker();
  for(const id of ['calibScreen','calibBanner','pipeScreen','pipeBanner','wiresScreen','wiresBanner','pidScreen','pidBanner','bypassScreen','bypassBanner','exchangerScreen','exchangerBanner']){
    const node=document.getElementById(id);if(node)node.classList.add('hidden');
  }
}
function openCitySelect(){
  resetWorkshopScreens();stopAuto();speech=null;state='title';
  for(const id of ['startScreen','endScreen','qScreen'])el(id).classList.add('hidden');
  el('cityScreen').classList.remove('hidden');buildCities();
}
function startGame(city){
  resetWorkshopScreens();stopAuto();chosenCity=city;startKm=city.km;
  completedMines=0;runOre=0;totalMines=minesFor(city.km);scheduleRunEvents(totalMines);
  depth=1;score=0;fuel=100;hp=100;answerStreak=0;decks.easy=[];decks.hard=[];
  shake=0;flash=0;speech=null;newLevel();
  for(const id of ['endScreen','qScreen','startScreen','cityScreen'])el(id).classList.add('hidden');
  state='playing';updateHUD();
  toast(city.name+' → СОТА · '+totalMines+' '+(currentSpec==='ts'?'участка':'цеха'));
}
