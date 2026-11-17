from pathlib import Path
import hashlib,json
baseline=json.loads(Path('.qa/ksk-baseline.json').read_text())
for f,h in baseline.items():assert hashlib.sha256(Path(f).read_bytes()).hexdigest()==h,f
before=json.loads(Path('.qa/questions-before-ksk.json').read_text(encoding='utf-8-sig'))
after=json.loads(Path('questions.json').read_text(encoding='utf-8'))
assert [q for q in after if q['spec']!='ksk']==before
q=[q for q in after if q['spec']=='ksk'];assert len(q)==25
assert all(sum(x['station']==i for x in q)==5 for i in range(5))
assert all(len(x['a'])==4 and 0<=x['c']<4 for x in q)
assert q==[x for x in json.loads(Path('data/questions.json').read_text(encoding='utf-8')) if x['spec']=='ksk']
print('PASS: all other specialty files byte-identical; existing questions unchanged; 25 valid KSK questions / five per station')
p=Path('menu.html');s=p.read_text(encoding='utf-8');s=s.replace('<button type="button" class="btn-disabled" disabled>Слот команды П и КСК</button>','<a href="index.html?spec=ksk" class="btn-play">Войти в лабораторию КСК</a>');p.write_text(s,encoding='utf-8')
