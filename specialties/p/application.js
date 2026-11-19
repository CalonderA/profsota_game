'use strict';

const P_JAVA_EXERCISE = {
 title:'Создайте окно приложения',
 task:'Допишите код, чтобы открылось окно «Калькулятор» размером 400 × 300.',
 file:'Main.java',
 output:'Результат запуска',
 hint:'Размер окна задаёт метод <code>setSize(width, height)</code>.',
 success:'setSize(400, 300) задаёт ширину 400 и высоту 300.',
 indent:'        ',
 preview:`<div class="p-app-window" hidden>
  <div class="p-app-titlebar"><strong>Калькулятор</strong><span aria-hidden="true">− &nbsp; □ &nbsp; ×</span></div>
 </div>`,
 choices:[
  {code:'frame.setSize(400, 300);'},
  {code:'frame.setBounds(400, 300);', error:'Ошибка компиляции. У setBounds четыре аргумента: координаты x и y, ширина и высота.'},
  {code:'frame.setResizable(false);', error:'Размер не задан. setResizable запрещает менять размер окна вручную.'}
 ],
 source:[
  'import javax.swing.*;',
  '',
  'public class Main {',
  '    public static void main(String[] args) {',
  '        // Создайте окно приложения',
  '        JFrame frame = new JFrame("Калькулятор");',
  null,
  '        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);',
  '        frame.setLocationRelativeTo(null);',
  '        frame.setVisible(true);',
  '    }',
  '}'
 ]
};

const P_GAME_EXERCISE = {
 title:'Заставьте героя двигаться вправо',
 task:'Выберите строку C#, которая при нажатии D задаёт скорость вправо через Rigidbody2D и сохраняет скорость по вертикали.',
 file:'Player.cs',
 output:'Тест игры',
 hint:'Положительная скорость по оси X двигает героя вправо. Значение по оси Y оставьте прежним.',
 success:'Положительная скорость по X двигает героя вправо, а скорость по Y сохраняется.',
 indent:'            ',
 preview:`<div class="p-app-platform" role="img" aria-label="Герой на платформе, справа финишный флаг">
  <span class="p-app-cloud" aria-hidden="true"></span>
  <span class="p-app-hills" aria-hidden="true"></span>
  <span class="p-app-ground" aria-hidden="true"></span>
  <span class="p-app-hero" aria-hidden="true"></span>
  <span class="p-app-flag" aria-hidden="true">🏁</span>
 </div>`,
 choices:[
  {code:'rb.velocity = new Vector2(speed, rb.velocity.y);'},
  {code:'rb.velocity = new Vector2(-speed, rb.velocity.y);', error:'Неверно. Скорость −speed по X направит героя влево.'},
  {code:'transform.position += Vector3.right * speed;', error:'Неверно. Эта строка меняет позицию напрямую, а в задании нужно задать скорость через Rigidbody2D.'}
 ],
 source:[
  'using UnityEngine;',
  '',
  'public class Player : MonoBehaviour {',
  '    public float speed = 5f;',
  '    private Rigidbody2D rb;',
  '',
  '    void Awake() {',
  '        rb = GetComponent<Rigidbody2D>();',
  '    }',
  '',
  '    void Update() {',
  '        if (Input.GetKey(KeyCode.D)) {',
  null,
  '        }',
  '    }',
  '}'
 ]
};

window.openPApplicationGame = (done, cancel) => openPCodeExercise(P_JAVA_EXERCISE, done, cancel);
window.openPGameDevelopment = (done, cancel) => openPCodeExercise(P_GAME_EXERCISE, done, cancel);

