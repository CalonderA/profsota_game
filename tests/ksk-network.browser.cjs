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
    const hint=()=>page.locator('.nw-hint').textContent();
    assert.match(await hint(),/Шаг 1 из 12.*Маршрутизатор/s);
    assert.equal(await page.locator('[data-tool="router"].nw-guide-target').count(),1);
    assert.equal(await page.locator('[data-slot="hub1"].nw-guide-target').count(),1);
    await page.locator('.nw-check').click();
    assert.match(await page.locator('.nw-status').textContent(),/Без связи/);
    assert.equal(await page.locator('.nw-link,.nw-packet').count(),0,'No prebuilt connections');
    // The initial instruction/error state can be taller than the success state.
    for(const [width,height] of [[1920,1080],[1366,768],[1280,720]]){
      await page.setViewportSize({width,height});
      assert(await page.locator('.ksk-network').evaluate(el=>el.scrollHeight<=el.clientHeight+1&&el.scrollWidth<=el.clientWidth+1),`Initial layout ${width}x${height}`);
    }
    await page.screenshot({path:path.join(os.tmpdir(),'ksk-network-initial.png')});
    await page.setViewportSize({width:1440,height:1080});
    const tool=kind=>page.locator(`[data-tool="${kind}"]`),slot=id=>page.locator(`[data-slot="${id}"]`);
    await tool('server').click();await slot('hub1').click();assert.equal(await page.locator('[data-device="server"]').count(),0);
    await slot('rack').click();
    assert.match(await hint(),/Шаг 2 из 12.*Маршрутизатор/s,'Out-of-order placement is counted');
    // Actual drag placement, including an invalid drop.
    await tool('router').dragTo(slot('hub2'));
    assert.equal(await page.locator('[data-device="router"]').count(),1);
    await tool('switch').click();await slot('hub1').click();
    assert.match(await hint(),/Шаг 4 из 12.*Интернет.*WAN/s);
    assert.equal(await page.locator('[data-port^="switch:"]').count(),8);
    assert.equal(await page.locator('.nw-link').count(),0,'Placement does not create cables');
    const port=id=>page.locator(`[data-port="${id}"]`);
    const connect=async(a,b)=>{await port(a).click();await port(b).click();};
    await connect('internet:net','router:lan');
    assert.equal(await page.locator('[data-link]').count(),0,'Wrong cable is rejected');
    assert.equal(await port('router:lan').getAttribute('aria-disabled'),'true');
    assert.equal(await page.locator('[data-port="router:lan"].nw-blocked').count(),1);
    await port('router:lan').click();
    assert.equal(await page.locator('[data-link]').count(),0,'Repeated wrong connection stays blocked');
    await port('internet:net').click();
    // The guide follows the player's first click and does not create a cable itself.
    await port('router:wan').click();
    assert.match(await hint(),/Теперь нажми порт 2.*Интернет/s);
    assert.equal(await page.locator('[data-port="internet:net"].nw-guide-target').count(),1);
    assert.equal(await page.locator('[data-link]').count(),0);
    await page.screenshot({path:path.join(os.tmpdir(),'ksk-network-guided-connection.png')});
    await port('internet:net').click();
    assert.match(await hint(),/Шаг 5 из 12.*LAN.*Коммутатор/s);
    await port('dev2:net').click();
    assert.match(await hint(),/Сначала отмени выбор/);
    await port('dev2:net').click();
    await port('router:lan').dragTo(port('switch:1'));
    const guideNumbers=()=>page.locator('.nw-guide-markers text').allTextContents();
    assert.deepEqual(await guideNumbers(),['1',...Array(6).fill('2')],'PCs, printer and server are destinations numbered 2');
    assert.equal(await page.locator('[data-port="printer:net"].nw-guide-target,[data-port="server:net"].nw-guide-target').count(),2);
    // Follow the guide and connect the printer before the computers.
    for(const [i,d] of ['printer','design2','dev2','dev1','design1','server'].entries()){
        await port('switch:'+(i+2)).click();
        assert.match(await hint(),/порт 2 на любом выделенном устройстве/);
        assert.deepEqual(await guideNumbers(),['1',...Array(6-i).fill('2')]);
        await port(d+':net').click();
        if(i<5)assert.deepEqual(await guideNumbers(),['1',...Array(5-i).fill('2')],'Connected devices lose their destination marker');
      assert.match(await hint(),new RegExp(`Шаг ${i+7} из 12`));
    }
    assert.equal(await page.locator('.nw-check.nw-guide-target').count(),1);
    assert.equal(await page.locator('[data-link]').count(),8);
    // Remove a cable through its visible stroke and restore it.
    await page.locator('[data-link]').last().focus();await page.keyboard.press('Enter');
    assert.match(await hint(),/Шаг 11 из 12/,'Disconnect returns to the missing connection');
    assert.equal(await page.locator('[data-port="server:net"].nw-guide-target').count(),1);
    assert.deepEqual(await guideNumbers(),['1','2']);
    await page.locator('.nw-check').click();assert.match(await page.locator('.nw-status').textContent(),/Сервер/);
    await connect('server:net','switch:8');
    assert.match(await hint(),/Шаг 12 из 12.*Проверить сеть/s,'Alternative free switch port is accepted');
    // The entire desktop interface must fit, with ports anchored to the sprites.
    for(const [width,height] of [[1920,1080],[1366,768],[1280,720]]){
      await page.setViewportSize({width,height});
      const layout=await page.evaluate(async()=>{
        const dialog=document.querySelector('.ksk-network');
        const fits=el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;};
        const images=[...dialog.querySelectorAll('image,img')];
        await Promise.all(images.map(el=>new Promise((resolve,reject)=>{const src=el.getAttribute('href')||el.getAttribute('src');const img=new Image();img.onload=resolve;img.onerror=()=>reject(new Error(src));img.src=src;})));
        return {
          fits:[dialog,...dialog.querySelectorAll('.nw-header,.nw-footer,.nw-hint,[data-tool],.nw-check')].every(fits),
          scroll:[dialog,dialog.querySelector('.nw-viewport')].some(el=>el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1),
          ports:[...dialog.querySelectorAll('[data-port]')].every(el=>{
            const device=el.dataset.port.split(':')[0],sprite=dialog.querySelector(`[data-device="${device}"] image,[data-device="${device}"] .nw-internet`).getBoundingClientRect(),r=el.querySelector('rect').getBoundingClientRect();
            return r.left>=sprite.left&&r.right<=sprite.right&&r.top>=sprite.top&&r.bottom<=sprite.bottom;
          })
        };
      });
      assert.deepEqual(layout,{fits:true,scroll:false,ports:true},`Desktop layout ${width}x${height}`);
      await page.screenshot({path:path.join(os.tmpdir(),`ksk-network-${width}x${height}.png`)});
    }
    await page.screenshot({path:path.join(os.tmpdir(),'ksk-network-desktop.png'),fullPage:true});
    await page.locator('.nw-check').click();assert.match(await page.locator('.nw-status').textContent(),/Сеть успешно/);
    assert.match(await hint(),/Готово!/);
    assert.equal(await page.locator('.nw-room-online').count(),4);
    assert.equal(await page.locator('.nw-check').textContent(),'Выйти в лабораторию');
    await page.locator('.nw-check').click();
    assert.deepEqual(await page.evaluate(()=>({score,collected,done:crystals.find(c=>c.stationType===4).done,state})),{score:600,collected:1,done:true,state:'playing'});
    await open();
    await tool('router').click();await slot('hub1').click();
    await page.locator('.nw-close').click();
    assert.equal(await page.locator('.ksk-exit-confirm[open]').count(),1);
    assert.match(await page.locator('.ksk-exit-confirm').textContent(),/15 света/);
    await page.locator('[data-exit="cancel"]').click();
    assert.equal(await page.locator('[data-device="router"]').count(),1,'Cancel keeps the current network');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.ksk-exit-confirm[open]').count(),1);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.ksk-exit-confirm').count(),0,'Escape dismisses confirmation');
    assert.equal(await page.locator('[data-device="router"]').count(),1);
    await page.locator('.nw-close').click();
    await page.locator('[data-exit="accept"]').click();
    assert.equal(await page.locator('.ksk-network').count(),0);
    assert.equal(await page.evaluate(()=>collected),0);
    await open();await page.keyboard.press('Escape');
    await page.locator('[data-exit="accept"]').click();
    assert.equal(await page.locator('.ksk-network').count(),0);
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
