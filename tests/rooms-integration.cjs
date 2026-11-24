const assert=require('node:assert/strict');
(async()=>{
 const targets=await(await fetch('http://127.0.0.1:9230/json')).json();const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value;};await send('Page.handleJavaScriptDialog',{accept:true}).catch(()=>{});await send('Runtime.enable');await send('Page.enable');await send('Page.handleJavaScriptDialog',{accept:true}).catch(()=>{});
 for(const spec of ['ksk','p','kip','ts']){
  await send('Page.navigate',{url:`http://127.0.0.1:8787/specialties/${spec}/index.html`});await new Promise(r=>setTimeout(r,600));
  await run("window.confirm=()=>true;document.getElementById('startBtn').click()");await new Promise(r=>setTimeout(r,150));
  const info=await run('({state,needed,count:crystals.length})');assert.equal(info.state,'playing');assert.equal(info.needed,info.count);console.log(spec,info);
  if(spec==='ksk'){
   await run('interactStation(crystals.find(c=>c.stationType===3))');assert.equal(await run("!!document.querySelector('.pc-service[open]')"),true);await run("document.querySelector('[data-act=exit]').click()");assert.equal(await run('state'),'playing');
   await run('interactStation(crystals.find(c=>c.stationType===0))');assert.equal(await run("!!document.querySelector('.ksk-assembly[open]')"),true);await run("document.querySelector('.assembly-exit').click()");
  }else if(spec==='p'){
   for(let n=0;n<4;n++){await run(`interactStation(crystals.find(c=>c.stationType===${n}))`);assert.equal(await run('state'),'minigame');await run("document.querySelector('[data-p-exit],.p-exit')?.click()");await run("document.querySelectorAll('dialog').forEach(d=>d.remove());state='playing'");}
  }else assert.ok(await run("Object.keys(window.MINI_GAMES||{}).length")>0);
 }
 assert.deepEqual(errors,[]);console.log('All four rooms start; KSK and programming stations launch; no browser exceptions.');await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1);});
