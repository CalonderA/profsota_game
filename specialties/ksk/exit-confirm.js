'use strict';

window.confirmKskMinigameExit=function(game,onConfirm){
 if(game.kskExitConfirmation)return;
 game.kskExitConfirmation=true;
 const previousFocus=document.activeElement,confirmation=document.createElement('dialog');
 confirmation.className='ksk-exit-confirm';
 confirmation.setAttribute('aria-labelledby','ksk-exit-title');
 confirmation.setAttribute('aria-describedby','ksk-exit-description');
 confirmation.innerHTML=`<div class="qconfirm-box">
 <h3 class="qconfirm-title" id="ksk-exit-title">Выйти из мини-игры?</h3>
 <p class="qconfirm-text" id="ksk-exit-description">Вы точно хотите выйти? Вы потеряете <b>15 света</b>. Незавершённое задание начнётся заново.</p>
 <div class="btnrow"><button type="button" class="btn ghost" data-exit="cancel" autofocus>Отмена</button><button type="button" class="btn danger" data-exit="accept">Выйти из мини-игры</button></div></div>`;
 let closed=false;
 function close(accepted){
  if(closed)return;closed=true;
  confirmation.close();confirmation.remove();game.kskExitConfirmation=false;
  if(accepted)onConfirm();else if(previousFocus?.isConnected)previousFocus.focus();
 }
 confirmation.querySelector('[data-exit="cancel"]').onclick=()=>close(false);
 confirmation.querySelector('[data-exit="accept"]').onclick=()=>close(true);
 confirmation.addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();close(false);});
 confirmation.addEventListener('keydown',event=>event.stopPropagation());
 document.body.append(confirmation);confirmation.showModal();
};
