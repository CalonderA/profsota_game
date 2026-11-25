// Run with node; PLAYWRIGHT_MODULE / BROWSER_PATH may point to an existing local installation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const centres = [[322,245],[440,245],[325,448],[345,352],[310,134],[474,566],[675,325]];
const hotTemps = {0:103,1:86,3:72,4:110,5:98};
const eligible = [0,1,3,4,5];
const server = http.createServer((req,res) => {
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{
    if(error){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
    res.end(data);
  });
});
function randomFor(first,second) {
  const desired=[first,second,...eligible.filter(i=>i!==first&&i!==second)];
  const values=[],order=[...eligible];
  for(let i=order.length-1;i>0;i--){const j=order.indexOf(desired[i]);values.push((j+.1)/(i+1));[order[i],order[j]]=[order[j],order[i]];}
  return values;
}
async function open(page,first=0,second=1,integration=false) {
  await page.evaluate(({values,integration})=>{
    const original=Math.random;let index=0;
    if(integration)startGame();
    Math.random=()=>values[index++]??.5;
    try {
      if(integration)openQuestion(crystals.find(c=>c.stationType===1));
      else {window.testRewards=[];window.testCancels=0;window.openKskDiagnosis(n=>window.testRewards.push(n),()=>window.testCancels++);}
    } finally {Math.random=original;}
  },{values:randomFor(first,second),integration});
}
async function position(page,xy) {
  return page.locator('.dg-computer').evaluate((svg,[x,y])=>{
    const p=svg.createSVGPoint();p.x=x;p.y=y;const v=p.matrixTransform(svg.getScreenCTM());return {x:v.x,y:v.y};
  },xy);
}
async function tap(page,i,touch=false) {const p=await position(page,centres[i]);if(touch)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);}
async function found(page) {return page.locator('.dg-found').count();}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
  const errors=[];
  const url=`http://127.0.0.1:${server.address().port}/specialties/ksk/index.html`;
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.goto(url);await open(page,0,1,true);
    assert.equal(await page.locator('.dg-brand svg').count(),1);
    assert.equal(await page.locator('[data-action="finish"]').isVisible(),false);
    assert.equal(await page.locator('.dg-hitareas [data-part]').count(),7);
    const healthy=await position(page,centres[2]);await page.mouse.move(healthy.x,healthy.y);
    assert.equal(await page.locator('.dg-temp').textContent(),'72 °C');
    await tap(page,2);assert.equal(await page.locator('.dg-wrong').count(),1);assert.equal(await found(page),0);
    await page.waitForFunction(()=>!document.querySelector('.dg-wrong'));
    await tap(page,0);await tap(page,0);assert.equal(await found(page),1);
    await page.screenshot({path:path.join(os.tmpdir(),'ksk-diagnosis-desktop.png')});
    await tap(page,1);assert.equal(await found(page),2);assert.equal(await page.locator('[data-action="finish"]').isVisible(),true);
    await page.locator('[data-action="finish"]').click();
    const progress=await page.evaluate(()=>({score,done:crystals.find(c=>c.stationType===1).done,collected,state}));
    assert.deepEqual(progress,{score:575,done:true,collected:1,state:'playing'});
    // Every interactive region uses the same coordinates for normal art, heat and clicks.
    for(const [index,i] of eligible.entries()){
      const second=eligible[(index+1)%eligible.length];
      await open(page,i,second);
      const gpu=await position(page,centres[2]);await page.mouse.move(gpu.x,gpu.y);
      assert.equal(await page.locator('.dg-temp').textContent(),'72 °C');
      const cooling=await position(page,centres[6]);await page.mouse.move(cooling.x,cooling.y);
      assert.equal(await page.locator('.dg-temp').textContent(),'39 °C');
      const p=await position(page,centres[i]);await page.mouse.move(p.x,p.y);
      assert.equal(await page.locator('.dg-temp').textContent(),hotTemps[i]+' °C');
      await tap(page,i);assert.equal(await found(page),1);
      await tap(page,second);await page.locator('[data-action="finish"]').click();
      assert.deepEqual(await page.evaluate(()=>window.testRewards),[600]);
    }
    await open(page,4,5);
    await tap(page,6);assert.equal(await found(page),0);assert.equal(await page.locator('.dg-wrong').count(),1);
    await page.waitForFunction(()=>!document.querySelector('.dg-wrong'));
    const ramGap=await position(page,[459,245]);await page.mouse.click(ramGap.x,ramGap.y);
    assert.equal(await page.locator('.dg-temp').textContent(),'— °C');assert.equal(await page.locator('.dg-wrong').count(),0);
    const vrmJoin=await position(page,[230,165]);await page.mouse.move(vrmJoin.x,vrmJoin.y);
    assert.equal(await page.locator('.dg-temp').textContent(),'110 °C');
    const vrmLeft=await position(page,[220,230]);await page.mouse.click(vrmLeft.x,vrmLeft.y);assert.equal(await found(page),1);
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.testCancels),1);
    await open(page);
    const hint=await page.locator('.dg-hint').boundingBox(),scene=await page.locator('.dg-scene').boundingBox();
    assert(hint.y+hint.height<=scene.y);
    await page.locator('[data-action="exit"]').click();assert.equal(await page.evaluate(()=>window.testCancels),1);
    assert.deepEqual(await page.evaluate(()=>window.testRewards),[]);
    await open(page);
    await page.locator('[data-part="0"]').focus();await page.keyboard.press('Enter');assert.equal(await found(page),1);
    await page.locator('[data-part="1"]').focus();await page.keyboard.press('Space');assert.equal(await found(page),2);
    await page.keyboard.press('Enter');assert.equal(await page.locator('.ksk-diagnosis').count(),0);
    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    mobile.on('pageerror',error=>errors.push(error.message));await mobile.goto(url);await open(mobile,0,3);
    assert.equal(await mobile.locator('.ksk-diagnosis').evaluate(d=>d.scrollWidth<=d.clientWidth),true);
    const client=await mobile.context().newCDPSession(mobile);
    const a=await position(mobile,centres[0]),b=await position(mobile,centres[3]);
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[b]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await found(mobile),0,'scanning by dragging must not mark parts');
    await tap(mobile,3,true);assert.equal(await found(mobile),1);
    await mobile.screenshot({path:path.join(os.tmpdir(),'ksk-diagnosis-mobile.png')});
    await tap(mobile,0,true);await mobile.locator('[data-action="finish"]').tap();
    assert.deepEqual(await mobile.evaluate(()=>window.testRewards),[600]);
    assert.deepEqual(errors,[]);
    console.log('PASS: seven hit areas, temperatures, duplicate clicks, error flash, keyboard, touch drag/tap, completion, points and laboratory progress.');
    console.log('Screenshots:',path.join(os.tmpdir(),'ksk-diagnosis-desktop.png'),path.join(os.tmpdir(),'ksk-diagnosis-mobile.png'));
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
