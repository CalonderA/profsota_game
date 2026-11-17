from pathlib import Path
for spec in ['kip','ts']:
 p=Path('specialties')/spec/'index.html';s=p.read_text(encoding='utf-8');s=s.replace('<script src="../../shared/js/common.js">','<script src="../../shared/js/workshop-start.js"></script>\n  <script src="../../shared/js/common.js">');p.write_text(s,encoding='utf-8')
p=Path('menu.html');s=p.read_text(encoding='utf-8');s=s.replace('window.location.href = `${spec}.html`;','window.location.href = `index.html?spec=${encodeURIComponent(spec)}`;');p.write_text(s,encoding='utf-8')
s=Path('.qa/check-ksk.cjs').read_text(encoding='utf-8');s=s[:s.index("await page.goto('http://game.test/menu.html');")]+'''
for(const spec of ['kip','ts']){
 await page.setViewportSize({width:390,height:844});await page.goto('http://game.test/index.html?spec='+spec);await page.waitForTimeout(200);
 await page.click('#startBtn');await page.locator('#cityGrid .citybtn').first().click();assert.equal(await page.evaluate(()=>state),'playing');
 for(let floor=0;floor<2;floor++){
  const count=await page.evaluate(()=>needed);
  for(let i=0;i<count;i++){
   await page.evaluate(i=>{const c=crystals[i];for(const p of planPath(c.x,c.y))tryMove(p.x-player.gx,p.y-player.gy);},i);
   assert.equal(await page.evaluate(()=>state),'question');
   await page.click('#qAnswers [data-ok="1"]');await page.click('#qNextBtn');
  }
  await page.evaluate(()=>{for(const p of planPath(exitCell.x,exitCell.y))tryMove(p.x-player.gx,p.y-player.gy);});
  assert.equal(await page.evaluate(()=>completedMines),floor+1);
 }
 assert.equal(await page.evaluate(()=>state),'dead');await page.click('#againBtn');assert(await page.locator('#cityScreen').isVisible());
 console.log('PASS',spec,'start, questions, room transition, victory and restart on mobile');
}
assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
'''
Path('.qa/check-workshop-entry.cjs').write_text(s,encoding='utf-8')
