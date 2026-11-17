from pathlib import Path
p=Path('specialties/p/p.js')
s=p.read_text(encoding='utf-8')
def replace(name, body):
 global s
 start=s.index('function '+name+'(')
 end=s.find('\nfunction ',start+1)
 if end<0:end=s.index('\nwindow.STATION_RENDERERS',start)
 s=s[:start]+body.rstrip()+'\n'+s[end:]
replace('pGlow', '''// Cache light sprites: no large gradients or shadowBlur in the frame loop.
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
const pFloorCache = new Map();''')
replace('drawPFloor', '''function drawPFloor(x,y){
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
}''')
replace('pRack', '''function pRack(x,y,n,now){
 pGlow(x+20,y+63,60,'#22aaff30');
 pBox(x,y,43,12,88,'#66748a','#111a2a');pRect(x+4,y+15,33,80,'#080e1a');
 for(let r=0;r<6;r++){
  const yy=y+20+r*12,active=Math.sin(now*.002+r*2+n)>-.25;
  pRect(x+7,yy,26,9,'#2a384c');pRect(x+9,yy+2,15,1,'#607189');
  for(let vent=0;vent<5;vent++)pRect(x+9+vent*3,yy+5,1,2,'#0a1420');
  pRect(x+27,yy+3,4,3,active?'#74e9ff':'#226c9a');pRect(x+32,yy+3,2,2,active?'#c5fcff':'#328398');
  pRect(x+6,yy,1,8,'#7194bc');
 }
 pRect(x+2,y+15,2,76,'#6f66ba');pRect(x+39,y+14,2,80,'#32495f');
 pText('0'+n,x+13,y+10,8,'#d3e8f8');pRect(x+17,y+94,12,2,'#52c9eb');
}''')
# Upgrade glass without moving its footprint or the entrance.
s=s.replace("pRect(572,88,308,112,'#172b3b');", "pRect(572,88,308,112,'#172b3b');pGlow(716,151,160,'#2788da35');")
s=s.replace("pRect(574,193,305,21,'#78c4db22');", "pRect(574,173,305,41,'#78c4db16');")
s=s.replace("pText('ВХОД →',883,207,9,'#78d7e6');", """// Aluminium frames and diagonal reflections, kept inside the existing glass boundary.
 pRect(574,96,5,118,'#65859e');pRect(579,96,2,115,'#c4eaff66');
 for(let xx=591;xx<870;xx+=76){pRect(xx,175,43,1,'#c6eaff55');for(let i=0;i<12;i++)pRect(xx+i*2,179+i*2,2,6,'#d3f1ff1c');}
 pRect(580,210,296,3,'#59bbeb');pGlow(733,211,122,'#218dea22');
 pText('ВХОД →',883,207,9,'#78d7e6');
 pVent(814,109,49,25);pVent(60,29,59,24);
 for(const xx of [155,629,835])pLamp(xx,77,'#d488ff');
 pLamp(930,156,'#9bd9ff');""")
s=s.replace("pBox(204,100,228,69,7,'#586478','#222b3c');pRect(210,105,216,59,'#162d38');", "pBox(204,100,228,47,7,'#586478','#222b3c');pRect(210,105,216,37,'#162d38');")
s=s.replace("pRect(220+i*49,132,41,20,'#2d5360');pText(t,240+i*49,145", "pRect(220+i*49,126,41,13,'#2d5360');pText(t,240+i*49,136").replace("262+i*49,145","262+i*49,136")
s=s.replace("pRect(388,163,18,3,'#e4b0d4');pPlant(475,145);", """pRect(388,142,18,3,'#e4b0d4');pPlant(475,145);
 // Shallow wall workstations fit wholly in the already blocked board alcove.
 pDeskConsole(247,155,now);pDeskConsole(362,155,now);
 pTinyPlant(170,120);""")
