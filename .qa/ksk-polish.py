from pathlib import Path
p=Path('specialties/ksk/ksk.js');s=p.read_text(encoding='utf-8-sig').replace('block(2,2,6,1);','block(2,2,6,1);block(2,3,3,1);').replace('block(10,11,3,2);','block(10,11,3,3);block(13,12,1,1);')
a=s.index('function kBoard(');b=s.index('\nfunction kFan',a)
s=s[:a]+'''function kBoard(x,y,w=48,h=31){
 kb(x,y,w,h,3,'#24655e','#123b39');
 ctx.save();ctx.translate(x,y);ctx.scale(w/48,h/31);
 kr(8,7,14,14,'#b2b5ab');kr(10,9,10,10,'#505d65');
 for(let i=0;i<4;i++){kr(26+i*4,5,2,19,'#d9bb71');kr(26+i*4,7,2,14,'#172f36');}
 for(let i=0;i<3;i++){kr(5,24+i*2,34,1,'#ad9c65');kr(3+i*13,3,2,2,'#97b9a2');}
 ctx.restore();
}'''+s[b:];p.write_text(s,encoding='utf-8')
p=Path('shared/js/common.js');s=p.read_text(encoding='utf-8');a=s.index('    ksk: {');b=s.index('\n    }',a);s=s[:a]+s[a:b].replace("floorName: 'Сектор'","floorName: 'Лаборатория'")+s[b:];p.write_text(s,encoding='utf-8')
p=Path('.qa/check-ksk.cjs');s=p.read_text(encoding='utf-8');s=s.replace('// Actually walk BFS paths;', '''// A closed door cannot finish the run.
await page.evaluate(()=>{player.gx=exitCell.x;player.gy=exitCell.y;onEnterTile();});
assert.equal(await page.evaluate(()=>state),'playing');assert.equal(await page.evaluate(()=>completedMines),0);
await page.evaluate(()=>startGame(CITIES[0]));
// Actually walk BFS paths;''')
s=s.replace("assert.equal(await page.evaluate(()=>state),'question');\nawait page.click", """assert.equal(await page.evaluate(()=>state),'question');
assert.equal(await page.evaluate(()=>activeQuestion.station),i);
if(i===0){await page.click('#qAnswers [data-ok="0"]');await page.click('#qNextBtn');assert.equal(await page.evaluate(()=>collected),0);assert.equal(await page.evaluate(()=>exitOpen),false);assert.equal(await page.evaluate(()=>state),'question');}
await page.click""")
p.write_text(s,encoding='utf-8')
