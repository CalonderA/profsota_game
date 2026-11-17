from pathlib import Path
p=Path('shared/js/common.js');s=p.read_text(encoding='utf-8');a=s.index('  function getSotaSprite(){');b=s.index('\n  function drawSotaBuilding(){',a)
s=s[:a]+'''  function getSotaSprite(){
    if (sotaSprite) return sotaSprite;
    if (sotaLoading) return null;
    sotaLoading = true;
    const img = new Image();
    img.onload = () => {
      // Готовый pixel-art здания сохраняем без уменьшения и постеризации.
      sotaSprite = img;
      sotaLoading = false;
      drawSotaBuilding();
    };
    img.onerror = () => {
      if (img.dataset.fallback) return;
      img.dataset.fallback = '1';
      img.src = SOTA_PHOTO_DATA;
    };
    img.src = window.location.pathname.includes('/specialties/')
      ? '../../assets/sota-building.png' : 'assets/sota-building.png';
    return null;
  }
''' +s[b:]
s=s.replace('if (!sp){ setTimeout(drawSotaBuilding, 150); return; }','if (!sp) return;').replace('cv.width = sp.width;\n    cv.height = sp.height;','cv.width = sp.naturalWidth;\n    cv.height = sp.naturalHeight;')
p.write_text(s,encoding='utf-8')
p=Path('shared/css/common.css');s=p.read_text(encoding='utf-8');s=s.replace('background:#0d0b09;image-rendering:pixelated;','background:#0d0b09;image-rendering:pixelated;object-fit:contain;');p.write_text(s,encoding='utf-8')
p=Path('.qa/check-ksk.cjs');s=p.read_text(encoding='utf-8');s=s.replace("assert.equal(await page.evaluate(()=>state),'dead');assert(await page.locator('#endScreen').isVisible());", """assert.equal(await page.evaluate(()=>state),'dead');assert(await page.locator('#endScreen').isVisible());
await page.waitForFunction(()=>sotaSprite && sotaSprite.naturalWidth>0);
assert(await page.locator('#sotaWrap').isVisible());assert(await page.evaluate(()=>sotaSprite.src.endsWith('/assets/sota-building.png')));
await page.screenshot({path:'.qa/sota-victory.png'});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.qa/sota-victory-mobile.png'});
await page.evaluate(()=>gameOver('test'));assert(!(await page.locator('#sotaWrap').isVisible()));""");Path('.qa/check-building.cjs').write_text(s,encoding='utf-8')
