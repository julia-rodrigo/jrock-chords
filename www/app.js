/* ---------- state ---------- */
const $=id=>document.getElementById(id);
const BIG_SIZE={sm:{w:92,h:112},md:{w:132,h:160},lg:{w:176,h:214}};

let st={
  key:"G",prog:PRESETS[0].p.map(([d,v])=>({d,v})),sel:null,
  timeSigIdx:2, drumStyle:"none", instrument:"guitar", diagramSize:"md", diagramMode:"guitar", bpm:120,
  expA:{root:9,q:"m"}, expB:{root:7,q:""}
};
let hist=[];
try{
  const s=JSON.parse(localStorage.getItem("jrock-pm")||"null");
  if(s&&Array.isArray(s.prog))st={...st,...s,sel:null};
}catch(e){}
function save(){
  try{localStorage.setItem("jrock-pm",JSON.stringify({
    key:st.key,prog:st.prog,timeSigIdx:st.timeSigIdx,drumStyle:st.drumStyle,
    instrument:st.instrument,diagramSize:st.diagramSize,diagramMode:st.diagramMode,bpm:st.bpm
  }))}catch(e){}
}
function snap(){hist.push(JSON.stringify(st.prog));if(hist.length>50)hist.shift()}

/* ---------- note / chord helpers ---------- */
function noteName(pc){const flat=["F","B♭","E♭"].includes(st.key);return (flat?FL:SH)[((pc%12)+12)%12]}
function fam(d){return DEG[d].f}
function famCol(d){return {T:"var(--T)",S:"var(--S)",D:"var(--D)"}[fam(d)]}
function famHex(d){return {T:"#4ade80",S:"#5aa9e6",D:"#ef4d5f"}[fam(d)]}
function roman(d){return DEG[d].r+(VARS[d][0].rn)}

function rn(c){const g=DEG[c.d],v=VARS[c.d][c.v];if(c.d===2&&v.rn==="7")return "III7";return g.r+v.rn}
function cn(c){return noteName(KEYPC[st.key]+DEG[c.d].off)+VARS[c.d][c.v].cn}

function chordRoot(c){return c.custom?((c.root%12)+12)%12:(KEYPC[st.key]+DEG[c.d].off)%12}
function chordIv(c){return c.custom?qualByKey(c.q).iv:VARS[c.d][c.v].iv}
function chordShapeKey(c){return c.custom?c.q:(VARS[c.d][c.v].rn==="°"?"dim":VARS[c.d][c.v].rn)}
function chordFamHexOf(c){return c.custom?"#c9a383":famHex(c.d)}
function chordFamCls(c){return c.custom?"fX":"f"+fam(c.d)}
function chordTop(c){return c.custom?(noteName(c.root)+qualByKey(c.q).suf):rn(c)}
function chordBottom(c){return c.custom?"custom":cn(c)}
function chordTension(c){return c.custom?2:(DEG[c.d].base+VARS[c.d][c.v].t)}
function chordFamName(c){return c.custom?"custom, non-diatonic":FAMNAME[fam(c.d)]}
function toPlayable(c){return{iv:chordIv(c),root:chordRoot(c)}}

function move(a,b){
  if(a===b)return["hold","Repeating holds the moment and lets the melody move — like the double VIm at the end of the Royal Road."];
  if(a===0)return["normal",ITEXT[b]];
  const m=MOVES[a];
  if(m.avoid&&m.avoid[b])return["avoid",m.avoid[b]];
  if(m[b])return m[b];
  if(b===(a+1)%7)return["step","Stepwise climb — lifts the energy (like IIm → IIIm → IV → V)."];
  if(a===(b+1)%7)return["step","Stepwise descent — smooth and flowing (like IV → IIIm)."];
  return["color","Not a standard pull — works when the melody or a shared note ties the chords together."];
}
function moveBetween(cA,cB){
  if(cA.custom||cB.custom)return["custom","A custom chord — outside the diatonic flow, so there's no standard move label here. Trust your ear, or lean on any notes the two chords share."];
  return move(cA.d,cB.d);
}

function focusIdx(){return st.sel!=null?st.sel:st.prog.length-1}

