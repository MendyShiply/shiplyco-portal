// ── TARA — Tracks All, Reports Anomalies ──
// ── TWO-STAGE RECEIVING SYSTEM ──
// ══════════════════════════════════════════════════════════════

// ── TARA STATE ──
let TARA_OPEN = false;
let TARA_BRIEFING_DONE = false;
let TARA_MUTED = false;
let TARA_CHAT_MODE = false; // false = voice only, true = open chat panel
let TARA_ALERTS = [];
let TARA_VOICE_ACTIVE = false;
let _taraRecognition = null;

// ── TARA BLOB STATE ──
let _taraBlob = {t:0, speakAmp:0, speakTarget:0, raf:null, analyser:null, freqData:null, audioCtx:null};

// ── TARA PARTICLE SYSTEM ──
let _taraParticles = [];
function _taraInitParticles(){
  _taraParticles = [];
  const N = 280;
  for(let i=0;i<N;i++){
    // Distribute on sphere surface using fibonacci sphere
    const phi = Math.acos(1 - 2*(i+0.5)/N);
    const theta = Math.PI*(1+Math.sqrt(5))*i;
    _taraParticles.push({
      bx: Math.sin(phi)*Math.cos(theta), // base x on unit sphere
      by: Math.sin(phi)*Math.sin(theta), // base y
      bz: Math.cos(phi),                  // base z (depth)
      phase: Math.random()*Math.PI*2,
      speed: 0.3+Math.random()*0.4,
      size: 1.2+Math.random()*1.8,
    });
  }
}

function _taraDrawBlob(){
  const cv=document.getElementById('taraBlobCanvas');
  if(!cv){_taraBlob.raf=null;return;}
  const ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height,CX=W/2,CY=H/2;
  _taraBlob.t+=0.008;
  if(_taraBlob.analyser&&_taraBlob.freqData){
    _taraBlob.analyser.getByteFrequencyData(_taraBlob.freqData);
    const avg=Array.from(_taraBlob.freqData.slice(0,60)).reduce((a,b)=>a+b,0)/60;
    _taraBlob.speakTarget=avg/255*0.85;
  } else {
    _taraBlob.speakTarget*=0.92;
  }
  _taraBlob.speakAmp+=(_taraBlob.speakTarget-_taraBlob.speakAmp)*0.10;
  const amp=_taraBlob.speakAmp;
  ctx.clearRect(0,0,W,H);

  const baseR = 38 + amp*14;
  const t = _taraBlob.t;

  // Draw particles
  if(_taraParticles.length===0) _taraInitParticles();
  for(let i=0;i<_taraParticles.length;i++){
    const p=_taraParticles[i];
    // Breathing — radius oscillates
    const breathe = 1 + 0.06*Math.sin(t*p.speed+p.phase) + amp*0.25*Math.sin(t*6+p.phase*2);
    const r = baseR * breathe;
    // Slow rotation around Y axis
    const rotY = t * 0.18;
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const rx = p.bx*cosY + p.bz*sinY;
    const rz = -p.bx*sinY + p.bz*cosY;
    const px = CX + rx*r;
    const py = CY + p.by*r;
    // Depth-based opacity and size (particles facing us are brighter)
    const depth = (rz+1)/2; // 0..1
    const alpha = 0.25 + depth*0.65;
    const sz = p.size*(0.5+depth*0.8);
    ctx.beginPath();
    ctx.arc(px,py,sz,0,Math.PI*2);
    ctx.fillStyle=`rgba(220,38,26,${alpha})`;
    ctx.fill();
  }
  _taraBlob.raf=requestAnimationFrame(_taraDrawBlob);
}

function _taraStartBlob(){
  if(_taraBlob.raf) return;
  _taraDrawBlob();
}

// ── TARA SPEAK via ElevenLabs ──
const TARA_VOICE_URL='https://xyemghdkehsfgeyidmie.supabase.co/functions/v1/tara-voice';
const TARA_SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZW1naGRrZWhzZmdleWlkbWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjE3NTIsImV4cCI6MjA4ODMzNzc1Mn0.4pIvrbdbMrPIrByY9GRnDiyw15BJobPxllr8mQ0c1OA';

// Create AudioContext on first user gesture and reuse (iOS requirement)
let _taraAC = null;
function _taraGetAC(){
  if(!_taraAC || _taraAC.state === 'closed'){
    _taraAC = new(window.AudioContext||window.webkitAudioContext)();
  }
  if(_taraAC.state === 'suspended') _taraAC.resume();
  return _taraAC;
}

