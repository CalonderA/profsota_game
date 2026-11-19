/* Лаборатория КСК: карта и Canvas-оборудование для общего движка СОТА. */
'use strict';
const KSK_STATIONS=[{x:5,y:5,type:0},{x:11,y:5,type:1},{x:18,y:4,type:2},{x:6,y:10,type:3},{x:17,y:10,type:4}];
const KSK_NAMES=['Сборка ПК','Диагностика','Серверное оборудование','Ремонт и обслуживание','Компьютерные сети'];
function setupKskMap(m){
 const block=(x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)m[j][i]=1;};
 for(const s of KSK_STATIONS)if(s.type!==2)block(s.x-2,s.y-1,4,1);
 block(2,2,6,1);block(2,3,3,1);block(9,2,4,1);block(14,2,6,2);block(14,4,1,1);block(14,5,6,1);
 block(1,8,2,5);block(20,8,2,5);block(10,11,3,3);block(13,12,1,1);
}
const kskDecks=new Map();
function nextKskQuestion(station){
 const topic=station.stationType;
 if(!kskDecks.get(topic)?.length){const pool=QUESTIONS.filter(q=>q.spec==='ksk'&&q.station===topic);kskDecks.set(topic,shuffle(pool.length?pool:window.KSK_QUESTIONS.filter(q=>q.station===topic)));}
 return kskDecks.get(topic).pop();
}
function cleanupClicker(){}
function startGame(){
 completedMines=0;runOre=0;totalMines=1;scheduledEvents.clear();kskDecks.clear();
 depth=1;score=0;fuel=100;hp=100;answerStreak=0;decks.easy=[];decks.hard=[];shake=0;flash=0;speech=null;newLevel();
 ['startScreen','endScreen','qScreen'].forEach(id=>el(id).classList.add('hidden'));
 state='playing';updateHUD();toast('Выполните задания на пяти станциях и подойдите к выходу.');
}
function kr(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function kt(t,x,y,size=10,c='#b9d4df',align='left'){ctx.font=`bold ${size}px monospace`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=c;ctx.fillText(t,x,y);}
function kb(x,y,w,h,d,top='#6e7f8d',front='#303f50'){
 kr(x+5,y+8,w,h+d,'#080e19a0');kr(x,y,w,h,top);kr(x,y+h,w,d,front);kr(x,y,w,2,'#a8b9c4');kr(x+w-4,y+2,4,h+d-2,'#172433');kr(x+2,y+h,w-6,2,'#596d7c');
}
const kLightCache=new Map(),kFloorCache=new Map();
function kg(x,y,r,color){let c=kLightCache.get(r+color);if(!c){c=document.createElement('canvas');c.width=c.height=r*2;let g=c.getContext('2d'),l=g.createRadialGradient(r,r,0,r,r,r);l.addColorStop(0,color);l.addColorStop(1,'transparent');g.fillStyle=l;g.fillRect(0,0,r*2,r*2);kLightCache.set(r+color,c);}ctx.drawImage(c,x-r,y-r);}
function wire(points,color='#45bbc8',width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)ctx.lineTo(points[i],points[i+1]);ctx.stroke();}
function drawKskFloor(x,y){
 let key=x+','+y,c=kFloorCache.get(key);
 if(!c){c=document.createElement('canvas');c.width=c.height=44;const g=c.getContext('2d');g.fillStyle=['#252e36','#29323b','#303841'][(x+y*3)%3];g.fillRect(0,0,44,44);g.fillStyle='#131e29';g.fillRect(43,0,1,44);g.fillRect(0,43,44,1);g.fillStyle='#485560';g.fillRect(0,0,43,1);
 for(let i=0;i<24;i++){g.fillStyle=i%2?'#849dad19':'#040e192a';g.fillRect((x*17+y*7+i*13)%42,(x*3+y*19+i*7)%42,i%5===0?3:1,1);}g.fillStyle='#64737c';g.fillRect(3,3,1,1);kFloorCache.set(key,c);}
 ctx.drawImage(c,x*44,y*44);
}
function drawKskWall(x,y){if(y<2)return;if(y===14){kb(x*44,y*44,44,10,15,'#4b5d6b','#202f3d');for(let i=0;i<4;i++)kr(x*44+i*11,y*44+2,6,4,'#cba347');}else{kr(x*44,y*44,44,44,'#172534');kr(x*44+(x===0?36:4),y*44,4,44,'#506f83');kr(x*44+(x===0?40:2),y*44,2,44,'#348caa');}}
function kVent(x,y,w=50,h=22){kb(x,y,w,3,h,'#78909e','#33495c');for(let i=5;i<h;i+=4){kr(x+4,y+i,w-8,2,'#111f2e');kr(x+4,y+i,w-8,1,'#4b6578');}}
function kLamp(x,y,w=64){kg(x+w/2,y+10,88,'#35c3ed35');kb(x,y,w,4,4,'#526d83','#203345');kr(x+3,y+2,w-6,3,'#88e6ff');kr(x+7,y+2,w-14,1,'#e4fbff');}
function kBoard(x,y,w=48,h=31){
 kb(x,y,w,h,3,'#24655e','#123b39');
 ctx.save();ctx.translate(x,y);ctx.scale(w/48,h/31);
 kr(8,7,14,14,'#b2b5ab');kr(10,9,10,10,'#505d65');
 for(let i=0;i<4;i++){kr(26+i*4,5,2,19,'#d9bb71');kr(26+i*4,7,2,14,'#172f36');}
 for(let i=0;i<3;i++){kr(5,24+i*2,34,1,'#ad9c65');kr(3+i*13,3,2,2,'#97b9a2');}
 ctx.restore();
}
function kFan(x,y,r=8,now=0){
 kr(x-r-2,y-r-2,r*2+4,r*2+4,'#132334');ctx.strokeStyle='#5ab3c7';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
 ctx.save();ctx.translate(x,y);ctx.rotate(now*.001);for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);kr(1,-2,r-2,3,'#8198a8');}ctx.restore();kr(x-2,y-2,4,4,'#b7ced7');
}
function kTower(x,y,open,now){
 kb(x,y,39,8,54,'#8a9dab','#354657');kr(x+4,y+12,29,46,'#101e2b');
 if(open){kBoard(x+6,y+18,25,29);kr(x+25,y+17,4,22,'#73a08c');kFan(x+17,y+29,7,now);kr(x+8,y+45,21,5,'#597681');kr(x+9,y+47,18,1,'#b6c5cf');wire([x+8,y+14,x+30,y+14,x+30,y+53,x+23,y+53],'#d1a657');}
 else {kFan(x+18,y+25,8,now);kFan(x+18,y+46,8,now);}
 kr(x+33,y+13,2,4,'#85f2d8');kr(x+34,y+23,2,7,'#152333');
}
function kScreen(x,y,mode,now){
 kg(x+24,y+22,44,'#23b2d52c');kb(x,y,50,4,30,'#7f99a8','#182c40');kr(x+3,y+6,42,23,'#0c2538');kr(x+4,y+6,40,3,'#34556c');
 if(mode==='wave'){wire([x+5,y+21,x+13,y+21,x+17,y+14,x+21,y+26,x+25,y+12,x+29,y+22,x+43,y+19],'#67ead7');}
 else if(mode==='net'){wire([x+24,y+13,x+24,y+23,x+10,y+23,x+39,y+23],'#58d5d5');for(let i=0;i<3;i++){kr(x+7+i*14,y+20,7,6,'#4ba9b5');kr(x+8+i*14,y+21,5,3,'#183e50');}kr(x+21,y+11,7,6,'#6ed3dd');}
 else if(mode==='fan'){kFan(x+22,y+19,8,now);for(let i=0;i<4;i++)kr(x+35,y+12+i*4,7,1,'#74d6df');}
 else if(mode==='board'){kr(x+8,y+12,17,12,'#236665');kr(x+12,y+14,6,6,'#a5d6d5');for(let i=0;i<4;i++)kr(x+29,y+12+i*4,11,1,'#56b6d4');}
 else {for(let i=0;i<5;i++){kr(x+6,y+11+i*3,14+i%3*5,1,'#75c0d5');kr(x+34,y+11+i*3,7,1,i===2?'#e6bf64':'#53d1bb');}}
 kr(x+21,y+34,7,6,'#657f91');kr(x+13,y+39,24,3,'#2b4155');kr(x+41,y+31,2,1,'#64f7d9');
}
function kKeyboard(x,y,w=45){kb(x,y,w,8,2,'#223646','#162634');for(let j=0;j<3;j++)for(let i=0;i<10;i++)kr(x+3+i*(w-5)/10,y+1+j*2,2,1,'#a3bbc5');}
function kRack(x,y,n,now){kg(x+23,y+60,62,'#19abd536');kb(x,y,48,10,90,'#7892a2','#142a3c');kr(x+4,y+14,37,80,'#0c1b2a');for(let row=0;row<6;row++){let yy=y+18+row*12;kr(x+7,yy,32,9,'#304a61');for(let v=0;v<5;v++)kr(x+9+v*3,yy+3,1,4,'#0b1c2b');kr(x+29,yy+3,4,2,Math.sin(now*.002+row+n)>0?'#76f7e3':'#287a8c');kr(x+35,yy+3,2,2,'#3bc1ee');}kr(x+2,y+13,2,79,'#47abc9');kt('SRV-0'+n,x+5,y+9,7);}
function kShelf(x,y,w=119){
 kb(x,y,w,7,81,'#687b89','#243749');
 for(let row=0;row<2;row++){for(let i=0;i<4;i++){let xx=x+8+i*(w-14)/4,yy=y+15+row*35;kb(xx,yy,20,5,21,i%2?'#928574':'#587181',i%2?'#655e56':'#2d495e');kr(xx+7,yy+8,6,7,'#c6c4b4');if(i%2===0)kFan(xx+10,yy+14,6,0);}kr(x+3,y+44+row*35,w-6,3,'#879ba7');}
}
function kPlant(x,y){kb(x-9,y,18,8,15,'#a7b9bf','#536b7a');for(let i=0;i<7;i++){let dx=[-11,-6,3,9,-8,5,0][i],dy=[-20,-32,-35,-22,-10,-13,-24][i];kr(x+dx,y+dy,7,13,i%2?'#397a6c':'#538f77');kr(x+dx+2,y+dy,2,9,'#92ba8c');}}
function drawKskBackWall(now){
 kr(0,0,VW,88,'#172333');for(let x=48;x<960;x+=56){kr(x,12,2,69,'#3e5262');kr(x+6,18,39,1,'#314657');}
 wire([42,78,42,17,925,17,925,84],'#506c7d',4);kr(44,84,924,4,'#47758b');
 kb(212,23,476,42,12,'#253d50','#142636');kr(221,26,458,2,'#60c5d8');
 kt('СОТА · ЛАБОРАТОРИЯ КСК',450,52,23,'#daeff6','center');kt('09.02.01  /  КОМПЬЮТЕРНЫЕ СИСТЕМЫ И КОМПЛЕКСЫ',450,70,9,'#6bd7df','center');
 kLamp(80,29);kLamp(757,30,94);kVent(899,35,53,26);
 // Component shelves and a schematic in the upper assembly bay.
 kShelf(91,95,114);kb(219,96,111,52,6,'#52788c','#233c50');kr(224,101,100,43,'#19384e');kt('СБОРКА / ATX',231,114,10,'#99dfec');wire([233,124,256,124,256,137,277,137,277,122,311,122],'#71b5c9');kr(252,120,12,12,'#92a9af');
 kVent(426,103,54,25);kLamp(466,96,67);kPlant(551,131);
 // Glass server enclosure, with a clear entry on its right at x=20.
 kr(616,88,264,153,'#133044');for(let i=0;i<4;i++)kRack(630+i*57,92,i+1,now);
 kr(617,117,262,124,'#8bd9f313');kr(616,117,264,3,'#82b5c7');kr(616,238,264,5,'#387890');
 for(let xx=616;xx<=880;xx+=66){kr(xx,118,3,122,'#577f98');kr(xx+3,121,1,115,'#a5e4f53b');for(let i=0;i<22;i++)kr(xx+8+i*2,154+i*2,2,14,'#b8edff12');}
 kt('СЕРВЕРНАЯ',748,111,10,'#b7e8f3','center');kt('ВХОД →',892,238,8,'#79dce4');kg(748,237,115,'#209dc528');
}
function drawKskProps(now){
 kShelf(49,361,72);kShelf(49,463,72);kLamp(155,358,82);kLamp(686,358,95);
 // Tool drawers and wall pegboard in the network bay.
 kb(886,367,67,7,117,'#8295a1','#344c60');kr(891,378,55,58,'#213a4d');
 for(let j=0;j<5;j++)for(let i=0;i<6;i++)kr(895+i*8,383+j*10,1,1,'#7190a0');
 for(let i=0;i<4;i++){kr(898+i*11,391,3,18,'#c0bd9d');kr(897+i*11,390,5,7,i%2?'#ddaf5c':'#49bfc7');}
 for(let j=0;j<3;j++){kr(893,444+j*12,51,9,'#4c6376');kr(912,446+j*12,13,2,'#a3b5bf');}
 for(let i=0;i<3;i++){ctx.strokeStyle=['#d5a65c','#439baa','#6f8ca1'][i];ctx.lineWidth=3;ctx.beginPath();ctx.arc(899+i*18,427,6,0,Math.PI*2);ctx.stroke();}
 // Small shared service desk in its own blocked footprint, outside the main aisle.
 kr(441,486,130,88,'#132736');kb(447,501,119,29,13,'#7d919e','#334c5f');
 kScreen(456,463,'wave',now);kKeyboard(459,508,37);kr(525,511,10,10,'#d4d5cc');kr(527,511,6,3,'#5c6261');kPlant(550,509);
 for(let xx of [462,524]){kb(xx,550,24,10,10,'#697f8f','#2c4356');kr(xx+3,568,3,8,'#192e40');kr(xx+18,568,3,8,'#192e40');}
 kPlant(588,566);kb(893,544,47,25,27,'#a28c6d','#695b4e');kr(911,544,5,52,'#c7b791');kt('ATX',898,584,9,'#d8d1b8');
 kg(163,224,125,'#55cde51b');kg(756,430,130,'#42bacb1e');
}
function drawKskStation(type,done,hard,now){
 ctx.save();ctx.translate(0,-44);kg(0,27,74,done?'#5accb41a':'#deb25d24');
 if(type===2){kb(-42,9,84,28,12,'#6d8a9c','#2d485b');kScreen(-27,-28,'status',now);kKeyboard(-28,24,40);kr(21,25,7,10,'#a5c2ca');wire([-34,17,-43,17,-43,-24,-52,-24],'#54bdc2',2);}
 else {
  kb(-79,0,158,36,13,'#8a9ba4','#3d5364');kr(-76,3,152,2,'#c3cdd0');
  // Anti-static mat, bonded ground lead and drawer cabinets.
  kr(-72,7,141,25,'#224d55');kr(-70,9,137,1,'#45747a');wire([-69,20,-76,20,-76,47,-58,47],'#79a49c');
  for(let xx of [-72,47]){kb(xx,49,23,5,17,'#5b7182','#2c4255');kr(xx+6,56,10,2,'#afbec6');}kr(-72,64,4,6,'#112537');kr(65,64,4,6,'#112537');
  if(type===0){kTower(-65,-43,true,now);kScreen(-18,-32,'board',now);kBoard(2,14,34,19);kr(45,17,16,4,'#82a698');kr(47,18,12,1,'#d0bd79');}
  if(type===1){kScreen(-50,-33,'wave',now);kScreen(5,-33,'status',now);kb(-72,10,19,13,9,'#9ba5a2','#435d6a');kr(-69,13,13,7,'#152f3f');wire([-68,16,-65,16,-63,13,-60,18,-57,15],'#e9c85d');}
  if(type===3){kTower(-65,-42,false,now);kScreen(-15,-33,'fan',now);kb(43,10,24,12,7,'#879598','#3c5360');kr(47,13,10,5,'#102c3b');kr(49,14,6,2,'#6edbc2');wire([60,16,72,16,72,28,55,28],'#152c3f',2);kr(54,22,14,2,'#b3b6ab');kr(53,22,6,3,'#ce9c55');}
  if(type===4){kScreen(-52,-33,'net',now);kScreen(3,-33,'status',now);kb(31,16,39,8,6,'#5e7b8c','#233e52');for(let i=0;i<8;i++){kr(34+i*4,26,2,2,'#75ecd3');wire([35+i*4,29,35+i*4,33,7+i*3,33],'#bead73');}kr(32,-1,2,17,'#9aafbc');kr(64,-1,2,17,'#9aafbc');}
  kKeyboard(-22,28,45);kr(29,29,7,8,'#8eacb9');kr(31,29,1,3,'#d4e7ec');
  // Screwdrivers, loose CPU, RAM and parts tray.
  kr(-48,23,15,2,'#bdc3bd');kr(-48,22,6,4,'#e0ac5a');kr(-38,12,7,7,'#b3b7ad');kr(-36,14,3,3,'#607681');
  kr(-30,10,2,13,'#bac9cc');kr(-31,9,4,5,'#4aadb4');
 }
 ctx.restore();kr(-85,32,170,21,'#0b1b2be8');kr(-85,32,170,1,done?'#58c7aa':'#c2a458');kt(KSK_NAMES[type],0,46,10,done?'#81e4c7':'#e3dfcc','center');
}
function drawKskExit(now){
 const x=exitCell.x*44+22,y=exitCell.y*44+22,c=exitOpen?'#71f1cf':'#ffd07a';kg(x,y+24,84,exitOpen?'#35baab39':'#e6ab3e36');
 kb(x-34,y-74,68,12,101,'#8c9aa1','#354c60');kr(x-26,y-58,52,82,'#0c2233');
 if(!exitOpen){kr(x-22,y-54,21,75,'#344c5e');kr(x+2,y-54,21,75,'#293e51');kr(x,y-54,2,75,'#ae955d');for(let i=0;i<5;i++){kr(x-18,y-48+i*13,12,2,'#607383');kr(x+7,y-48+i*13,12,2,'#435c70');}}
 else {kr(x-22,y-54,4,75,'#3b697b');kr(x+19,y-54,4,75,'#3b697b');}
 kr(x-29,y-58,3,85,c);kr(x+27,y-58,3,85,c);kr(x-29,y+26,59,4,c);
 for(let i=0;i<8;i++)kr(x-29+i*8,y-62,4,4,'#ddba62');
 kb(x-18,y-85,36,4,5,'#637b88','#2f4657');kr(x-14,y-82,28,3,'#fff0c1');
 kt('К СОТЕ',x,y-65,12,'#f9e7bc','center');
 for(let dx of [-10,3])for(let i=0;i<6;i++)kr(x+dx+(i<3?i:5-i)*2,y-13+i*3,3,3,c);
 kt(exitOpen?'ОТКРЫТО':`${collected} / 5`,x,y+43,10,c,'center');kr(x-40,y-10,8,16,'#152d40');kr(x-38,y-7,4,6,c);
}
window.STATION_RENDERERS=window.STATION_RENDERERS||{};
window.STATION_RENDERERS.ksk=drawKskStation;
