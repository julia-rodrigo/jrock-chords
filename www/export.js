/* ---------- export: save/share files, copy, chord-sheet picture, MIDI, MusicXML sheet music ---------- */

function isNativeApp(){const c=window.Capacitor;return !!(c&&c.isNativePlatform&&c.isNativePlatform())}

function blobToBase64(blob){
  return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(",")[1]);r.onerror=rej;r.readAsDataURL(blob)});
}

// In the Android app, write the file to the app cache and open the share sheet (Save to Files,
// Drive, send…). In a browser, fall back to a normal download link.
async function saveFile(blob,filename){
  const P=window.Capacitor&&window.Capacitor.Plugins;
  if(isNativeApp()&&P&&P.Filesystem&&P.Share){
    const data=await blobToBase64(blob);
    const r=await P.Filesystem.writeFile({path:filename,data,directory:"CACHE"});
    try{await P.Share.share({title:filename,files:[r.uri],dialogTitle:"Save or send "+filename})}
    catch(e){if(!/cancel/i.test(String(e&&e.message||e)))throw e}
    return;
  }
  downloadBlob(blob,filename);
}

async function copyText(text){
  try{await navigator.clipboard.writeText(text);return true}catch(e){}
  const P=window.Capacitor&&window.Capacitor.Plugins;
  if(P&&P.Clipboard){try{await P.Clipboard.write({string:text});return true}catch(e){}}
  return false;
}

function progTitle(){return `Key of ${st.key} · ${TIME_SIGS[st.timeSigIdx].label} · ${st.bpm} BPM`}
function chordNameOf(c){return c.custom?chordTop(c):cn(c)}
function chordRomanOf(c){return c.custom?"custom":rn(c)}
function progNamesText(){
  const withLen=c=>c.len!=null?` (${lenLabel(c.len)})`:"";
  return `${progTitle()}\n${st.prog.map(c=>chordNameOf(c)+withLen(c)).join(" – ")}\n${st.prog.map(chordRomanOf).join(" – ")}`;
}

/* ---- chord-sheet picture: every chord with its name, numeral, length and diagram ---- */
function svgToImage(svg){
  const s=svg.replace("<svg ",'<svg xmlns="http://www.w3.org/2000/svg" ').replace(/currentColor/g,"#2a211b");
  const img=new Image();
  return new Promise((res,rej)=>{img.onload=()=>res(img);img.onerror=rej;img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s)});
}
async function chordSheetPNG(){
  const cols=4,cw=250,ch=330,pad=50,head=150;
  const rows=Math.max(1,Math.ceil(st.prog.length/cols));
  const W=pad*2+cols*cw,H=head+rows*ch+pad;
  const cv=document.createElement("canvas");cv.width=W;cv.height=H;
  const g=cv.getContext("2d");
  g.fillStyle="#fbf7f2";g.fillRect(0,0,W,H);
  g.fillStyle="#2a211b";g.font="700 44px Lexend, system-ui, sans-serif";g.fillText("J-Rock progression",pad,pad+38);
  g.fillStyle="#7a5b40";g.font="500 26px Lexend, system-ui, sans-serif";g.fillText(progTitle(),pad,pad+84);
  const piano=st.diagramMode==="piano";
  for(let i=0;i<st.prog.length;i++){
    const c=st.prog[i],x=pad+(i%cols)*cw,y=head+Math.floor(i/cols)*ch;
    g.strokeStyle="#e2d6c8";g.lineWidth=2;g.strokeRect(x+6,y+6,cw-12,ch-12);
    g.textAlign="center";
    g.fillStyle=chordFamHexOf(c)==="#c9a383"?"#8a6a4f":chordFamHexOf(c);
    g.font="700 40px Lexend, system-ui, sans-serif";g.fillText(chordNameOf(c),x+cw/2,y+58);
    g.fillStyle="#7a5b40";g.font="500 22px Lexend, system-ui, sans-serif";
    g.fillText(chordRomanOf(c)+(c.len!=null?" · "+lenLabel(c.len):""),x+cw/2,y+90);
    const dw=piano?210:160,dh=piano?120:196;
    const svg=chordOrPianoSVG(st.diagramMode,chordRoot(c),chordShapeKey(c),chordIv(c),chordFamHexOf(c),dw,dh);
    try{const img=await svgToImage(svg);g.drawImage(img,x+(cw-dw)/2,y+110+(piano?40:0),dw,dh)}catch(e){}
    g.textAlign="left";
  }
  return new Promise(res=>cv.toBlob(res,"image/png"));
}

