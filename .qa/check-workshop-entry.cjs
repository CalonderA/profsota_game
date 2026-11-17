const {chromium}=require('C:/Users/777/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/777/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});let errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('http://game.test/**',async r=>{const f=path.join(process.cwd(),decodeURIComponent(new URL(r.request().url()).pathname));if(!fs.existsSync(f))return r.fulfill({status:404,body:''});await r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png'})[path.extname(f)]||'application/octet-stream'});});

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