/* ---------- top controls ---------- */
function renderKey(){$("key").innerHTML=KEYS.map(k=>`<option ${k===st.key?"selected":""}>${k}</option>`).join("")}
function renderTimeSig(){$("timeSig").innerHTML=TIME_SIGS.map((t,i)=>`<option value="${i}" ${i===st.timeSigIdx?"selected":""}>${t.label}</option>`).join("")}
function renderDrum(){$("drumStyle").innerHTML=DRUM_STYLES.map(s=>`<option value="${s}" ${s===st.drumStyle?"selected":""}>${s[0].toUpperCase()+s.slice(1)}</option>`).join("")}
function renderInstrument(){$("instrument").innerHTML=INSTRUMENTS.map(i=>`<option value="${i.k}" ${i.k===st.instrument?"selected":""}>${i.label}</option>`).join("")}
function renderPresets(){$("presets").innerHTML=PRESETS.map((p,i)=>`<button data-i="${i}">${p.n}</button>`).join("")}
function renderSizeBtns(){document.querySelectorAll("#sizeBtns button").forEach(b=>b.classList.toggle("on",b.dataset.s===st.diagramSize))}
function renderDiagModeBtns(){document.querySelectorAll("#diagModeBtns button").forEach(b=>b.classList.toggle("on",b.dataset.m===st.diagramMode))}

/* ---------- progression ---------- */
function renderProg(){
  const el=$("prog"),sz=diagramSizePx(st.diagramSize);
  if(!st.prog.length){el.innerHTML=`<div class="empty">Tap a chord on the wheel below to start.</div>`;return}
  let h="";
  st.prog.forEach((c,i)=>{
    if(i>0){const t=TYPES[moveBetween(st.prog[i-1],c)[0]];h+=`<span class="mv" style="color:${t.c};border-color:${t.c}">${t.lbl}</span>`}
    const diagram=chordOrPianoSVG(st.diagramMode,chordRoot(c),chordShapeKey(c),chordIv(c),chordFamHexOf(c),sz.w,sz.h);
    h+=`<div class="chip ${chordFamCls(c)} ${st.sel===i?"sel":""}" data-i="${i}">`+
       `<div class="chipBtns"><button class="chipBtn" data-act="play" data-i="${i}" title="Replay this chord">▶</button><button class="chipBtn" data-act="del" data-i="${i}" title="Remove this chord">✕</button></div>`+
       `<div class="rn">${chordTop(c)}</div><div class="cn">${chordBottom(c)}</div><div class="diagram">${diagram}</div></div>`;
  });
  el.innerHTML=h;
}