replace('drawPProps', '''function drawPProps(now){
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
 pText('IT / СОТА',470,555,27,'#45425e','center');pText('ПЯТЬ ИДЕЙ. ОДНА КОМАНДА.',470,575,9,'#72748e','center');
}''')
replace('pMonitor', '''function pMonitor(x,y,kind,now){
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
}''')
# Desk shape unchanged; warmer material and a second, distinct security/game screen.
s=s.replace("pBox(-62,-2,124,35,15,'#596075','#2d344a');pRect(-60,0,120,3,'#8d86a4');", """pGlow(0,22,75,done?'#48d8a418':'#f6b64d22');
  pRect(-59,48,130,18,'#070d1a65');
  pBox(-62,-2,124,35,15,'#947c78','#4a4053');pRect(-60,0,120,3,'#c1a48e');
  for(let line=0;line<4;line++)pRect(-57,7+line*7,108,1,'#5b50673b');
  pCable([-29,5,-29,11,12,11,12,34,48,34],'#263347');
  pCable([23,6,23,14,45,14,45,29,52,29],'#68a7bd');""")
s=s.replace("pMonitor(0,-35,type===0?0:type,now);", "pMonitor(0,-35,type===3||type===4?5:type,now);")
s=s.replace("pRect(35,21,6,7,'#8893b1');", "pRect(35,21,6,7,'#8893b1');pRect(37,21,1,3,'#dbe3ec');pCable([38,20,38,16,29,16,29,12],'#21283b');")
s=s.replace("// Кресло с высокой", """if(type===3)pGamepad(4,11);
  if(type===0){pRect(-47,4,12,9,'#d9cab0');pRect(-45,6,8,1,'#778f9d');pRect(-45,9,6,1,'#778f9d');}
  if(type===4){pRect(-48,5,14,8,'#1b2839');pRect(-46,7,5,4,'#5bb9aa');pRect(-38,7,2,2,'#c598e5');}
  pRect(-61,9,5,9,'#e4ceb8');pRect(-60,10,3,2,'#9d708d');
  // Кресло с высокой""")
s=s.replace("pRect(17,51,7,3,'#a0a3b8');", """pRect(17,51,7,3,'#a0a3b8');
  pRect(-10,55,20,2,'#a297bb');pRect(-11,65,22,1,'#252c41');
  for(const wx of [-18,14]){pRect(wx,70,5,3,'#0c1220');pRect(wx+1,70,2,1,'#65718b');}""")
s=s.replace("if(type===2){pMonitor(-20,-17,0,now);pBox(-27,28,58,15,10,'#526277','#26354b');pText('ТЕРМИНАЛ',0,38,8,'#92d9e4','center');}", """if(type===2){pGlow(0,20,65,'#31bcf52b');pMonitor(-20,-17,5,now);pBox(-27,28,58,15,10,'#526277','#26354b');
  for(let row=0;row<3;row++)for(let key=0;key<9;key++)pRect(-21+key*4,32+row*3,3,2,'#8ea9c0');pRect(19,32,6,8,'#b9c7d2');
  pCable([-24,29,-30,29,-30,7,-42,7],'#427d9a');pRect(-23,48,46,2,'#6edaff');}""")
s=s.replace("ctx.restore();pText(P_NAMES[type],0,45,10,done?'#77dcb3':'#c4cfdf','center');", """ctx.restore();
 const label=type===2?'Серверное оборудование':P_NAMES[type];
 pRect(-82,33,164,19,'#0c1425dc');pRect(-82,33,164,1,done?'#58bca1':'#aa8750');
 pText(label,0,46,10,done?'#77dcb3':'#d9d4cc','center');""")
replace('drawPExit', '''function drawPExit(now){
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
 pText('К СОТЕ',x,y-61,12,'#f8e5ca','center');pText(exitOpen?'ОТКРЫТО':`${collected} / 5`,x,y+42,10,c,'center');
 pRect(x-40,y-15,9,19,'#18253a');pRect(x-38,y-12,5,6,c);pRect(x-38,y-3,5,2,'#8093aa');
}''')
# Render-only helpers. No additions to map, pickups, stations or movement.
pos=s.index('\nwindow.STATION_RENDERERS')
s=s[:pos]+'''
function pCable(points,color){
 ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(points[0],points[1]);
 for(let i=2;i<points.length;i+=2)ctx.lineTo(points[i],points[i+1]);ctx.stroke();
}
function pLamp(x,y,color){
 pGlow(x,y+17,90,'#b164ef30');pBox(x-25,y-3,50,5,5,'#44425f','#202339');
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
'''+s[pos:]
p.write_text(s,encoding='utf-8')
