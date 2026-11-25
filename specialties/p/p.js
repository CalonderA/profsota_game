/* IT-центр: модуль существующего Canvas-движка. Все координаты в мировых пикселях. */
'use strict';
const P_STATIONS = [
  {x:6,y:6,type:0}, {x:15,y:6,type:1}, {x:18,y:3,type:2},
  {x:9,y:10,type:3}
];
const P_NAMES = ['DEV-01 · Приложения','NET-02 · Сети','SRV-03 · Сервер','GAME-04 · Игры'];
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
function startGame(){
  completedMines=0; runOre=0; totalMines=1;
  scheduledEvents.clear(); depth=1; score=0; fuel=100; hp=100; answerStreak=0;
  decks.easy=[]; decks.hard=[]; shake=0; flash=0; speech=null; newLevel();
  ['startScreen','endScreen','qScreen'].forEach(id=>el(id).classList.add('hidden'));
  state='playing'; updateHUD(); toast('Выполните задания на четырёх станциях и подойдите к выходу.');
}
function pRect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function pText(t,x,y,size=10,c='#a8bacc',align='left'){
 ctx.font=`bold ${size}px monospace`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=c;ctx.fillText(t,x,y);
}
function pBox(x,y,w,h,depth,top='#343e55',front='#20293d'){
 pRect(x+5,y+8,w,h+depth,'#0b101ba0');pRect(x,y,w,h,top);pRect(x,y+h,w,depth,front);
 pRect(x,y,w,2,'#718097');pRect(x+w-4,y+2,4,h+depth-2,'#151c2e');pRect(x+2,y+h,w-6,2,'#46516e');
}
// Cache light sprites: no large gradients or shadowBlur in the frame loop.
const pLightCache = new Map();
function pGlow(x,y,r,c){
 const key=r+':'+c;
 let lamp=pLightCache.get(key);
 if(!lamp){lamp=document.createElement('canvas');lamp.width=lamp.height=r*2;
  const g=lamp.getContext('2d'),light=g.createRadialGradient(r,r,0,r,r,r);
  light.addColorStop(0,c);light.addColorStop(1,'transparent');g.fillStyle=light;g.fillRect(0,0,r*2,r*2);pLightCache.set(key,lamp);
 }
 ctx.drawImage(lamp,Math.round(x-r),Math.round(y-r));
}
const pFloorCache = new Map();

function drawPFloor(x,y){
 const key=x+','+y;
 let tile=pFloorCache.get(key);
 if(!tile){
  tile=document.createElement('canvas');tile.width=tile.height=44;const g=tile.getContext('2d');
  const n=(x*7919+y*3137)%97;
  g.fillStyle=['#282a39','#222635','#2c2e40','#252937'][(x+y*3)%4];g.fillRect(0,0,44,44);
  g.fillStyle='#111a28';g.fillRect(0,43,44,1);g.fillRect(43,0,1,44);
  g.fillStyle='#434356';g.fillRect(1,0,42,1);
  for(let i=0;i<26;i++){g.fillStyle=i%3?'#8494b00d':'#090d1d40';g.fillRect(2+(n+i*17)%39,2+(n*3+i*11)%39,i%5===0?3:1,1);}
  if(n%4===0){g.fillStyle='#65738524';g.fillRect(11,25,9,1);g.fillRect(16,23,8,1);}
  g.fillStyle='#0f1726';g.fillRect(3,3,2,2);g.fillRect(39,39,2,2);
  if(x===1||x===21){g.fillStyle=x===1?'#645286':'#326276';g.fillRect(x===1?5:35,0,2,44);}
  pFloorCache.set(key,tile);
 }
 ctx.drawImage(tile,x*TILE,y*TILE);
}

