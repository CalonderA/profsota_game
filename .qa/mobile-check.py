from pathlib import Path
s=Path('.qa/check-ksk.cjs').read_text(encoding='utf-8');s=s[:s.index("await page.goto('http://game.test/menu.html');")]+'''
for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390}]){
 await page.setViewportSize(size);await page.goto('http://game.test/menu.html');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(size.width<760){await page.locator('.mobile-spec-list [data-spec="p"]').click();await page.locator('#panelActions a').click();await page.waitForURL('**/specialties/p/index.html');}
 for(const spec of ['p','ksk','kip','ts']){
  await page.goto('http://game.test/index.html?spec='+spec);await page.waitForTimeout(150);
  // Scroll the actual overlay to reach start without forced clicks.
  await page.click('#startBtn');assert(await page.locator('#cityScreen').isVisible());
  await page.locator('#cityGrid .citybtn').first().click();await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>state),'playing');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const dpad=await page.locator('.dpad').boundingBox();assert(dpad && dpad.y+dpad.height<=size.height+1);
  const before=await page.evaluate(()=>player.gx);await page.locator('.dpad .r').dispatchEvent('pointerdown');assert.equal(await page.evaluate(()=>player.gx),before+1);
  await page.evaluate(()=>{const c=crystals[0];const route=planPath(c.x,c.y);for(const p of route)tryMove(p.x-player.gx,p.y-player.gy);});
  assert.equal(await page.evaluate(()=>state),'question');await page.click('#qAnswers [data-ok="1"]');await page.click('#qNextBtn');
  assert.equal(await page.evaluate(()=>state),'playing');
  if(spec==='p'){
   assert.equal(await page.evaluate(()=>needed),4);assert.equal(await page.evaluate(()=>crystals.length),4);
   assert(await page.evaluate(()=>map[9][16]===FLOOR));
   for(let floor=0;floor<2;floor++){
    const start=floor===0?1:0;
    for(let i=start;i<4;i++){
     await page.evaluate(i=>{const c=crystals[i];for(const p of planPath(c.x,c.y))tryMove(p.x-player.gx,p.y-player.gy);},i);
     await page.click('#qAnswers [data-ok="1"]');await page.click('#qNextBtn');
    }
    assert(await page.evaluate(()=>exitOpen));
    await page.evaluate(()=>{for(const p of planPath(exitCell.x,exitCell.y))tryMove(p.x-player.gx,p.y-player.gy);});
   }
   assert.equal(await page.evaluate(()=>state),'dead');assert.equal(await page.evaluate(()=>runOre),8);
   await page.waitForFunction(()=>sotaSprite&&sotaSprite.naturalWidth>0);
   await page.locator('#againBtn').scrollIntoViewIfNeeded();assert(await page.locator('#againBtn').isVisible());
   await page.screenshot({path:'.qa/mobile-results-'+size.width+'.png'});
  }
 }
 console.log('PASS mobile',size.width,size.height,'menu, four playable specialties, questions, dpad, P four tasks and final victory');
}
assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
'''
Path('.qa/check-mobile-all.cjs').write_text(s,encoding='utf-8')
