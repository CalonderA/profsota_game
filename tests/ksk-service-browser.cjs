const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const assert=require('node:assert/strict');
(async()=>{
 const targets=await (await fetch('http://127.0.0.1:9229/json')).json();const target=targets.find(t=>t.type==='page');assert.ok(target,'Headless Chromium must listen on port 9229');
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let seq=0;const pending=new Map(),errors=[];
 ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text+': '+m.params.exceptionDetails.exception?.description);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 async function run(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
 const click=selector=>run(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const state=()=>run("JSON.parse(localStorage.getItem('sota_ksk_service_v1'))");
 const hint=()=>run("document.querySelector('.pc-tutorial').dataset.step");
 const out=path.join(os.tmpdir(),'sota-service-review');fs.mkdirSync(out,{recursive:true});
 async function shot(name){const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(r.data,'base64'));}
 async function size(width,height){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});}
 await send('Runtime.enable');await send('Page.enable');await size(1366,768);
 await send('Page.navigate',{url:'http://127.0.0.1:8787/specialties/ksk/index.html'});
 for(let n=0;n<60;n++){if(await run("typeof window.openKskService==='function'"))break;await new Promise(r=>setTimeout(r,100));}
 await run("localStorage.removeItem('sota_ksk_service_v1');window.openKskService(n=>window.serviceBonus=n,()=>window.serviceCancelled=true)");
 const dims=()=>run(`(()=>{const d=document.querySelector('.pc-service');return {w:d.clientWidth,sw:d.scrollWidth,h:d.clientHeight,sh:d.scrollHeight,children:[...d.querySelectorAll('.pc-layout,.pc-steps,.pc-diag,.pc-workbench,footer')].map(e=>({name:e.className||e.tagName,h:e.clientHeight,sh:e.scrollHeight,w:e.clientWidth,sw:e.scrollWidth})),buttons:[...d.querySelectorAll('button')].filter(e=>e.offsetWidth).map(e=>{let r=e.getBoundingClientRect();return {text:e.textContent.trim(),left:r.left,right:r.right,top:r.top,bottom:r.bottom}})}})()`);
 for(const [w,h] of [[1366,768],[1920,1080],[1024,768],[1280,720]]){await size(w,h);const v=await dims();assert.ok(v.sw<=v.w,`horizontal overflow at ${w}: ${JSON.stringify(v)}`);assert.ok(v.sh<=v.h,`vertical overflow at ${w}: ${JSON.stringify(v)}`);for(const child of v.children)assert.ok(child.sh<=child.h+1,`child overflow at ${w}: ${JSON.stringify(child)}`);await shot('desktop-'+w);console.log('Desktop fits',w,h);}
 await size(1366,768);assert.equal(await run("document.querySelector('.pc-tutorial').hidden"),false);await click('[data-act=hint]');assert.equal(await run("document.querySelector('.pc-tutorial').hidden"),false);await click('[data-act=diagnose]');assert.equal(await run("document.querySelector('.pc-tutorial').hidden"),false);assert.equal(await hint(),'inspect');await shot('diagnosis');await click('[data-act=inspect]');await click('[data-cause="1"]');await click('[data-act=power]');await click('[data-act=plug]');await click('[data-tool=air]');assert.equal(await hint(),'hold');await click('[data-act=hold]');await shot('cleaning');
 // Exercise touch cleaning and the persistent mobile toolbar in the real browser.
 await size(390,844);await send('Emulation.setTouchEmulationEnabled',{enabled:true});
 await click('[data-act=view-pc]');await run("document.querySelector('.pc-workbench').scrollIntoView({behavior:'instant',block:'start'})");
 const touchPoint=await run(`(()=>{const svg=document.querySelector('.hardware'),p=svg.createSVGPoint();p.x=242;p.y=160;const v=p.matrixTransform(svg.getScreenCTM());return {x:v.x,y:v.y}})()`);
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...touchPoint,id:1}]});
 for(let i=0;i<4;i++)await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchPoint.x+(i%2?0:6),y:touchPoint.y,id:1}]});
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.ok((await state()).dust[0]<1,'native touch cleaning');
 const toolbar=await run("(()=>{const r=document.querySelector('.pc-tools').getBoundingClientRect();return {top:r.top,bottom:r.bottom}})()");assert.ok(toolbar.top>0&&toolbar.bottom<=844,'tools visible while scrolling');await shot('mobile-touch');
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});await size(1366,768);await run("document.querySelector('.pc-service').scrollTop=0");
 // Native browser mouse input tests viewBox / screen coordinate conversion.
 const pt=await run(`(()=>{const p=document.querySelector('.hardware').createSVGPoint();p.x=242;p.y=160;const s=p.matrixTransform(document.querySelector('.hardware').getScreenCTM());return {x:s.x,y:s.y}})()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',...pt,button:'left',clickCount:1});for(let i=0;i<12;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:pt.x+(i%2?0:8),y:pt.y,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...pt,button:'left',clickCount:1});assert.ok((await state()).dust[0]<1,'native mouse cleaning');
 // Complete the production pointer handlers in the real DOM.
 await run(`(()=>{const svg=document.querySelector('.hardware');function event(type,x,y){const p=svg.createSVGPoint();p.x=x;p.y=y;const s=p.matrixTransform(svg.getScreenCTM());return new PointerEvent(type,{clientX:s.x,clientY:s.y,pointerId:1,pointerType:'mouse',bubbles:true});}window.serviceTap=(x,y)=>{svg.dispatchEvent(event('pointerdown',x,y));svg.dispatchEvent(event('pointerup',x,y));};window.serviceRub=(x,y)=>{svg.dispatchEvent(event('pointerdown',x,y));for(let j=0;j<26;j++)svg.dispatchEvent(event('pointermove',x+(j%2?0:6),y));svg.dispatchEvent(event('pointerup',x,y));};for(let i=0;i<60;i++)serviceRub(...(i<30?[242+i%6*20,160+Math.floor(i/6)*22]:[120+(i-30)%10*47,320+Math.floor((i-30)/10)*36]));})()`);
 assert.ok((await state()).dust.every(v=>v<=.01));
 const tap=(x,y)=>run(`serviceTap(${x},${y})`);
 await click('[data-tool=hand]');await tap(380,95);await click('[data-tool=driver]');for(const p of [[230,145],[352,145],[230,272],[352,272]])await tap(...p);await click('[data-tool=hand]');await tap(290,205);assert.equal((await state()).removed,true);await new Promise(r=>setTimeout(r,550));await shot('cooler-removed');
 await click('[data-tool=cloth]');await run('serviceRub(290,205);serviceRub(430,220)');await click('[data-tool=paste]');await tap(290,205);await shot('new-paste');await click('[data-tool=hand]');await tap(290,205);await click('[data-tool=driver]');for(const p of [[230,145],[352,145],[230,272],[352,272]])await tap(...p);await click('[data-tool=hand]');await tap(380,95);await click('[data-act=plug]');await click('[data-act=power]');await click('[data-act=diagnose]');await new Promise(r=>setTimeout(r,3300));assert.equal((await state()).verified,true);await shot('completed');
 for(const [w,h] of [[1366,768],[1024,768],[1280,720]]){await size(w,h);const v=await dims();for(const child of v.children)assert.ok(child.sh<=child.h+1,`success overflow at ${w}: ${JSON.stringify(child)}`);}
 for(const [w,h] of [[768,1024],[820,1180],[390,844],[360,800]]){await size(w,h);const v=await dims();assert.ok(v.sw<=v.w,`mobile overflow ${w}`);await shot('responsive-'+w);}
 await size(390,844);await shot('mobile');const mobile=await dims();assert.ok(mobile.sw<=mobile.w,'mobile horizontal overflow');await click('[data-act=finish]');assert.equal(await run('window.serviceBonus'),600);assert.deepEqual(errors,[]);console.log('Repair completed, 600 points; no browser exceptions. Screenshots:',out);await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1);});