function drawPWall(x,y){
 if(y<2)return;
 if(y===14){pBox(x*44,y*44,44,12,12,'#384059','#151d30');pRect(x*44,y*44,44,2,'#6b62aa');}
 else {pRect(x*44,y*44,44,44,'#151c2b');pRect(x*44+(x===0?37:3),y*44,4,44,x===0?'#7360b0':'#33849c');}
}
function pPlant(x,y){
 pRect(x-16,y+22,35,6,'#0b13226b');
 pBox(x-12,y,24,10,17,'#b3b6c3','#646d83');pRect(x-10,y+2,20,5,'#24313b');
 pRect(x-8,y+12,3,11,'#929aa9');pRect(x-5,y-28,3,32,'#345c51');
 const leaves=[[-17,-25],[-10,-37],[1,-44],[9,-31],[-14,-14],[7,-20],[-3,-29],[14,-11],[0,-17]];
 for(let i=0;i<leaves.length;i++){
  const [dx,dy]=leaves[i],xx=x+dx,yy=y+dy;
  pRect(xx+2,yy,4,3,'#80b98b');pRect(xx,yy+3,8,8,i%2?'#478a72':'#376c5c');
  pRect(xx+1,yy+11,6,4,'#29564f');pRect(xx+3,yy+4,2,9,'#6ba581');
 }
}
function pRack(x,y,n,now){
 pGlow(x+20,y+63,60,'#22aaff48');
 pBox(x,y,43,12,88,'#66748a','#111a2a');pRect(x+4,y+15,33,80,'#080e1a');
 for(let r=0;r<6;r++){
  const yy=y+20+r*12,active=Math.sin(now*.002+r*2+n)>-.25;
  pRect(x+7,yy,26,9,'#2a384c');pRect(x+9,yy+2,15,1,'#607189');
  for(let vent=0;vent<5;vent++)pRect(x+9+vent*3,yy+5,1,2,'#0a1420');
  pRect(x+24,yy+1,11,7,active?'#36b8ff25':'#226c9a10');pRect(x+27,yy+3,4,3,active?'#74e9ff':'#226c9a');pRect(x+32,yy+3,2,2,active?'#c5fcff':'#328398');
  pRect(x+6,yy,1,8,'#7194bc');
 }
 pRect(x+2,y+15,2,76,'#6f66ba');pRect(x+39,y+14,2,80,'#32495f');
 pText('0'+n,x+13,y+10,8,'#d3e8f8');pRect(x+17,y+94,12,2,'#52c9eb');
}