/* ---- MIDI: one track, chords on channel 1, bass on channel 2 ---- */
function timeSigParts(){const[n,d]=TIME_SIGS[st.timeSigIdx].label.split("/").map(Number);return{n,d}}
function vlq(v){const out=[v&0x7f];while((v>>=7))out.unshift((v&0x7f)|0x80);return out}
function buildMidi(){
  const{n,d}=timeSigParts(),ppq=480,bt=ppq*4/d;
  const prog={guitar:25,piano:0,pad:89}[st.instrument]??25;
  const ev=[];// [tick, order, bytes]
  const usPerQuarter=Math.round(60e6/st.bpm*d/4);
  ev.push([0,0,[0xff,0x51,3,(usPerQuarter>>16)&255,(usPerQuarter>>8)&255,usPerQuarter&255]]);
  ev.push([0,0,[0xff,0x58,4,n,Math.log2(d),24,8]]);
  ev.push([0,1,[0xc0,prog]]);ev.push([0,1,[0xc1,33]]);
  let t=0;
  st.prog.forEach(c=>{
    const L=c.len!=null?c.len:n,dur=Math.round(L*bt),notes=AudioEngine.voicingNotes(chordIv(c),chordRoot(c));
    notes.forEach(m=>{ev.push([t,3,[0x90,m,80]]);ev.push([t+dur,2,[0x80,m,0]])});
    ev.push([t,3,[0x91,notes[0]-12,90]]);ev.push([t+dur,2,[0x81,notes[0]-12,0]]);
    t+=dur;
  });
  ev.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const body=[];let last=0;
  ev.forEach(([tick,,bytes])=>{body.push(...vlq(tick-last),...bytes);last=tick});
  body.push(0,0xff,0x2f,0);
  const len=body.length;
  const bytes=[0x4d,0x54,0x68,0x64,0,0,0,6,0,0,0,1,(ppq>>8)&255,ppq&255,
    0x4d,0x54,0x72,0x6b,(len>>>24)&255,(len>>16)&255,(len>>8)&255,len&255,...body];
  return new Blob([new Uint8Array(bytes)],{type:"audio/midi"});
}

/* ---- MusicXML sheet music: chord symbols over block chords, opens in MuseScore, Flat, Finale… ---- */
const KEY_FIFTHS={C:0,G:1,D:2,A:3,E:4,F:-1,"B♭":-2,"E♭":-3};
const HARMONY_KIND={"":["major",""],"m":["minor","m"],"7":["dominant","7"],"m7":["minor-seventh","m7"],
  "maj7":["major-seventh","maj7"],"6":["major-sixth","6"],"add9":["major","add9"],"sus2":["suspended-second","sus2"],
  "sus4":["suspended-fourth","sus4"],"7sus4":["suspended-fourth","7sus4"],"maj7(9)":["major-ninth","maj9"],
  "m9":["minor-ninth","m9"],"m7(11)":["minor-11th","m11"],"m7♭5":["half-diminished","m7b5"],"dim":["diminished","dim"]};
