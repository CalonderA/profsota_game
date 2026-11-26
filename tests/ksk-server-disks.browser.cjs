const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}/specialties/ksk/index.html`;
  await page.goto(url);await page.evaluate(()=>{startGame();openQuestion(crystals.find(c=>c.stationType===2));});
  const slot=i=>page.locator(`[data-slot="${i}"]`),spare=i=>page.locator(`[data-spare="${i}"]`);
  assert.equal(await page.locator('.sd-slot').count(),18);
  const failed=await page.locator('[data-state=failed]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.slot)));
  assert.equal(failed.length,3);assert.equal(await page.locator('[data-state=healthy]').count(),15);
  assert.equal(await page.locator('.sd-slot[data-guide="1"][data-state=failed]').count(),1);
  assert.match(await page.locator('.sd-hint h3').textContent(),/извлечение/);
  assert.equal(await page.locator('.sd-finish').isVisible(),false);
  assert.deepEqual(await page.locator('.sd-close').evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),{width:44,height:44});
  assert.equal(await page.locator('.sd-close svg').count(),1);
  await spare(0).click();await page.keyboard.press('Escape');
  assert.equal(await page.locator('.ksk-exit-confirm[open]').count(),1);
  assert.match(await page.locator('.ksk-exit-confirm').textContent(),/15 света/);
  await page.locator('[data-exit=cancel]').click();
  assert.equal(await page.locator('[data-state=failed]').count(),3);
  for(const [width,height] of [[1920,1080],[1366,768],[1280,720]]){
   await page.setViewportSize({width,height});
   assert(await page.locator('.sd-game').evaluate(el=>{
    const fits=n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;};
    return el.scrollHeight<=el.clientHeight+1&&[el,...el.querySelectorAll('.sd-header,.sd-footer,.sd-hint,.sd-slot')].every(fits);
   }),`Layout fits ${width}x${height}`);
  }
  await page.setViewportSize({width:1366,height:768});
  await page.screenshot({path:path.join(os.tmpdir(),'ksk-server-disks.png')});
  await page.locator('[data-state=healthy]').first().click({force:true});assert.equal(await page.locator('[data-state=healthy]').count(),15);
  await spare(0).dragTo(slot(failed[0]));assert.equal(await slot(failed[0]).getAttribute('data-state'),'failed');assert.match(await page.locator('.sd-count').textContent(),/3 из 3/);
  for(let i=0;i<3;i++){
   await slot(failed[i]).click();await page.waitForTimeout(350);
   assert.equal(await slot(failed[i]).getAttribute('data-state'),'empty');
   assert.equal(await slot(failed[i]).getAttribute('data-guide'),'2');
   assert.equal(await page.locator('[data-spare][data-guide="1"]').count(),1);
   if(i===0){await spare(i).dragTo(page.locator('.sd-hint'));assert.match(await page.locator('.sd-count').textContent(),/3 из 3/);}
   if(i===1){await spare(i).focus();await page.keyboard.press('Enter');await slot(failed[i]).focus();await page.keyboard.press('Enter');}
   else await spare(i).dragTo(slot(failed[i]));
   assert.equal(await slot(failed[i]).getAttribute('data-state'),'checking');
   await slot(failed[i]).click({force:true});assert.equal(await slot(failed[i]).getAttribute('data-state'),'checking');
   await page.waitForTimeout(1250);assert.equal(await slot(failed[i]).getAttribute('data-state'),'repaired');
  }
  assert.match(await page.locator('.sd-status').textContent(),/Серверное оборудование исправно/);
  assert.equal(await page.locator('.sd-finish').isVisible(),true);
  assert.equal(await page.locator('.sd-finish').getAttribute('data-guide'),'✓');
  await page.locator('.sd-finish').click();
  assert.deepEqual(await page.evaluate(()=>({score,collected,done:crystals.find(c=>c.stationType===2).done,state})),{score:600,collected:1,done:true,state:'playing'});
  await page.evaluate(()=>{window.testDone=0;window.testCancel=0;openKskDisks(()=>window.testDone++,()=>window.testCancel++);});
  await page.locator('[data-state=failed]').first().click();await page.locator('.sd-close').click();await page.locator('[data-exit=cancel]').click();
  assert.equal(await page.locator('.sd-game').count(),1);
  await page.locator('.sd-close').click();await page.locator('[data-exit=accept]').click();await page.waitForTimeout(1400);
  assert.deepEqual(await page.evaluate(()=>[testDone,testCancel]),[0,1]);
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(url);await mobile.evaluate(()=>{startGame();openQuestion(crystals.find(c=>c.stationType===2));});
  const touchSession=await mobile.context().newCDPSession(mobile);
  for(let i=0;i<3;i++){
   const target=await mobile.locator('[data-state=failed]').first().getAttribute('data-slot');
   await mobile.locator(`[data-slot="${target}"]`).tap();await mobile.waitForTimeout(350);
   if(i===0){
    const from=await mobile.locator(`[data-spare="${i}"]`).boundingBox(),to=await mobile.locator(`[data-slot="${target}"]`).boundingBox();
    const start={x:from.x+from.width/2,y:from.y+from.height/2},end={x:to.x+to.width/2,y:to.y+to.height/2};
    await touchSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
    for(let step=1;step<=10;step++)await touchSession.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*step/10,y:start.y+(end.y-start.y)*step/10}]});
    await touchSession.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }else{await mobile.locator(`[data-spare="${i}"]`).tap();await mobile.locator(`[data-slot="${target}"]`).tap();}
   await mobile.waitForTimeout(1250);
   assert.equal(await mobile.locator(`[data-slot="${target}"]`).getAttribute('data-state'),'repaired');
  }
  await mobile.screenshot({path:path.join(os.tmpdir(),'ksk-server-disks-mobile.png')});
  await mobile.locator('.sd-finish').tap();assert.equal(await mobile.evaluate(()=>collected),1);
  assert.deepEqual(errors,[]);console.log('PASS: desktop layouts, drag, rejected drops, keyboard, touch, completion, progress and cancellation.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
