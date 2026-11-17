from pathlib import Path
p=Path('specialties/p/p.js');s=p.read_text(encoding='utf-8')
s=s.replace("pRect(574,173,305,41,'#78c4db16');", "pRect(574,127,305,87,'#78c4db14');pRect(574,127,305,2,'#8bb3d950');")
s=s.replace("pRect(x,171,3,45,'#627f9a');pRect(x+9,177,2,25,'#bee8ff44');", "pRect(x,128,3,88,'#627f9a');pRect(x+9,139,2,37,'#bee8ff33');")
s=s.replace("for(let i=0;i<12;i++)pRect(xx+i*2,179+i*2,2,6,'#d3f1ff1c');", "for(let i=0;i<23;i++)pRect(xx+i*2,147+i*2,2,12,'#d3f1ff18');")
s=s.replace("pGlow(x,y+17,90,'#b164ef30');", "pGlow(x,y+17,90,'#b164ef50');pGlow(x,y+3,33,'#c780ff55');")
s=s.replace("pGlow(x+20,y+63,60,'#22aaff30');", "pGlow(x+20,y+63,60,'#22aaff48');")
s=s.replace("pRect(x+27,yy+3,4,3,active?'#74e9ff':'#226c9a');", "pRect(x+24,yy+1,11,7,active?'#36b8ff25':'#226c9a10');pRect(x+27,yy+3,4,3,active?'#74e9ff':'#226c9a');")
a=s.index('function pPlant(');b=s.index('\nfunction pRack',a)
s=s[:a]+'''function pPlant(x,y){
 pRect(x-16,y+22,35,6,'#0b13226b');
 pBox(x-12,y,24,10,17,'#b3b6c3','#646d83');pRect(x-10,y+2,20,5,'#24313b');
 pRect(x-8,y+12,3,11,'#929aa9');pRect(x-5,y-28,3,32,'#345c51');
 const leaves=[[-17,-25],[-10,-37],[1,-44],[9,-31],[-14,-14],[7,-20],[-3,-29],[14,-11],[0,-17]];
 for(let i=0;i<leaves.length;i++){
  const [dx,dy]=leaves[i],xx=x+dx,yy=y+dy;
  pRect(xx+2,yy,4,3,'#80b98b');pRect(xx,yy+3,8,8,i%2?'#478a72':'#376c5c');
  pRect(xx+1,yy+11,6,4,'#29564f');pRect(xx+3,yy+4,2,9,'#6ba581');
 }
}'''+s[b:]
p.write_text(s,encoding='utf-8')
p=Path('.qa/check.cjs');s=p.read_text(encoding='utf-8');s=s.replace("await page.screenshot({path:'.qa/it-desktop.png'});", "await page.screenshot({path:'.qa/it-desktop.png'});\nconsole.log('Mean warm render ms (desktop):',await page.evaluate(()=>{let t=performance.now();for(let i=0;i<60;i++)draw(t+i*16);return ((performance.now()-t)/60).toFixed(2)}));")
p.write_text(s,encoding='utf-8')
