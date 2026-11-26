const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('confirmation handles cancellation, Escape, repeat clicks and accepting exit',()=>{
 let dialog,created=0,accepted=0,focused=0;
 const context={window:{},document:{
  activeElement:{isConnected:true,focus(){focused++;}},
  body:{append(){}},
  createElement(){
   created++;
   const buttons={},events={};
   return dialog={buttons,events,setAttribute(){},querySelector(s){return buttons[s]??={};},
    addEventListener(name,fn){events[name]=fn;},showModal(){this.open=true;},
    close(){this.open=false;},remove(){this.removed=true;}};
  }
 }};
 vm.runInNewContext(fs.readFileSync('specialties/ksk/exit-confirm.js','utf8'),context);
 const game={},open=()=>context.window.confirmKskMinigameExit(game,()=>accepted++);
 open();open();assert.equal(created,1);assert.equal(accepted,0);
 dialog.buttons['[data-exit="cancel"]'].onclick();
 assert.equal(accepted,0);assert.equal(game.kskExitConfirmation,false);assert.equal(focused,1);
 open();let prevented=false;
 dialog.events.cancel({preventDefault(){prevented=true;},stopPropagation(){}});
 assert.equal(prevented,true);assert.equal(accepted,0);assert.equal(dialog.removed,true);
 open();dialog.buttons['[data-exit="accept"]'].onclick();
 dialog.buttons['[data-exit="accept"]'].onclick();
 assert.equal(accepted,1);assert.equal(game.kskExitConfirmation,false);
});