function openPCodeExercise(exercise, done, cancel){
 const {choices, source, indent} = exercise;
 const previousFocus = document.activeElement;
 const overlay = document.createElement('div');
 overlay.className = 'p-algorithm-overlay p-app-overlay';
 overlay.innerHTML = `
  <section class="p-app-game" role="dialog" aria-modal="true" aria-labelledby="pAppTitle">
   <header class="p-app-heading">
    <div><h2 id="pAppTitle">${exercise.title}</h2><p>${exercise.task}</p></div>
    <button type="button" class="p-app-close" aria-label="Выйти из мини-игры" title="Выйти · −15 света">✕</button>
   </header>
   <div class="p-app-layout">
    <details class="p-app-editor" open>
     <summary class="p-app-file">Код · ${exercise.file}</summary>
     <div class="p-app-code"></div>
    </details>
    <fieldset class="p-app-choices">
     <legend>Варианты ответа</legend>
     <div class="p-app-answer-list"></div>
     <details class="p-app-hint"><summary>Подсказка</summary><p>${exercise.hint}</p></details>
    </fieldset>
    <aside class="p-app-output">
     <h3 id="pAppResultTitle">${exercise.output}</h3>
     <div class="p-app-preview">
      <p class="p-app-status" role="status" tabindex="-1">Выберите строку кода и нажмите «Запустить».</p>
      ${exercise.preview}
     </div>
    </aside>
    <div class="p-app-actions">
     <button type="button" class="p-app-run" disabled>▷ Запустить</button>
     <button type="button" class="p-app-finish" hidden>В лабораторию</button>
    </div>
   </div>
   <dialog class="p-app-result" aria-labelledby="pAppResultTitle">
    <button type="button" class="p-app-result-action"></button>
   </dialog>
  </section>`;

 const find = selector => overlay.querySelector(selector);
 const editor = find('.p-app-code');
 let missingLine;
 source.forEach((line, index) => {
  const row = document.createElement('div');
  const number = document.createElement('span');
  const code = document.createElement('code');
  number.textContent = index + 1;
  number.setAttribute('aria-hidden','true');
  code.textContent = line ?? indent + '// Вставьте строку';
  if(line === null){
   missingLine = code;
   row.className = 'p-app-missing';
  }else if(line.trimStart().startsWith('//')){
   code.className = 'p-app-comment';
  }
  row.append(number, code);
  editor.append(row);
 });

 let selected = null;
 let solved = false;
 let closed = false;
 let mistakes = 0;
 const run = find('.p-app-run');
 const finish = find('.p-app-finish');
 const status = find('.p-app-status');
 const output = find('.p-app-output');
 const result = find('.p-app-result');
 const resultAction = find('.p-app-result-action');
 const mobile = window.matchMedia('(max-width: 760px), (orientation: landscape) and (max-height: 450px)');

 function showResult(){
  if(!mobile.matches){
   (solved ? finish : status).focus();
   return;
  }
  resultAction.textContent = solved ? 'В лабораторию' : 'К вариантам ответа';
  result.prepend(output);
  result.showModal();
  status.focus({preventScroll:true});
 }
 resultAction.onclick = () => {
  if(solved)close();
  else result.close();
 };
 result.addEventListener('close', () => {
  if(closed)return;
  find('.p-app-actions').before(output);
  const returnFocus = solved ? finish : find('input:checked');
  returnFocus?.focus({preventScroll:true});
 });
 result.addEventListener('keydown', event => event.stopPropagation());

 choices.forEach(choice => {
  const label = document.createElement('label');
  const radio = document.createElement('input');
  const code = document.createElement('code');
  const badge = document.createElement('span');
  radio.type = 'radio';
  radio.name = 'p-app-line';
  code.textContent = choice.code;
  badge.className = 'p-app-correct-badge';
  badge.textContent = '✓ Верно';
  radio.onchange = () => {
   selected = choice;
   missingLine.textContent = indent + choice.code;
   status.textContent = 'Строка вставлена. Запустите код.';
   status.classList.remove('incorrect');
   overlay.classList.remove('p-app-incorrect');
   run.disabled = false;
  };
  label.append(radio, code, badge);
  find('.p-app-answer-list').append(label);
 });

 run.onclick = () => {
  if(!selected || solved || closed)return;
  if(selected.error){
   mistakes++;
   status.textContent = selected.error;
   status.classList.add('incorrect');
   overlay.classList.add('p-app-incorrect');
   run.disabled = true;
   showResult();
   return;
  }
  solved = true;
  overlay.classList.add('p-app-solved');
  const appWindow = find('.p-app-window');
  if(appWindow)appWindow.hidden = false;
  status.textContent = '✓ Верно! ' + exercise.success + ' Задание выполнено. +' + reward() + ' очков.';
  find('fieldset').disabled = true;
  run.hidden = true;
  finish.hidden = false;
  showResult();
 };

 function reward(){
  return Math.max(50, 200 - mistakes * 25);
 }
 function close(){
  if(closed)return;
  closed = true;
  overlay.remove();
  if(previousFocus?.isConnected)previousFocus.focus();
  if(solved)done(reward());
  else cancel?.();
 }
 function leave(){
  if(solved)close();
  else window.confirmPMinigameExit(overlay, close);
 }
 find('.p-app-close').onclick = leave;
 finish.onclick = close;
 overlay.addEventListener('keydown', event => {
  if(event.key === 'Escape'){
   event.preventDefault();
   leave();
  }
  if(event.key !== 'Tab')return;
  const controls = [...overlay.querySelectorAll('button:not(:disabled):not([hidden]), input:enabled, summary')]
   .filter(control => control.getClientRects().length);
  const first = controls[0], last = controls[controls.length - 1];
  if(event.shiftKey && document.activeElement === first){
   event.preventDefault();
   last.focus();
  }else if(!event.shiftKey && document.activeElement === last){
   event.preventDefault();
   first.focus();
  }
 });
 document.body.appendChild(overlay);
 find('.p-app-close').focus({preventScroll:true});
}