function spell(pc){
  const flat=KEY_FIFTHS[st.key]<0;
  const S=[["C",0],["C",1],["D",0],["D",1],["E",0],["F",0],["F",1],["G",0],["G",1],["A",0],["A",1],["B",0]];
  const F=[["C",0],["D",-1],["D",0],["E",-1],["E",0],["F",0],["G",-1],["G",0],["A",-1],["A",0],["B",-1],["B",0]];
  return (flat?F:S)[((pc%12)+12)%12];
}
function xmlEsc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function buildMusicXML(){
  const{n,d}=timeSigParts(),bd=16/d,measureDiv=n*bd;
  const VALS=[[16,"whole",0],[12,"half",1],[8,"half",0],[6,"quarter",1],[4,"quarter",0],[3,"eighth",1],[2,"eighth",0],[1,"16th",0]];
  const split=v=>{const out=[];for(const[val,type,dot]of VALS)while(v>=val){out.push([val,type,dot]);v-=val}return out};
  const pitchXml=m=>{const[st_,alt]=spell(m);return`<pitch><step>${st_}</step>${alt?`<alter>${alt}</alter>`:""}<octave>${Math.floor(m/12)-1}</octave></pitch>`};
  const measures=[];let cur=[],fill=0;
  const pushMeasureIfFull=()=>{if(fill===measureDiv){measures.push(cur);cur=[];fill=0}};
  st.prog.forEach(c=>{
    const notes=AudioEngine.voicingNotes(chordIv(c),chordRoot(c));
    let left=Math.round((c.len!=null?c.len:n)*bd),first=true;
    const[rs,ra]=spell(chordRoot(c)),[kind,text]=HARMONY_KIND[chordShapeKey(c)]||["major",""];
    const harmony=`<harmony><root><root-step>${rs}</root-step>${ra?`<root-alter>${ra}</root-alter>`:""}</root><kind text="${xmlEsc(text)}">${kind}</kind></harmony>`;
    while(left>0){
      const take=Math.min(left,measureDiv-fill);
      const pieces=split(take);
      pieces.forEach(([val,type,dot],pi)=>{
        const tieStart=!(left-take===0&&pi===pieces.length-1),tieStop=!first;
        if(first)cur.push(harmony);
        notes.forEach((m,ni)=>{
          cur.push(`<note>${ni?"<chord/>":""}${pitchXml(m)}<duration>${val}</duration>${tieStop?'<tie type="stop"/>':""}${tieStart?'<tie type="start"/>':""}<type>${type}</type>${dot?"<dot/>":""}${tieStop||tieStart?`<notations>${tieStop?'<tied type="stop"/>':""}${tieStart?'<tied type="start"/>':""}</notations>`:""}</note>`);
        });
        first=false;fill+=val;
      });
      left-=take;pushMeasureIfFull();
    }
  });
  if(fill>0){split(measureDiv-fill).forEach(([val,type,dot])=>cur.push(`<note><rest/><duration>${val}</duration><type>${type}</type>${dot?"<dot/>":""}</note>`));measures.push(cur)}
  if(!measures.length)measures.push([`<note><rest measure="yes"/><duration>${measureDiv}</duration></note>`]);
  const attrs=`<attributes><divisions>4</divisions><key><fifths>${KEY_FIFTHS[st.key]||0}</fifths></key><time><beats>${n}</beats><beat-type>${d}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`
    +`<direction placement="above"><direction-type><metronome><beat-unit>${d===8?"eighth":"quarter"}</beat-unit><per-minute>${st.bpm}</per-minute></metronome></direction-type><sound tempo="${Math.round(st.bpm*4/d)}"/></direction>`;
  const body=measures.map((m,i)=>`<measure number="${i+1}">${i===0?attrs:""}${m.join("")}</measure>`).join("\n");
  const xml=`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0"><work><work-title>${xmlEsc("J-Rock progression — "+progTitle())}</work-title></work>
<part-list><score-part id="P1"><part-name>Chords</part-name></score-part></part-list>
<part id="P1">
${body}
</part></score-partwise>`;
  return new Blob([xml],{type:"application/vnd.recordare.musicxml+xml"});
}
