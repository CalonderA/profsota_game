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
  for(const spec of ['ksk','p','kip','ts','e','reu']){
   const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto(`http://127.0.0.1:${server.address().port}/specialties/${spec}/index.html`);assert(response.ok());
   await page.evaluate(()=>startGame(null));
   assert.equal(await page.evaluate(()=>state),'playing',spec+' starts');
   if(spec==='p'){
    for(let n=0;n<4;n++){
     await page.evaluate(n=>openQuestion(crystals.find(c=>c.stationType===n)),n);
     assert.equal(await page.evaluate(()=>state),'minigame','Programming station '+n);
     assert(await page.locator('[role=dialog]').count()>0);
     await page.reload();await page.evaluate(()=>startGame(null));
    }
   }
   if(spec==='e'||spec==='reu'){
    assert.equal(await page.evaluate(spec=>typeof window[spec==='e'?'startEStation':'startReuStation'],spec),'function');
    for(let n=0;n<5;n++){
     await page.evaluate(n=>openQuestion(crystals.find(c=>c.stationType===n)),n);
     assert.equal(await page.evaluate(()=>state),'minigame',spec+' station '+n+' launches');
     await page.reload();await page.evaluate(()=>startGame(null));
    }
   }
   if(spec==='kip'||spec==='ts'){
    const id=spec==='kip'?'meter':'manometer';
    await page.evaluate(id=>interactStation(crystals.find(c=>c.minigameId===id)),id);
    assert(await page.locator('#'+id+'Screen').isVisible(),spec+' new station launches');
   }
   assert.deepEqual(errors,[],spec+' browser errors');console.log('PASS: '+spec);await page.close();
  }
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