function pos(d,R=120){const a=(-90+d*360/7)*Math.PI/180;return[170+R*Math.cos(a),170+R*Math.sin(a)]}
function renderWheel(){
  const fi=focusIdx(),selChord=fi>=0?st.prog[fi]:null,from=(selChord&&!selChord.custom)?selChord.d:null;
  if(!st.prog.length)$("fromLbl").textContent="Pick a starting chord.";
  else if(selChord&&selChord.custom)$("fromLbl").textContent=`${chordTop(selChord)} is a custom chord — pick a diatonic chord below to keep building from here.`;
  else $("fromLbl").textContent=`Next after ${rn(st.prog[fi])} (${cn(st.prog[fi])}) — tap a chord to add it${st.sel!=null?" after the selected one":""}.`;
  let defs="<defs>"+Object.entries(TYPES).map(([k,t])=>`<marker id="m-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9z" fill="${t.c}"/></marker>`).join("")+"</defs>";
  let s=defs+`<circle cx="170" cy="170" r="120" fill="none" stroke="#4a3929" stroke-width="1"/><circle cx="170" cy="170" r="70" fill="none" stroke="#3a2d1f" stroke-width="1"/>`;
  if(from!=null){
    const order=[0,1,2,3,4,5,6].filter(b=>b!==from).map(b=>({b,m:move(from,b)})).sort((x,y)=>TYPES[y.m[0]].rank-TYPES[x.m[0]].rank);
    order.forEach(({b,m})=>{
      const t=TYPES[m[0]];const[x1,y1]=pos(from),[x2,y2]=pos(b);
      const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;
      const sx=x1+ux*30,sy=y1+uy*30,ex=x2-ux*32,ey=y2-uy*32;
      const mx=(sx+ex)/2+(-uy)*18,my=(sy+ey)/2+ux*18;
      s+=`<path d="M${sx} ${sy} Q${mx} ${my} ${ex} ${ey}" fill="none" stroke="${t.c}" stroke-width="${t.w}" ${t.dash?`stroke-dasharray="${t.dash}"`:""} marker-end="url(#m-${m[0]})" opacity="${m[0]==="avoid"||m[0]==="color"?.55:.95}"/>`;
    });
  }
  for(let d=0;d<7;d++){
    const[x,y]=pos(d),isF=d===from,col=famHex(d);
    s+=`<g class="node" data-d="${d}"><circle cx="${x}" cy="${y}" r="${isF?28:25}" fill="${isF?col:"#241b15"}" stroke="${col}" stroke-width="${isF?3:2.5}"/><text x="${x}" y="${y+1}" text-anchor="middle" dominant-baseline="central" font-size="${d===6?14:15}" font-weight="700" fill="${isF?"#19130f":col}">${roman(d)}</text></g>`;
  }
  s+=`<text x="170" y="166" text-anchor="middle" font-size="12" fill="#c9a383">key of</text><text x="170" y="186" text-anchor="middle" font-size="20" font-weight="700" fill="#f5ebe0">${st.key}</text>`;
  $("wheel").innerHTML=s;

  const sg=$("sugg");
  if(from==null){
    if(!st.prog.length){sg.innerHTML=[0,5,3].map(d=>`<button class="sg" data-d="${d}"><b style="color:${famCol(d)}">${roman(d)}</b><span class="why">${{0:"Start home — stable, a natural opening.",5:"Start on VIm — the melancholic J-rock opener.",3:"Start on IV — like the Royal Road, already in motion."}[d]}</span></button>`).join("")}
    else sg.innerHTML="";
    return;
  }
  const list=[0,1,2,3,4,5,6].map(b=>({b,m:move(from,b)})).sort((x,y)=>TYPES[x.m[0]].rank-TYPES[y.m[0]].rank);
  sg.innerHTML=list.map(({b,m})=>{const t=TYPES[m[0]];return`<button class="sg ${m[0]==="avoid"?"avoid":""}" data-d="${b}"><b style="color:${famCol(b)}">${roman(b)}</b><span class="why"><span class="mv" style="color:${t.c};border-color:${t.c}">${t.lbl}</span> ${m[1]}</span></button>`}).join("");
}

function renderSel(){
  const c=st.sel!=null?st.prog[st.sel]:null;$("selCard").style.display=c?"":"none";if(!c)return;
  const root=chordRoot(c),sz=diagramSizePx(st.diagramSize),big=BIG_SIZE[st.diagramSize];
  if(c.custom){
    const q=qualByKey(c.q);
    $("selTitle").textContent=`Selected: ${noteName(root)}${q.suf} (custom, non-diatonic)`;
    $("bigDiagram").innerHTML=chordOrPianoSVG(st.diagramMode,root,c.q,q.iv,"#c9a383",big.w,big.h);
    $("varsLbl").textContent="Quality (tap to change)";
    $("vars").innerHTML=QUALS.map(qq=>{
      const d=chordOrPianoSVG(st.diagramMode,root,qq.k,qq.iv,"#c9a383",sz.w,sz.h);
      return `<button data-q="${qq.k}" class="${qq.k===c.q?"on":""}"><div class="diagram">${d}</div><div>${noteName(root)}${qq.suf||"maj"}</div></button>`;
    }).join("");
    $("swapsWrap").style.display="none";
  }else{
    const curV=VARS[c.d][c.v];
    $("selTitle").textContent=`Selected: ${rn(c)} · ${cn(c)} (${FAMNAME[fam(c.d)]})`;
    $("bigDiagram").innerHTML=chordOrPianoSVG(st.diagramMode,root,chordShapeKey(c),chordIv(c),chordFamHexOf(c),big.w,big.h);
    $("varsLbl").textContent="Voicing (tap to see how it's fretted)";
    $("vars").innerHTML=VARS[c.d].map((v,i)=>{
      const diagram=chordOrPianoSVG(st.diagramMode,root,v.rn==="°"?"dim":v.rn,v.iv,chordFamHexOf(c),sz.w,sz.h);
      return `<button data-v="${i}" class="${i===c.v?"on":""}"><div class="diagram">${diagram}</div><div>${rn({d:c.d,v:i})}</div><span style="color:var(--muted);font-size:12px">${cn({d:c.d,v:i})}</span></button>`;
    }).join("");
    $("swapsWrap").style.display="";
    const others=FAMS[fam(c.d)].filter(x=>x!==c.d);
    $("swaps").innerHTML=others.map(o=>`<button class="swap" data-s="${o}"><b style="color:${famCol(o)}">${rn(c)} → ${roman(o)}</b> <span style="color:var(--muted)">(${cn({d:o,v:0})})</span><small>${SWAPT[c.d+">"+o]||""}</small></button>`).join("");
  }
}

