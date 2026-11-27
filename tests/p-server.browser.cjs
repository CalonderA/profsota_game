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
  for(const touch of [false,true]){
   const page=await browser.newPage(touch?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}/specialties/p/index.html`);
   await page.evaluate(()=>{startGame(null);openQuestion(crystals.find(c=>c.stationType===2));});
   const choose=word=>page.locator('.p-server-choice').filter({hasText:word});
   const activate=async locator=>touch?locator.tap():locator.click();
   await activate(page.locator('.p-linux-help'));
   assert.equal(await page.locator('.p-linux-reference[open]').count(),1);
   assert.equal(await page.locator('.p-linux-reference-list dt').count(),2);
   await activate(page.locator('.p-linux-back'));
   for(const [i,command] of ['cd languages','rm fr.lang','cd ..'].entries()){
    assert((await page.locator('.p-progress').textContent()).endsWith(`${i+1} / 3`));
    assert.equal(await page.locator('.p-linux-slot').count(),1);
    if(i===1){
     await activate(choose('rm ru.lang'));await activate(page.locator('.p-server-check'));
     assert.equal(await page.locator('.p-linux-slot').getAttribute('aria-invalid'),'true');
     assert.equal(await page.locator('.p-server-next').isVisible(),false);
     assert.equal(await page.locator('.p-linux-output').textContent(),'');
     await activate(page.locator('.p-server-reset'));
    }
    if(!touch&&i===0)await choose(command).dragTo(page.locator('.p-linux-slot'));
    else await activate(choose(command));
    await activate(page.locator('.p-server-check'));
    assert.equal(await page.locator('.p-server-next').isVisible(),true);
    if(i===0)assert((await page.locator('.p-linux-output').textContent()).includes('/home/admin/languages'));
    if(i===1){const text=await page.locator('.p-linux-output').textContent();assert(text.includes('ru.lang'));assert(text.includes('en.lang'));}
    if(i===2)assert((await page.locator('.p-linux-output').textContent()).startsWith('/home/admin'));
    await activate(page.locator('.p-server-next'));
   }
   assert.deepEqual(await page.evaluate(()=>({state,collected,score,done:crystals.find(c=>c.stationType===2).done})),{state:'playing',collected:1,score:175,done:true});
   assert.deepEqual(errors,[]);console.log('PASS: '+(touch?'touch':'mouse drag')+', three steps, wrong language rejected, help and station progress.');await page.close();
  }
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
