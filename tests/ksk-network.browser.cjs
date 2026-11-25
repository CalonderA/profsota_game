const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
    const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url=`http://127.0.0.1:${server.address().port}/specialties/ksk/index.html`;
    await page.goto(url);
    const open=()=>page.evaluate(()=>{startGame();openQuestion(crystals.find(c=>c.stationType===4));});
    await open();
    assert.equal(await page.locator('.nw-brand svg').count(),1);
    await page.locator('.nw-check').click();
    assert.match(await page.locator('.nw-status').textContent(),/Без связи/);
    const tool=kind=>page.locator(`[data-tool="${kind}"]`),slot=id=>page.locator(`[data-slot="${id}"]`);
    await tool('server').click();await slot('hub1').click();assert.equal(await page.locator('[data-device="server"]').count(),0);
    await slot('rack').click();
    // Actual drag placement, including an invalid drop.
    await tool('router').dragTo(slot('hub2'));
    assert.equal(await page.locator('[data-device="router"]').count(),1);
    await tool('switch').click();await slot('hub1').click();
    assert.equal(await page.locator('[data-port^="switch:"]').count(),8);
    const port=id=>page.locator(`[data-port="${id}"]`);
    const connect=async(a,b)=>{await port(a).click();await port(b).click();};
    await connect('internet:net','router:lan');
    await page.locator('.nw-check').click();assert.match(await page.locator('.nw-status').textContent(),/несовместимые/);
    await port('router:lan').click();assert.equal(await page.locator('[data-link]').count(),0);
    await connect('internet:net','router:wan');
    await port('router:lan').dragTo(port('switch:1'));
    for(const [i,d] of ['dev1','dev2','design1','design2','printer','server'].entries())await connect(d+':net','switch:'+(i+2));
    assert.equal(await page.locator('[data-link]').count(),8);
    // Remove a cable through its visible stroke and restore it.
    await page.locator('[data-link]').last().focus();await page.keyboard.press('Enter');
    await page.locator('.nw-check').click();assert.match(await page.locator('.nw-status').textContent(),/Сервер/);
    await connect('server:net','switch:8');
    await page.screenshot({path:path.join(os.tmpdir(),'ksk-network-desktop.png'),fullPage:true});
    await page.locator('.nw-check').click();assert.match(await page.locator('.nw-status').textContent(),/Сеть успешно/);
    assert.equal(await page.locator('.nw-room-online').count(),4);
    assert.equal(await page.locator('.nw-check').textContent(),'Выйти в лабораторию');
    await page.locator('.nw-check').click();
    assert.deepEqual(await page.evaluate(()=>({score,collected,done:crystals.find(c=>c.stationType===4).done,state})),{score:600,collected:1,done:true,state:'playing'});
    await open();await page.locator('.nw-close').click();assert.equal(await page.evaluate(()=>collected),0);
    await open();await page.keyboard.press('Escape');assert.equal(await page.locator('.ksk-network').count(),0);
    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(url);
    await mobile.evaluate(()=>{startGame();openQuestion(crystals.find(c=>c.stationType===4));});
    for(const [kind,place] of [['router','hub1'],['switch','hub2'],['server','rack']]){await mobile.locator(`[data-tool="${kind}"]`).tap();await mobile.locator(`[data-slot="${place}"]`).tap();}
    for(const [a,b] of [['internet:net','router:wan'],['router:lan','switch:1'],...['dev1','dev2','design1','design2','printer','server'].map((d,i)=>[d+':net','switch:'+(i+2)])]){await mobile.locator(`[data-port="${a}"]`).tap();await mobile.locator(`[data-port="${b}"]`).tap();}
    await mobile.locator('.nw-check').tap();assert.match(await mobile.locator('.nw-status').textContent(),/Сеть успешно/);
    assert(await mobile.locator('.ksk-network').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'No dialog horizontal overflow');
    await mobile.screenshot({path:path.join(os.tmpdir(),'ksk-network-mobile.png')});
    await mobile.locator('.nw-check').tap();assert.equal(await mobile.evaluate(()=>collected),1);
    assert.deepEqual(errors,[]);console.log('PASS: desktop drag, touch completion, topology feedback, disconnect, cancellation, progress and responsive layout.');
  }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