function drawPBackWall(now){
 pRect(0,0,VW,88,'#151a2b');pRect(0,7,VW,4,'#47415f');
 for(let x=44;x<980;x+=58){pRect(x,14,2,65,'#2b3045');pRect(x+6,19,40,1,'#32384d');}
 pRect(44,84,924,4,'#6955b7');pGlow(470,70,260,'#7054c333');
 pBox(240,22,365,40,10,'#252941','#11172a');pRect(248,26,349,2,'#b49aef');
 pText('СОТА · IT-ЦЕНТР',422,53,25,'#e1d4ff','center');pText('09.02.07  /  СОЗДАВАЙ БУДУЩЕЕ',422,74,9,'#7ed7ec','center');
 pText('SERVER ROOM',740,48,16,'#80dcf3','center');pText('ONLINE  •  24 / 7',740,65,9,'#82baa9','center');
 // Серверная за стеклом: стойки, кабельный лоток, охлаждение.
 pRect(572,88,308,112,'#172b3b');pGlow(716,151,160,'#2788da35');
 for(let i=0;i<4;i++)pRack(595+i*51,91,i+1,now);
 pRect(582,93,3,103,'#55798a');
 pRect(616,193,255,3,'#40a7b5');
 pRect(574,127,305,87,'#78c4db14');pRect(574,127,305,2,'#8bb3d950');pRect(574,192,305,3,'#89b8cc');pRect(574,214,305,4,'#253d52');
 for(let x=574;x<880;x+=76){pRect(x,128,3,88,'#627f9a');pRect(x+9,139,2,37,'#bee8ff33');}
 // Aluminium frames and diagonal reflections, kept inside the existing glass boundary.
 pRect(574,96,5,118,'#65859e');pRect(579,96,2,115,'#c4eaff66');
 for(let xx=591;xx<870;xx+=76){pRect(xx,175,43,1,'#c6eaff55');for(let i=0;i<23;i++)pRect(xx+i*2,147+i*2,2,12,'#d3f1ff18');}
 pRect(580,210,296,3,'#59bbeb');pGlow(733,211,122,'#218dea22');
 pText('ВХОД →',883,207,9,'#78d7e6');
 pVent(814,109,49,25);pVent(60,29,59,24);
 for(const xx of [155,629,835])pLamp(xx,77,'#d488ff');
 pLamp(930,156,'#9bd9ff');
 // Книжный шкаф.
 pBox(49,97,118,11,69,'#665f76','#292c42');
 for(let row=0;row<2;row++){for(let i=0;i<13;i++){let h=19+(i*7%12);pRect(55+i*8,133+row*33-h,6,h,['#9a6eb1','#568a9d','#c49a79','#6365a2'][i%4]);pRect(56+i*8,139+row*33-h,4,2,'#dac9b2');}pRect(52,135+row*33,109,4,'#827787');}
 pText('БИБЛИОТЕКА',107,94,9,'#aab8ce','center');
 // Доска алгоритмов.
 pBox(204,100,228,47,7,'#586478','#222b3c');pRect(210,105,216,37,'#162d38');
 pText('АЛГОРИТМ / DEPLOY',221,119,10,'#9cddd9');
 ['СТАРТ','КОД','ТЕСТ','РЕЛИЗ'].forEach((t,i)=>{pRect(220+i*49,126,41,13,'#2d5360');pText(t,240+i*49,136,8,'#c1ebdf','center');if(i<3)pText('→',262+i*49,136,10,'#b2a2ef');});
 pRect(388,142,18,3,'#e4b0d4');pPlant(475,145);
 // Shallow wall workstations fit wholly in the already blocked board alcove.
 pDeskConsole(247,155,now);pDeskConsole(362,155,now);
 pTinyPlant(170,120);
}
function drawPProps(now){
 // Low ambient pools and contact shadows; all decoration stays in existing furniture footprints.
 pGlow(175,230,180,'#9650e92b');pGlow(760,320,165,'#2c9edc1c');
 pRect(52,421,174,169,'#181e30');for(let y=425;y<586;y+=8)pRect(56,y,166,2,'#34334d');
 pRect(59,508,146,13,'#070e1a88');
 pBox(60,449,137,25,46,'#655c91','#393653');
 for(let i=0;i<3;i++){pBox(69+i*39,467,36,24,14,'#8374ac','#514963');pRect(72+i*39,469,29,2,'#ad9acd');pRect(74+i*39,488,25,1,'#403b58');}
 pBox(56,460,13,38,13,'#8c7eae','#4e4966');pBox(190,460,13,38,13,'#8c7eae','#4e4966');
 pBox(74,477,21,14,3,'#b99896','#766078');pRect(77,480,15,1,'#dcc4bb');
 pRect(98,563,78,8,'#080d1980');pBox(94,535,80,23,10,'#a68273','#4c3b48');
 pRect(99,567,4,6,'#293142');pRect(164,567,4,6,'#293142');
 pLaptop(103,527);pRect(144,541,9,10,'#d7c6bc');pRect(146,541,5,3,'#59454c');pRect(152,544,3,4,'#d7c6bc');
 pRect(158,549,12,4,'#b482ae');pRect(158,548,12,1,'#ead6d2');
 pTinyPlant(184,534);pText('ПЕРЕЗАГРУЗКА',133,582,9,'#a899c1','center');
 pPlant(67,398);pPlant(918,552);pPlant(224,584);
 // Small wall-mounted equipment does not occupy walking tiles.
 pVent(971,394,29,37);pRect(978,440,18,29,'#334459');pRect(981,444,12,2,'#66d7db');
 for(let yy=451;yy<466;yy+=4)pRect(981,yy,12,1,'#171f30');
 pText('IT / СОТА',470,555,27,'#45425e','center');pText('СОЗДАВАЙ. ПРОБУЙ. ИГРАЙ.',470,575,9,'#72748e','center');
}