function renderCurve(){
  const p=st.prog,svg=$("curve");
  if(p.length<1){svg.innerHTML="";return}
  const W=340,H=130,l=20,r=20,top=14,bot=96,n=p.length;
  const xs=i=>n===1?W/2:l+i*(W-l-r)/(n-1),ys=v=>bot-(v/4.6)*(bot-top);
  let s=`<text x="4" y="12" font-size="11" fill="#c9a383">tension</text><line x1="${l}" y1="${bot}" x2="${W-r}" y2="${bot}" stroke="#4a3929"/>`;
  let d=p.map((c,i)=>`${i?"L":"M"}${xs(i)} ${ys(chordTension(c))}`).join(" ");
  s+=`<path d="${d}" fill="none" stroke="var(--primaryLine)" stroke-width="2.5" stroke-linejoin="round"/>`;
  p.forEach((c,i)=>{s+=`<circle cx="${xs(i)}" cy="${ys(chordTension(c))}" r="6" fill="${chordFamHexOf(c)}" stroke="#19130f" stroke-width="2"/>`;if(n<=10||i%2===0)s+=`<text x="${xs(i)}" y="${bot+18}" text-anchor="middle" font-size="${n>8?10:12}" font-weight="700" fill="${chordFamHexOf(c)}">${chordTop(c)}</text><text x="${xs(i)}" y="${bot+31}" text-anchor="middle" font-size="10" fill="#c9a383">${chordBottom(c)}</text>`});
  svg.innerHTML=s;
}

function renderAnalysis(){
  const p=st.prog,ul=$("an");
  if(!p.length){ul.innerHTML=`<li>Add a few chords and the breakdown appears here.</li>`;return}
  const out=[];
  if(p.every(c=>!c.custom)){
    const seq=p.map(c=>c.d).join(",");
    const pre=PRESETS.find(x=>x.p.map(a=>a[0]).join(",")===seq);
    if(pre)out.push(`<span class="k">This is the ${pre.n} pattern</span> — ${pre.d}`);
  }
  const c0=p[0];
  out.push(`<span class="k">Opening on ${chordTop(c0)}:</span> `+(c0.custom?"a custom opening chord — distinctive, but it won't read as 'home' the way a diatonic tonic would.":c0.d===5?"starting on VIm gives that melancholic J-rock opening.":fam(c0.d)==="T"?"starting in the tonic family feels grounded and natural.":fam(c0.d)==="S"?"starting on a subdominant feels like you've already left home — the Royal Road opens this way.":"starting on tension sounds dramatic, like entering mid-thought."));
  for(let i=1;i<p.length;i++){const m=moveBetween(p[i-1],p[i]),t=TYPES[m[0]];out.push(`<span class="k">${chordTop(p[i-1])} → ${chordTop(p[i])}</span> <span class="mv" style="color:${t.c};border-color:${t.c}">${t.lbl}</span> ${m[1]}`)}
  const last=p[p.length-1];
  if(p.length>1){
    out.push(`<span class="k">Ending on ${chordTop(last)}:</span> `+(last.custom?"ends on a custom chord — an open, unresolved colour to loop or transition from.":last.d===0?"lands home — final and satisfying, ideal for the end of a chorus.":last.d===5?"resolved but bittersweet — the classic J-rock landing.":fam(last.d)==="D"?"leaves you hanging on tension — perfect for a pre-chorus that launches into the chorus.":fam(last.d)==="S"?"feels open and floating, so it loops smoothly.":"a soft, ambiguous landing."));
    const lm=moveBetween(last,p[0]),lt=TYPES[lm[0]];
    out.push(`<span class="k">When it loops</span> (${chordTop(last)} → ${chordTop(p[0])}) <span class="mv" style="color:${lt.c};border-color:${lt.c}">${lt.lbl}</span> ${lm[1]}`);
    const fams=new Set(p.filter(c=>!c.custom).map(c=>fam(c.d)));
    if(!fams.has("D"))out.push(`<span class="k">No dominant chord:</span> there's no hard pull home, so it floats — softer and more dreamy.`);
    if(!fams.has("T"))out.push(`<span class="k">No tonic chord:</span> it never settles — pure momentum, great for build-ups.`);
    if(fams.size===3)out.push(`<span class="k">All three families used:</span> rest → motion → tension gives a complete emotional arc.`);
    const tv=p.map(chordTension),mx=tv.indexOf(Math.max(...tv));
    out.push(`<span class="k">Peak tension</span> at chord ${mx+1} (${chordTop(p[mx])}). `+(mx===p.length-1?"Peaking at the end creates forward pull into whatever comes next.":"After the peak, the release is what makes it feel emotional."));
    const av=p.slice(1).filter((c,i)=>moveBetween(p[i],c)[0]==="avoid").length;
    if(av)out.push(`<span class="k" style="color:var(--D)">${av} move${av>1?"s":""} to use with care</span> — not wrong, just make sure it's intentional.`);
    const cu=p.filter(c=>c.custom).length;
    if(cu)out.push(`<span class="k">${cu} custom chord${cu>1?"s":""}</span> — outside the diatonic set, so treat ${cu>1?"them":"it"} as colour rather than part of the roman-numeral flow.`);
  }
  ul.innerHTML=out.map(x=>`<li>${x}</li>`).join("");
}

