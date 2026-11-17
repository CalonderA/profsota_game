from pathlib import Path
s=Path('.qa/check-ksk.cjs').read_text(encoding='utf-8');s=s[:s.index("await page.goto('http://game.test/menu.html');")]+'''
await page.goto('http://game.test/menu.html');await page.screenshot({path:'.qa/menu-light-desktop.png',fullPage:true});
for(const [node,spec] of [['#nodeP','p'],['#nodeKsk','ksk']]){
 await page.locator(node).click();assert(await page.locator('#panelActions a[href="index.html?spec='+spec+'"]').isVisible());
}
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.qa/menu-light-mobile.png',fullPage:true});
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
await page.locator('#nodeP').click();await page.locator('#panelActions a').click();await page.waitForURL('**/specialties/p/index.html');
assert.deepEqual(errors,[]);console.log('PASS menu selection, launch, mobile layout; no JS errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
'''
Path('.qa/check-menu-light.cjs').write_text(s,encoding='utf-8')
