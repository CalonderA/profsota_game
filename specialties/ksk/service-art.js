'use strict';
// Workshop-specific case artwork. SVG overlays retain their interactive coordinates.
window.KskServiceArt = (() => {
 const many=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
 const bolt=(x,y,r=3)=>`<g transform="translate(${x} ${y})"><circle r="${r}" fill="#182029" stroke="#76828c" stroke-width=".7"/><path d="M-${r/2} 0h${r}" stroke="#a6b4be" stroke-width=".8"/></g>`;
 function fan(x,y,r,frame=true){return `<g transform="translate(${x} ${y})">${frame?`<path d="M-${r+7} -${r+7}h${r*2+14}v${r*2+14}h-${r*2+14}Z" fill="url(#pc-frame)" stroke="#4a535e"/><path d="M-${r+5} -${r+5}l${r*2+10} ${r*2+10}m0 -${r*2+10}l-${r*2+10} ${r*2+10}" stroke="#151c25" stroke-width="6"/>`:''}<circle r="${r}" fill="#060a10" stroke="#53606d" stroke-width="2"/><circle r="${r-2}" fill="none" stroke="#253746" stroke-width="2"/><g class="rotor">${many(9,i=>`<path transform="rotate(${i*40})" d="M-4 -7C-${r*.85} -${r*.25} -${r*.9} -${r*.8} -${r*.35} -${r*.93}Q${r*.22} -${r*.99} 8 -9L0 0Z" fill="url(#pc-blade)" stroke="#73808c" stroke-opacity=".35" stroke-width=".6"/>`)}</g><circle r="${r*.24}" fill="url(#pc-cap)" stroke="#566572" stroke-width=".8"/><circle r="${r*.17}" fill="#1a232d"/><path d="M-4 1l4-5 4 5-4 3Z" fill="#95a4b1"/>${frame?[-1,1].map(a=>[-1,1].map(b=>bolt(a*(r+3),b*(r+3),1.6)).join('')).join(''):''}</g>`;}
 function scene(){return `<svg class="hardware" viewBox="0 0 680 620" role="img" aria-label="Открытый металлический корпус компьютера на сервисном столе">
 <defs>
 <linearGradient id="pc-frame" x2=".35" y2="1"><stop stop-color="#5c6976"/><stop offset=".12" stop-color="#303b47"/><stop offset=".5" stop-color="#171f29"/><stop offset="1" stop-color="#313d49"/></linearGradient>
 <linearGradient id="pc-brushed" x2=".2" y2="1"><stop stop-color="#b0bac1"/><stop offset=".15" stop-color="#626f7a"/><stop offset=".45" stop-color="#35414e"/><stop offset=".52" stop-color="#75828e"/><stop offset="1" stop-color="#293543"/></linearGradient>
 <linearGradient id="pc-blade" x2=".8" y2="1"><stop stop-color="#77828b"/><stop offset=".42" stop-color="#384550"/><stop offset="1" stop-color="#131d29"/></linearGradient>
 <radialGradient id="pc-cap" cx=".35" cy=".25"><stop stop-color="#c3cbd0"/><stop offset=".4" stop-color="#707d88"/><stop offset="1" stop-color="#283442"/></radialGradient>
 <linearGradient id="pc-copper"><stop stop-color="#573d29"/><stop offset=".5" stop-color="#b88b5c"/><stop offset="1" stop-color="#6c4c33"/></linearGradient>
 <pattern id="pc-perf" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M1 2h3v3H1Z" fill="#070d15"/><path d="M1 1h4" stroke="#70808c" stroke-opacity=".22" stroke-width=".7"/></pattern>
 <pattern id="pc-grain" width="8" height="5" patternUnits="userSpaceOnUse"><path d="M0 .5h6M3 3h5" stroke="#c5d5de" stroke-opacity=".07" stroke-width=".4"/></pattern>
 <filter id="pc-shadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="3" dy="7" stdDeviation="5" flood-color="#000" flood-opacity=".65"/></filter>
 </defs>
 <image class="pc-case-photo" href="service-art/case.png" x="10" y="0" width="600" height="600" preserveAspectRatio="xMidYMid meet"/>
 <path d="M238 153h104v107H238Z" fill="#0c151c" stroke="#889189" stroke-width="2"/><path d="M246 160h89v92h-89Z" fill="#677786" stroke="#c5cbd1"/>

 <path d="M252 168h78v80h-78Z" fill="url(#pc-brushed)" stroke="#ced4d5"/>
 <text x="290" y="202" text-anchor="middle" fill="#34424e" font-size="8">CORE / CPU</text><text x="290" y="217" text-anchor="middle" fill="#34424e" font-size="5">LGA 1700 · 65 W</text>
 <path class="old-cpu" d="M261 181q14-9 23 4t29-1l6 15-14 10 11 18-19 10-14-9-22 5 9-24-13-12Z" fill="#8d8f94" stroke="#a4a6a9" stroke-width="2"/>
 <g class="new-paste"><ellipse cx="291" cy="208" rx="8" ry="7" fill="#747e8b"/><ellipse cx="289" cy="205" rx="7" ry="6" fill="#c3c9d1"/><path d="M285 203q4-4 7-1" stroke="#f0f3f5" stroke-width="1.5" fill="none"/></g>
 <g class="cooler" filter="url(#pc-shadow)"><path d="M227 151l16-15h113v125l-16 15H227Z" fill="#303c48"/>
 ${many(24,i=>`<path d="M229 ${149+i*5}l15-11h109v3H245l-15 11Z" fill="${i%3?'#9ca9b2':'#677782'}" stroke="#d0d7da" stroke-opacity=".25" stroke-width=".5"/>`)}
 <path d="M241 139v124m9-124v124m96-124v124" stroke="#d4dcdf" stroke-opacity=".4"/>
 <path d="M248 263v12q0 8 8 8h9q8 0 8-8v-9m35-2v12q0 8 8 8h9q8 0 8-8v-12" fill="none" stroke="url(#pc-copper)" stroke-width="6"/>
 ${fan(290,205,48)}<path d="M235 153l-4 17m111-17l5 17m-112 70l-4 17m111-17l5 17" stroke="#cbd2d7" stroke-width="2"/>
 </g>
 <g class="base" filter="url(#pc-shadow)"><rect x="375" y="160" width="130" height="150" rx="8" fill="#172733" stroke="#65808c"/><path d="M383 178l9-10h101v100l-9 12H383Z" fill="#28343f" stroke="#778591"/><path d="M383 178h101v102H383Z" fill="url(#pc-brushed)"/>${many(13,i=>`<path d="M388 ${183+i*7}h91" stroke="#e4e8e9" stroke-opacity=".14" stroke-width=".5"/>`)}<path d="M402 192h65v65h-65Z" fill="url(#pc-copper)" stroke="#b8ab91"/><path class="old-base" d="M406 199l20-3 15 9 18-6 5 15-16 13 14 21-23 4-15-10-18 7 8-23-13-14Z" fill="#96989b" stroke="#b0b2b4" stroke-width="1.5"/><text x="433" y="299" text-anchor="middle" fill="#a3b7c8" font-size="8" letter-spacing="1">ОСНОВАНИЕ КУЛЕРА</text></g>
 ${[[230,145],[352,145],[230,272],[352,272]].map(([x,y],i)=>`<g class="screw" transform="translate(${x} ${y})"><circle r="9" fill="#121d27" stroke="#7a8791"/><g class="screw-head"><circle r="6" fill="url(#pc-cap)"/><path d="M-3 0h6M0-3v6" stroke="#131e29" stroke-width="1.5"/></g><text x="-3" y="-14" fill="#c0d1df" font-size="8">${i+1}</text></g>`).join('')}
 <g class="cable"><path d="M336 161C386 155 409 111 380 95" fill="none" stroke="#070b12" stroke-width="7"/><path d="M336 160C386 154 409 110 380 94" fill="none" stroke="#707268" stroke-width="1.2"/><path d="M338 162C389 154 411 111 382 95" fill="none" stroke="#a19566" stroke-width="1.1"/></g>
 <g class="fan-connector"><path d="M370 85h22v19h-22Z" fill="#d3d5c5" stroke="#86928b"/><path d="M373 88h16v8h-16Z" fill="#39434a"/>${many(4,i=>`<path d="M${375+i*4} 89v6" stroke="#c9b67d"/>`)}<path d="M376 101h10" stroke="#53616c" stroke-width="2"/><text x="366" y="79" fill="#a4b6c1" font-size="6">CPU_FAN</text></g>
 <g class="dust"></g><g class="particles" pointer-events="none"></g><g class="pc-guide-marker" pointer-events="none" aria-hidden="true"></g></svg>`;}
 function tool(id){
  const body={
   hand:'<path d="M27 63l-9-17q-3-8 3-8l9 9-5-27q-1-7 5-6l7 24-1-29q1-6 6-3l4 30 3-24q3-6 7-1l-1 27 5-15q4-4 7 1l-4 29-15 17Z" fill="#adb8bc" stroke="#e1e5e4"/><path d="M29 48l9 8m4-34l4 18m6-5l-1 9" stroke="#687980" fill="none"/><path d="M28 62l24-5 4 14-26 5Z" fill="#344859" stroke="#7e929e"/>',
   air:'<path d="M24 26q16-6 31 0v43q-16 8-31 0Z" fill="url(#pc-tool-air)" stroke="#a1b4c0"/><ellipse cx="39.5" cy="26" rx="15.5" ry="4" fill="#c7d1d7"/><path d="M29 25v-9h21v9" fill="#313d48" stroke="#91a7b7"/><path d="M33 16V9h13v7" fill="#b8c4cb"/><path d="M43 12h29" stroke="#bb7855" stroke-width="2"/><path d="M26 36h27v22H26Z" fill="#25465d"/><text x="40" y="46" text-anchor="middle" fill="#d9e7ed" font-size="7" font-weight="700">AIR</text><text x="40" y="53" text-anchor="middle" fill="#a9c7da" font-size="4">DUSTER</text><path d="M28 63h22" stroke="#9caebb"/>',
   brush:'<g transform="rotate(28 40 40)"><path d="M35 6q5-4 10 0l-1 36h-8Z" fill="#344e64" stroke="#8eabbc"/><path d="M36 33h8v14h-8Z" fill="url(#pc-tool-brush)" stroke="#aebbc1"/><path d="M31 47h18l6 25q-16 5-30 0Z" fill="#879293" stroke="#bcc5bf"/>'+many(12,i=>`<path d="M${32+i*1.4} 48l${(i-6)*.7} 25" stroke="${i%2?'#d1d4c5':'#4d5f61'}" stroke-width=".7"/>`)+'</g>',
   driver:'<g transform="rotate(32 40 40)"><path d="M36 36h8v28l-2 9h-4l-2-9Z" fill="url(#pc-tool-driver)" stroke="#c3d0d8"/><path d="M30 7q10-5 20 0l-1 28-5 7h-8l-5-7Z" fill="#283f54" stroke="#92a9bb"/><path d="M34 11v21m6-23v25m6-23v21" stroke="#6c8494" stroke-width="2"/><path d="M36 64h8" stroke="#657b88"/></g>',
   paste:'<g transform="rotate(35 40 40)"><path d="M34 5h12v12H34Z" fill="#99abb8" stroke="#d5dfe3"/><path d="M29 16h22v5H29Z" fill="#b9c7d0"/><path d="M32 21h16v33H32Z" fill="url(#pc-tool-paste)" stroke="#c7d4dc"/><path d="M32 29h16v17H32Z" fill="#315268"/><text x="40" y="40" text-anchor="middle" fill="#d2e1e7" font-size="5">THERMAL</text><path d="M34 54h12l-4 10h-4Z" fill="#a4b7c3"/><path d="M39 64h2v11h-2Z" fill="#d4dce1"/></g>',
   cloth:'<path d="M13 22l43-9 16 44-46 14-14-9Z" fill="#a2b9bd" stroke="#d3e1e0"/><path d="M13 22l40 1 19 34-46 14 8-39Z" fill="#c4d1cf"/><path d="M14 24l20 8-8 39m8-39l19-9m-16 7l23 28-31 10" fill="none" stroke="#7e9b9e" stroke-width="1.1"/>'+many(10,i=>`<path d="M${24+i*3} ${30+i%3*3}l13 26" stroke="#e3eae4" stroke-opacity=".4" stroke-width=".6"/>`)
  };
  return `<svg viewBox="0 0 80 80" aria-hidden="true"><defs><linearGradient id="pc-tool-${id}"><stop stop-color="#536c7f"/><stop offset=".35" stop-color="#d7e0e3"/><stop offset=".65" stop-color="#9aafbc"/><stop offset="1" stop-color="#425b70"/></linearGradient></defs><ellipse cx="42" cy="74" rx="25" ry="3" fill="#000" opacity=".25"/>${body[id]||body.hand}</svg>`;
 }
 // Fixed pseudo random distribution: no new noise or geometry while cleaning.
 function dust(i,x,y){const rand=n=>{const v=Math.sin(i*127.1+n*311.7)*43758.5453;return v-Math.floor(v);};return many(i<30?24:16,j=>{const dx=(rand(j*5)-.5)*33,dy=(rand(j*5+1)-.5)*23,r=.45+rand(j*5+2)*1.6;return j%4===0?`<path d="M${x+dx} ${y+dy}q${rand(j+2)*6-3} -4 ${3+rand(j)*4} 1" fill="none" stroke="${j%2?'#a5a8aa':'#6f7b83'}" stroke-width="${r*.65}" opacity=".8"/>`:`<circle cx="${x+dx}" cy="${y+dy}" r="${r}" fill="${['#747f85','#a9adae','#65727a','#c0c0b9'][j%4]}" opacity="${.35+rand(j+3)*.5}"/>`;});}
 return {scene,tool,dust};
})();
