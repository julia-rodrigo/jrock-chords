/* ---------- audio engine: instruments, drums, scheduling, mic pitch/chord detection, WAV export ---------- */
const AudioEngine=(()=>{
  let ac=null,master=null,dry=null,wet=null,delay=null,fb=null,comp=null,micStream=null,micAC=null,micAnalyser=null,micRaf=null;
  function ctx(){
    if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)()}
    if(ac.state==="suspended")ac.resume();
    return ac;
  }
  function buildMaster(c,out){
    const m=c.createGain();m.gain.value=.65;
    const d=c.createGain();d.gain.value=1;
    const w=c.createGain();w.gain.value=.16;
    const dl=c.createDelay(1.2);dl.delayTime.value=.27;
    const f=c.createGain();f.gain.value=.34;
    const lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=2600;
    const cp=c.createDynamicsCompressor();cp.threshold.value=-18;cp.ratio.value=2.5;
    m.connect(d);m.connect(w);w.connect(dl);dl.connect(lp);lp.connect(f);f.connect(dl);dl.connect(cp);d.connect(cp);cp.connect(out);
    return{m,d,w,dl,f,lp,cp};
  }
  function getMaster(){
    const c=ctx();
    if(!master){const b=buildMaster(c,c.destination);master=b.m;dry=b.d;wet=b.w;delay=b.dl;fb=b.f;comp=b.cp}
    return master;
  }
  const hz=m=>440*Math.pow(2,(m-69)/12);
  function noiseBuffer(c,len=1){
    const buf=c.createBuffer(1,c.sampleRate*len,c.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    return buf;
  }
  function pan(c,out,v){const p=c.createStereoPanner?c.createStereoPanner():null;if(!p){return out}p.pan.value=Math.max(-1,Math.min(1,v));p.connect(out);return p}

  function guitarNote(c,out,m,t,vel,len,panV){
    const dest=pan(c,out,panV);
    const o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
    o.type="sawtooth";o2.type="triangle";o.frequency.value=hz(m);o2.frequency.value=hz(m)*1.003;
    f.type="lowpass";f.frequency.setValueAtTime(3200,t);f.frequency.exponentialRampToValueAtTime(700,t+len);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vel,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+len);
    o.connect(f);o2.connect(f);f.connect(g);g.connect(dest);
    o.start(t);o2.start(t);o.stop(t+len+.05);o2.stop(t+len+.05);
  }
  function pianoNote(c,out,m,t,vel,len,panV){
    const dest=pan(c,out,panV);
    const o=c.createOscillator(),o2=c.createOscillator(),o3=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
    o.type="triangle";o2.type="sine";o3.type="sine";
    o.frequency.value=hz(m);o2.frequency.value=hz(m)*2.0;o3.frequency.value=hz(m)*4.0;
    f.type="lowpass";f.frequency.setValueAtTime(5200,t);f.frequency.exponentialRampToValueAtTime(1100,t+len*.8);
    const g2=c.createGain();g2.gain.value=.14;const g3=c.createGain();g3.gain.value=.05;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vel,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+len);
    o.connect(f);o2.connect(g2);g2.connect(f);o3.connect(g3);g3.connect(f);f.connect(g);g.connect(dest);
    o.start(t);o2.start(t);o3.start(t);o.stop(t+len+.05);o2.stop(t+len+.05);o3.stop(t+len+.05);
  }
  function padNote(c,out,m,t,vel,len,panV){
    const dest=pan(c,out,panV);
    const o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
    o.type="sawtooth";o2.type="sawtooth";o.frequency.value=hz(m);o2.frequency.value=hz(m)*1.006;
    f.type="lowpass";f.frequency.setValueAtTime(400,t);f.frequency.linearRampToValueAtTime(1800,t+len*.5);f.frequency.linearRampToValueAtTime(300,t+len);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vel*.7,t+len*.35);g.gain.linearRampToValueAtTime(.0001,t+len);
    o.connect(f);o2.connect(f);f.connect(g);g.connect(dest);
    o.start(t);o2.start(t);o.stop(t+len+.1);o2.stop(t+len+.1);
  }
  function leadNote(c,out,m,t,vel,len,panV=0){
    const dest=pan(c,out,panV);
    const o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
    o.type="sine";o2.type="triangle";
    const freq=hz(m);o.frequency.setValueAtTime(freq,t);o2.frequency.setValueAtTime(freq,t);
    const lfo=c.createOscillator(),lfoGain=c.createGain();
    lfo.type="sine";lfo.frequency.value=5.5;lfoGain.gain.value=freq*.012;
    lfo.connect(lfoGain);lfoGain.connect(o.frequency);lfoGain.connect(o2.frequency);
    f.type="lowpass";f.frequency.setValueAtTime(2400,t);f.frequency.exponentialRampToValueAtTime(1100,t+len);
    const og2=c.createGain();og2.gain.value=.3;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vel,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+len);
    o.connect(f);o2.connect(og2);og2.connect(f);f.connect(g);g.connect(dest);
    lfo.start(t);o.start(t);o2.start(t);
    lfo.stop(t+len+.08);o.stop(t+len+.08);o2.stop(t+len+.08);
  }
  function bassNote(c,out,m,t,len,panV=0){
    const dest=pan(c,out,panV);
    const o=c.createOscillator(),g=c.createGain();o.type="triangle";o.frequency.value=hz(m);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.32,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+len);
    o.connect(g);g.connect(dest);o.start(t);o.stop(t+len+.05);
  }
  function playInstrumentNote(instrument,c,out,m,t,vel,len,panV){
    if(instrument==="piano")return pianoNote(c,out,m,t,vel,len,panV);
    if(instrument==="pad")return padNote(c,out,m,t,vel,len,panV);
    return guitarNote(c,out,m,t,vel,len,panV);
  }
  function strum(c,out,notes,t,up,vel,len,instrument){
    const ns=up?[...notes].reverse():notes;
    ns.forEach((n,i)=>{
      const panV=(i/(Math.max(1,ns.length-1))-.5)*.7;
      playInstrumentNote(instrument,c,out,n,t+i*(instrument==="piano"?.006:.018),vel/Math.sqrt(notes.length),len,panV);
    });
  }
  function kick(c,out,t){
    const o=c.createOscillator(),g=c.createGain();o.type="sine";
    o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.11);
    g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);
    o.connect(g);g.connect(out);o.start(t);o.stop(t+.25);
  }
  function snare(c,out,t){
    const buf=noiseBuffer(c,.3),src=c.createBufferSource();src.buffer=buf;
    const bp=c.createBiquadFilter();bp.type="bandpass";bp.frequency.value=1800;bp.Q.value=.8;
    const g=c.createGain();g.gain.setValueAtTime(.55,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);
    src.connect(bp);bp.connect(g);g.connect(out);src.start(t);src.stop(t+.16);
    const o=c.createOscillator(),og=c.createGain();o.type="triangle";o.frequency.value=190;
    og.gain.setValueAtTime(.3,t);og.gain.exponentialRampToValueAtTime(.001,t+.08);
    o.connect(og);og.connect(out);o.start(t);o.stop(t+.09);
  }
  function hihat(c,out,t,open){
    const buf=noiseBuffer(c,.3),src=c.createBufferSource();src.buffer=buf;
    const hp=c.createBiquadFilter();hp.type="highpass";hp.frequency.value=7000;
    const g=c.createGain();const len=open?.28:.06;
    g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+len);
    src.connect(hp);hp.connect(g);g.connect(out);src.start(t);src.stop(t+len+.02);
  }
  function drumHit(c,out,type,t){
    if(type==="kick")kick(c,out,t);else if(type==="snare")snare(c,out,t);else hihat(c,out,t,false);
  }

  function voicingNotes(iv,rootPc){let root=48+(((rootPc%12)+12)%12);if(root>53)root-=12;return iv.map(i=>root+i+12)}

  let timers=[],playing=false,playHandlers={},sessionGain=null;
  function stop(){
    playing=false;timers.forEach(clearTimeout);timers=[];
    if(sessionGain){
      try{
        const c=ctx(),now=c.currentTime,g=sessionGain;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value,now);
        g.gain.linearRampToValueAtTime(0,now+.03);
        setTimeout(()=>{try{g.disconnect()}catch(e){}},80);
      }catch(e){}
      sessionGain=null;
    }
    if(playHandlers.onStop)playHandlers.onStop();
  }
  function isPlaying(){return playing}

  function previewChord(iv,rootPc,instrument){
    try{
      const c=ctx(),out=getMaster();
      const t=c.currentTime+.02,notes=voicingNotes(iv,rootPc);
      strum(c,out,notes,t,false,.5,1.4,instrument);
      bassNote(c,out,notes[0]-12,t,1.2);
    }catch(e){}
  }

  function playProgression(chords,opts){
    stop();
    const c=ctx(),master=getMaster();
    const out=c.createGain();out.gain.value=1;out.connect(master);
    sessionGain=out;
    playing=true;playHandlers=opts;
    const beat=60/opts.bpm,n=opts.timeSigBeats||4,bar=beat*n;
    const strumPat=buildStrumPattern(n),drums=buildDrumPattern(opts.drumStyle||"none",n);
    function schedule(start){
      chords.forEach((ch,i)=>{
        const t0=start+i*bar,notes=voicingNotes(ch.iv,ch.root);
        strumPat.forEach(([b,up,v])=>{if(b<n)strum(c,out,notes,t0+b*beat,!!up,v,beat*1.1,opts.instrument)});
        bassNote(c,out,notes[0]-12,t0,beat*Math.min(2,n));
        if(n>2)bassNote(c,out,notes[0]-12,t0+Math.floor(n/2)*beat,beat*Math.min(2,n));
        drums.kick.forEach(b=>drumHit(c,out,"kick",t0+b*beat));
        drums.snare.forEach(b=>drumHit(c,out,"snare",t0+b*beat));
        drums.hihat.forEach(b=>drumHit(c,out,"hihat",t0+b*beat));
        if(opts.melody&&opts.melody[i])opts.melody[i].forEach(nt=>{if(nt.b<n)leadNote(c,out,nt.midi,t0+nt.b*beat,nt.vel||.5,nt.len*beat,0)});
        timers.push(setTimeout(()=>{if(playing&&opts.onBeat)opts.onBeat(i)},Math.max(0,(t0-c.currentTime)*1000)));
      });
      const end=start+chords.length*bar;
      timers.push(setTimeout(()=>{
        if(!playing)return;
        if(opts.loop&&chords.length)schedule(end);
        else timers.push(setTimeout(()=>{playing=false;if(opts.onDone)opts.onDone()},400));
      },Math.max(0,(end-c.currentTime-.3)*1000)));
    }
    schedule(c.currentTime+.08);
  }

  /* ---- offline render -> WAV blob (for download) ---- */
  async function renderToWavBlob(chords,opts){
    const beat=60/opts.bpm,n=opts.timeSigBeats||4,bar=beat*n,total=Math.max(1,chords.length)*bar+1.5;
    const sr=44100,oc=new OfflineAudioContext(2,Math.ceil(total*sr),sr);
    const b=buildMaster(oc,oc.destination);
    const strumPat=buildStrumPattern(n),drums=buildDrumPattern(opts.drumStyle||"none",n);
    chords.forEach((ch,i)=>{
      const t0=i*bar,notes=voicingNotes(ch.iv,ch.root);
      strumPat.forEach(([beatOff,up,v])=>{if(beatOff<n)strum(oc,b.m,notes,t0+beatOff*beat,!!up,v,beat*1.1,opts.instrument)});
      bassNote(oc,b.m,notes[0]-12,t0,beat*Math.min(2,n));
      if(n>2)bassNote(oc,b.m,notes[0]-12,t0+Math.floor(n/2)*beat,beat*Math.min(2,n));
      drums.kick.forEach(beatOff=>drumHit(oc,b.m,"kick",t0+beatOff*beat));
      drums.snare.forEach(beatOff=>drumHit(oc,b.m,"snare",t0+beatOff*beat));
      drums.hihat.forEach(beatOff=>drumHit(oc,b.m,"hihat",t0+beatOff*beat));
    });
    const rendered=await oc.startRendering();
    return encodeWav(rendered);
  }
  function encodeWav(buf){
    const numCh=buf.numberOfChannels,len=buf.length,sr=buf.sampleRate;
    const bytesPerSample=2,blockAlign=numCh*bytesPerSample;
    const dataSize=len*blockAlign,bufferLen=44+dataSize;
    const ab=new ArrayBuffer(bufferLen),view=new DataView(ab);
    function ws(o,s){for(let i=0;i<s.length;i++)view.setUint8(o+i,s.charCodeAt(i))}
    ws(0,"RIFF");view.setUint32(4,36+dataSize,true);ws(8,"WAVE");ws(12,"fmt ");
    view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,numCh,true);
    view.setUint32(24,sr,true);view.setUint32(28,sr*blockAlign,true);
    view.setUint16(32,blockAlign,true);view.setUint16(34,16,true);ws(36,"data");view.setUint32(40,dataSize,true);
    const chans=[];for(let c=0;c<numCh;c++)chans.push(buf.getChannelData(c));
    let off=44;
    for(let i=0;i<len;i++){
      for(let c=0;c<numCh;c++){
        let s=Math.max(-1,Math.min(1,chans[c][i]));
        view.setInt16(off,s<0?s*0x8000:s*0x7fff,true);off+=2;
      }
    }
    return new Blob([ab],{type:"audio/wav"});
  }

  /* ---- mic pitch (single note / singing) + chord (chroma) detection, best-effort ---- */
  const NOTE_NAMES=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  function freqToNote(f){
    if(!f||f<=0)return null;
    const midi=69+12*Math.log2(f/440),r=Math.round(midi),cents=Math.round((midi-r)*100);
    return{name:NOTE_NAMES[((r%12)+12)%12],octave:Math.floor(r/12)-1,cents,freq:f};
  }
  function autocorrelate(buf,sampleRate){
    let SIZE=buf.length,rms=0;
    for(let i=0;i<SIZE;i++)rms+=buf[i]*buf[i];
    rms=Math.sqrt(rms/SIZE);
    if(rms<0.01)return -1;
    let r1=0,r2=SIZE-1,thresh=.2;
    for(let i=0;i<SIZE/2;i++)if(Math.abs(buf[i])<thresh){r1=i;break}
    for(let i=1;i<SIZE/2;i++)if(Math.abs(buf[SIZE-i])<thresh){r2=SIZE-i;break}
    const buf2=buf.slice(r1,r2),SIZE2=buf2.length;
    const c=new Array(SIZE2).fill(0);
    for(let i=0;i<SIZE2;i++)for(let j=0;j<SIZE2-i;j++)c[i]+=buf2[j]*buf2[j+i];
    let d=0;while(d<SIZE2-1&&c[d]>c[d+1])d++;
    let maxval=-1,maxpos=-1;
    for(let i=d;i<SIZE2;i++)if(c[i]>maxval){maxval=c[i];maxpos=i}
    let T0=maxpos;
    if(T0<=0)return -1;
    const x1=c[T0-1]||c[T0],x2=c[T0],x3=c[T0+1]||c[T0];
    const a=(x1+x3-2*x2)/2,bb=(x3-x1)/2;
    if(a)T0=T0-bb/(2*a);
    return sampleRate/T0;
  }
  function startMicPitch(onResult,onError){
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
      micStream=stream;micAC=new (window.AudioContext||window.webkitAudioContext)();
      const src=micAC.createMediaStreamSource(stream);
      micAnalyser=micAC.createAnalyser();micAnalyser.fftSize=2048;
      src.connect(micAnalyser);
      const buf=new Float32Array(micAnalyser.fftSize);
      function tick(){
        micAnalyser.getFloatTimeDomainData(buf);
        const f=autocorrelate(buf,micAC.sampleRate);
        onResult(f>0?freqToNote(f):null);
        micRaf=requestAnimationFrame(tick);
      }
      tick();
    }).catch(e=>onError&&onError(e));
  }
  const CHORD_TEMPLATES=[
   {q:"",iv:[0,4,7]},{q:"m",iv:[0,3,7]},{q:"7",iv:[0,4,7,10]},{q:"m7",iv:[0,3,7,10]},
   {q:"maj7",iv:[0,4,7,11]},{q:"sus2",iv:[0,2,7]},{q:"sus4",iv:[0,5,7]},{q:"dim",iv:[0,3,6]}
  ];
  function startMicChord(onResult,onError){
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
      micStream=stream;micAC=new (window.AudioContext||window.webkitAudioContext)();
      const src=micAC.createMediaStreamSource(stream);
      micAnalyser=micAC.createAnalyser();micAnalyser.fftSize=8192;micAnalyser.smoothingTimeConstant=.7;
      src.connect(micAnalyser);
      const data=new Float32Array(micAnalyser.frequencyBinCount);
      function tick(){
        micAnalyser.getFloatFrequencyData(data);
        const chroma=new Array(12).fill(0);
        const sr=micAC.sampleRate,binHz=sr/micAnalyser.fftSize;
        for(let i=1;i<data.length;i++){
          const freq=i*binHz;if(freq<60||freq>2000)continue;
          const db=data[i];if(db<-85)continue;
          const mag=Math.pow(10,db/20);
          const pc=((Math.round(12*Math.log2(freq/440)+69))%12+12)%12;
          chroma[pc]+=mag;
        }
        const total=chroma.reduce((a,b)=>a+b,0);
        if(total<1e-6){onResult(null);micRaf=requestAnimationFrame(tick);return}
        const norm=chroma.map(v=>v/total);
        let best=null,bestScore=-1;
        for(let root=0;root<12;root++){
          CHORD_TEMPLATES.forEach(tmpl=>{
            let score=0;
            tmpl.iv.forEach(iv=>score+=norm[(root+iv)%12]);
            score-=(tmpl.iv.length<norm.length?0:0);
            if(score>bestScore){bestScore=score;best={root,q:tmpl.q}}
          });
        }
        onResult(best?{name:NOTE_NAMES[best.root]+(qualByKey(best.q)?qualByKey(best.q).suf:best.q),root:best.root,q:best.q,confidence:bestScore}:null);
        micRaf=requestAnimationFrame(tick);
      }
      tick();
    }).catch(e=>onError&&onError(e));
  }
  function stopMic(){
    if(micRaf)cancelAnimationFrame(micRaf);micRaf=null;
    if(micStream)micStream.getTracks().forEach(t=>t.stop());micStream=null;
    if(micAC)try{micAC.close()}catch(e){}
    micAC=null;micAnalyser=null;
  }

  return{ctx,getMaster,hz,previewChord,playProgression,stop,isPlaying,renderToWavBlob,
    startMicPitch,startMicChord,stopMic,voicingNotes};
})();