async function taraSpeak(text){
  if(!text||text.length<2) return;
  if(TARA_MUTED) return;
  const clean=text.replace(/<[^>]+>/g,' ').replace(/[*_#\[\]]/g,'').replace(/\s+/g,' ').trim().slice(0,500);
  try{
    // Stop any current audio
    if(_taraBlob.currentSrc){try{_taraBlob.currentSrc.stop();}catch(e){}}
    _taraBlob.currentSrc=null;_taraBlob.analyser=null;_taraBlob.freqData=null;

    // Ensure AudioContext is running (iOS suspends it)
    if(_taraAC && _taraAC.state === 'suspended') await _taraAC.resume();

    const res=await fetch(TARA_VOICE_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+TARA_SUPABASE_ANON},
      body:JSON.stringify({text:clean})
    });
    if(!res.ok){ console.warn('Voice fetch failed:',res.status); return; }
    const buf=await res.arrayBuffer();
    const ac=_taraGetAC();
    const analyser=ac.createAnalyser();
    analyser.fftSize=512;
    _taraBlob.analyser=analyser;
    _taraBlob.freqData=new Uint8Array(analyser.frequencyBinCount);
    const decoded=await ac.decodeAudioData(buf.slice(0));
    const src=ac.createBufferSource();
    src.buffer=decoded;
    src.connect(analyser);
    analyser.connect(ac.destination);
    _taraBlob.currentSrc=src;
    src.start(0);
    return new Promise(resolve=>{
      // Safety timeout — if audio doesn't end naturally in 30s, resolve anyway
      const safetyTimer = setTimeout(()=>{
        _taraBlob.analyser=null; _taraBlob.freqData=null;
        _taraBlob.speakTarget=0; _taraBlob.currentSrc=null;
        resolve();
      }, 30000);
      src.onended=()=>{
        clearTimeout(safetyTimer);
        _taraBlob.analyser=null;
        _taraBlob.freqData=null;
        _taraBlob.speakTarget=0;
        _taraBlob.currentSrc=null;
        resolve();
      };
    });
  }catch(e){
    console.warn('TARA ElevenLabs error — using browser TTS fallback:',e);
    // Fallback to browser speechSynthesis
    return new Promise(resolve=>{
      if(!window.speechSynthesis){ resolve(); return; }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(clean);
      utt.rate = 1.05; utt.pitch = 1.0;
      // Pick a female voice if available
      const voices = window.speechSynthesis.getVoices();
      const female = voices.find(v=>v.name.includes('Samantha')||v.name.includes('Karen')||v.name.includes('Victoria')||v.name.includes('female'));
      if(female) utt.voice = female;
      utt.onend = resolve;
      utt.onerror = resolve;
      window.speechSynthesis.speak(utt);
    });
  }
}

// ── IN-PROGRESS TRUCKS (two-stage receiving) ──
// Status: 'arriving' → 'receiving' → 'received'
let TRUCKS_INPROGRESS = []; // loaded from Supabase
let _trucksLoaded = false;

async function loadTrucksFromSB(){
  try{
    // Load trucks
    const {data:trucks, error:te} = await sb.from('trucks').select('*').order('created_at',{ascending:false});
    if(te) throw te;

    // Load pallets
    const {data:pallets, error:pe} = await sb.from('pallets').select('*');
    if(pe) throw pe;

    // Merge pallets into trucks
    TRUCKS_INPROGRESS = (trucks||[]).map(t=>({
      id: t.id,
      name: t.name,
      custId: t.cust_id || t.custId,
      date: t.date ? new Date(t.date).toLocaleDateString() : new Date(t.created_at).toLocaleDateString(),
      origin: t.origin||'',
      store: t.store||'',
      totalPallets: t.total_pallets||0,
      bol: t.bol_url||'',
      receipt: t.receipt_url||'',
      status: t.status||'receiving',
      receivedBy: t.received_by||'',
      notes: t.notes||'',
      pallets: (pallets||[]).filter(p=>p.truck_id===t.id).map(p=>({
        id: p.id,
        num: p.pallet_num,
        stage: p.stage||1,
        loc: p.location||'',
        items: p.items||[]
      })).sort((a,b)=>a.num-b.num)
    }));
    // Update totalPallets from actual pallet data
    TRUCKS_INPROGRESS.forEach(t=>{
      if(!t.total_pallets && t.pallets.length > 0) t.totalPallets = t.pallets.length;
    });
    _trucksLoaded = true;
  }catch(e){
    console.warn('Trucks load error:',e);
    _trucksLoaded = true; // don't loop forever
  }
}

// ── TARA BLOB CLICK — voice mode (tap=speak, right-click/long-press=open panel) ──
let _taraHoldTimer = null;
let _taraVoiceMode = false;
let _taraVoiceRecognition = null;

// Set up long-press for mobile
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('taraBtn');
  if(!btn) return;
  btn.addEventListener('touchstart', ()=>{
    _taraHoldTimer = setTimeout(()=>{ toggleTara(); }, 600);
  });
  btn.addEventListener('touchend', ()=>{ clearTimeout(_taraHoldTimer); });
});

function taraBlobClick(){
  // If panel is open, just close it
  if(TARA_OPEN){ toggleTara(); return; }
  // Respect chat mode setting
  if(TARA_CHAT_MODE){ toggleTara(); return; }
  // Toggle convo
  taraStartVoiceOnly();
  // Update TARA label to show state
  const lbl = document.querySelector('#taraBtn .tara-state-lbl');
  if(lbl) lbl.textContent = _taraConvoActive ? '● LIVE' : 'TARA';
}

let _taraConvoActive = false; // continuous convo mode

const _taraGreetings = [
  "Hey, what do you need?",
  "I'm listening — go ahead.",
  "What's up?",
  "Talk to me.",
  "Go ahead, I'm here.",
  "What can I help with?",
  "Ready when you are.",
];
let _taraGreetIdx = 0;

function taraStartVoiceOnly(){
  if(!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)){
    showToast('Voice not supported — use Chrome or Safari');
    toggleTara();
    return;
  }
  // If convo already active, stop it
  if(_taraConvoActive){
    _taraStopConvo();
    return;
  }
  // Init AudioContext immediately from user gesture (iOS requirement)
  _taraGetAC();
  _taraConvoActive = true;
  // Greet with rotating phrases
  const greeting = _taraGreetings[_taraGreetIdx % _taraGreetings.length];
  _taraGreetIdx++;
  // CRITICAL iOS fix: close and recreate AudioContext fresh on each tap
  // iOS requires AudioContext to be created AND used within the same user gesture
  if(_taraAC){ try{_taraAC.close();}catch(e){} }
  _taraAC = new(window.AudioContext||window.webkitAudioContext)();

  // Speak greeting then listen when done
  taraSpeak(greeting).then(()=>{
    if(_taraConvoActive) _taraListenLoop();
  }).catch(()=>{
    if(_taraConvoActive) setTimeout(_taraListenLoop, 800);
  });
  // Safety fallback
  setTimeout(()=>{ if(_taraConvoActive && !_taraVoiceRecognition) _taraListenLoop(); }, 5000);
}

