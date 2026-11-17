from pathlib import Path
p=Path('specialties/p/p.js');s=p.read_text(encoding='utf-8');s=s.replace('{x:9,y:10,type:3}, {x:16,y:10,type:4}','{x:9,y:10,type:3}').replace(",'Кибербезопасность'",'').replace('по пять заданий','по четыре задания').replace('ПЯТЬ ИДЕЙ. ОДНА КОМАНДА.','СОЗДАВАЙ. ПРОБУЙ. ИГРАЙ.').replace('`${collected} / 5`','`${collected} / ${needed}`');p.write_text(s,encoding='utf-8')
p=Path('shared/js/common.js');s=p.read_text(encoding='utf-8');s=s.replace("needed = (currentSpec === 'p' || currentSpec === 'ksk') ? 5 :", "needed = currentSpec === 'p' ? P_STATIONS.length : currentSpec === 'ksk' ? KSK_STATIONS.length :")
s=s.replace("(currentSpec === 'p' || currentSpec === 'ksk') && cssW < 600", "(cssW < 760 || cssH < 450)")
p.write_text(s,encoding='utf-8')
p=Path('specialties/p/index.html');s=p.read_text(encoding='utf-8').replace('Пять рабочих станций: приложения, сети, серверы, игры и кибербезопасность.','Четыре рабочие станции: приложения, сети, серверы и игры.').replace('Пять заданий','Четыре задания').replace('после всех пяти','после всех четырёх').replace('В каждой — пять заданий.','В каждой — четыре задания.');p.write_text(s,encoding='utf-8')
p=Path('menu.html');s=p.read_text(encoding='utf-8').replace('Приложения, сети, серверы, игры и кибербезопасность. Пять станций','Приложения, сети, серверы и игры. Четыре станции');pos=s.index('    <!-- ИНФО-ПАНЕЛЬ')
s=s[:pos]+'''    <nav class="mobile-spec-list" aria-label="Выбор специальности">
      <button type="button" data-spec="kip" onclick="selectSpec('kip')"><b>КИП</b><span>15.01.31 · Доступно</span></button>
      <button type="button" data-spec="ts" onclick="selectSpec('ts')"><b>ТС</b><span>13.02.02 · Доступно</span></button>
      <button type="button" data-spec="p" onclick="selectSpec('p')"><b>Программирование</b><span>09.02.07 · Доступно</span></button>
      <button type="button" data-spec="ksk" onclick="selectSpec('ksk')"><b>КСК</b><span>09.02.01 · Доступно</span></button>
      <button type="button" data-spec="e" onclick="selectSpec('e')"><b>Э</b><span>13.02.13 · В разработке</span></button>
      <button type="button" data-spec="reu" onclick="selectSpec('reu')"><b>РЭУ</b><span>11.02.16 · В разработке</span></button>
    </nav>

'''+s[pos:]
s=s.replace('      renderPanel(key);', '''      renderPanel(key);
      document.querySelectorAll('.mobile-spec-list button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.spec === key)));''')
p.write_text(s,encoding='utf-8')
# Allow browser zoom and safe screen edges.
for p in Path('specialties').glob('*/index.html'):
 s=p.read_text(encoding='utf-8');s=s.replace('width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no','width=device-width, initial-scale=1.0, viewport-fit=cover');p.write_text(s,encoding='utf-8')
p=Path('menu.html');s=p.read_text(encoding='utf-8').replace('width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no','width=device-width, initial-scale=1.0, viewport-fit=cover');p.write_text(s,encoding='utf-8')