function render(){
  renderProg();renderWheel();renderSel();renderCurve();renderAnalysis();renderSizeBtns();renderDiagModeBtns();
  renderExplorer();save();
}

function addChord(d){
  snap();const c={d,v:0};
  if(st.sel!=null){st.prog.splice(st.sel+1,0,c);st.sel++}else st.prog.push(c);
  if(st.prog.length>16){st.prog.shift();if(st.sel!=null)st.sel--}
  render();previewChord(c);
}
function addCustomChord(root,q){
  snap();const c={custom:true,root:((root%12)+12)%12,q};
  if(st.sel!=null){st.prog.splice(st.sel+1,0,c);st.sel++}else st.prog.push(c);
  if(st.prog.length>16){st.prog.shift();if(st.sel!=null)st.sel--}
  render();previewChord(c);
}
function previewChord(c){AudioEngine.previewChord(chordIv(c),chordRoot(c),st.instrument)}

/* ---------- playback ---------- */
function playOpts(extra){
  return Object.assign({bpm:st.bpm,timeSigBeats:TIME_SIGS[st.timeSigIdx].beats,drumStyle:st.drumStyle,instrument:st.instrument,loop:$("loop").classList.contains("on")},extra||{});
}
function highlight(i){document.querySelectorAll(".chip").forEach(el=>el.classList.toggle("play",+el.dataset.i===i))}
function play(){
  if(!st.prog.length)return;
  if(playingSongIdx!==-1){playingSongIdx=-1;renderSongs()}
  const chords=st.prog.map(toPlayable);
  $("play").textContent="■ Stop";
  AudioEngine.playProgression(chords,playOpts({onBeat:highlight,onDone:()=>{$("play").textContent="▶ Play";highlight(-1)}}));
}
function stopPlay(){AudioEngine.stop();$("play").textContent="▶ Play";highlight(-1)}
$("play").onclick=()=>AudioEngine.isPlaying()?stopPlay():play();

