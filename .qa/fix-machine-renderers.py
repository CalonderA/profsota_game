from pathlib import Path
for spec,fn in [('kip','drawKIPStation'),('ts','drawTSStation')]:
 p=Path('specialties')/spec/(spec+'.js');s=p.read_text(encoding='utf-8')
 old="if (window.registerStationRenderer) {\n  registerStationRenderer('"+spec+"', "+fn+");\n}"
 assert old in s
 s=s.replace(old,"// Модуль загружается до common.js: сохраняем отрисовщик в реестре напрямую.\nwindow.STATION_RENDERERS = window.STATION_RENDERERS || {};\nwindow.STATION_RENDERERS."+spec+" = "+fn+";")
 p.write_text(s,encoding='utf-8')
p=Path('.qa/check-workshop-entry.cjs');s=p.read_text(encoding='utf-8');s=s.replace("for(let floor=0;floor<2;floor++){", """assert.equal(await page.evaluate(spec=>typeof window.STATION_RENDERERS[spec],spec),'function');
await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(350);
await page.screenshot({path:'.qa/'+spec+'-machines.png'});
await page.evaluate(()=>{const original=window.STATION_RENDERERS[currentSpec];window.renderCount=0;window.STATION_RENDERERS[currentSpec]=(...args)=>{window.renderCount++;original(...args);};draw(performance.now());});
assert((await page.evaluate(()=>window.renderCount))>=6);
await page.setViewportSize({width:390,height:844});
for(let floor=0;floor<2;floor++){""")
Path('.qa/check-workshop-machines.cjs').write_text(s,encoding='utf-8')
