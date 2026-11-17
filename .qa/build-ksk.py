from pathlib import Path
import hashlib,json
files=[p for p in Path('specialties').rglob('*') if p.is_file() and 'ksk' not in p.parts]
Path('.qa/ksk-baseline.json').write_text(json.dumps({str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}))
Path('.qa/questions-before-ksk.json').write_bytes(Path('questions.json').read_bytes())
p=Path('shared/js/common.js');s=p.read_text(encoding='utf-8')
s=s.replace("if (window.CURRENT_SPEC === 'p' && window.P_QUESTIONS) QUESTIONS = window.P_QUESTIONS;", "if (window.CURRENT_SPEC === 'p' && window.P_QUESTIONS) QUESTIONS = window.P_QUESTIONS;\n    if (window.CURRENT_SPEC === 'ksk' && window.KSK_QUESTIONS) QUESTIONS = window.KSK_QUESTIONS;")
s=s.replace("currentSpec === 'p' ?", "(currentSpec === 'p' || currentSpec === 'ksk') ?")
# restore station-specific layout selection
s=s.replace("const stationSpots = (currentSpec === 'p' || currentSpec === 'ksk') ? P_STATIONS : [", "const stationSpots = currentSpec === 'ksk' ? KSK_STATIONS : currentSpec === 'p' ? P_STATIONS : [")
s=s.replace("if (currentSpec === 'p') setupPMap(map);", "if (currentSpec === 'p') setupPMap(map);\n    if (currentSpec === 'ksk') setupKskMap(map);")
for name,call in [('drawFloor(x, y, b)','drawKskFloor(x,y)'),('drawHazardZones()','undefined'),('drawWall(x, y, b)','drawKskWall(x,y)'),('drawBackWall(now)','drawKskBackWall(now)'),('drawRoomProps(now)','drawKskProps(now)'),('drawExit(now)','drawKskExit(now)')]:
 s=s.replace('function '+name+'{','function '+name+"{\n    if (currentSpec === 'ksk') return "+call+';')
s=s.replace("currentSpec === 'p' && cssW < 600", "(currentSpec === 'p' || currentSpec === 'ksk') && cssW < 600")
s=s.replace('function openQuestion(crystal){',"function openQuestion(crystal){\n    if (currentSpec === 'ksk' && (!crystal || crystal.done)) return;")
s=s.replace('const q = nextQuestion(hard);',"const q = currentSpec === 'ksk' ? nextKskQuestion(crystal) : nextQuestion(hard);")
s=s.replace("title: 'Серверная КСК'","title: 'Лаборатория КСК'").replace("unitName: 'Стойки'","unitName: 'Станции'").replace("unitSingular: 'стойку'","unitSingular: 'станцию'")
p.write_text(s,encoding='utf-8')
p=Path('menu.html');s=p.read_text(encoding='utf-8');a=s.index('      ksk: {');b=s.index('      grey: {',a)
s=s[:a]+'''      ksk: {
        cluster: 'grey',
        tag: '⬜ КСК (09.02.01) · Компьютерные системы и комплексы',
        sub: 'Лаборатория КСК · Доступно',
        desc: 'Сборка ПК, диагностика, серверы, ремонт и компьютерные сети. Пять практических станций СОТА.',
        actionHtml: `<a href="index.html?spec=ksk" class="btn-play">Войти в лабораторию КСК</a>`
      },
'''+s[b:]
s=s.replace('onclick="handleNodeClick(\'ksk\')"','onclick="event.stopPropagation(); handleNodeClick(\'ksk\')"')
a=s.index('id="nodeKsk"');b=s.index('</g>',a);s=s[:a]+s[a:b].replace('node-status wip','node-status ready').replace('СЛОТ КОМАНДЫ','● ДОСТУПНО')+s[b:]
s=s.replace("key !== 'p' && key !== 'blue'", "key !== 'p' && key !== 'ksk' && key !== 'blue'")
s=s.replace('function handleNodeClick(key){',"function handleNodeClick(key){\n      if (key === 'ksk' && currentSelection === 'ksk') { window.location.href = 'index.html?spec=ksk'; return; }")
p.write_text(s,encoding='utf-8')
p=Path('specialties/ksk/index.html');s=p.read_text(encoding='utf-8');s=s.replace('<script src="ksk.js">','<script src="questions.js"></script>\n  <script src="ksk.js">')
s=s.replace('Цех КИПиА','Лаборатория КСК').replace('Станок КИП','Рабочая станция').replace('Специальность 15.01.31','Специальность 09.02.01').replace('>КИП</span>','>КСК</span>').replace('Войти в цех','Войти в лабораторию')
import re
s=re.sub(r'(<p class="sub" id="startMainSub">).*?</p>',r'\1Соберите ПК, найдите неисправность, изучите серверы, обслуживание и сети. Выполните пять заданий и подойдите к двери «К СОТЕ».</p>',s)
s=s.replace('Подойдите к станку — проведите диагностику','Подойдите к маркеру — решите задачу').replace('<b>Сложный узел</b>Фиолетовый индикатор: сложная задача, ×2 очков','<b>Пять станций</b>Зелёная галочка — задание выполнено. После пяти заданий откроется дверь.')
s=s.replace('чем дальше город, тем больше цехов придётся пройти, но и награда за путь больше.','пройдите пять станций лаборатории. За дальний путь награда больше.').replace('Дальние (4–5 цехов)','Дальние города')
p.write_text(s,encoding='utf-8')
