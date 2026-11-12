/* ---------- static data: scale degrees, voicings, theory tables, presets, time/drum/instrument config ---------- */
const DEG=[
 {r:"I",off:0,f:"T",base:0},
 {r:"II",off:2,f:"S",base:2.3},
 {r:"III",off:4,f:"T",base:1.5},
 {r:"IV",off:5,f:"S",base:2},
 {r:"V",off:7,f:"D",base:3.2},
 {r:"VI",off:9,f:"T",base:1},
 {r:"VII",off:11,f:"D",base:3.6}
];
const V=(rn,cn,iv,t=0)=>({rn,cn,iv,t});
const VARS=[
 [V("","",[0,4,7]),V("maj7","maj7",[0,4,7,11],.2),V("add9","add9",[0,4,7,14],.1),V("6","6",[0,4,7,9]),V("sus2","sus2",[0,2,7],.3)],
 [V("m","m",[0,3,7]),V("m7","m7",[0,3,7,10],.1),V("m7(11)","m7(11)",[0,3,7,10,17],.2),V("m9","m9",[0,3,7,10,14],.2)],
 [V("m","m",[0,3,7]),V("m7","m7",[0,3,7,10],.1),V("7","7",[0,4,7,10],1)],
 [V("","",[0,4,7]),V("maj7","maj7",[0,4,7,11],.2),V("add9","add9",[0,4,7,14],.1),V("maj7(9)","maj7(9)",[0,4,7,11,14],.3),V("sus2","sus2",[0,2,7],.3)],
 [V("","",[0,4,7]),V("7","7",[0,4,7,10],.4),V("sus4","sus4",[0,5,7],.3),V("7sus4","7sus4",[0,5,7,10],.5)],
 [V("m","m",[0,3,7]),V("m7","m7",[0,3,7,10],.1),V("m7(11)","m7(11)",[0,3,7,10,17],.2),V("m9","m9",[0,3,7,10,14],.2)],
 [V("°","dim",[0,3,6]),V("m7♭5","m7♭5",[0,3,6,10],.1)]
];
const KEYS=["C","G","D","A","E","F","B♭","E♭"];
const KEYPC={C:0,G:7,D:2,A:9,E:4,F:5,"B♭":10,"E♭":3};
const SH=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const FL=["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];
const FAMNAME={T:"tonic",S:"subdominant",D:"dominant"};
const FAMS={T:[0,2,5],S:[1,3],D:[4,6]};

// Any-chord / chromatic explorer qualities. Keys match SHAPES in chords.js exactly, so every
// one of these already has a real, verified movable bar-chord diagram.
const QUALS=[
 {k:"",suf:"",name:"major",iv:[0,4,7]},
 {k:"m",suf:"m",name:"minor",iv:[0,3,7]},
 {k:"7",suf:"7",name:"dominant 7",iv:[0,4,7,10]},
 {k:"m7",suf:"m7",name:"minor 7",iv:[0,3,7,10]},
 {k:"maj7",suf:"maj7",name:"major 7",iv:[0,4,7,11]},
 {k:"6",suf:"6",name:"major 6",iv:[0,4,7,9]},
 {k:"add9",suf:"add9",name:"add9",iv:[0,4,7,14]},
 {k:"sus2",suf:"sus2",name:"sus2",iv:[0,2,7]},
 {k:"sus4",suf:"sus4",name:"sus4",iv:[0,5,7]},
 {k:"7sus4",suf:"7sus4",name:"7sus4",iv:[0,5,7,10]},
 {k:"maj7(9)",suf:"maj7(9)",name:"major 9",iv:[0,4,7,11,14]},
 {k:"m9",suf:"m9",name:"minor 9",iv:[0,3,7,10,14]},
 {k:"m7(11)",suf:"m7(11)",name:"minor 11",iv:[0,3,7,10,17]},
 {k:"m7♭5",suf:"m7♭5",name:"half-diminished",iv:[0,3,6,10]},
 {k:"dim",suf:"°",name:"diminished",iv:[0,3,6]}
];
function qualByKey(k){return QUALS.find(q=>q.k===k)}

const ITEXT={1:"Steps up to IIm — a gentle start of motion.",2:"Darkens slightly — an introspective colour.",3:"Home to warmth — bright and nostalgic.",4:"Sets up an instant pull back home.",5:"Same notes, darker mood — the most-used tonic swap.",6:"Tense passing colour that needs to resolve."};
const MOVES={
 1:{4:["tension","Pushes toward V — the classic pre-dominant launch."],3:["normal","Steps back to IV — brighter and more open."],6:["normal","Slides to VII° — keeps the dominant energy rising."],avoid:{0:"II → I skips the dominant, so it sounds abrupt — fine only as a stepwise descent (IV→III→II→I)."}},
 2:{5:["normal","Falls a fifth into VIm — natural, melancholic flow."],3:["normal","Lifts to IV — opens the ambiguity up into warmth."],1:["tension","Steps down to IIm — sets up a push toward V."],avoid:{0:"III → I sounds abrupt mid-phrase — use it only as a deliberate colour."}},
 3:{0:["resolution","Plagal landing — a warm, gentle resolution."],1:["normal","Same forward motion, darker and more introspective."],4:["tension","The J-rock launch ramp — IV rising to V builds maximum lift."],6:["normal","Climbs to VII° — a tense passing colour toward I."]},
 4:{0:["resolution","Dominant → tonic: the strongest pull home."],5:["normal","Deceptive move — the ear expects I and gets VIm. Bittersweet."],3:["tension","Backs off to IV — keeps tension without resolving."],2:["signature","The Royal Road move — V sidesteps to IIIm (I's darker sibling) instead of going home. The emotional heart of J-pop and J-rock."],avoid:{6:"V → VII° stacks two dominant chords — unresolved and awkward."}},
 5:{1:["normal","Down to IIm — circle-of-fifths flow heading for V."],3:["normal","VIm → IV: moody to warm, one of the most-used J-rock moves."],4:["tension","Climbs straight into tension."],avoid:{2:"VIm → IIIm sounds weak unless it's part of a descending line."}},
 6:{0:["resolution","Leading-tone chord resolving home — a sharper V → I."],4:["normal","Same function, smoother sound."],2:["normal","Eases the tension into the tonic family."],avoid:{3:"VII° → IV moves away from resolution and sounds ungrounded."}}
};
const TYPES={
 resolution:{c:"#4ade80",lbl:"resolution",dash:"",w:3,rank:0},
 signature:{c:"var(--sig)",lbl:"J-rock signature",dash:"",w:3,rank:1},
 tension:{c:"#fbbf24",lbl:"tension",dash:"6 4",w:2,rank:2},
 normal:{c:"var(--normal)",lbl:"normal",dash:"",w:1.6,rank:3},
 step:{c:"var(--step)",lbl:"stepwise",dash:"2 3",w:1.6,rank:4},
 hold:{c:"var(--hold)",lbl:"repeat",dash:"",w:1.4,rank:5},
 color:{c:"var(--colorMv)",lbl:"colour",dash:"2 4",w:1.2,rank:6},
 avoid:{c:"#fb3f6c",lbl:"use with care",dash:"1 4",w:1.2,rank:7},
 custom:{c:"var(--muted)",lbl:"custom chord",dash:"3 3",w:1.4,rank:8}
};
const SWAPT={"0>5":"Same landing, darker — the most-used tonic swap in J-rock.","0>2":"Adds introspection — works better as a passing chord than a landing.","5>0":"Removes the ambiguity and resolves — good for closing a section.","5>2":"Creates suspension — a link between tonic and subdominant territory.","2>5":"Natural pull — reinforces the minor direction.","2>0":"Brings the introspective colour back to stable — best at phrase ends.","3>1":"Same forward drive, darker and more introspective — great in pre-choruses.","1>3":"Brighter and more direct — more anthemic.","4>6":"Same tension, sharper and more angular — for dramatic transitions.","6>4":"Smoother resolution — use when VII° sounds too dissonant."};
const PRESETS=[
 {n:"Royal Road",p:[[3,0],[4,0],[2,0],[5,0]],d:"one of the most iconic Japanese progressions — emotional yet uplifting."},
 {n:"Royal Road (jazzy)",p:[[3,1],[2,2],[5,1],[5,1]],d:"the V-omitted Royal Road: III7 gives a stronger, jazzier pull into VIm."},
 {n:"Royal Road (III omitted)",p:[[3,1],[4,0],[5,1],[5,1]],d:"the III-omitted Royal Road — straight from V into a held VIm7."},
 {n:"Soft tension",p:[[2,0],[3,0],[4,0],[5,0]],d:"builds from III up to V, then resolves into VIm — great for intros and dynamic verses."},
 {n:"Rising pressure",p:[[1,0],[2,0],[3,0],[4,0]],d:"a stepwise climb with no true resolution — built for pre-choruses."},
 {n:"Turnaround",p:[[5,0],[1,0],[4,0],[0,0]],d:"follows the circle of fifths back home — bright and airy, Yorushika-style."},
 {n:"Seishun flow",p:[[3,0],[2,0],[5,0],[5,0]],d:"stable and flowing with a double landing on VIm — for verses and choruses."}
];

/* ---------- time signatures, drum styles, instruments ---------- */
const TIME_SIGS=[
 {label:"2/4",beats:2},{label:"3/4",beats:3},{label:"4/4",beats:4},{label:"5/4",beats:5},
 {label:"6/8",beats:6},{label:"7/8",beats:7},{label:"9/8",beats:9},{label:"12/8",beats:12}
];
const DRUM_STYLES=["none","pop","rock","ballad"];
const INSTRUMENTS=[{k:"guitar",label:"Guitar"},{k:"piano",label:"Piano"},{k:"pad",label:"Synth pad"}];

function buildStrumPattern(n){
  const pat=[];
  for(let b=0;b<n;b++){
    pat.push([b,0,b===0?.55:.4]);
    pat.push([b+.5,1,.26]);
  }
  return pat;
}
function buildDrumPattern(style,n){
  if(style==="none")return{kick:[],snare:[],hihat:[]};
  const half=n>=2?Math.floor(n/2):0;
  let kick=[0],snare=[half||Math.max(1,n-1)],hihat=[];
  const hhStep=style==="ballad"?1:.5;
  for(let b=0;b<n;b+=hhStep)hihat.push(b);
  if(style==="rock"&&n>=4)kick.push(Math.min(n-1,2));
  if(style==="pop"&&n>=4)kick.push(Math.max(0,n-1.5));
  if(style==="ballad"){hihat=hihat.filter((_,i)=>i%2===0)}
  return{kick,snare,hihat};
}

/* ---------- "Studies": Kessoku Band (結束バンド, Bocchi the Rock!) song studies.
   Each song's sourced excerpt (from published chord charts, chord names only — no lyrics
   or tab) is kept as the verified anchor and extended into a full Intro/Verse/Pre-chorus/
   Chorus (etc.) structure in the same key and chord vocabulary — an original arrangement
   in the song's style, not a claimed verbatim transcription of every section. `sections`
   lists [name,barCount] pairs for display. d/v pairs are the same {degree,variant} shape
   as PRESETS; {custom:true,root,q} represents a borrowed (non-diatonic) chord. ---------- */
/* melody notes are ORIGINAL, representative melodic contours — voice-led note to note from
   each bar's chord tones, in a register clearly above the chord voicing so it reads as a
   lead line rather than blending into the harmony. Not a transcription of the real
   recorded vocal line (no verified score source was used). {b: beat offset in the bar,
   m: semitone offset from the song's key tonic at the lead register, len: duration in
   beats, vel: 0-1 velocity}. */
const KESSOKU_SONGS=[
 {n:"A Rolling Stone, Morning Falls on You",jp:"転がる岩、君に朝が降る",key:"C",
  d:"full structure (Intro–Verse–Pre-chorus–Chorus), extended in the songs own key/chord vocabulary from the sourced verse excerpt (I-VIm-IV-I / I-VIm-IV-V) — the extension is an original arrangement in the songs style, not a verbatim transcription of every section.",
  sections:[["Intro",4],["Verse",8],["Pre-chorus",4],["Chorus",8]],
  p:[{d:5,v:0},{d:3,v:0},{d:0,v:0},{d:4,v:0},{d:0,v:0},{d:5,v:0},{d:3,v:0},{d:0,v:0},{d:0,v:0},{d:5,v:0},{d:3,v:0},{d:4,v:0},{d:1,v:0},{d:3,v:0},{d:4,v:0},{d:4,v:0},{d:3,v:0},{d:4,v:0},{d:2,v:0},{d:5,v:0},{d:3,v:0},{d:4,v:0},{d:0,v:0},{d:0,v:0}],
  melody:[
   [{b:0,m:9,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:2,len:2,vel:0.47},{b:2,m:-1,len:2,vel:0.42}],
   [{b:0,m:0,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:4,len:2,vel:0.5},{b:2,m:0,len:2,vel:0.45}],
   [{b:0,m:0,len:2,vel:0.5},{b:2,m:5,len:2,vel:0.45}],
   [{b:0,m:4,len:2,vel:0.47},{b:2,m:7,len:2,vel:0.42}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:4,len:2,vel:0.5},{b:2,m:0,len:2,vel:0.45}],
   [{b:0,m:0,len:2,vel:0.5},{b:2,m:5,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.47},{b:2,m:11,len:2,vel:0.42}],
   [{b:0,m:9,len:2,vel:0.5},{b:2,m:5,len:2,vel:0.45}],
   [{b:0,m:5,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:11,len:2,vel:0.47},{b:2,m:14,len:2,vel:0.42}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:11,len:2,vel:0.5},{b:2,m:7,len:2,vel:0.45}],
   [{b:0,m:9,len:2,vel:0.47},{b:2,m:12,len:2,vel:0.42}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:16,len:2,vel:0.45}],
   [{b:0,m:16,len:2,vel:0.47},{b:2,m:12,len:2,vel:0.42}]
  ]},
 {n:"milky way",jp:"milky way",key:"G",
  d:"full structure (Intro–Verse–Pre-chorus–Chorus); the Verse (I-V-I-IIm7, then VIm-V-IVmaj7-I) is the sourced excerpt, extended around it in the same key/chord vocabulary as an original arrangement, not a verbatim transcription of every section.",
  sections:[["Intro",4],["Verse",8],["Pre-chorus",4],["Chorus",8]],
  p:[{d:0,v:0},{d:3,v:1},{d:4,v:0},{d:0,v:0},{d:0,v:0},{d:4,v:0},{d:0,v:0},{d:1,v:1},{d:5,v:0},{d:4,v:0},{d:3,v:1},{d:0,v:0},{d:1,v:1},{d:3,v:1},{d:4,v:0},{d:4,v:0},{d:3,v:1},{d:4,v:0},{d:2,v:0},{d:5,v:0},{d:1,v:1},{d:4,v:0},{d:0,v:0},{d:0,v:0}],
  melody:[
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:4,len:2,vel:0.5},{b:2,m:5,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.47},{b:2,m:16,len:2,vel:0.42}],
   [{b:0,m:16,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:11,len:2,vel:0.5},{b:2,m:14,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:16,len:2,vel:0.45}],
   [{b:0,m:14,len:2,vel:0.47},{b:2,m:12,len:2,vel:0.42}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.47},{b:2,m:4,len:2,vel:0.42}],
   [{b:0,m:5,len:2,vel:0.5},{b:2,m:2,len:2,vel:0.45}],
   [{b:0,m:0,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:2,len:2,vel:0.5},{b:2,m:-1,len:2,vel:0.45}],
   [{b:0,m:-1,len:2,vel:0.47},{b:2,m:2,len:2,vel:0.42}],
   [{b:0,m:0,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:2,len:2,vel:0.5},{b:2,m:-1,len:2,vel:0.45}],
   [{b:0,m:-1,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:4,len:2,vel:0.47},{b:2,m:0,len:2,vel:0.42}],
   [{b:0,m:0,len:2,vel:0.5},{b:2,m:2,len:2,vel:0.45}],
   [{b:0,m:2,len:2,vel:0.5},{b:2,m:-1,len:2,vel:0.45}],
   [{b:0,m:0,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:4,len:2,vel:0.47},{b:2,m:7,len:2,vel:0.42}]
  ]},
 {n:"Small Sea",jp:"小さな海",key:"C",
  d:"full structure (Intro–Verse–Pre-chorus–Chorus); the Verse (I-VIm-IV-IIm-V-I) is the sourced excerpt, extended around it in the same key/chord vocabulary as an original arrangement, not a verbatim transcription of every section.",
  sections:[["Intro",4],["Verse",6],["Pre-chorus",4],["Chorus",8]],
  p:[{d:0,v:0},{d:3,v:0},{d:5,v:0},{d:4,v:0},{d:0,v:0},{d:5,v:0},{d:3,v:0},{d:1,v:0},{d:4,v:0},{d:0,v:0},{d:1,v:0},{d:3,v:0},{d:4,v:0},{d:4,v:0},{d:3,v:0},{d:4,v:0},{d:2,v:0},{d:5,v:0},{d:3,v:0},{d:4,v:0},{d:0,v:0},{d:0,v:0}],
  melody:[
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:5,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:9,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:11,len:2,vel:0.47},{b:2,m:14,len:2,vel:0.42}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:16,len:2,vel:0.45}],
   [{b:0,m:16,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:9,len:2,vel:0.47},{b:2,m:5,len:2,vel:0.42}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:16,len:2,vel:0.45}],
   [{b:0,m:14,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:9,len:2,vel:0.47},{b:2,m:12,len:2,vel:0.42}],
   [{b:0,m:11,len:2,vel:0.5},{b:2,m:14,len:2,vel:0.45}],
   [{b:0,m:14,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.47},{b:2,m:11,len:2,vel:0.42}],
   [{b:0,m:11,len:2,vel:0.5},{b:2,m:7,len:2,vel:0.45}],
   [{b:0,m:9,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.47},{b:2,m:11,len:2,vel:0.42}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:16,len:2,vel:0.45}],
   [{b:0,m:16,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}]
  ]},
 {n:"Seishun Complex",jp:"青春コンプレックス",key:"C",
  d:"full structure (Intro–Verse–Pre-chorus–Chorus); the Intro (Imaj7, a borrowed ♭VIImaj7 shown as a custom chord, IVmaj7, a III7 secondary dominant, VIm9, IVmaj7) is the sourced excerpt, extended around it in the same key/chord vocabulary as an original arrangement, not a verbatim transcription of every section.",
  sections:[["Intro",6],["Verse",8],["Pre-chorus",4],["Chorus",8]],
  p:[{d:0,v:1},{custom:true,root:10,q:"maj7"},{d:3,v:1},{d:2,v:2},{d:5,v:3},{d:3,v:1},{d:0,v:1},{d:5,v:1},{d:3,v:1},{d:1,v:1},{d:0,v:1},{d:5,v:1},{d:3,v:1},{d:4,v:1},{d:1,v:1},{d:3,v:1},{d:4,v:1},{d:4,v:1},{d:3,v:1},{d:4,v:1},{d:2,v:1},{d:5,v:3},{d:3,v:1},{d:4,v:1},{d:0,v:1},{d:0,v:1}],
  melody:[
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:5,len:2,vel:0.5},{b:2,m:2,len:2,vel:0.45}],
   [{b:0,m:0,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:4,len:2,vel:0.47},{b:2,m:2,len:2,vel:0.42}],
   [{b:0,m:0,len:2,vel:0.5},{b:2,m:-1,len:2,vel:0.45}],
   [{b:0,m:0,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:4,len:2,vel:0.5},{b:2,m:7,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.47},{b:2,m:9,len:2,vel:0.42}],
   [{b:0,m:9,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:14,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.47},{b:2,m:9,len:2,vel:0.42}],
   [{b:0,m:9,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:11,len:2,vel:0.5},{b:2,m:14,len:2,vel:0.45}],
   [{b:0,m:14,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.47},{b:2,m:9,len:2,vel:0.42}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:5,len:2,vel:0.45}],
   [{b:0,m:5,len:2,vel:0.5},{b:2,m:7,len:2,vel:0.45}],
   [{b:0,m:5,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:5,len:2,vel:0.47},{b:2,m:7,len:2,vel:0.42}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:4,len:2,vel:0.5},{b:2,m:7,len:2,vel:0.45}],
   [{b:0,m:5,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:5,len:2,vel:0.47},{b:2,m:7,len:2,vel:0.42}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:4,len:2,vel:0.5},{b:2,m:7,len:2,vel:0.45}]
  ]},
 {n:"Guitar, Solitude, and a Blue Planet",jp:"ギターと孤独と蒼い惑星",key:"G",
  d:"full structure (Intro/Verse–Pre-chorus–Chorus–Outro); the Intro/Verse (VIm-V-I-V, IV-V-VIm) is the sourced excerpt (capo 2 in the original chart, shown here as sounded), extended around it in the same key/chord vocabulary as an original arrangement, not a verbatim transcription of every section.",
  sections:[["Intro/Verse",7],["Pre-chorus",4],["Chorus",8],["Outro",4]],
  p:[{d:5,v:0},{d:4,v:0},{d:0,v:0},{d:4,v:0},{d:3,v:0},{d:4,v:0},{d:5,v:0},{d:3,v:0},{d:4,v:0},{d:2,v:0},{d:5,v:0},{d:0,v:0},{d:4,v:0},{d:5,v:0},{d:3,v:0},{d:0,v:0},{d:4,v:0},{d:3,v:0},{d:4,v:0},{d:3,v:0},{d:4,v:0},{d:5,v:0},{d:5,v:0}],
  melody:[
   [{b:0,m:9,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:11,len:2,vel:0.5},{b:2,m:14,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:16,len:2,vel:0.45}],
   [{b:0,m:14,len:2,vel:0.47},{b:2,m:11,len:2,vel:0.42}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:9,len:2,vel:0.47},{b:2,m:12,len:2,vel:0.42}],
   [{b:0,m:11,len:2,vel:0.5},{b:2,m:14,len:2,vel:0.45}],
   [{b:0,m:16,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.47},{b:2,m:4,len:2,vel:0.42}],
   [{b:0,m:2,len:2,vel:0.5},{b:2,m:-1,len:2,vel:0.45}],
   [{b:0,m:0,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:5,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.47},{b:2,m:4,len:2,vel:0.42}],
   [{b:0,m:2,len:2,vel:0.5},{b:2,m:-1,len:2,vel:0.45}],
   [{b:0,m:0,len:2,vel:0.5},{b:2,m:5,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.47},{b:2,m:9,len:2,vel:0.42}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:9,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}]
  ]},
 {n:"That Band",jp:"あのバンド",key:"C",
  d:"full structure (Intro–Verse/Pre-chorus–Chorus–Outro); the Verse/Pre-chorus (VIm7-IVmaj7-IIm7-V, then VIm7-IVmaj7-IIIm7 into a borrowed ♭VII shown as a custom chord) is the sourced excerpt, extended around it in the same key/chord vocabulary as an original arrangement, not a verbatim transcription of every section.",
  sections:[["Intro",4],["Verse/Pre-chorus",8],["Chorus",8],["Outro",4]],
  p:[{d:0,v:1},{d:5,v:1},{d:3,v:1},{d:4,v:1},{d:5,v:1},{d:3,v:1},{d:1,v:1},{d:4,v:0},{d:5,v:1},{d:3,v:1},{d:2,v:1},{custom:true,root:10,q:""},{d:3,v:1},{d:4,v:1},{d:0,v:1},{d:0,v:1},{d:5,v:1},{d:3,v:1},{d:4,v:1},{d:4,v:1},{d:3,v:1},{d:4,v:1},{d:0,v:1},{d:0,v:1}],
  melody:[
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:4,len:2,vel:0.5},{b:2,m:7,len:2,vel:0.45}],
   [{b:0,m:5,len:2,vel:0.5},{b:2,m:4,len:2,vel:0.45}],
   [{b:0,m:5,len:2,vel:0.47},{b:2,m:7,len:2,vel:0.42}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:9,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:14,len:2,vel:0.45}],
   [{b:0,m:14,len:2,vel:0.47},{b:2,m:11,len:2,vel:0.42}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:9,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:11,len:2,vel:0.5},{b:2,m:14,len:2,vel:0.45}],
   [{b:0,m:14,len:2,vel:0.47},{b:2,m:10,len:2,vel:0.42}],
   [{b:0,m:9,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:11,len:2,vel:0.5},{b:2,m:14,len:2,vel:0.45}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:11,len:2,vel:0.45}],
   [{b:0,m:11,len:2,vel:0.47},{b:2,m:12,len:2,vel:0.42}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:9,len:2,vel:0.5},{b:2,m:12,len:2,vel:0.45}],
   [{b:0,m:11,len:2,vel:0.5},{b:2,m:14,len:2,vel:0.45}],
   [{b:0,m:14,len:2,vel:0.47},{b:2,m:11,len:2,vel:0.42}],
   [{b:0,m:12,len:2,vel:0.5},{b:2,m:9,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.5},{b:2,m:5,len:2,vel:0.45}],
   [{b:0,m:4,len:2,vel:0.5},{b:2,m:7,len:2,vel:0.45}],
   [{b:0,m:7,len:2,vel:0.47},{b:2,m:4,len:2,vel:0.42}]
  ]}
];
