const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function setup(){
 let dialog,confirmExit,bonus=0,cancelled=0;
 class Node{
  constructor(dataset={}){this.dataset=dataset;this.nodes=new Map();this.hidden=true;this.disabled=false;const classes=new Set();this.classList={add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n)};}
  querySelector(key){if(!this.nodes.has(key))this.nodes.set(key,new Node());return this.nodes.get(key);}
  querySelectorAll(key){return key==='[data-part]'?this.cards:key==='[data-slot]'?this.slots:[];}
  setAttribute(){} prepend(){} focus(){} cloneNode(){return new Node();}
  showModal(){} close(){} remove(){this.removed=true;}
 }
 const context={window:{matchMedia:()=>({matches:false}),confirmKskMinigameExit:(d,accept)=>{confirmExit=accept;}},document:{body:{append(){}},createElement(){
  dialog=new Node();dialog.cards=['gpu','ssd','cpu','ram'].map(part=>new Node({part}));dialog.slots=['cpu','ram','ssd','gpu'].map(slot=>new Node({slot}));return dialog;
 }}};
 vm.runInNewContext(fs.readFileSync('specialties/ksk/assembly.js','utf8'),context);
 const open=()=>context.window.openKskAssembly(n=>bonus+=n,()=>cancelled++);
 open();
 return {open,place(part,slot=part){dialog.cards.find(c=>c.dataset.part===part).onclick({detail:0});dialog.slots.find(s=>s.dataset.slot===slot).onclick({});},
  exit(){dialog.querySelector('.assembly-exit').onclick({});},escape(){dialog.oncancel({preventDefault(){}});},accept(){confirmExit();},finish(){dialog.querySelector('.assembly-finish').onclick();},
  count:()=>dialog.querySelector('.assembly-count').textContent,bonus:()=>bonus,cancelled:()=>cancelled,cards:()=>dialog.cards,
  highlighted:()=>dialog.slots.filter(s=>s.classList.contains('assembly-hinted')).map(s=>s.dataset.slot)};
}

test('partial assembly restarts after confirmed exit',()=>{
 const g=setup();g.place('cpu');assert.equal(g.count(),'1 / 4');g.exit();assert.equal(g.cancelled(),0);g.accept();assert.equal(g.cancelled(),1);g.open();assert(g.cards().every(c=>!c.disabled));g.place('cpu');assert.equal(g.count(),'1 / 4');
});
for(const exit of ['exit','escape'])test(`${exit} discards even fully assembled PC`,()=>{
 const g=setup();for(const part of ['cpu','ram','ssd','gpu'])g.place(part);g[exit]();assert.equal(g.bonus(),0);g.accept();assert.equal(g.cancelled(),1);assert.equal(g.bonus(),0);g.open();assert(g.cards().every(c=>!c.disabled));
});
test('finish explicitly submits completed assembly',()=>{
 const g=setup();for(const part of ['cpu','ram','ssd','gpu'])g.place(part);g.finish();assert.equal(g.bonus(),200);assert.equal(g.cancelled(),0);
});

function permutations(parts){return parts.length?parts.flatMap((p,i)=>permutations(parts.filter((_,j)=>j!==i)).map(rest=>[p,...rest])):[[]];}
test('all 24 assembly orders complete successfully',()=>{
 for(const order of permutations(['cpu','ram','ssd','gpu'])){
  const g=setup();order.forEach((part,i)=>{g.place(part);assert.equal(g.count(),`${i+1} / 4`,order.join(','));});g.finish();assert.equal(g.bonus(),200);
 }
});
test('second mistake highlights only the matching slot, independently for each part',()=>{
 const g=setup();g.place('gpu','cpu');assert.deepEqual(g.highlighted(),[]);
 g.place('ram','ssd');assert.deepEqual(g.highlighted(),[]);
 g.place('gpu','ram');assert.deepEqual(g.highlighted(),['gpu']);
 g.place('ram','cpu');assert.deepEqual(g.highlighted(),['ram']);
 g.place('ram');assert.deepEqual(g.highlighted(),[]);assert.equal(g.count(),'1 / 4');
 g.place('gpu');g.place('ssd');g.place('cpu');g.finish();assert.equal(g.bonus(),100);
});
test('mistake counters reset after exit',()=>{
 const g=setup();g.place('gpu','cpu');g.place('gpu','ram');assert.deepEqual(g.highlighted(),['gpu']);
 g.exit();g.accept();g.open();g.place('gpu','cpu');assert.deepEqual(g.highlighted(),[]);
});
