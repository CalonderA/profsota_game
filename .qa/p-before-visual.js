/* IT-центр: модуль существующего Canvas-движка. Все координаты в мировых пикселях. */
'use strict';
const P_STATIONS = [
  {x:6,y:6,type:0}, {x:15,y:6,type:1}, {x:18,y:3,type:2},
  {x:9,y:10,type:3}, {x:16,y:10,type:4}
];
const P_NAMES = ['Разработка приложений','Компьютерные сети','Серверное оборудование','Разработка игр','Кибербезопасность'];
// Мебель занимает клетки за рабочими точками; перед каждой есть свободный проход.
function setupPMap(m){
  const block=(x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)m[j][i]=1;};
  for(const s of P_STATIONS) if(s.type!==2) block(s.x-1,s.y-1,3,1);
  block(1,2,3,2); block(1,10,4,3); block(13,2,5,2);
  block(4,2,7,2); block(1,8,1,2); block(20,12,1,1); block(5,13,1,1);
  block(14,4,6,1); // стеклянная перегородка, вход справа через x=20
  block(13,2,1,2);
}
function cleanupClicker(){ /* В этой комнате нет мини-игры калибровки. */ }
function openCitySelect(){
  state='title'; stopAuto(); speech=null;
  ['startScreen','endScreen','qScreen'].forEach(id=>el(id).classList.add('hidden'));
  el('cityScreen').classList.remove('hidden'); buildCities();
}
function startGame(city){
  chosenCity=city; startKm=city.km; completedMines=0; runOre=0; totalMines=1;
  scheduledEvents.clear(); depth=1; score=0; fuel=100; hp=100; answerStreak=0;
  decks.easy=[]; decks.hard=[]; shake=0; flash=0; speech=null; newLevel();
  ['startScreen','cityScreen','endScreen','qScreen'].forEach(id=>el(id).classList.add('hidden'));
  state='playing'; updateHUD(); toast('Пять станций → дверь «К СОТЕ». Подойдите к маркеру задания.');
}
function pRect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function pText(t,x,y,size=10,c='#a8bacc',align='left'){
 ctx.font=`bold ${size}px monospace`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=c;ctx.fillText(t,x,y);
}
function pBox(x,y,w,h,depth,top='#343e55',front='#20293d'){
 pRect(x+5,y+8,w,h+depth,'#0b101ba0');pRect(x,y,w,h,top);pRect(x,y+h,w,depth,front);
 pRect(x,y,w,2,'#718097');pRect(x+w-4,y+2,4,h+depth-2,'#151c2e');pRect(x+2,y+h,w-6,2,'#46516e');
}
function pGlow(x,y,r,c){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function drawPFloor(x,y){
 const px=x*TILE,py=y*TILE,n=((x*7919+y*3137)%17);
 pRect(px,py,44,44,n%3===0?'#252936':'#222632');pRect(px,py,44,1,'#343746');pRect(px,py,1,44,'#181d29');
 for(let i=0;i<8;i++)pRect(px+(n+i*17)%42,py+(n*3+i*11)%42,2,1,i%2?'#303542':'#1b202b');
 if(x===1||x===21)pRect(px+(x===1?5:35),py,2,44,x===1?'#68529b':'#285d76');
}
function drawPWall(x,y){
 if(y<2)return;
 if(y===14){pBox(x*44,y*44,44,12,12,'#384059','#151d30');pRect(x*44,y*44,44,2,'#6b62aa');}
 else {pRect(x*44,y*44,44,44,'#151c2b');pRect(x*44+(x===0?37:3),y*44,4,44,x===0?'#7360b0':'#33849c');}
}
function pPlant(x,y){
 pBox(x-12,y,24,10,17,'#6e7788','#384355');pRect(x-10,y+2,20,5,'#172732');
 for(let i=0;i<9;i++){let dx=[-16,-8,2,10,-12,7,-3,14,0][i],dy=[-23,-36,-43,-30,-12,-19,-27,-9,-15][i];pRect(x+dx,y+dy,9,15,i%2?'#357f71':'#245748');pRect(x+dx,y+dy,3,10,'#65b68d');}
}
function pRack(x,y,n,now){
 pBox(x,y,43,12,88,'#536077','#111a2a');pRect(x+5,y+17,30,76,'#080e1a');
 for(let r=0;r<6;r++){pRect(x+7,y+20+r*12,26,9,'#263447');pRect(x+9,y+22+r*12,15,1,'#536177');pRect(x+9,y+25+r*12,15,1,'#0a1320');pRect(x+28,y+23+r*12,3,3,Math.sin(now*.003+r+n)>0?'#62edcb':'#32796f');}
 pRect(x+2,y+15,2,76,'#876fd1');pText('0'+n,x+13,y+10,8,'#d3e8f8');
}
function drawPBackWall(now){
 pRect(0,0,VW,88,'#151a2b');pRect(0,7,VW,4,'#47415f');
 for(let x=44;x<980;x+=58){pRect(x,14,2,65,'#2b3045');pRect(x+6,19,40,1,'#32384d');}
 pRect(44,84,924,4,'#6955b7');pGlow(470,70,260,'#7054c333');
 pBox(240,22,365,40,10,'#252941','#11172a');pRect(248,26,349,2,'#b49aef');
 pText('СОТА · IT-ЦЕНТР',422,53,25,'#e1d4ff','center');pText('09.02.07  /  СОЗДАВАЙ БУДУЩЕЕ',422,74,9,'#7ed7ec','center');
 pText('SERVER ROOM',740,48,16,'#80dcf3','center');pText('ONLINE  •  24 / 7',740,65,9,'#82baa9','center');
 // Серверная за стеклом: стойки, кабельный лоток, охлаждение.
 pRect(572,88,308,112,'#172b3b');
 for(let i=0;i<4;i++)pRack(595+i*51,91,i+1,now);
 pRect(582,93,3,103,'#55798a');
 pRect(616,193,255,3,'#40a7b5');
 pRect(574,193,305,21,'#78c4db22');pRect(574,192,305,3,'#89b8cc');pRect(574,214,305,4,'#253d52');
 for(let x=574;x<880;x+=76){pRect(x,171,3,45,'#627f9a');pRect(x+9,177,2,25,'#bee8ff44');}
 pText('ВХОД →',883,207,9,'#78d7e6');
 // Книжный шкаф.
 pBox(49,97,118,11,69,'#665f76','#292c42');
 for(let row=0;row<2;row++){for(let i=0;i<13;i++){let h=19+(i*7%12);pRect(55+i*8,133+row*33-h,6,h,['#9a6eb1','#568a9d','#c49a79','#6365a2'][i%4]);pRect(56+i*8,139+row*33-h,4,2,'#dac9b2');}pRect(52,135+row*33,109,4,'#827787');}
 pText('БИБЛИОТЕКА',107,94,9,'#aab8ce','center');
 // Доска алгоритмов.
 pBox(204,100,228,69,7,'#586478','#222b3c');pRect(210,105,216,59,'#162d38');
 pText('АЛГОРИТМ / DEPLOY',221,119,10,'#9cddd9');
 ['СТАРТ','КОД','ТЕСТ','РЕЛИЗ'].forEach((t,i)=>{pRect(220+i*49,132,41,20,'#2d5360');pText(t,240+i*49,145,8,'#c1ebdf','center');if(i<3)pText('→',262+i*49,145,10,'#b2a2ef');});
 pRect(388,163,18,3,'#e4b0d4');pPlant(475,145);
}
function drawPProps(now){
 // Ковёр и мягкая зона отдыха.
 pRect(52,421,174,169,'#181e30');for(let y=425;y<586;y+=8)pRect(56,y,166,2,'#34334d');
 pBox(60,449,137,25,46,'#655c91','#393653');
 for(let i=0;i<3;i++){pBox(69+i*39,467,36,24,14,'#8374ac','#514963');pRect(72+i*39,469,29,2,'#ad9acd');}
 pBox(56,460,13,38,13,'#8c7eae','#4e4966');pBox(190,460,13,38,13,'#8c7eae','#4e4966');
 pBox(94,535,80,23,10,'#806b77','#3b3547');pRect(106,539,19,12,'#b9c5cb');pRect(108,541,15,2,'#698792');pRect(143,539,10,9,'#dcbd9e');pRect(145,539,6,3,'#543f42');
 pText('ПЕРЕЗАГРУЗКА',133,582,9,'#a899c1','center');pPlant(67,398);pPlant(918,552);pPlant(224,584);
 pText('IT / СОТА',470,555,27,'#45425e','center');pText('ПЯТЬ ИДЕЙ. ОДНА КОМАНДА.',470,575,9,'#72748e','center');
 pGlow(240,270,170,'#7950db16');pGlow(745,405,170,'#24b7df12');
}
function pMonitor(x,y,kind,now){
 pBox(x,y,45,4,31,'#66728e','#101727');pRect(x+3,y+6,37,23,'#102c3e');
 if(kind===3){pRect(x+4,y+7,35,14,'#253666');pRect(x+4,y+24,35,3,'#63b18c');for(let i=0;i<3;i++)pRect(x+6+i*12,y+18-i*3,8,2,'#8a7abd');pRect(x+21,y+15,4,7,'#f5c883');}
 else if(kind===4){ctx.strokeStyle='#81e6da';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+21,y+10);ctx.lineTo(x+30,y+14);ctx.lineTo(x+28,y+23);ctx.lineTo(x+21,y+27);ctx.lineTo(x+14,y+23);ctx.lineTo(x+12,y+14);ctx.closePath();ctx.stroke();pText('✓',x+21,y+23,11,'#adf8d8','center');}
 else if(kind===1){for(let i=0;i<3;i++){pRect(x+8+i*11,y+20,7,5,'#7abbdc');pRect(x+11+i*11,y+15,1,5,'#9881cd');}pRect(x+11,y+14,23,1,'#9881cd');}
 else {for(let i=0;i<6;i++){pRect(x+6,y+9+i*3,2,1,'#617895');pRect(x+11+(i%2)*4,y+9+i*3,10+(i*7%16),1,['#c58de3','#78c8dd','#dbb779'][i%3]);}}
 pRect(x+19,y+35,6,5,'#69748a');pRect(x+12,y+40,20,3,'#343f57');
}
function drawPStation(type,done,hard,now){
 ctx.save();ctx.translate(0,-44);
 if(type===2){pMonitor(-20,-17,0,now);pBox(-27,28,58,15,10,'#526277','#26354b');pText('ТЕРМИНАЛ',0,38,8,'#92d9e4','center');}
 else {
  pBox(-62,-2,124,35,15,'#596075','#2d344a');pRect(-60,0,120,3,'#8d86a4');
  pRect(-54,47,6,15,'#151c29');pRect(48,47,6,15,'#151c29');pRect(-61,45,119,2,type===3?'#b578ec':'#4cbbd0');
  pMonitor(-52,-35,type,now);pMonitor(0,-35,type===0?0:type,now);
  pBox(-34,17,55,10,2,'#151d2d','#0d1422');for(let j=0;j<3;j++)for(let i=0;i<12;i++)pRect(-31+i*4,19+j*2,3,1,j===2?'#9c80c6':'#7498ac');
  pRect(30,18,17,13,'#262f45');pRect(35,21,6,7,'#8893b1');pRect(-55,20,9,9,'#d8b79d');pRect(-53,20,5,3,'#5d4448');
  // Башня ПК, вентиляторы, USB и индикаторы.
  pBox(50,7,18,12,31,'#57627b','#182233');for(let i=0;i<2;i++){ctx.strokeStyle=i?'#a783de':'#5fd5df';ctx.lineWidth=2;ctx.strokeRect(54,23+i*11,8,8);}pRect(54,20,3,2,'#83e9c9');
  if(type===1){pBox(22,5,25,7,5,'#496076','#1b2a3c');for(let port=0;port<5;port++)pRect(24+port*4,14,3,2,'#67e2c2');pRect(21,9,1,12,'#af85cb');pRect(12,20,10,1,'#af85cb');pBox(-57,0,31,9,6,'#273a50','#15243a');for(let i=0;i<6;i++)pRect(-55+i*4,11,2,2,'#70e7ca');pRect(-54,-12,2,12,'#a3a8c4');pRect(-31,-12,2,12,'#a3a8c4');}
  // Кресло с высокой спинкой, подлокотниками и крестовиной.
  pRect(-17,68,34,3,'#141b2b');pRect(-2,57,4,16,'#8a91a5');pBox(-14,48,28,11,8,'#655b86','#34334f');pBox(-15,51,30,6,17,'#797096','#45405e');pRect(-23,51,7,3,'#a0a3b8');pRect(17,51,7,3,'#a0a3b8');
 }
 ctx.restore();pText(P_NAMES[type],0,45,10,done?'#77dcb3':'#c4cfdf','center');
}
function drawPExit(now){
 const x=exitCell.x*TILE+22,y=exitCell.y*TILE+22;
 pBox(x-30,y-67,60,10,92,'#67738c','#202b41');pRect(x-24,y-53,48,77,'#0c1724');
 if(!exitOpen){pRect(x-21,y-51,20,72,'#35435c');pRect(x+2,y-51,20,72,'#2b374e');pRect(x-1,y-51,2,72,'#7d689c');for(let i=0;i<5;i++){pRect(x-17,y-44+i*12,12,2,'#536078');pRect(x+6,y-44+i*12,12,2,'#46536d');}}
 else {pGlow(x,y,60,'#5ce4bd33');pRect(x-21,y-51,5,72,'#334c61');pRect(x+17,y-51,5,72,'#334c61');}
 const c=exitOpen?'#7df3ca':'#b59aea';pRect(x-28,y-53,3,77,c);pRect(x+26,y-53,3,77,c);pRect(x-28,y+25,57,3,c);
 pText('К СОТЕ',x,y-58,12,'#d9ecff','center');pText(exitOpen?'ОТКРЫТО':`${collected} / 5`,x,y+42,10,c,'center');pRect(x-38,y-13,7,14,'#23384c');pRect(x-37,y-10,4,5,c);
}
window.STATION_RENDERERS=window.STATION_RENDERERS||{};
window.STATION_RENDERERS.p=drawPStation;