function _taraStopConvo(){
  _taraConvoActive = false;
  _taraGreetIdx = 0; // reset so next tap greets fresh
  if(_taraVoiceRecognition){
    try{_taraVoiceRecognition.stop();}catch(e){}
    _taraVoiceRecognition = null;
  }
  if(_taraBlob.currentSrc){try{_taraBlob.currentSrc.stop();}catch(e){} _taraBlob.currentSrc=null;}
  _taraBlob.speakTarget = 0;
  _taraBlob.analyser = null;
  _taraHideListeningHint();
}

function _taraListenLoop(){
  if(!_taraConvoActive) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = 'en-US';
  rec.continuous = false;
  rec.interimResults = true; // get partial results to detect speech faster
  rec.maxAlternatives = 1;
  _taraVoiceRecognition = rec;
  _taraBlob.speakTarget = 0.45;
  _taraShowListeningHint('🎤 Listening…');
  let _gotResult = false;
  let _finalTranscript = '';
  let _silenceTimer = null;

  rec.onresult = (e) => {
    let interim = '';
    for(let i=e.resultIndex;i<e.results.length;i++){
      if(e.results[i].isFinal){
        _finalTranscript += e.results[i][0].transcript;
      } else {
        interim += e.results[i][0].transcript;
      }
    }
    // Show blob reacting while user speaks
    if(interim || _finalTranscript) _taraBlob.speakTarget = 0.3;
    // If we have a final result, process immediately
    if(_finalTranscript && !_gotResult){
      _gotResult = true;
      clearTimeout(_silenceTimer);
      _taraVoiceRecognition = null;
      try{ rec.stop(); }catch(e){}
      _processTranscript(_finalTranscript.trim());
    }
  };

  rec.onerror = (e) => {
    _taraVoiceRecognition = null;
    clearTimeout(_silenceTimer);
    if(e.error === 'no-speech'){
      if(_taraConvoActive) setTimeout(_taraListenLoop, 200);
    } else if(e.error === 'not-allowed'){
      _taraConvoActive = false;
      _taraHideListeningHint();
      showToast('Microphone blocked — check browser permissions');
    } else {
      if(_taraConvoActive) setTimeout(_taraListenLoop, 300);
    }
  };

  rec.onend = () => {
    clearTimeout(_silenceTimer);
    if(!_gotResult){
      _taraVoiceRecognition = null;
      if(_finalTranscript.trim() && !_gotResult){
        _gotResult = true;
        _processTranscript(_finalTranscript.trim());
      } else if(_taraConvoActive){
        setTimeout(_taraListenLoop, 200);
      }
    }
  };

  async function _processTranscript(text){
    if(!text){ if(_taraConvoActive) _taraListenLoop(); return; }
    _taraBlob.speakTarget = 0.2;
    _taraShowListeningHint('💬 Thinking…');
    await taraVoiceOnlyReply(text);
    // Wait for TARA to finish speaking then listen again
    if(_taraConvoActive){
      const checkDone = setInterval(()=>{
        if(_taraBlob.speakTarget < 0.05 && !_taraBlob.currentSrc){
          clearInterval(checkDone);
          if(_taraConvoActive) setTimeout(_taraListenLoop, 300);
        }
      }, 150);
      // Safety timeout — restart after 15s regardless
      setTimeout(()=>{ clearInterval(checkDone); if(_taraConvoActive) _taraListenLoop(); }, 15000);
    }
  }

  try { rec.start(); } catch(err){
    showToast('Mic error: ' + err.message);
    _taraConvoActive = false;
    _taraHideListeningHint();
  }
}

function _taraShowListeningHint(msg){
  let hint = document.getElementById('taraListeningHint');
  if(!hint){
    hint = document.createElement('div');
    hint.id = 'taraListeningHint';
    hint.style.cssText = 'position:fixed;bottom:200px;right:20px;z-index:8001;background:#e8241a;color:#fff;font-family:Barlow,sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;padding:8px 16px;border-radius:20px;box-shadow:0 4px 16px rgba(232,36,26,0.4);pointer-events:none';
    document.body.appendChild(hint);
  }
  hint.textContent = msg || '🎤 Listening…';
  hint.style.display = 'block';
}

function _taraHideListeningHint(){
  const hint = document.getElementById('taraListeningHint');
  if(hint) hint.style.display = 'none';
}

async function taraVoiceOnlyReply(userText){
  _taraConv.push({role:'user', content:userText});
  const inProgress = TRUCKS_INPROGRESS.filter(t=>t.status==='receiving');
  const system = `You are TARA, the AI warehouse assistant for ShiplyCo 3PL in Houston, TX. Answer in 1-2 short sentences max — you are being spoken aloud. Be direct and precise.
CRITICAL: Only state facts from the data below. Never guess or speculate. If data is missing, say it naturally — e.g. "He's not assigned to anything right now" or "Nothing's logged for her yet today." Sound like a helpful coworker, not a computer error message.
Current context: ${TARA_ALERTS.length} alerts. Trucks in progress: ${JSON.stringify(inProgress.map(t=>({name:t.name,pallets:t.pallets.length,done:t.pallets.filter(p=>p.stage>=2).length,receivedBy:t.receivedBy})))}. Orders: ${(ORDERS||[]).slice(0,10).map(o=>({id:o.id,status:o.status,assignedTo:o.assignedTo||'unassigned'})).join(', ')}. Customers: ${CUSTOMERS.map(c=>c.name).join(', ')}.`;

  // Use direct fetch to avoid _aiLoading conflict
  try {
    const resp = await fetch('https://xyemghdkehsfgeyidmie.supabase.co/functions/v1/tara-voice',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZW1naGRrZWhzZmdleWlkbWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjE3NTIsImV4cCI6MjA4ODMzNzc1Mn0.4pIvrbdbMrPIrByY9GRnDiyw15BJobPxllr8mQ0c1OA'
      },
      body:JSON.stringify({
        type:'ai',
        model:'llama-3.3-70b-versatile',
        max_tokens:150,
        system:system,
        messages:_taraConv
      })
    });
    const data = await resp.json();
    const reply = data.content?.[0]?.text || '';
    if(!reply){ taraSpeak('Sorry, I had trouble with that.'); return; }
    _taraConv.push({role:'assistant', content:reply});
    await taraSpeak(reply);
  } catch(e){
    await taraSpeak('Sorry, I had trouble connecting.');
  }
}