/* ---------- wiring: wheel / selection / editing ---------- */
$("wheel").addEventListener("click",e=>{const g=e.target.closest(".node");if(g)addChord(+g.dataset.d)});
$("sugg").addEventListener("click",e=>{const b=e.target.closest(".sg");if(b)addChord(+b.dataset.d)});
$("prog").addEventListener("click",e=>{
  const b=e.target.closest(".chipBtn");
  if(b){
    const i=+b.dataset.i;
    if(b.dataset.act==="play")previewChord(st.prog[i]);
    else{snap();st.prog.splice(i,1);if(st.sel===i)st.sel=null;else if(st.sel>i)st.sel--;render()}
    return;
  }
  const c=e.target.closest(".chip");if(!c)return;const i=+c.dataset.i;st.sel=st.sel===i?null:i;render();if(st.sel!=null)previewChord(st.prog[i]);
});
$("vars").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;snap();
  const c=st.prog[st.sel];
  if(c.custom)c.q=b.dataset.q;else c.v=+b.dataset.v;
  render();previewChord(c);
});
$("swaps").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;snap();st.prog[st.sel]={d:+b.dataset.s,v:0};render();previewChord(st.prog[st.sel])});
$("del").onclick=()=>{snap();st.prog.splice(st.sel,1);st.sel=null;render()};
$("desel").onclick=()=>{st.sel=null;render()};
$("mvL").onclick=()=>{const i=st.sel;if(i>0){snap();[st.prog[i-1],st.prog[i]]=[st.prog[i],st.prog[i-1]];st.sel--;render()}};
$("mvR").onclick=()=>{const i=st.sel;if(i<st.prog.length-1){snap();[st.prog[i+1],st.prog[i]]=[st.prog[i],st.prog[i+1]];st.sel++;render()}};
$("clear").onclick=()=>{snap();st.prog=[];st.sel=null;stopPlay();render()};
$("undo").onclick=()=>{if(!hist.length)return;st.prog=JSON.parse(hist.pop());st.sel=null;render()};
$("presets").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;snap();st.prog=PRESETS[+b.dataset.i].p.map(([d,v])=>({d,v}));st.sel=null;render()});
$("key").onchange=e=>{st.key=e.target.value;render()};
$("bpm").oninput=e=>{st.bpm=+e.target.value;$("bpmv").textContent=e.target.value;save()};
$("loop").onclick=e=>e.currentTarget.classList.toggle("on");
$("timeSig").onchange=e=>{st.timeSigIdx=+e.target.value;save()};
$("drumStyle").onchange=e=>{st.drumStyle=e.target.value;save()};
$("instrument").onchange=e=>{st.instrument=e.target.value;save()};
$("sizeBtns").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st.diagramSize=b.dataset.s;render()});
$("diagModeBtns").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st.diagramMode=b.dataset.m;render()});
$("copy").onclick=()=>{if(!st.prog.length)return;const t=`Key of ${st.key}: ${st.prog.map(chordBottom).join(" – ")}  (${st.prog.map(chordTop).join(" – ")})`;try{navigator.clipboard.writeText(t).then(()=>toast("Copied"),()=>toast(t))}catch(e){toast(t)}};
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.h);toast.h=setTimeout(()=>el.classList.remove("show"),2200)}

function downloadBlob(blob,filename){
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url)},200);
}
$("downloadChart").onclick=()=>{
  if(!st.prog.length)return toast("Nothing to download yet");
  const lines=[`J-Rock progression — key of ${st.key}, ${TIME_SIGS[st.timeSigIdx].label}, ${st.bpm} BPM`,
    st.prog.map(chordTop).join("  -  "),
    st.prog.map(chordBottom).join("  -  "),""];
  for(let i=1;i<st.prog.length;i++){const m=moveBetween(st.prog[i-1],st.prog[i]);lines.push(`${chordTop(st.prog[i-1])} -> ${chordTop(st.prog[i])}: ${TYPES[m[0]].lbl} — ${m[1]}`)}
  downloadBlob(new Blob([lines.join("\n")],{type:"text/plain"}),"jrock-progression.txt");
};
$("downloadAudio").onclick=async()=>{
  if(!st.prog.length)return toast("Nothing to download yet");
  toast("Rendering audio…");
  try{
    const blob=await AudioEngine.renderToWavBlob(st.prog.map(toPlayable),playOpts({loop:false}));
    downloadBlob(blob,"jrock-progression.wav");
    toast("Downloaded");
  }catch(e){toast("Couldn't render audio")}
};

