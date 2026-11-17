const {chromium}=require('C:/Users/777/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/777/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});let errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('http://game.test/**',async r=>{const f=path.join(process.cwd(),decodeURIComponent(new URL(r.request().url()).pathname));if(!fs.existsSync(f))return r.fulfill({status:404,body:''});await r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream'});});

await page.goto('http://game.test/menu.html');await page.screenshot({path:'.qa/menu-light-desktop.png',fullPage:true});
for(const [node,spec] of [['#nodeP','p'],['#nodeKsk','ksk']]){
 await page.locator(node).click();assert(await page.locator('#panelActions a[href="index.html?spec='+spec+'"]').isVisible());
}
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.qa/menu-light-mobile.png',fullPage:true});
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
await page.locator('#nodeP').click();await page.locator('#panelActions a').click();await page.waitForURL('**/specialties/p/index.html');
assert.deepEqual(errors,[]);console.log('PASS menu selection, launch, mobile layout; no JS errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
