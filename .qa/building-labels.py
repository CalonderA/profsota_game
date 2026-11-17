from pathlib import Path
p=Path('shared/js/common.js');s=p.read_text(encoding='utf-8')
s=s.replace("nextBtn.textContent = collected >= needed ?", "nextBtn.textContent = collected >= needed && completedMines === totalMines - 1 ? 'К СОТЕ' : collected >= needed ?")
s=s.replace("toast((currentSpec === 'p' || currentSpec === 'ksk') ? 'Дверь «К СОТЕ» открыта!'", "toast(completedMines === totalMines - 1 ? 'Вход в СОТУ открыт!' : (currentSpec === 'p' || currentSpec === 'ksk') ? 'Дверь «К СОТЕ» открыта!'")
s=s.replace("toast((currentSpec === 'p' || currentSpec === 'ksk') ? 'Все задания выполнены — подойдите к двери «К СОТЕ».'", "toast(completedMines === totalMines - 1 ? 'Все задания выполнены — подойдите к зданию СОТА.' : (currentSpec === 'p' || currentSpec === 'ksk') ? 'Все задания выполнены — подойдите к двери «К СОТЕ».'")
p.write_text(s,encoding='utf-8')
