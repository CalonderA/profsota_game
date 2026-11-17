from pathlib import Path
p=Path('shared/js/common.js');s=p.read_text(encoding='utf-8');s=s.replace('  function drawExit(now){','''  // На последнем уровне цель маршрута — сама СОТА вместо переходной двери.
  function drawSotaDestination(now){
    const sprite = getSotaSprite();
    if (!sprite) return;
    const x = exitCell.x * TILE + TILE / 2;
    const y = exitCell.y * TILE + TILE / 2;
    const width = 112;
    const height = width * sprite.naturalHeight / sprite.naturalWidth;
    // Вход здания совпадает с прежней клеткой выхода; картинка помещается в карту.
    const left = Math.min(x - width / 2, VW - width - 5);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath();ctx.ellipse(left + width / 2, y + 12, width / 2, 10, 0, 0, Math.PI * 2);ctx.fill();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, left, y + 10 - height, width, height);
    ctx.fillStyle = exitOpen ? '#8af2ce' : '#ffd180';
    ctx.fillRect(x - 12, y + 10, 24, 3);
    ctx.fillStyle = '#101c2bea';ctx.fillRect(left, y + 19, width, 19);
    ctx.textAlign = 'center';ctx.textBaseline = 'middle';ctx.font = 'bold 10px monospace';
    ctx.fillStyle = exitOpen ? '#8af2ce' : '#ffd180';
    ctx.fillText(exitOpen ? 'ВОЙТИ В СОТУ' : 'СОТА · ' + collected + '/' + needed, left + width / 2, y + 29);
    ctx.restore();
  }

  function drawExit(now){
    if (completedMines === totalMines - 1) {
      if (getSotaSprite()) return drawSotaDestination(now);
    }''');p.write_text(s,encoding='utf-8')
p=Path('.qa/check-building.cjs');s=p.read_text(encoding='utf-8');s=s.replace("await page.screenshot({path:'.qa/ksk-complete.png'});", "await page.waitForFunction(()=>sotaSprite && sotaSprite.naturalWidth>0);await page.screenshot({path:'.qa/sota-in-room.png'});")
Path('.qa/check-building-room.cjs').write_text(s,encoding='utf-8')
