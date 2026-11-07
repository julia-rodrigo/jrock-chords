/* ---------- chord diagrams (movable barre shapes, root always on the low-E string) ---------- */
// offsets are frets ABOVE the barre fret, per string low-E..high-e; null = muted string.
// Every shape is derived from real open-position CAGED chords (E-family) so it stays a genuine,
// playable bar chord that just slides up/down the neck for every root and key.
const SHAPES={
 "":      [0,2,2,1,0,0],   // E major shape
 "m":     [0,2,2,0,0,0],   // E minor shape
 "7":     [0,2,0,1,0,0],   // E7 shape
 "m7":    [0,2,0,0,0,0],   // Em7 shape
 "maj7":  [0,2,1,1,0,0],   // Emaj7 shape
 "6":     [0,2,2,1,2,0],
 "add9":  [0,2,2,1,0,2],
 "sus2":  [0,2,2,null,0,2],
 "sus4":  [0,2,2,2,0,0],   // Esus4 shape
 "7sus4": [0,2,0,2,0,0],
 "maj7(9)":[0,2,1,1,0,2],
 "m9":    [0,2,0,0,0,2],
 "m7(11)":[0,0,0,0,0,0],   // plain full barre - the classic one-finger "m11/sus" sound
 "m7♭5":  [0,1,0,0,null,0],
 "dim":   [0,1,null,0,null,0]
};
function diagramSizePx(size){return {sm:{w:34,h:42},md:{w:46,h:56},lg:{w:66,h:80},xl:{w:92,h:112}}[size]||{w:46,h:56}}
function chordDiagramSVG(rootPc,key,color,w,h){
  const shape=SHAPES[key];
  if(!shape)return "";
  const N=((rootPc-4)%12+12)%12;
  const x=i=>12+i*10, fretY=k=>16+13*k;
  let s=`<svg viewBox="0 0 70 86" width="${w}" height="${h}">`;
  if(N===0){
    s+=`<line x1="9" y1="16" x2="63" y2="16" stroke="currentColor" stroke-width="3"/>`;
  }else{
    s+=`<text x="2" y="14" font-size="8" fill="currentColor" opacity=".75">${N}fr</text>`;
    s+=`<line x1="9" y1="16" x2="63" y2="16" stroke="currentColor" stroke-width="1" opacity=".7"/>`;
  }
  for(let k=1;k<=4;k++)s+=`<line x1="9" y1="${fretY(k)}" x2="63" y2="${fretY(k)}" stroke="currentColor" stroke-width="1" opacity=".5"/>`;
  for(let i=0;i<6;i++)s+=`<line x1="${x(i)}" y1="16" x2="${x(i)}" y2="68" stroke="currentColor" stroke-width="1" opacity=".5"/>`;
  shape.forEach((off,i)=>{if(off===null)s+=`<text x="${x(i)}" y="9" font-size="9" text-anchor="middle" fill="currentColor" opacity=".65">×</text>`});
  const zeroIdx=shape.map((o,i)=>o===0?i:-1).filter(i=>i>=0);
  if(zeroIdx.length>=2){
    const bx1=x(Math.min(...zeroIdx))-5,bx2=x(Math.max(...zeroIdx))+5;
    s+=`<rect x="${bx1}" y="${fretY(0)+2}" width="${bx2-bx1}" height="11" rx="5.5" fill="${color}" opacity=".9"/>`;
  }
  shape.forEach((off,i)=>{
    if(off===null)return;
    const cy=fretY(off)+6.5;
    s+=`<circle cx="${x(i)}" cy="${cy}" r="5" fill="${color}" stroke="#19130f" stroke-width="1"/>`;
  });
  s+="</svg>";
  return s;
}

/* ---------- piano keyboard diagrams: same chord tones, shown as a highlighted one-octave keyboard ---------- */
const PIANO_WHITES=[0,2,4,5,7,9,11];
const PIANO_BLACKS=[{after:0,pc:1},{after:1,pc:3},{after:3,pc:6},{after:4,pc:8},{after:5,pc:10}];
function pianoChordSVG(rootPc,iv,color,w,h){
  const root=((rootPc%12)+12)%12;
  const chordPcs=new Set((iv||[0,4,7]).map(i=>((root+i)%12+12)%12));
  const WW=w/7,WH=h,BW=WW*.62,BH=h*.62,labelOk=w>=60;
  let s=`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;
  PIANO_WHITES.forEach((pc,i)=>{
    const x=i*WW,on=chordPcs.has(pc);
    s+=`<rect x="${x}" y="0" width="${WW}" height="${WH}" fill="${on?color:'#f5ebe0'}" stroke="#19130f" stroke-width="1"/>`;
    if(on&&labelOk)s+=`<text x="${x+WW/2}" y="${WH-8}" text-anchor="middle" font-size="9" fill="#19130f" font-weight="700">${pc===root?"R":""}</text>`;
  });
  PIANO_BLACKS.forEach(({after,pc})=>{
    const x=(after+1)*WW-BW/2,on=chordPcs.has(pc);
    s+=`<rect x="${x}" y="0" width="${BW}" height="${BH}" rx="1.5" fill="${on?color:'#19130f'}" stroke="#19130f" stroke-width="1"/>`;
    if(on&&labelOk&&pc===root)s+=`<text x="${x+BW/2}" y="${BH-6}" text-anchor="middle" font-size="8" fill="#f5ebe0" font-weight="700">R</text>`;
  });
  s+="</svg>";
  return s;
}
function chordOrPianoSVG(mode,rootPc,shapeKey,iv,color,w,h){
  return mode==="piano"?pianoChordSVG(rootPc,iv,color,w,h):chordDiagramSVG(rootPc,shapeKey,color,w,h);
}