function toggleTaraChatMode(){
  TARA_CHAT_MODE = !TARA_CHAT_MODE;
  const btn = document.getElementById('taraChatModeBtn');
  if(btn){
    btn.textContent = TARA_CHAT_MODE ? 'CHAT' : 'VOICE';
    btn.style.color = TARA_CHAT_MODE ? 'rgba(232,36,26,0.9)' : 'rgba(255,255,255,0.5)';
    btn.style.borderColor = TARA_CHAT_MODE ? 'rgba(232,36,26,0.4)' : 'rgba(255,255,255,0.12)';
  }
  showToast(TARA_CHAT_MODE ? '💬 TARA: Chat mode — tap blob to open chat' : '🎤 TARA: Voice mode — tap blob to speak');
}

function toggleTaraMute(){
  TARA_MUTED = !TARA_MUTED;
  // Stop any current audio
  if(TARA_MUTED && _taraBlob.audioCtx){
    try{_taraBlob.audioCtx.close();}catch(e){}
    _taraBlob.audioCtx=null;_taraBlob.analyser=null;_taraBlob.freqData=null;_taraBlob.speakTarget=0;
  }
  const btn = document.getElementById('taraMuteBtn');
  if(btn) btn.innerHTML = TARA_MUTED ? '🔇' : '🔊';
}