function pMonitor(x,y,kind,now){
 pGlow(x+22,y+25,48,kind===3?'#ab63ec24':'#3dc6f52b');
 pBox(x,y,45,4,31,'#7c879d','#101727');pRect(x+3,y+6,37,23,'#0c1c32');
 pRect(x+4,y+6,35,3,'#38415b');pRect(x+6,y+7,2,1,'#c488c6');pRect(x+10,y+7,2,1,'#75cfdd');
 if(kind===3){
  pRect(x+4,y+10,35,14,'#302354');
  for(let i=0;i<5;i++)pRect(x+6+i*7,y+11+(i%3)*3,1,1,'#d4c6ff');
  for(let i=0;i<3;i++){pRect(x+5+i*12,y+22-i*3,9,3,'#6d569b');pRect(x+5+i*12,y+22-i*3,9,1,'#b498d2');}
  pRect(x+4,y+27,35,2,'#76ab83');pRect(x+20,y+17,4,6,'#edbc68');pRect(x+21,y+16,3,2,'#fce3b3');pRect(x+19,y+23,2,2,'#7ccbd7');pRect(x+24,y+23,2,2,'#7ccbd7');
 } else if(kind===4){
  ctx.strokeStyle='#79e5df';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+18,y+11);ctx.lineTo(x+26,y+14);ctx.lineTo(x+24,y+22);ctx.lineTo(x+18,y+26);ctx.lineTo(x+12,y+22);ctx.lineTo(x+10,y+14);ctx.closePath();ctx.stroke();
  pRect(x+16,y+16,4,6,'#8eeedb');pRect(x+15,y+18,6,2,'#8eeedb');
  for(let i=0;i<5;i++){pRect(x+30,y+12+i*3,6,1,i%2?'#7f91ca':'#54c8b2');}
 } else if(kind===1){
  pRect(x+20,y+13,2,11,'#36a4c0');pRect(x+9,y+22,25,1,'#36a4c0');
  for(let i=0;i<3;i++){pRect(x+7+i*11,y+21,7,5,'#253e63');pRect(x+8+i*11,y+21,5,2,'#78deed');pRect(x+10+i*11,y+26,1,1,'#b5a4eb');}
  pRect(x+17,y+11,8,5,'#508ab2');pRect(x+19,y+12,4,1,'#b1f6fa');
 } else if(kind===5){
  for(let i=0;i<5;i++){pRect(x+7,y+12+i*3,14+(i%2)*4,1,'#b58adf');pRect(x+30,y+12+i*3,5,1,'#59c7bb');}
 } else {
  pRect(x+4,y+10,7,18,'#192740');
  for(let i=0;i<6;i++){pRect(x+6,y+11+i*3,2,1,'#617895');pRect(x+13+(i%2)*4,y+11+i*3,9+(i*7%12),1,['#c58de3','#78c8dd','#dbb779'][i%3]);}
 }
 pRect(x+3,y+30,37,1,'#4a6380');pRect(x+36,y+32,2,1,'#6cf1d5');pRect(x+19,y+35,6,5,'#69748a');pRect(x+12,y+40,20,3,'#343f57');
}

