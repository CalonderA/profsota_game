const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(data);
 });
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/specialties/ksk/index.html`);
  await page.evaluate(()=>{
   localStorage.setItem('sota_ksk_service_v1',JSON.stringify({diagnosed:true,cause:true,plug:false,dust:Array(60).fill(0)}));
   startGame();openQuestion(crystals.find(c=>c.stationType===3));
  });
  const hint=()=>page.locator('.pc-tutorial').getAttribute('data-step');
  assert.equal(await hint(),'diagnose');
  assert.equal(await page.evaluate(()=>localStorage.getItem('sota_ksk_service_v1')),null);
  for(const exit of ['button','escape']){
   await page.locator('[data-act=diagnose]').click();
   await page.locator('[data-act=inspect]').click();
   await page.locator('[data-cause="1"]').click();
   await page.locator('[data-act=power]').click();
   await page.locator('[data-act=plug]').click();
   assert.equal(await hint(),'tool-brush');
   if(exit==='button')await page.locator('[data-act=exit]').click();
   else await page.keyboard.press('Escape');
   assert.match(await page.locator('#pc-exit-description').textContent(),/начать заново/);
   await page.locator('.pc-exit-accept').click();
   assert.equal(await page.locator('.pc-service').count(),0);
   assert.equal(await page.evaluate(()=>state),'playing');
   await page.evaluate(()=>openQuestion(crystals.find(c=>c.stationType===3)));
   assert.equal(await hint(),'diagnose');
   assert.equal(await page.locator('[data-dust="0"]').getAttribute('opacity'),'1');
   assert.equal(await page.evaluate(()=>localStorage.getItem('sota_ksk_service_v1')),null);
  }
  await page.reload();
  await page.evaluate(()=>{startGame();openQuestion(crystals.find(c=>c.stationType===3));});
  assert.equal(await hint(),'diagnose');
  assert.deepEqual(errors,[]);
  console.log('PASS: old save removed; exit, Escape and reload start repair from scratch.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
