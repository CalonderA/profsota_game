const {chromium}=require('C:/Users/777/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/777/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});let errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('http://game.test/**',async r=>{const f=path.join(process.cwd(),decodeURIComponent(new URL(r.request().url()).pathname));if(!fs.existsSync(f))return r.fulfill({status:404,body:''});await r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png'})[path.extname(f)]||'application/octet-stream'});});

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
