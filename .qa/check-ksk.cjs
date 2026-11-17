const {chromium}=require('C:/Users/777/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/777/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});let errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('http://game.test/**',async r=>{const f=path.join(process.cwd(),decodeURIComponent(new URL(r.request().url()).pathname));if(!fs.existsSync(f))return r.fulfill({status:404,body:''});await r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png'})[path.extname(f)]||'application/octet-stream'});});
await page.goto('http://game.test/menu.html');await page.locator('#nodeKsk').click();await page.locator('#panelActions a[href="index.html?spec=ksk"]').click();await page.waitForTimeout(600);
console.log('URL',page.url(),'errors',errors);
await page.click('#startBtn');await page.evaluate(()=>startGame(CITIES[0]));await page.waitForTimeout(300);
await page.screenshot({path:'.qa/ksk-desktop.png'});
console.log('Mean warm render ms (desktop):',await page.evaluate(()=>{let t=performance.now();for(let i=0;i<60;i++)draw(t+i*16);return ((performance.now()-t)/60).toFixed(2)}));
console.log(await page.evaluate(()=>({state,needed,questions:QUESTIONS.filter(q=>q.spec==='ksk').length,paths:crystals.map(c=>!!planPath(c.x,c.y))})));
assert.equal(await page.evaluate(()=>needed),5);
// Keyboard movement and blocked furniture use the real controls.
await page.keyboard.press('ArrowLeft');assert.equal(await page.evaluate(()=>player.gx),10);
await page.waitForTimeout(100);await page.keyboard.press('KeyD');assert.equal(await page.evaluate(()=>player.gx),11);
await page.evaluate(()=>{player.gx=5;player.gy=5;tryMove(0,-1);});assert.equal(await page.evaluate(()=>player.gy),5);
await page.evaluate(()=>startGame(CITIES[0]));
const tap=await page.evaluate(()=>{const r=canvas.getBoundingClientRect();return {x:r.left+(12*TILE+22-camX)*zoom,y:r.top+(6*TILE+22-camY)*zoom};});
await page.mouse.click(tap.x,tap.y);await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>player.gx),12);
// A closed door cannot finish the run.
await page.evaluate(()=>{player.gx=exitCell.x;player.gy=exitCell.y;onEnterTile();});
assert.equal(await page.evaluate(()=>state),'playing');assert.equal(await page.evaluate(()=>completedMines),0);
await page.evaluate(()=>startGame(CITIES[0]));
// Actually walk BFS paths; answer using the existing question buttons.
for(let i=0;i<5;i++){
const route=await page.evaluate(i=>planPath(crystals[i].x,crystals[i].y),i);assert(route);
await page.evaluate(route=>{for(const p of route){tryMove(p.x-player.gx,p.y-player.gy);}},route);
assert.equal(await page.evaluate(()=>state),'question');
assert.equal(await page.evaluate(()=>activeQuestion.station),i);
if(i===0){await page.click('#qAnswers [data-ok="0"]');await page.click('#qNextBtn');assert.equal(await page.evaluate(()=>collected),0);assert.equal(await page.evaluate(()=>exitOpen),false);assert.equal(await page.evaluate(()=>state),'question');}
await page.click('#qAnswers [data-ok="1"]');await page.click('#qNextBtn');
}
assert(await page.evaluate(()=>exitOpen&&collected===5&&crystals.every(c=>c.done)));
assert.equal(await page.evaluate(()=>state),'playing');
const earned=await page.evaluate(()=>score);await page.evaluate(()=>{openQuestion(crystals[0]);tapTo(crystals[0]);});assert.equal(await page.evaluate(()=>score),earned);assert.equal(await page.evaluate(()=>state),'playing');await page.evaluate(()=>stopAuto());
await page.screenshot({path:'.qa/ksk-complete.png'});
await page.evaluate(()=>{for(const p of planPath(exitCell.x,exitCell.y))tryMove(p.x-player.gx,p.y-player.gy);});
assert.equal(await page.evaluate(()=>state),'dead');assert(await page.locator('#endScreen').isVisible());
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>startGame(CITIES[0]));await page.waitForTimeout(300);await page.screenshot({path:'.qa/ksk-mobile.png'});
const before=await page.evaluate(()=>player.gx);await page.locator('.dpad .r').dispatchEvent('pointerdown');assert.equal(await page.evaluate(()=>player.gx),before+1);
// Mobile tap coordinates use the scrolling camera.
await page.waitForTimeout(200);
const mt=await page.evaluate(()=>{const r=canvas.getBoundingClientRect();return {x:r.left+((player.gx+1)*TILE+22-camX)*zoom,y:r.top+(player.gy*TILE+22-camY)*zoom};});
await page.mouse.click(mt.x,mt.y);await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>player.gx),before+2);
await page.goto('file:///'+process.cwd().replaceAll('\\','/')+'/index.html?spec=ksk');await page.waitForTimeout(500);
assert.equal(await page.evaluate(()=>QUESTIONS.filter(q=>q.spec==='ksk').length),25);
await page.click('#startBtn');await page.evaluate(()=>startGame(CITIES[0]));assert.equal(await page.evaluate(()=>state),'playing');
assert.deepEqual(errors,[]);console.log('PASS five stations, questions, exit, mobile dpad; no JS errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