/* ---------- chord explorer ---------- */
function renderExplorer(){
  const rootOpts=d=>Array.from({length:12},(_,pc)=>`<option value="${pc}" ${pc===d?"selected":""}>${noteName(pc)}</option>`).join("");
  const qualOpts=k=>QUALS.map(q=>`<option value="${q.k}" ${q.k===k?"selected":""}>${q.name}</option>`).join("");
  $("expRootA").innerHTML=rootOpts(st.expA.root);$("expQualA").innerHTML=qualOpts(st.expA.q);
  $("expRootB").innerHTML=rootOpts(st.expB.root);$("expQualB").innerHTML=qualOpts(st.expB.q);
  const sz=BIG_SIZE.sm;
  $("expDiagA").innerHTML=chordOrPianoSVG(st.diagramMode,st.expA.root,st.expA.q,qualByKey(st.expA.q).iv,"#c9a383",sz.w,sz.h);
  $("expDiagB").innerHTML=chordOrPianoSVG(st.diagramMode,st.expB.root,st.expB.q,qualByKey(st.expB.q).iv,"#c9a383",sz.w,sz.h);
}
$("expRootA").onchange=e=>{st.expA.root=+e.target.value;renderExplorer()};
$("expQualA").onchange=e=>{st.expA.q=e.target.value;renderExplorer()};
$("expRootB").onchange=e=>{st.expB.root=+e.target.value;renderExplorer()};
$("expQualB").onchange=e=>{st.expB.q=e.target.value;renderExplorer()};
$("expPlayA").onclick=()=>AudioEngine.previewChord(qualByKey(st.expA.q).iv,st.expA.root,st.instrument);
$("expPlayB").onclick=()=>AudioEngine.previewChord(qualByKey(st.expB.q).iv,st.expB.root,st.instrument);
$("expPlayBoth").onclick=()=>{
  AudioEngine.playProgression([
    {iv:qualByKey(st.expA.q).iv,root:st.expA.root},
    {iv:qualByKey(st.expB.q).iv,root:st.expB.root}
  ],{bpm:st.bpm,timeSigBeats:4,drumStyle:"none",instrument:st.instrument,loop:false});
};
$("expAddA").onclick=()=>addCustomChord(st.expA.root,st.expA.q);
$("expAddB").onclick=()=>addCustomChord(st.expB.root,st.expB.q);

/* ---------- saved progressions ---------- */
function loadLibrary(){try{return JSON.parse(localStorage.getItem("jrock-pm-library")||"[]")}catch(e){return[]}}
function saveLibrary(arr){try{localStorage.setItem("jrock-pm-library",JSON.stringify(arr))}catch(e){}}
function renderSavedList(){
  const lib=loadLibrary(),el=$("savedList");
  if(!lib.length){el.innerHTML=`<div class="empty">No saved progressions yet — build one above and tap "Save current".</div>`;return}
  el.innerHTML=lib.slice().reverse().map(item=>`
    <div class="savedItem" data-id="${item.id}">
      <div style="flex:1">
        <div class="name">${item.name}</div>
        <div class="meta">${item.key} · ${item.prog.length} chords · ${new Date(item.createdAt).toLocaleDateString()}</div>
      </div>
      <button data-act="load">Load</button>
      <button data-act="del" class="danger">Delete</button>
    </div>`).join("");
}
$("saveBtn").onclick=()=>{
  if(!st.prog.length)return toast("Nothing to save yet");
  const name=($("saveName").value||"").trim()||`Progression ${new Date().toLocaleDateString()}`;
  const lib=loadLibrary();
  lib.push({id:Date.now(),name,key:st.key,prog:JSON.parse(JSON.stringify(st.prog)),timeSigIdx:st.timeSigIdx,drumStyle:st.drumStyle,instrument:st.instrument,bpm:st.bpm,createdAt:Date.now()});
  saveLibrary(lib);$("saveName").value="";renderSavedList();toast("Saved");
};
$("savedList").addEventListener("click",e=>{
  const row=e.target.closest(".savedItem");if(!row)return;
  const id=+row.dataset.id,act=e.target.dataset.act;if(!act)return;
  let lib=loadLibrary();const item=lib.find(x=>x.id===id);if(!item)return;
  if(act==="load"){
    snap();
    st.key=item.key;st.prog=JSON.parse(JSON.stringify(item.prog));st.sel=null;
    if(item.timeSigIdx!=null)st.timeSigIdx=item.timeSigIdx;
    if(item.drumStyle)st.drumStyle=item.drumStyle;
    if(item.instrument)st.instrument=item.instrument;
    if(item.bpm)st.bpm=item.bpm;
    $("bpm").value=st.bpm;$("bpmv").textContent=st.bpm;
    renderKey();renderTimeSig();renderDrum();renderInstrument();render();
    toast(`Loaded "${item.name}"`);
  }else if(act==="del"){
    lib=lib.filter(x=>x.id!==id);saveLibrary(lib);renderSavedList();toast("Deleted");
  }
});