function drawPStation(type,done,hard,now){
 ctx.save();ctx.translate(0,-44);
 if(type===2){pGlow(0,20,65,'#31bcf52b');pMonitor(-20,-17,5,now);pBox(-27,28,58,15,10,'#526277','#26354b');
  for(let row=0;row<3;row++)for(let key=0;key<9;key++)pRect(-21+key*4,32+row*3,3,2,'#8ea9c0');pRect(19,32,6,8,'#b9c7d2');
  pCable([-24,29,-30,29,-30,7,-42,7],'#427d9a');pRect(-23,48,46,2,'#6edaff');}
 else {
  pGlow(0,22,75,done?'#48d8a418':'#f6b64d22');
  pRect(-59,48,130,18,'#070d1a65');
  pBox(-62,-2,124,35,15,'#947c78','#4a4053');pRect(-60,0,120,3,'#c1a48e');
  for(let line=0;line<4;line++)pRect(-57,7+line*7,108,1,'#5b50673b');
  pCable([-29,5,-29,11,12,11,12,34,48,34],'#263347');
  pCable([23,6,23,14,45,14,45,29,52,29],'#68a7bd');
  pRect(-54,47,6,15,'#151c29');pRect(48,47,6,15,'#151c29');pRect(-61,45,119,2,type===3?'#b578ec':'#4cbbd0');
  pMonitor(-52,-35,type,now);pMonitor(0,-35,type===3||type===4?5:type,now);
  pBox(-34,17,55,10,2,'#151d2d','#0d1422');for(let j=0;j<3;j++)for(let i=0;i<12;i++)pRect(-31+i*4,19+j*2,3,1,j===2?'#9c80c6':'#7498ac');
  pRect(30,18,17,13,'#262f45');pRect(35,21,6,7,'#8893b1');pRect(37,21,1,3,'#dbe3ec');pCable([38,20,38,16,29,16,29,12],'#21283b');pRect(-55,20,9,9,'#d8b79d');pRect(-53,20,5,3,'#5d4448');
  // Башня ПК, вентиляторы, USB и индикаторы.
  pBox(50,7,18,12,31,'#57627b','#182233');for(let i=0;i<2;i++){ctx.strokeStyle=i?'#a783de':'#5fd5df';ctx.lineWidth=2;ctx.strokeRect(54,23+i*11,8,8);}pRect(54,20,3,2,'#83e9c9');
  if(type===1){pBox(22,5,25,7,5,'#496076','#1b2a3c');for(let port=0;port<5;port++)pRect(24+port*4,14,3,2,'#67e2c2');pRect(21,9,1,12,'#af85cb');pRect(12,20,10,1,'#af85cb');pBox(-57,0,31,9,6,'#273a50','#15243a');for(let i=0;i<6;i++)pRect(-55+i*4,11,2,2,'#70e7ca');pRect(-54,-12,2,12,'#a3a8c4');pRect(-31,-12,2,12,'#a3a8c4');}
  if(type===3)pGamepad(4,11);
  if(type===0){pRect(-47,4,12,9,'#d9cab0');pRect(-45,6,8,1,'#778f9d');pRect(-45,9,6,1,'#778f9d');}
  if(type===4){pRect(-48,5,14,8,'#1b2839');pRect(-46,7,5,4,'#5bb9aa');pRect(-38,7,2,2,'#c598e5');}
  pRect(-61,9,5,9,'#e4ceb8');pRect(-60,10,3,2,'#9d708d');
  // Кресло с высокой спинкой, подлокотниками и крестовиной.
  pRect(-17,68,34,3,'#141b2b');pRect(-2,57,4,16,'#8a91a5');pBox(-14,48,28,11,8,'#655b86','#34334f');pBox(-15,51,30,6,17,'#797096','#45405e');pRect(-23,51,7,3,'#a0a3b8');pRect(17,51,7,3,'#a0a3b8');
  pRect(-10,55,20,2,'#a297bb');pRect(-11,65,22,1,'#252c41');
  for(const wx of [-18,14]){pRect(wx,70,5,3,'#0c1220');pRect(wx+1,70,2,1,'#65718b');}
 }
 ctx.restore();

}
function drawPExit(now){
 const x=exitCell.x*TILE+22,y=exitCell.y*TILE+22,c=exitOpen?'#7df3ca':'#ffc86d';
 pGlow(x,y+25,88,exitOpen?'#4bd5bd38':'#f5a72f35');
 pRect(x-35,y+30,73,14,'#090d1877');pBox(x-34,y-71,68,12,96,'#7f7c89','#263249');
 pRect(x-32,y-56,5,77,'#596174');pRect(x+28,y-56,5,77,'#141d2c');pRect(x-24,y-53,48,77,'#0c1724');
 if(!exitOpen){
  pRect(x-21,y-51,20,72,'#414051');pRect(x+2,y-51,20,72,'#303044');pRect(x-1,y-51,2,72,'#af8654');
  for(let i=0;i<4;i++){pRect(x-17,y-45+i*16,12,2,'#626079');pRect(x+6,y-45+i*16,12,2,'#4b4b61');}
 }else{pRect(x-21,y-51,5,72,'#334c61');pRect(x+17,y-51,5,72,'#334c61');pRect(x-15,y-46,31,65,'#142b38');}
 pRect(x-28,y-53,3,77,c);pRect(x+26,y-53,3,77,c);pRect(x-28,y+25,57,3,c);
 // Raised lintel, hazard trim, guide chevrons and a lit access reader.
 pRect(x-30,y-58,60,4,'#c8a161');for(let i=0;i<8;i++)pRect(x-29+i*8,y-58,4,4,'#242736');
 for(const dx of [-10,3])for(let i=0;i<6;i++)pRect(x+dx+(i<3?i:5-i)*2,y-11+i*3,3,3,c);
 pBox(x-17,y-82,34,5,6,'#9c8b85','#37344b');pRect(x-13,y-79,26,3,'#ffe9b4');pGlow(x,y-76,45,'#ffc86d33');
 pText('К СОТЕ',x,y-61,12,'#f8e5ca','center');pText(exitOpen?'ОТКРЫТО':`${collected} / ${needed}`,x,y+42,10,c,'center');
 pRect(x-40,y-15,9,19,'#18253a');pRect(x-38,y-12,5,6,c);pRect(x-38,y-3,5,2,'#8093aa');
}

