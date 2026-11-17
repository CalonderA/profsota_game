from pathlib import Path
for name in ['specialties/p/p.js','specialties/ksk/ksk.js']:
 p=Path(name);s=p.read_text(encoding='utf-8-sig');s=s.replace('totalMines=1','totalMines=minesFor(city.km)');s=s.replace("toast('Пять станций → дверь «К СОТЕ». Подойдите к маркеру задания.');", "toast('Маршрут: ' + totalMines + ' лаборатории · по пять заданий в каждой.');");s=s.replace("toast('Пять станций лаборатории → дверь «К СОТЕ».');", "toast('Маршрут: ' + totalMines + ' лаборатории · по пять заданий в каждой.');");p.write_text(s,encoding='utf-8')
p=Path('shared/js/common.js');s=p.read_text(encoding='utf-8');s=s.replace("const mines = (currentSpec === 'p' || currentSpec === 'ksk') ? 1 : minesFor(c.km);","const mines = minesFor(c.km);");p.write_text(s,encoding='utf-8')
for name in ['specialties/p/index.html','specialties/ksk/index.html']:
 p=Path(name);s=p.read_text(encoding='utf-8');s=s.replace('пройдите пять станций лаборатории. За дальний путь награда больше.','чем дальше город, тем больше лабораторий: от 2 до 5. В каждой — пять заданий. В последней вас ждёт здание СОТА.').replace('пройдите пять станций IT-центра. За дальний путь награда больше.','чем дальше город, тем больше лабораторий: от 2 до 5. В каждой — пять заданий. В последней вас ждёт здание СОТА.');p.write_text(s,encoding='utf-8')
# Use existing browser harness and resource routing.
s=Path('.qa/check-ksk.cjs').read_text(encoding='utf-8');s=s[:s.index("await page.goto('http://game.test/menu.html');")]+'''
for(const spec of ['p','ksk']){
 await page.goto('http://game.test/index.html?spec='+spec);await page.waitForTimeout(200);
 const counts=await page.evaluate(()=>[8,90,91,135,136,180,181,238].map(minesFor));assert.deepEqual(counts,[2,2,3,3,4,4,5,5]);
 await page.click('#startBtn');
 const cityLabels=await page.locator('#cityGrid').innerText();assert(cityLabels.includes('5'));
 for(const cityIndex of [0,29]){
  await page.evaluate(i=>startGame(CITIES[i]),cityIndex);
  const total=await page.evaluate(()=>totalMines);assert.equal(total,cityIndex===0?2:5);
  for(let floor=0;floor<total;floor++){
   assert.equal(await page.evaluate(()=>completedMines),floor);
   assert.equal(await page.evaluate(()=>needed),5);assert.equal(await page.evaluate(()=>collected),0);
   const distance=await page.evaluate(()=>leftKm());assert(distance>0);
   for(let i=0;i<5;i++){
    await page.evaluate(i=>{const path=planPath(crystals[i].x,crystals[i].y);if(!path)throw Error('Unreachable station');for(const p of path)tryMove(p.x-player.gx,p.y-player.gy);},i);
    assert.equal(await page.evaluate(()=>state),'question');
    await page.click('#qAnswers [data-ok="1"]');await page.click('#qNextBtn');
   }
   assert(await page.evaluate(()=>exitOpen));
   assert.equal(await page.evaluate(()=>completedMines===totalMines-1),floor===total-1);
   await page.evaluate(()=>{for(const p of planPath(exitCell.x,exitCell.y))tryMove(p.x-player.gx,p.y-player.gy);});
   if(floor<total-1){assert.equal(await page.evaluate(()=>state),'playing');assert((await page.evaluate(()=>leftKm()))<distance);}
  }
  assert.equal(await page.evaluate(()=>state),'dead');assert.equal(await page.evaluate(()=>leftKm()),0);
  assert.equal(await page.evaluate(()=>runOre),total*5);assert(await page.locator('#endScreen').isVisible());
 }
 console.log('PASS',spec,'2 and 5 laboratories, reset tasks, distance, transitions, final victory');
}
assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
'''
Path('.qa/check-multi-labs.cjs').write_text(s,encoding='utf-8')