/* ---------- studies: Kessoku Band ---------- */
function songChordRoot(song,c){return c.custom?((c.root%12)+12)%12:(KEYPC[song.key]+DEG[c.d].off)%12}
function songChordIv(c){return c.custom?qualByKey(c.q).iv:VARS[c.d][c.v].iv}
function songToPlayable(song,c){return{iv:songChordIv(c),root:songChordRoot(song,c)}}
function songMelodyAbs(song){
  if(!song.melody)return null;
  const base=60+KEYPC[song.key];
  return song.melody.map(bar=>bar.map(nt=>({b:nt.b,midi:base+nt.m,len:nt.len,vel:nt.vel})));
}
let melodyOn=true,playingSongIdx=-1;
function renderSongs(){
  $("songsList").innerHTML=KESSOKU_SONGS.map((song,i)=>`
    <div class="songCard">
      <div class="t">${song.n}</div>
      <div class="jp">${song.jp} · key of ${song.key}</div>
      <div class="d">${song.d}</div>
      <div class="row">
        <button data-i="${i}" data-act="play" class="${playingSongIdx===i?"on":""}">${playingSongIdx===i?"■ Stop":"▶ Play"}</button>
        <button data-i="${i}" data-act="load" class="primary">Load into builder</button>
      </div>
    </div>`).join("");
}
$("songsList").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  const i=+b.dataset.i,song=KESSOKU_SONGS[i];
  if(b.dataset.act==="play"){
    if(playingSongIdx===i){AudioEngine.stop();playingSongIdx=-1;renderSongs();return}
    stopPlay();
    const chords=song.p.map(c=>songToPlayable(song,c));
    const melody=melodyOn?songMelodyAbs(song):null;
    playingSongIdx=i;renderSongs();
    AudioEngine.playProgression(chords,{bpm:st.bpm,timeSigBeats:4,drumStyle:st.drumStyle,instrument:st.instrument,loop:false,melody,
      onDone:()=>{playingSongIdx=-1;renderSongs()}});
    return;
  }
  snap();
  st.key=song.key;st.prog=song.p.map(c=>c.custom?{...c}:{d:c.d,v:c.v});st.sel=null;
  renderKey();render();toast(`Loaded "${song.n}"`);
});
$("melodyToggle").onclick=e=>{melodyOn=!melodyOn;e.currentTarget.classList.toggle("on",melodyOn);e.currentTarget.textContent=melodyOn?"🎵 Melody: on":"🎵 Melody: off"};

/* ---------- mic: listen & detect ---------- */
let micOn=false,micMode="chord";
$("micMode").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  micMode=b.dataset.m;
  document.querySelectorAll("#micMode button").forEach(x=>x.classList.toggle("on",x===b));
  if(micOn){stopMic();startMic()}
});
function startMic(){
  $("micSub").textContent="Listening…";
  const onErr=e=>{toast("Microphone access failed");stopMic()};
  if(micMode==="chord"){
    AudioEngine.startMicChord(res=>{
      $("micReadout").textContent=res?res.name:"…";
      $("micSub").textContent=res?"Closest matching chord from what's coming through the mic.":"Listening for a chord…";
    },onErr);
  }else{
    AudioEngine.startMicPitch(res=>{
      if(res){$("micReadout").textContent=`${res.name}${res.octave}`;$("micSub").textContent=`${res.cents>=0?"+":""}${res.cents} cents from pitch-perfect.`}
      else{$("micReadout").textContent="…";$("micSub").textContent="Listening for a note…"}
    },onErr);
  }
}
function stopMic(){AudioEngine.stopMic();$("micReadout").textContent="—";$("micSub").textContent="Tap start and allow microphone access."}
$("micToggle").onclick=()=>{
  micOn=!micOn;
  $("micToggle").textContent=micOn?"⏹ Stop listening":"🎤 Start listening";
  $("micToggle").classList.toggle("on",micOn);
  if(micOn)startMic();else stopMic();
};

/* ---------- init ---------- */
renderKey();renderTimeSig();renderDrum();renderInstrument();renderPresets();renderSavedList();renderSongs();
$("bpm").value=st.bpm;$("bpmv").textContent=st.bpm;
render();
