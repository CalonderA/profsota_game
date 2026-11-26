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
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/specialties/ksk/index.html`);
  await page.evaluate(()=>{localStorage.removeItem('sota_ksk_service_v1');startGame();openQuestion(crystals.find(c=>c.stationType===3));});
  const check=async(label)=>{
   const v=await page.locator('.pc-service').evaluate(d=>{
    const fits=e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1};
    return {overflow:d.scrollHeight>d.clientHeight+1||d.scrollWidth>d.clientWidth+1,bad:[...d.querySelectorAll('button,.pc-diagnostic-card,.pc-switches,footer')].filter(e=>e.getBoundingClientRect().width&&!fits(e)).map(e=>e.className||e.textContent),children:[...d.querySelectorAll('.pc-diag,.pc-workbench')].filter(e=>e.scrollHeight>e.clientHeight+1).map(e=>e.className)};
   });assert.deepEqual(v,{overflow:false,bad:[],children:[]},label);
  };
  for(const [width,height] of [[1920,1080],[1366,768],[1280,720]]){await page.setViewportSize({width,height});await check('initial '+width);await page.screenshot({path:path.join(os.tmpdir(),`ksk-service-new-${width}.png`)});}
  await page.setViewportSize({width:1366,height:768});await page.locator('[data-act=diagnose]').click();await check('diagnosed');
  await page.locator('[data-act=inspect]').click();await page.locator('[data-cause="1"]').click();await page.locator('[data-act=power]').click();await page.locator('[data-act=plug]').click();await page.locator('[data-tool=brush]').click();
  const pt=await page.locator('.hardware').evaluate(svg=>{const p=svg.createSVGPoint();p.x=242;p.y=160;return {x:p.matrixTransform(svg.getScreenCTM()).x,y:p.matrixTransform(svg.getScreenCTM()).y};});
  await page.mouse.move(pt.x,pt.y);await page.mouse.down();for(let i=0;i<8;i++)await page.mouse.move(pt.x+(i%2?0:8),pt.y);await page.mouse.up();
  assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('sota_ksk_service_v1')).dust[0]<1));
  await page.setViewportSize({width:390,height:844});assert(await page.locator('.pc-service').evaluate(d=>d.scrollWidth<=d.clientWidth+1));await page.screenshot({path:path.join(os.tmpdir(),'ksk-service-new-mobile.png')});
  assert.deepEqual(errors,[]);console.log('PASS: workshop desktop layouts, diagnosis, power controls, native cleaning input and mobile width.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