function pCable(points,color){
 ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(points[0],points[1]);
 for(let i=2;i<points.length;i+=2)ctx.lineTo(points[i],points[i+1]);ctx.stroke();
}
function pLamp(x,y,color){
 pGlow(x,y+17,90,'#b164ef50');pGlow(x,y+3,33,'#c780ff55');pBox(x-25,y-3,50,5,5,'#44425f','#202339');
 pRect(x-21,y,42,3,color);pRect(x-18,y,36,1,'#f4d8ff');
}
function pVent(x,y,w,h){
 pBox(x,y,w,3,h,'#718199','#283548');
 for(let yy=6;yy<h;yy+=4){pRect(x+4,y+yy,w-8,2,'#0e1c2b');pRect(x+4,y+yy,w-8,1,'#4b6077');}
 pRect(x+2,y+3,2,2,'#c7ccd7');pRect(x+w-5,y+h-2,2,2,'#c7ccd7');
}
function pLaptop(x,y){
 pBox(x,y,26,3,17,'#667891','#141f31');pRect(x+3,y+4,20,12,'#19405b');
 for(let i=0;i<3;i++)pRect(x+5,y+6+i*3,9+i*3,1,'#74c6dc');
 pBox(x-2,y+20,30,9,2,'#7f8da5','#344259');
 for(let i=0;i<6;i++)pRect(x+i*4,y+22,2,3,'#29374e');pRect(x+9,y+27,9,1,'#c4c9d4');
}
function pTinyPlant(x,y){
 pBox(x,y,10,5,9,'#b6aaa9','#716f83');pRect(x+3,y-7,3,10,'#4e9b76');
 pRect(x-1,y-5,5,3,'#80ad75');pRect(x+6,y-10,4,5,'#6db786');
}
function pDeskConsole(x,y,now){
 pBox(x-34,y+5,70,10,7,'#9b827c','#4c4257');
 // Small recessed display and a docked laptop on the same wall shelf.
 pRect(x-29,y-1,25,4,'#64758d');pRect(x-27,y-13,23,14,'#15253a');
 for(let i=0;i<3;i++)pRect(x-24,y-10+i*3,12+i*2,1,'#6abdd5');
 pRect(x-26,y+8,24,3,'#283547');pRect(x+4,y-3,18,9,'#222c40');pRect(x+6,y-1,14,5,'#5987a0');pRect(x+2,y+7,23,4,'#8490a4');
 pRect(x-14,y+17,28,3,'#403d56');pRect(x-10,y+17,20,1,'#8b819a');
 pRect(x+29,y+4,4,6,'#d0b8ab');
}
function pGamepad(x,y){
 pRect(x-2,y+2,21,7,'#252c44');pRect(x,y,17,10,'#b3b4c8');pRect(x-2,y+7,5,4,'#9297b1');pRect(x+14,y+7,5,4,'#9297b1');
 pRect(x+2,y+3,6,2,'#30394c');pRect(x+4,y+1,2,6,'#30394c');pRect(x+12,y+2,2,2,'#b06cbd');pRect(x+15,y+5,2,2,'#5cb5cc');
}

window.STATION_RENDERERS=window.STATION_RENDERERS||{};
window.STATION_RENDERERS.p=drawPStation;