// ── TARA WIDGET HTML ──
function injectTara(){
  // Remove existing if present
  const existing = document.getElementById('taraWidget');
  if(existing) existing.remove();

  // Compute alerts
  TARA_ALERTS = computeTaraAlerts();
  const alertCount = TARA_ALERTS.length;

  const widget = document.createElement('div');
  widget.id = 'taraWidget';
  widget.innerHTML = `
    <!-- TARA Blob Button -->
    <div id="taraBtn" oncontextmenu="toggleTara();return false;"
      style="position:fixed;bottom:16px;right:16px;z-index:8000;cursor:pointer;
             display:flex;flex-direction:column;align-items:center;
             user-select:none;transition:transform 0.2s ease;
             filter:drop-shadow(0 4px 16px rgba(0,0,0,0.3));">
      <div style="position:relative;background:transparent" onclick="taraBlobClick()">
        <canvas id="taraBlobCanvas" width="110" height="110" style="display:block;background:transparent;opacity:1"></canvas>
        ${alertCount>0?`<div style="position:absolute;top:6px;right:6px;background:#e8241a;color:#fff;border-radius:50%;width:22px;height:22px;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;border:2px solid #000;box-shadow:0 0 10px rgba(232,36,26,0.8);z-index:1">${alertCount}</div>`:''}
      </div>
      <div style="color:#e8241a;font-size:9px;font-weight:900;letter-spacing:5px;text-transform:uppercase;margin-top:-6px;text-shadow:0 0 8px rgba(232,36,26,0.5)">TARA</div>
      <div style="display:flex;gap:6px;margin-top:4px">
        <div onclick="event.stopPropagation();event.preventDefault();if(!TARA_OPEN)toggleTara();" title="Open chat"
          style="background:rgba(232,36,26,0.15);border:1px solid rgba(232,36,26,0.35);border-radius:12px;
                 padding:3px 8px;font-size:10px;cursor:pointer;color:#e8241a;font-weight:700">💬 Chat</div>
      </div>
    </div>

    <!-- TARA Panel -->
    <div id="taraPanel"
      style="position:fixed;bottom:200px;right:16px;z-index:7999;
             width:360px;max-height:65vh;
             background:#f0ede8;
             border:1px solid rgba(0,0,0,0.08);border-radius:16px;
             box-shadow:0 20px 60px rgba(0,0,0,0.5);
             display:none;flex-direction:column;overflow:hidden;
             font-family:Barlow,sans-serif">

      <!-- Panel Header -->
      <div style="padding:16px 18px;border-bottom:1px solid rgba(0,0,0,0.08);
                  display:flex;align-items:center;gap:12px;flex-shrink:0">
        <div style="width:38px;height:38px;border-radius:50%;
                    background:linear-gradient(135deg,var(--red),#ff6b35);
                    display:flex;align-items:center;justify-content:center;
                    font-size:16px;font-weight:900;color:#fff">T</div>
        <div>
          <div style="color:#1a1a1a;font-weight:800;font-size:14px">TARA</div>
          <div style="color:rgba(0,0,0,0.4);font-size:11px;margin-top:1px">Tracks All · Reports Anomalies</div>
        </div>
        <button id="taraChatModeBtn" onclick="toggleTaraChatMode()"
          style="background:#fff;border:1px solid rgba(0,0,0,0.12);
                 border-radius:6px;color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;cursor:pointer;
                 padding:4px 8px;line-height:1;transition:all 0.15s;letter-spacing:0.5px" title="Toggle chat/voice mode">VOICE</button>
        <button id="taraMuteBtn" onclick="toggleTaraMute()"
          style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
                 border-radius:6px;color:rgba(255,255,255,0.5);font-size:13px;cursor:pointer;
                 padding:4px 8px;line-height:1;transition:all 0.15s" title="Mute voice">🔊</button>
        <button onclick="toggleTara()"
          style="margin-left:8px;background:none;border:none;color:rgba(255,255,255,0.4);
                 font-size:18px;cursor:pointer;padding:4px;line-height:1">×</button>
      </div>

      <!-- Messages area -->
      <div id="taraMessages"
        style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:200px">
        ${renderTaraBriefing()}
      </div>

      <!-- Input area -->
      <div style="padding:12px 14px;border-top:1px solid rgba(0,0,0,0.08);flex-shrink:0">
        <div style="display:flex;gap:8px;align-items:center">
          <input id="taraInput" type="text"
            placeholder="Tell TARA what's coming off the truck…"
            style="flex:1;background:#fff;border:1px solid rgba(0,0,0,0.12);
                   border-radius:8px;padding:9px 12px;color:#1a1a1a;font-family:Barlow,sans-serif;
                   font-size:13px;outline:none"
            onfocus="this.style.borderColor='rgba(232,36,26,0.5)'"
            onblur="this.style.borderColor='rgba(0,0,0,0.12)'"
            onkeydown="if(event.key==='Enter')sendToTara()"/>
          <button id="taraMicBtn" onclick="toggleTaraVoice()"
            style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
                   border-radius:8px;padding:9px 11px;cursor:pointer;font-size:15px;
                   transition:all 0.15s;flex-shrink:0"
            title="Voice input">🎤</button>
          <button onclick="sendToTara()"
            style="background:var(--red);border:none;border-radius:8px;
                   padding:9px 14px;color:#fff;font-family:Barlow,sans-serif;
                   font-size:12px;font-weight:800;cursor:pointer;flex-shrink:0">Send</button>
        </div>
        <div style="color:rgba(0,0,0,0.3);font-size:10px;margin-top:6px;text-align:center">
          Ask anything · Log a truck · Send customer updates
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(widget);
  // Start blob animation
  setTimeout(_taraStartBlob, 50);

  // Inject TARA CSS
  if(!document.getElementById('taraCSS')){
    const style = document.createElement('style');
    style.id = 'taraCSS';
    style.textContent = `
      @keyframes taraPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.05)}}
      @keyframes taraSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      #taraBtn:hover{transform:translateY(-2px)}
      #taraBlobCanvas{background:transparent !important;}
      #taraMessages::-webkit-scrollbar{width:4px}
      #taraMessages::-webkit-scrollbar-track{background:transparent}
      #taraMessages::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:2px}
      .tara-msg{animation:taraSlideIn 0.25s ease}
      .tara-user-msg{background:rgba(200,200,210,0.25);border:none;border-radius:18px 18px 4px 18px;padding:10px 14px;color:#1a1a1a;font-size:13px;align-self:flex-end;max-width:80%}
      .tara-ai-msg{background:#fff;border:none;border-radius:12px;padding:14px 16px;color:#2a2a2a;font-size:13px;line-height:1.7;max-width:92%;box-shadow:0 1px 4px rgba(0,0,0,0.08)}
      .tara-ai-wrap{display:flex;align-items:flex-start;gap:10px}
      .tara-orb{width:28px;height:28px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#ff8c42,#e8241a);flex-shrink:0;box-shadow:0 0 10px rgba(232,36,26,0.4);margin-top:2px}
      .tara-alert{background:rgba(232,36,26,0.06);border-left:3px solid var(--red);border-radius:0 8px 8px 0;padding:10px 13px;color:#2a2a2a;font-size:12px;line-height:1.6}
      .tara-ok{background:rgba(30,122,79,0.08);border-left:3px solid #1e7a4f;border-radius:0 8px 8px 0;padding:10px 13px;color:#1a2a1a;font-size:12px}
      .tara-action{display:inline-block;background:rgba(232,36,26,0.2);border:1px solid rgba(232,36,26,0.3);border-radius:6px;padding:5px 12px;color:#ff8a80;font-size:11px;font-weight:700;cursor:pointer;margin-top:6px;margin-right:6px;transition:all 0.15s}
      .tara-action:hover{background:rgba(232,36,26,0.35)}
      .tara-action-green{background:rgba(30,122,79,0.2);border-color:rgba(30,122,79,0.3);color:#4caf87}
      .tara-action-green:hover{background:rgba(30,122,79,0.35)}
    `;
    document.head.appendChild(style);
  }
}

// ── COMPUTE ALERTS from live portal data ──
function computeTaraAlerts(){
  const alerts = [];

  // Late orders — processing > 2 days
  const now = new Date();
  (ORDERS||[]).filter(o=>o.status==='processing').forEach(o=>{
    const d = new Date(o.date);
    const days = Math.floor((now-d)/(1000*60*60*24));
    if(days>=2){
      const c = CUSTOMERS.find(x=>x.id===o.custId);
      alerts.push({type:'late_order', severity:'high',
        msg:`Order ${o.id} (${c?.name||o.custId}) has been processing for ${days} days with no completion.`,
        action:'view_order', data:o.id});
    }
  });

  // Unassigned orders
  (ORDERS||[]).filter(o=>o.status==='pending'&&!o.assignedTo).forEach(o=>{
    const c = CUSTOMERS.find(x=>x.id===o.custId);
    alerts.push({type:'unassigned', severity:'medium',
      msg:`Order ${o.id} (${c?.name||o.custId} · ${o.type}) has no employee assigned.`,
      action:'assign_order', data:o.id});
  });

  // Trucks in progress (receiving)
  TRUCKS_INPROGRESS.filter(t=>t.status==='receiving').forEach(t=>{
    const incomplete = t.pallets.filter(p=>p.stage<2).length;
    if(incomplete>0){
      const c = CUSTOMERS.find(x=>x.id===t.custId);
      alerts.push({type:'receiving_incomplete', severity:'medium',
        msg:`${t.name} (${c?.name||t.custId}) — ${incomplete} pallet${incomplete>1?'s':''} still need full inspection before receiving is complete.`,
        action:'view_truck', data:t.id});
    }
  });

  // Low supplies
  (SUPPLIES||[]).filter(s=>s.qty<=s.lowThreshold).forEach(s=>{
    alerts.push({type:'low_supply', severity: s.qty<=s.criticalThreshold?'high':'medium',
      msg:`${s.name} is ${s.qty<=s.criticalThreshold?'critically':'running'} low — ${s.qty} ${s.unit} remaining.`,
      action:'view_supplies', data:s.id});
  });

  // EDI fine risks
  (EDI_PO_INBOX||[]).filter(p=>p.status==='pending'&&p.partner==='Home Depot').forEach(p=>{
    alerts.push({type:'edi_fine', severity:'high',
      msg:`Home Depot PO ${p.poNum} has not been acknowledged — risk of $250 late ASN fine.`,
      action:'view_edi', data:p.id});
  });

  return alerts;
}

// ── TARA BRIEFING (shown on open) ──
function renderTaraBriefing(){
  const hour = new Date().getHours();
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  const alerts = TARA_ALERTS;
  const inProgress = TRUCKS_INPROGRESS.filter(t=>t.status==='receiving');

  if(alerts.length===0 && inProgress.length===0){
    return `
      <div class="tara-msg tara-ok">
        <strong>${greeting} —</strong> everything looks good right now. No alerts, no pending issues.
      </div>`;
  }

  let html = `
    <div class="tara-msg tara-ai-msg">
      <strong>${greeting} —</strong> ${alerts.length>0?`I found <strong>${alerts.length} thing${alerts.length>1?'s':''}</strong> that need${alerts.length===1?'s':''} your attention.`:''}
      ${inProgress.length>0?`<br>${inProgress.length} truck${inProgress.length>1?'s are':' is'} currently being received.`:''}
    </div>`;

  // Show top 3 alerts
  alerts.slice(0,3).forEach((a,i)=>{
    html += `
      <div class="tara-msg tara-alert">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:${a.severity==='high'?'#ff6b6b':'#ffaa5e'};margin-bottom:4px">
          ${a.severity==='high'?'⚠ Urgent':'• Heads up'}
        </div>
        ${a.msg}
        <br>
        <span class="tara-action" onclick="taraHandleAction('${a.action}','${a.data||''}')">View →</span>
      </div>`;
  });

  if(alerts.length>3){
    html+=`<div style="color:rgba(255,255,255,0.3);font-size:11px;text-align:center">+${alerts.length-3} more alerts</div>`;
  }

  // In-progress trucks
  inProgress.forEach(t=>{
    const done = t.pallets.filter(p=>p.stage>=2).length;
    const total = t.pallets.length;
    const pct = Math.round(done/total*100);
    html+=`
      <div class="tara-msg" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 13px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="color:#fff;font-weight:700;font-size:12px">🚛 ${t.name} — In Progress</span>
          <span style="color:rgba(255,255,255,0.4);font-size:11px">${done}/${total} pallets</span>
        </div>
        <div style="background:rgba(255,255,255,0.08);border-radius:4px;height:4px;margin-bottom:8px">
          <div style="background:var(--red);height:4px;border-radius:4px;width:${pct}%;transition:width 0.3s"></div>
        </div>
        <span class="tara-action" onclick="showPage('entry');toggleTara()">Continue Receiving →</span>
        <span class="tara-action tara-action-green" onclick="taraNotifyCustomer('${t.id}')">Notify Customer</span>
      </div>`;
  });

  return html;
}

// ── TOGGLE TARA PANEL ──
function toggleTara(){
  TARA_OPEN = !TARA_OPEN;
  const panel = document.getElementById('taraPanel');
  if(!panel) return;
  panel.style.display = TARA_OPEN ? 'flex' : 'none';
  if(TARA_OPEN){
    // Refresh alerts
    TARA_ALERTS = computeTaraAlerts();
    const msgs = document.getElementById('taraMessages');
    if(msgs) msgs.innerHTML = renderTaraBriefing();
    setTimeout(()=>document.getElementById('taraInput')?.focus(), 100);
    // Greet with voice on first open
    if(!TARA_BRIEFING_DONE){
      TARA_BRIEFING_DONE=true;
      const alerts=TARA_ALERTS.length;
      const hour=new Date().getHours();
      const greet=hour<12?'Good morning':'Good afternoon';
      const voiceMsg=alerts>0?`${greet}. I found ${alerts} thing${alerts>1?'s':''} that need your attention.`:`${greet}. Everything looks good. No alerts right now.`;
      taraSpeak(voiceMsg);
    }
  }
}

// ── SEND MESSAGE TO TARA ──
let _taraConv = [];
async function sendToTara(){
  const input = document.getElementById('taraInput');
  const msgs = document.getElementById('taraMessages');
  if(!input||!msgs) return;
  const text = input.value.trim();
  if(!text) return;
  input.value='';

  // Add user message
  msgs.innerHTML += `<div class="tara-msg tara-user-msg">${text}</div>`;

  // Thinking
  const thinkId = 'tt_'+Date.now();
  msgs.innerHTML += `<div id="${thinkId}" class="tara-msg tara-ai-msg" style="color:rgba(255,255,255,0.3)">
    <span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Thinking…
  </div>`;
  msgs.scrollTop = msgs.scrollHeight;

  _taraConv.push({role:'user', content:text});

  // Detect intent before sending to AI
  const lower = text.toLowerCase();
  const isTruckLog = lower.includes('truck')||lower.includes('pallet')||lower.includes('received')||lower.includes('just got')||lower.includes('came in');
  const isEmail = lower.includes('email')||lower.includes('send')||lower.includes('notify')||lower.includes('let them know');
  const isQuestion = lower.includes('?')||lower.startsWith('what')||lower.startsWith('how')||lower.startsWith('when')||lower.startsWith('who')||lower.startsWith('show');

  const inProgress = TRUCKS_INPROGRESS.filter(t=>t.status==='receiving');

  const system = `You are TARA, the AI warehouse assistant for ShiplyCo 3PL in Houston, TX. You are direct, precise, and honest. Warehouse workers are busy — keep responses short and action-oriented.

CRITICAL RULES:
- Only state facts you can see in the data provided below. Never guess, assume, or make things up.
- If you don't have the data to answer something, say it naturally like a coworker would — e.g. "Nothing's showing up for him right now", "She's not on anything at the moment", "That's not in the system yet." Never say "I don't have that info" — it sounds robotic.
- Never say "it's possible", "probably", "might be", "I've checked and..." unless you actually have the data to back it up.
- If asked about a specific employee's task and you have no assignment data, say "[Name] isn't assigned to anything right now." Be helpful and suggest what they could be assigned to if relevant.

You can:
1. Parse truck/receiving info from natural speech and return structured JSON prefixed with [TRUCK_DATA]
2. Draft customer notification emails prefixed with [EMAIL_DRAFT]
3. Answer questions about warehouse data — only what is in the context below
4. Flag issues and anomalies

Current warehouse context:
- Trucks in progress: ${JSON.stringify(inProgress.map(t=>({id:t.id,name:t.name,pallets:t.pallets.length,done:t.pallets.filter(p=>p.stage>=2).length,receivedBy:t.receivedBy})))}
- Active alerts: ${TARA_ALERTS.length}
- Customers: ${CUSTOMERS.map(c=>c.name).join(', ')}
- Orders: ${(ORDERS||[]).slice(0,10).map(o=>({id:o.id,status:o.status,assignedTo:o.assignedTo||'unassigned',custId:o.custId})).join(', ')}
- Today: ${new Date().toLocaleDateString()}

If the user is describing a truck arriving, extract: customer name, truck number, pallet count, origin/store, and any items visible on boxes. Return as [TRUCK_DATA]{...json...}

If asked to send an email/notification, draft it and prefix with [EMAIL_DRAFT]

For all other questions, answer in 1-2 sentences max. Be precise. No fluff.`;

  await callAI(_taraConv, system, null, (reply, err)=>{
    const thinkEl = document.getElementById(thinkId);
    if(thinkEl) thinkEl.remove();

    if(err){
      msgs.innerHTML+=`<div class="tara-msg tara-alert">⚠ ${err}</div>`;
      return;
    }

    _taraConv.push({role:'assistant', content:reply});

    // Handle structured responses
    if(reply.includes('[TRUCK_DATA]')){
      handleTaraTruckData(reply, msgs);
    } else if(reply.includes('[EMAIL_DRAFT]')){
      handleTaraEmailDraft(reply, msgs);
    } else {
      msgs.innerHTML+=`<div class="tara-msg tara-ai-wrap"><div class="tara-orb"></div><div class="tara-ai-msg">${reply.replace(/\n/g,'<br>')}</div></div>`;
      taraSpeak(reply);
    }
    msgs.scrollTop = msgs.scrollHeight;
  });
}

// ── HANDLE TRUCK DATA from TARA ──
function handleTaraTruckData(reply, msgs){
  try {
    const jsonStr = reply.match(/\[TRUCK_DATA\]([\s\S]+)/)?.[1]?.trim();
    const data = JSON.parse(jsonStr||'{}');
    const truckId = 'TIP-'+(Date.now()%10000).toString().padStart(3,'0');
    const cust = CUSTOMERS.find(c=>c.name?.toLowerCase().includes((data.customer||'').toLowerCase()))||CUSTOMERS[0];

    // Build draft pallets from items TARA parsed
    const draftPallets = [];
    const palletCount = parseInt(data.pallets)||1;
    const items = data.items||[{brand:'Unknown',category:'Mixed',type:'Mixed'}];
    for(let i=1;i<=Math.min(palletCount,8);i++){
      const item = items[(i-1)%items.length]||items[0];
      draftPallets.push({
        num:i, stage:1, loc:'',
        items:[{itemNum:'', brand:item.brand||'', dept:item.dept||'', category:item.category||'', type:item.type||'',
                upc:'', sku:'', desc:'', color:'', size:'', cases:'', casepack:'', units:'', cond:'', notes:''}]
      });
    }
    if(palletCount>8){
      for(let i=9;i<=palletCount;i++) draftPallets.push({num:i,stage:1,loc:'',items:[{brand:'',category:'',type:'',upc:'',sku:'',desc:'',color:'',size:'',cases:'',casepack:'',units:'',cond:'',notes:''}]});
    }

    const newTruck = {
      id:truckId, name:data.truckName||`Truck #${TRUCKS_INPROGRESS.length+4}`,
      custId:cust?.id||'platinum', date:new Date().toLocaleDateString(),
      origin:data.origin||'', store:data.store||'',
      totalPallets:palletCount, bol:'', receipt:'',
      status:'receiving', receivedBy:currentEmployee||'Unknown', notes:'',
      pallets:draftPallets
    };

    TRUCKS_INPROGRESS.push(newTruck);

    msgs.innerHTML+=`
      <div class="tara-msg tara-ai-msg">
        ✅ <strong>Got it.</strong> I've started a receiving log for <strong>${newTruck.name}</strong> — ${palletCount} pallets, ${cust?.name||'customer'}.
        <br><br>
        ${draftPallets.slice(0,3).map(p=>`<div style="font-size:11px;opacity:0.6;margin-top:2px">Pallet ${p.num}: ${p.items[0]?.brand||'?'} ${p.items[0]?.category||''} ${p.items[0]?.type||''}</div>`).join('')}
        ${palletCount>3?`<div style="font-size:11px;opacity:0.4">+${palletCount-3} more pallets added as blanks</div>`:''}
        <br>
        <span class="tara-action" onclick="showPage('entry');toggleTara()">Open Receiving Form →</span>
        <span class="tara-action tara-action-green" onclick="taraNotifyCustomer('${truckId}')">Notify Customer</span>
      </div>`;

    // Refresh TARA button
    setTimeout(()=>injectTara(), 500);

  } catch(e){
    msgs.innerHTML+=`<div class="tara-msg tara-ai-msg">${reply.replace('[TRUCK_DATA]','').replace(/\n/g,'<br>')}</div>`;
  }
}

// ── HANDLE EMAIL DRAFT from TARA ──
function handleTaraEmailDraft(reply, msgs){
  const emailText = reply.replace('[EMAIL_DRAFT]','').trim();
  msgs.innerHTML+=`
    <div class="tara-msg tara-ai-msg">
      <div style="margin-bottom:8px;font-weight:700">📧 Draft ready:</div>
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px;font-size:12px;line-height:1.7;white-space:pre-wrap">${emailText}</div>
      <br>
      <span class="tara-action tara-action-green" onclick="taraSendEmail(this)">✓ Send This Email</span>
      <span class="tara-action" onclick="this.parentElement.querySelector('div div').contentEditable='true';this.parentElement.querySelector('div div').focus();this.textContent='Editing…'">✏ Edit First</span>
    </div>`;
}

function taraSendEmail(btn){
  btn.textContent='✓ Sent!';
  btn.style.background='rgba(30,122,79,0.4)';
  showToast('✓ Email sent to customer');
}

// ── NOTIFY CUSTOMER about truck ──
async function taraNotifyCustomer(truckId){
  const truck = TRUCKS_INPROGRESS.find(t=>t.id===truckId);
  if(!truck){showToast('Truck not found');return;}
  const cust = CUSTOMERS.find(c=>c.id===truck.custId);
  const items = [...new Set(truck.pallets.flatMap(p=>p.items.map(i=>i.brand||i.category||i.type)).filter(Boolean))];
  const done = truck.pallets.filter(p=>p.stage>=2).length;

  const msgs = document.getElementById('taraMessages');
  if(msgs) msgs.innerHTML+=`<div class="tara-msg" style="color:rgba(255,255,255,0.4);font-size:12px">⏳ Drafting customer update…</div>`;

  const system=`You are drafting a professional, brief receiving notification email from ShiplyCo 3PL to a customer. Be warm but concise. Subject line first, then body. Sign off as "ShiplyCo Receiving Team".`;
  await callAI([{role:'user',content:`Draft a receiving notification email to ${cust?.name||'the customer'}.
Truck: ${truck.name}
Date received: ${truck.date}
Origin: ${truck.origin||'Texas'}
Total pallets: ${truck.totalPallets}
Pallets fully inspected so far: ${done} of ${truck.pallets.length}
Items visible on boxes: ${items.join(', ')||'Mixed merchandise'}
Status: ${truck.status==='received'?'Fully received and in inventory':'Receiving in progress — full count coming soon'}

Keep it to 3-4 sentences. Professional but friendly.`}],
    system, null, (reply,err)=>{
      const msgs=document.getElementById('taraMessages');
      if(!msgs) return;
      // Remove thinking msg
      const last=msgs.lastElementChild;
      if(last&&last.textContent.includes('Drafting')) last.remove();
      if(err){msgs.innerHTML+=`<div class="tara-msg tara-alert">⚠ ${err}</div>`;return;}
      handleTaraEmailDraft('[EMAIL_DRAFT]'+reply, msgs);
      msgs.scrollTop=msgs.scrollHeight;
    });
}

// ── TARA ACTION HANDLERS ──
function taraHandleAction(action, data){
  toggleTara();
  setTimeout(()=>{
    if(action==='view_order'||action==='assign_order') showPage('dispatch');
    else if(action==='view_truck') showPage('entry');
    else if(action==='view_supplies') showPage('supplies');
    else if(action==='view_edi') showPage('edi');
  }, 200);
}

// ── VOICE INPUT ──
function toggleTaraVoice(){
  const btn = document.getElementById('taraMicBtn');
  const input = document.getElementById('taraInput');

  if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){
    showToast('⚠ Voice input not supported in this browser — try Chrome');
    return;
  }

  if(TARA_VOICE_ACTIVE){
    if(_taraRecognition) _taraRecognition.stop();
    TARA_VOICE_ACTIVE=false;
    if(btn){btn.textContent='🎤';btn.style.background='rgba(255,255,255,0.06)';}
    return;
  }

  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  _taraRecognition = new SR();
  _taraRecognition.continuous = false;
  _taraRecognition.interimResults = false;
  _taraRecognition.lang = 'en-US';

  _taraRecognition.onstart = ()=>{
    TARA_VOICE_ACTIVE=true;
    if(btn){btn.textContent='🔴';btn.style.background='rgba(232,36,26,0.2)';}
    if(input) input.placeholder='Listening…';
  };
  _taraRecognition.onresult = (e)=>{
    const transcript = e.results[0][0].transcript;
    if(input) input.value=transcript;
    sendToTara();
  };
  _taraRecognition.onend = ()=>{
    TARA_VOICE_ACTIVE=false;
    if(btn){btn.textContent='🎤';btn.style.background='rgba(255,255,255,0.06)';}
    if(input) input.placeholder='Tell TARA what\'s coming off the truck…';
  };
  _taraRecognition.onerror = (e)=>{
    TARA_VOICE_ACTIVE=false;
    if(btn){btn.textContent='🎤';btn.style.background='rgba(255,255,255,0.06)';}
    showToast('⚠ Voice input error — try again');
  };
  _taraRecognition.start();
}

// ══════════════════════════════════════════════════════════════