class EditorController {
  static loopThresholdStorageKey = "gus-patch-editor-loop-thresholds";
  static defaultLoopThresholds = {variation: 50, drift: 25, boundary: 45};

  static ensureAudio(){
    if(!state.audio.ctx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)throw new Error(t("web_audio_unsupported"));
      state.audio.ctx=new AC();
      state.audio.master=state.audio.ctx.createGain();
      state.audio.master.gain.value=0.8;
      state.audio.master.connect(state.audio.ctx.destination);
    }
    if(state.audio.ctx.state==="suspended")state.audio.ctx.resume();
  }

  static gusEnvMs(rate,start,end){
    let r=(3-((rate>>6)&3))*3, p=rate&0x3f;
    if(!p)p=1;
    let t=Math.abs(end-start);
    t=13>r?t<<(13-r):t>>(r-13);
    return (t*10)/(p*441);
  }

  static computeEnv(s){
    if(!(s.modes&MENV))return {attack:0.005,decay:0.001,sustain:1,release:0.03};
    const r=s.envRates, o=s.envOffsets;
    const attack=clamp(gusEnvMs(r[0],0,o[0])/1000,0.001,8);
    const decay=clamp(gusEnvMs(r[1],o[0],o[1])/1000,0.001,8);
    const sustain=clamp(o[2]/255,0.001,1);
    let release=clamp(gusEnvMs(r[3],o[2],0)/1000,0.005,8);
    if(s.modes&MCLAMP)release=Math.min(release,0.06);
    return {attack,decay,sustain,release};
  }

  static rootHz(s){
    let f=s.rootFreq;
    if(!f||f<=0)f=s.sampleRate||22050;
    if(f>100000)f/=1000;
    return clamp(f,1,200000);
  }

  static minimumLoopFrames(s){
    const sampleRate=clamp(Number(s.sampleRate)||22050,4000,192000);
    return Math.max(64,Math.ceil(sampleRate*0.02));
  }

  static readLoopThresholds(){
    const read=(id,fallback)=>{
      const value=Number($(id)?.value);
      return clamp(Number.isFinite(value)?value:fallback,1,200)/100;
    };
    return {
      variation: read("loopVariationThreshold",EditorController.defaultLoopThresholds.variation),
      drift: read("loopDriftThreshold",EditorController.defaultLoopThresholds.drift),
      boundary: read("loopBoundaryThreshold",EditorController.defaultLoopThresholds.boundary)
    };
  }

  static updateLoopThresholdLabels(){
    for(const [inputId,outputId] of [
      ["loopVariationThreshold","loopVariationThresholdValue"],
      ["loopDriftThreshold","loopDriftThresholdValue"],
      ["loopBoundaryThreshold","loopBoundaryThresholdValue"]
    ]){
      const input=$(inputId), output=$(outputId);
      if(input&&output)output.value=`${input.value}%`;
    }
  }

  static bindLoopThresholdControls(){
    const controls=[
      $("loopVariationThreshold"),
      $("loopDriftThreshold"),
      $("loopBoundaryThreshold")
    ];
    if(controls.some(control=>!control)||controls[0].dataset.bound==="true")return;

    try{
      const saved=JSON.parse(localStorage.getItem(EditorController.loopThresholdStorageKey)||"{}");
      const values=[
        clamp(Number(saved.variation)||EditorController.defaultLoopThresholds.variation,1,200),
        clamp(Number(saved.drift)||EditorController.defaultLoopThresholds.drift,1,200),
        clamp(Number(saved.boundary)||EditorController.defaultLoopThresholds.boundary,1,200)
      ];
      controls.forEach((control,index)=>control.value=String(values[index]));
    }catch(error){
      console.warn("Unable to load loop detection thresholds:",error);
    }

    const save=()=>{
      const values=EditorController.readLoopThresholds();
      try{
        localStorage.setItem(EditorController.loopThresholdStorageKey,JSON.stringify({
          variation:values.variation*100,
          drift:values.drift*100,
          boundary:values.boundary*100
        }));
      }catch(error){
        console.warn("Unable to save loop detection thresholds:",error);
      }
    };
    controls.forEach(control=>{
      control.dataset.bound="true";
      control.addEventListener("input",EditorController.updateLoopThresholdLabels);
      control.addEventListener("change",save);
    });
    EditorController.updateLoopThresholdLabels();
  }

  static sampleHasValidLoop(s){
    if(!s?.pcm?.length||(s.modes&MLOOP)===0)return false;
    const bps=fmt(s).bps, total=Math.floor(s.pcm.length/bps), loop=loopInfo(s);
    return s.loopStart>=0
      && s.loopEnd>s.loopStart
      && s.loopEnd<=s.pcm.length
      && loop.start>=0
      && loop.end<=total
      && loop.end-loop.start>=EditorController.minimumLoopFrames(s);
  }

  static findStableLoop(s){
    const samples=ensureFloat(s), total=samples.length;
    const thresholds=EditorController.readLoopThresholds();
    const minLoop=EditorController.minimumLoopFrames(s);
    const sampleRate=clamp(Number(s.sampleRate)||22050,4000,192000);
    const blockFrames=Math.max(16,Math.round(sampleRate*0.01));
    const minStableBlocks=Math.max(4,Math.ceil(sampleRate*0.1/blockFrames));
    if(total<minLoop+Math.ceil(sampleRate*0.1))return null;

    const blockRms=[];
    for(let start=0;start<total;start+=blockFrames){
      const end=Math.min(total,start+blockFrames);
      let sum=0;
      for(let i=start;i<end;i++)sum+=samples[i]*samples[i];
      blockRms.push(Math.sqrt(sum/(end-start)));
    }

    let stableStart=-1, stableEnd=-1;
    const maxStableBlocks=Math.min(blockRms.length,Math.ceil(sampleRate*0.5/blockFrames));
    for(let span=maxStableBlocks;span>=minStableBlocks;span--){
      let bestVariation=Infinity, bestMean=0, bestBlock=-1;
      for(let start=0;start+span<=blockRms.length;start++){
        let min=Infinity, max=0, sum=0, weightedSum=0;
        for(let i=start;i<start+span;i++){
          const value=blockRms[i];
          min=Math.min(min,value);
          max=Math.max(max,value);
          sum+=value;
          weightedSum+=(i-start)*value;
        }
        const mean=sum/span;
        const variation=(max-min)/Math.max(mean,1e-8);
        const meanIndex=(span-1)/2;
        const slope=(weightedSum-meanIndex*sum)/(span*(span*span-1)/12);
        const drift=Math.abs(slope)*(span-1)/Math.max(mean,1e-8);
        if(mean>0.0015&&variation<=thresholds.variation&&drift<=thresholds.drift
          &&(variation<bestVariation||(variation===bestVariation&&mean>bestMean))){
          bestVariation=variation;
          bestMean=mean;
          bestBlock=start;
        }
      }
      if(bestBlock>=0){
        stableStart=bestBlock*blockFrames;
        stableEnd=Math.min(total,(bestBlock+span)*blockFrames);
        break;
      }
    }
    if(stableStart<0)return null;

    const signatureFrames=Math.min(32,Math.max(8,Math.floor(minLoop/4)));
    const loopEnd=stableEnd-signatureFrames;
    const maxStart=loopEnd-minLoop;
    if(maxStart<stableStart)return null;

    let bestStart=-1, bestError=Infinity;
    for(let start=stableStart;start<=maxStart;start++){
      let error=0, energy=0;
      for(let offset=0;offset<signatureFrames;offset++){
        const a=samples[start+offset], b=samples[loopEnd+offset];
        const difference=a-b;
        error+=difference*difference;
        energy+=a*a+b*b;
      }
      const normalizedError=error/Math.max(energy,1e-8);
      if(normalizedError<bestError){
        bestError=normalizedError;
        bestStart=start;
      }
    }
    if(bestStart<0||Math.sqrt(bestError)>thresholds.boundary)return null;
    return {start:bestStart,end:loopEnd};
  }

  static createSampleLoop(){
    const sample=state.selSample;
    if(!sample)return;
    openConfirmationDialog(
      t("create_loop_confirmation_title"),
      t("create_loop_confirmation_message",{name:sample.name||t("sample")}),
      t("create_loop"),
      ()=>EditorController.applySampleLoop(sample)
    );
  }

  static applySampleLoop(sample){
    const loop=EditorController.findStableLoop(sample);
    if(!loop){
      showStatus(t("loop_detection_failed"),"bad");
      return;
    }
    const bps=fmt(sample).bps;
    sample.loopStart=loop.start*bps;
    sample.loopEnd=loop.end*bps;
    sample.fractions=0;
    sample.modes|=MLOOP;
    renderSampleEditor();
    render();
    showStatus(t("loop_created",{start:loop.start.toLocaleString(),end:loop.end.toLocaleString()}),"ok");
  }

  static playSample(s, note=60, velocity=100, hold=false){
    ensureAudio();
    const ctx=state.audio.ctx;
    let floats=ensureFloat(s);
    const sr=clamp(s.sampleRate||22050,4000,192000);
    let li=loopInfo(s);
  
    if(s.modes&MREV){
      const r=new Float32Array(floats.length);
      for(let i=0;i<floats.length;i++)r[i]=floats[floats.length-1-i];
      floats=r;
      if(li.enabled){
        const t=floats.length;
        li={enabled:true,start:t-li.end,end:t-li.start,total:t};
      }
    }
  
    const buf=ctx.createBuffer(1,floats.length,sr);
    buf.copyToChannel(floats,0);
    const src=ctx.createBufferSource(); src.buffer=buf;
    const rate=s._generatorInfo?.isDrum
      ? 1
      : clamp(midiToFreq(note)/rootHz(s),0.01,32);
    src.playbackRate.value=rate;
  
    if(li.enabled){
      src.loop=true;
      src.loopStart=clamp(li.start/sr,0,buf.duration);
      src.loopEnd=clamp(li.end/sr,0.0001,buf.duration);
    }
  
    const gain=ctx.createGain(); src.connect(gain).connect(state.audio.master);
    const env=computeEnv(s);
    const now=ctx.currentTime+0.005;
    const patchVol=state.patch?(state.patch.header.masterVolume??127)/127:1;
    const peak=Math.max(0.0001,(velocity/127)*patchVol);
    gain.gain.setValueAtTime(0.0001,now);
    gain.gain.exponentialRampToValueAtTime(peak,now+env.attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001,peak*env.sustain),now+env.attack+env.decay);
  
    const voice={src,gain,sample:s,note,velocity,env,released:false};
    src.onended=()=>{
      state.audio.voices.delete(voice);
      if(state.audio.hold===voice)state.audio.hold=null;
      try{gain.disconnect();}catch(_){}
    };
    src.start(now);
    state.audio.voices.add(voice);
    if(hold)state.audio.hold=voice;
    return voice;
  }

  static releaseVoice(v,fast=false){
    if(!v||v.released)return;
    v.released=true;
    const ctx=state.audio.ctx; if(!ctx)return;
    const now=ctx.currentTime, g=v.gain.gain;
    let cur=0.0001;
    try{cur=Math.max(0.0001,g.value);}catch(_){}
    g.cancelScheduledValues(now);
    g.setValueAtTime(cur,now);
    const rel=Math.max(0.005,fast?Math.min(v.env.release,0.04):v.env.release);
    g.exponentialRampToValueAtTime(0.0001,now+rel);
    try{v.src.stop(now+rel+0.06);}catch(_){}
  }

  static releaseAllVoices(fast=false){ for(const v of Array.from(state.audio.voices))releaseVoice(v,fast); }

  static stopAllVoices(){
    for(const v of Array.from(state.audio.voices)){
      try{v.src.stop();}catch(_){}
      try{v.gain.disconnect();}catch(_){}
      state.audio.voices.delete(v);
    }
    state.audio.hold=null;
  }

  static clampView(n){
    if(!n)return;
    const visible=n/state.zoom;
    state.offset=clamp(state.offset,0,Math.max(0,n-visible));
    if(state.zoom===1)state.offset=0;
  }

  static updateZoomUI(){const el=$("zoomLevelText"); if(el)el.textContent=state.zoom.toFixed(1)+"x";}

  static zoomCanvas(factor, centerX=null){
    const s=state.selSample; if(!s)return;
    const n=ensureFloat(s).length;
    const oldZoom=state.zoom;
    state.zoom=clamp(state.zoom*factor,1,1000);
    if(oldZoom===state.zoom)return;
    const w=$("waveCanvas").getBoundingClientRect().width;
    const mouseRatio=centerX!==null?centerX/w:0.5;
    const oldVisible=n/oldZoom;
    const newVisible=n/state.zoom;
    const mouseSmp=state.offset+mouseRatio*oldVisible;
    state.offset=mouseSmp-mouseRatio*newVisible;
    clampView(n); updateZoomUI(); drawWave();
  }

  static smpToX(smp,w,n){const v=n/state.zoom; return ((smp-state.offset)/v)*w;}

  static xToSmp(x,w,n){const v=n/state.zoom; const idx=state.offset+(x/Math.max(1,w))*v; return clamp(Math.round(idx),0,Math.max(0,n-1));}

  static drawWave(){
    const cv=$("waveCanvas");
    if(!cctx)cctx=cv.getContext("2d");
    const rect=cv.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
    if(cv.width!==Math.floor(rect.width*dpr)||cv.height!==Math.floor(rect.height*dpr)){
      cv.width=Math.floor(rect.width*dpr); cv.height=Math.floor(rect.height*dpr);
    }
    const ctx=cctx; ctx.setTransform(dpr,0,0,dpr,0,0);
    const w=rect.width, h=rect.height;
    ctx.clearRect(0,0,w,h);
    const grad=ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,"#08101e"); grad.addColorStop(1,"#060b14");
    ctx.fillStyle=grad; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle="rgba(56,189,248,0.06)";
    for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(0,h/4*i);ctx.lineTo(w,h/4*i);ctx.stroke();}
  
    const s=state.selSample; if(!s){$("waveInfo").textContent="—";$("selInfo").textContent=t("selection_empty");return;}
    const floats=ensureFloat(s), n=floats.length;
    if(!n)return;
    clampView(n);
    const visibleCount=n/state.zoom, startSmp=state.offset, mid=h/2, amp=h/2*0.92;
  
    const li=loopInfo(s);
    if(li.enabled){
      const x1=smpToX(li.start,w,n), x2=smpToX(li.end,w,n);
      if(x2>0&&x1<w){
        const drawX1=Math.max(0,x1), drawX2=Math.min(w,x2);
        ctx.fillStyle="rgba(56,189,248,0.075)";
        ctx.fillRect(drawX1,0,Math.max(1,drawX2-drawX1),h);
        ctx.strokeStyle="rgba(56,189,248,0.55)"; ctx.setLineDash([4,4]);
        if(x1>=0&&x1<=w){ctx.beginPath();ctx.moveTo(x1,0);ctx.lineTo(x1,h);ctx.stroke();}
        if(x2>=0&&x2<=w){ctx.beginPath();ctx.moveTo(x2,0);ctx.lineTo(x2,h);ctx.stroke();}
        ctx.setLineDash([]);
      }
    }
    const selS=Math.min(state.selStart,state.selEnd), selE=Math.max(state.selStart,state.selEnd);
    if(selE>selS){
      const sx=smpToX(selS,w,n), ex=smpToX(selE,w,n);
      if(ex>0&&sx<w){
        const drawSx=Math.max(0,sx), drawEx=Math.min(w,ex);
        ctx.fillStyle="rgba(167,139,250,0.14)";
        ctx.fillRect(drawSx,0,Math.max(1,drawEx-drawSx),h);
        ctx.strokeStyle="rgba(167,139,250,0.8)";
        if(sx>=0&&sx<=w){ctx.beginPath();ctx.moveTo(sx,0);ctx.lineTo(sx,h);ctx.stroke();}
        if(ex>=0&&ex<=w){ctx.beginPath();ctx.moveTo(ex,0);ctx.lineTo(ex,h);ctx.stroke();}
      }
    }
  
    // =====================================================================
    // PERBAIKAN DI SINI: Sesuaikan lineWidth berdasarkan zoom & cegah gap
    // =====================================================================
    let lineWidth = 1;
    if (state.zoom >= 2) lineWidth = 1.2;
    if (state.zoom >= 4) lineWidth = 1.5;
    if (state.zoom >= 8) lineWidth = 2.0;
    if (state.zoom >= 16) lineWidth = 2.5;
    if (state.zoom >= 32) lineWidth = 3.0;
  
    // =====================================================================
    // PERBAIKAN FINAL: lineWidth = 1 + Logika Penyambung Horizontal
    // =====================================================================
    ctx.strokeStyle = "#7dd3fc"; 
    ctx.lineWidth = 1; 
    ctx.lineJoin = "round"; // Mencegah sudut tajam yang patah
    ctx.lineCap = "round";  // Mencegah ujung garis yang patah/titik hilang
    ctx.beginPath();
  
    let prevX = -1;
    let prevTopY = 0;
    let prevBotY = 0;
  
    for(let x=0; x<w; x++){
      const s0 = Math.floor(startSmp + (x / w) * visibleCount);
      let s1 = Math.floor(startSmp + ((x + 1) / w) * visibleCount);
      
      // Pastikan minimal membaca 1 sampel
      if (s1 <= s0) s1 = s0 + 1;
      if (s0 >= n) break;
  
      let mn = 1, mx = -1;
      for(let i = s0; i < s1; i++){
        const v = floats[i];
        if(v < mn) mn = v;
        if(v > mx) mx = v;
      }
      if(mn > mx){ mn = 0; mx = 0; }
      
      // Konversi nilai amplitudo ke koordinat Y layar
      const yTop = mid - mx * amp;
      const yBot = mid - mn * amp;
  
      // 1. Gambar batang vertikal (badan gelombang di kolom ini)
      ctx.moveTo(x + 0.5, yTop); 
      ctx.lineTo(x + 0.5, yBot);
  
      // 2. Gambar garis penyambung ke kolom sebelumnya (agar tidak putus)
      if (prevX !== -1) {
        // Sambungkan bagian atas (puncak)
        ctx.moveTo(prevX + 0.5, prevTopY);
        ctx.lineTo(x + 0.5, yTop);
        // Sambungkan bagian bawah (lembah)
        ctx.moveTo(prevX + 0.5, prevBotY);
        ctx.lineTo(x + 0.5, yBot);
      }
  
      // Simpan posisi saat ini untuk iterasi kolom berikutnya
      prevX = x;
      prevTopY = yTop;
      prevBotY = yBot;
    }
    ctx.stroke();
    // =====================================================================
  
    $("waveInfo").textContent=t("wave_info", {count: n.toLocaleString(), duration: (n/(s.sampleRate||1)).toFixed(2), bit_depth: fmt(s).is16?"16-bit":"8-bit"});
    $("selInfo").textContent=selE>selS?t("selection_count", {count: (selE-selS).toLocaleString()}):t("selection_empty");
  }

  static canvasPt(e){const cv=$("waveCanvas"), r=cv.getBoundingClientRect(); return {x:clamp(e.clientX-r.left,0,r.width),y:clamp(e.clientY-r.top,0,r.height),w:r.width,h:r.height};}

  static yToAmp(y,h){return clamp((h/2-y)/(h/2*0.92),-1,1);}

  static pushUndo(s){
    state.undo.push({ref:{sample:s},floats:ensureFloat(s).slice()});
    if(state.undo.length>16)state.undo.shift();
  }

  static undo(){
    const it=state.undo.pop();
    if(!it){showStatus(t("no_undo"),"bad");return;}
    it.ref.sample._float=it.floats;
    commitFloat(it.ref.sample);
    state.selStart=state.selEnd=0;
    renderSampleEditor(); render();
    showStatus(t("undo_done"),"ok");
  }

  static editRange(s){
    const n=ensureFloat(s).length;
    let a=Math.min(state.selStart,state.selEnd), b=Math.max(state.selStart,state.selEnd);
    if(b<=a){a=0;b=n;}
    return {a:clamp(a,0,n),b:clamp(b,0,n)};
  }

  static applyEdit(kind,param){
    const s=state.selSample; if(!s)return;
    const f=ensureFloat(s), n=f.length; if(!n)return;
    pushUndo(s);
    const {a,b}=editRange(s);
    if(kind==="normalize"){
      let pk=0;
      for(let i=a;i<b;i++)pk=Math.max(pk,Math.abs(f[i]));
      if(pk>1e-5){const g=0.98/pk;for(let i=a;i<b;i++)f[i]=clamp(f[i]*g,-1,1);}
    } else if(kind==="fadeIn"||kind==="fadeOut"){
      const len=Math.max(1,b-a);
      for(let i=0;i<len;i++){
        const idx=a+i, t=i/(len-1||1);
        f[idx]=clamp(f[idx]*(kind==="fadeIn"?t:1-t),-1,1);
      }
    } else if(kind==="silence"){
      for(let i=a;i<b;i++)f[i]=0;
    } else if(kind==="reverse"){
      for(let i=0;i<Math.floor((b-a)/2);i++){const x=a+i, y=b-1-i, t=f[x]; f[x]=f[y]; f[y]=t;}
      if(a===0&&b===n){
        const lp=loopInfo(s), bps=fmt(s).bps;
        s.loopStart=Math.round((n-lp.end)*bps); s.loopEnd=Math.round((n-lp.start)*bps);
      }
    } else if(kind==="amplify"){
      const g=Number(param); if(!isFinite(g))return;
      for(let i=a;i<b;i++)f[i]=clamp(f[i]*g,-1,1);
    } else if(kind==="dc"){
      let sum=0;
      for(let i=a;i<b;i++)sum+=f[i];
      const avg=sum/Math.max(1,b-a);
      for(let i=a;i<b;i++)f[i]=clamp(f[i]-avg,-1,1);
    }
    commitFloat(s);
    renderSampleEditor(); render();
    const operationKey = {fadeIn: "fade_in", fadeOut: "fade_out", dc: "remove_dc"}[kind] || kind;
    showStatus(t("edit_done", {operation: t(operationKey)}),"ok");
  }

  static generatePureWaveformSample(waveform, options = {}) {
    const {
      sampleRate = 22050,
      duration = 0.25,
      rootFreq: defaultRootFreq = 441
    } = options;
  
    if (typeof ProjectPatchGenerator === "undefined") {
      throw new Error("ProjectPatchGenerator not loaded");
    }
    const { pitchFrom, pitchTo } = ProjectPatchGenerator.normalizePitchRange(
      options.pitchFrom,
      options.pitchTo
    );
    const isFullPitchRange = pitchFrom === 0 && pitchTo === 127;
    const rootFreq = isFullPitchRange
      ? defaultRootFreq
      : ProjectPatchGenerator.midiPitchToFrequency(Math.round((pitchFrom + pitchTo) / 2));
    const harm = ProjectPatchGenerator.waveformHarmonics(waveform, 16);
    if (!harm) throw new Error("Unknown waveform: " + waveform);
  
    const preset = {
      harm,
      freq: rootFreq,
      loop: false,
      env: { a: 0.005, d: duration * 0.95, s: 0, r: 0.05 }
    };
    const rendered = new MelodicRenderer(preset, {
      sampleRate, freq: rootFreq, duration
    }).render();
  
    // Konversi ke PCM 16-bit signed
    const pcm = new Uint8Array(rendered.pcm.length * 2);
    for (let i = 0; i < rendered.pcm.length; i++) {
      let v = Math.round(Math.max(-1, Math.min(1, rendered.pcm[i])) * 32768);
      if (v >  32767) v =  32767;
      if (v < -32768) v = -32768;
      if (v < 0) v += 65536;
      pcm[i * 2]     =  v       & 0xff;
      pcm[i * 2 + 1] = (v >> 8) & 0xff;
    }
  
    const shortName = { sine: "SINE", triangle: "TRI", saw: "SAW", square: "SQR" }[waveform] || "WAVE";
  
    return {
      name: shortName,
      fractions: 0,
      dataSize: pcm.length,
      loopStart: 0, loopEnd: 0,
      sampleRate,
      lowFreq: isFullPitchRange
        ? Math.round(8.1757989156 * 1000)
        : Math.floor(ProjectPatchGenerator.midiPitchToFrequency(pitchFrom) * 1000),
      highFreq: isFullPitchRange
        ? Math.round(12543.853951 * 1000)
        : Math.ceil(ProjectPatchGenerator.midiPitchToFrequency(pitchTo) * 1000),
      rootFreq: Math.round(rootFreq * 1000),
      tune: 0, balance: 7,
      envRates: [0, 0, 0, 0, 0, 0],
      envOffsets: [255, 255, 255, 0, 0, 0],
      tremoloSweep: 0, tremoloRate: 0, tremoloDepth: 0,
      vibratoSweep: 0, vibratoRate: 0, vibratoDepth: 0,
      modes: M16,
      scaleFreq: 60, scaleFactor: 1024,
      reserved: new Uint8Array(36),
      pcm, _float: null,
      _autoGenerated: true,
      _generatorInfo: { isDrum: false, program: null, waveform, pitchFrom, pitchTo }
    };
  }

  static generateWaveformDraft(waveform, options = {}) {
    const program = options.program;
    const isDrum = !!options.isDrum; // <-- Tambahkan ini
    const { pitchFrom, pitchTo } = ProjectPatchGenerator.normalizePitchRange(
      options.pitchFrom,
      options.pitchTo
    );
    const generatorWaveform = waveform === "default" ? null : waveform;
  
    // Jika program valid (0-127), gunakan ProjectPatchGenerator
    if (program !== null && program !== undefined && Number.isInteger(program) && program >= 0 && program <= 127) {
      if (!projectPatchGenerator) projectPatchGenerator = new ProjectPatchGenerator();
      const generated = projectPatchGenerator.generate({
        isDrum: isDrum, // <-- Gunakan isDrum dari parameter
        program,
        waveform: generatorWaveform,
        pitchFrom,
        pitchTo
      });
      let sample = generated.patch.instruments[0].layers[0].samples[0];
      const activeEntry = state.patches.find(entry => entry.id === state.currentPatchId);
      const activeIsDrum = (activeEntry?.gmBank ?? 0) === 128;
      const matchingSample = activeEntry?.gmProgram === program && activeIsDrum === isDrum
        ? state.patch?.instruments[state.selInst]?.layers
          .flatMap(layer => layer.samples)
          .find(candidate => candidate._generatorInfo?.program === program
            && !!candidate._generatorInfo.isDrum === isDrum
            && (candidate._generatorInfo.pitchFrom ?? ProjectPatchGenerator.frequencyToMidiPitch(candidate.lowFreq) ?? 0) === pitchFrom
            && (candidate._generatorInfo.pitchTo ?? ProjectPatchGenerator.frequencyToMidiPitch(candidate.highFreq) ?? 127) === pitchTo)
        : null;
      let originalSample = matchingSample?._generatorInfo?.originalSample
        || (matchingSample?._generatorInfo?.waveform === null
          ? cleanSampleForStorage(matchingSample)
          : null);
      if (generatorWaveform === null && originalSample) {
        sample = cleanSampleForStorage(originalSample);
      }
      if (!originalSample) {
        originalSample = generatorWaveform === null || isDrum
          ? cleanSampleForStorage(sample)
          : cleanSampleForStorage(projectPatchGenerator.generate({
          isDrum,
          program,
          waveform: null,
          pitchFrom,
          pitchTo
          }).patch.instruments[0].layers[0].samples[0]);
      }
      sample._autoGenerated = true;
      sample._generatorInfo = { isDrum, program, waveform: generatorWaveform, pitchFrom, pitchTo, originalSample };
      const duration = (sample.pcm.length / 2) / sample.sampleRate;
      return { sample, duration, sourceName: generatorWaveform || "default" };
    }
  
    // Fallback: pure waveform (jika tidak ada program)
    const pureWaveform = generatorWaveform || "sine";
    const sample = generatePureWaveformSample(pureWaveform, { pitchFrom, pitchTo });
    const originalSample = cleanSampleForStorage(generatorWaveform === null
      ? sample
      : generatePureWaveformSample("sine", {
        sampleRate: sample.sampleRate,
        rootFreq: sample.rootFreq / 1000,
        duration: (sample.pcm.length / 2) / sample.sampleRate,
        pitchFrom,
        pitchTo
      }));
    sample._generatorInfo.originalSample = originalSample;
    const duration = (sample.pcm.length / 2) / sample.sampleRate;
    return { sample, duration, sourceName: pureWaveform };
  }

  static regenerateSample(newWaveform) {
    const oldSample = state.selSample;
    if (!oldSample) return;
    const genInfo = oldSample._generatorInfo;
    if (!genInfo) {
      showStatus(t("status_not_autogenerated"), "bad");
      return;
    }
    // (Drum tidak lagi diblokir — drum boleh di-regenerate.)
  
    // ── Best-effort untuk sample LAMA yang belum punya info drum lengkap ──
    // Jika program == null tapi patch aktif adalah drum, gunakan gmProgram patch
    // sebagai program drum agar regenerate menghasilkan suara drum yang benar.
    const entry = state.patches.find(p => p.id === state.currentPatchId);
    const patchIsDrum = (entry?.gmBank ?? 0) === 128;
    const patchProgram = entry?.gmProgram;
  
    let effectiveIsDrum = !!genInfo.isDrum;
    let effectiveProgram = genInfo.program;
    const pitchFrom = genInfo.pitchFrom
      ?? ProjectPatchGenerator.frequencyToMidiPitch(oldSample.lowFreq)
      ?? 0;
    const pitchTo = genInfo.pitchTo
      ?? ProjectPatchGenerator.frequencyToMidiPitch(oldSample.highFreq)
      ?? 127;
    const generatorWaveform = newWaveform === "default" ? null : newWaveform;
    let originalSample = genInfo.originalSample
      || (genInfo.waveform === null ? cleanSampleForStorage(oldSample) : null);
  
    if (genInfo.program === null || genInfo.program === undefined) {
      if (patchIsDrum && Number.isInteger(patchProgram) && patchProgram >= 0 && patchProgram <= 127) {
        effectiveIsDrum = true;
        effectiveProgram = patchProgram;
      }
    }
  
    let newSample;
    const generateSample = waveform => {
      if (effectiveProgram !== null && effectiveProgram !== undefined) {
        if (!projectPatchGenerator) projectPatchGenerator = new ProjectPatchGenerator();
        return projectPatchGenerator.generate({
          isDrum: effectiveIsDrum,
          program: effectiveProgram,
          waveform,
          pitchFrom,
          pitchTo
        }).patch.instruments[0].layers[0].samples[0];
      }
      const pureWaveform = waveform || "sine";
      return generatePureWaveformSample(pureWaveform, {
        sampleRate: oldSample.sampleRate || 22050,
        rootFreq: (oldSample.rootFreq || 441000) / 1000,
        duration: (oldSample.pcm.length / 2) / (oldSample.sampleRate || 22050),
        pitchFrom,
        pitchTo
      });
    };
    try {
      newSample = generatorWaveform === null && originalSample
        ? cleanSampleForStorage(originalSample)
        : generateSample(generatorWaveform);
      if (!originalSample) {
        originalSample = cleanSampleForStorage(generatorWaveform === null
          ? newSample
          : generateSample(null));
      }
    } catch (err) {
      console.error("Regenerate sample error:", err);
      showStatus(t("status_generation_failed", {message: err.message}), "bad");
      return;
    }
  
    newSample._autoGenerated = true;
    newSample._generatorInfo = {
      isDrum: effectiveIsDrum,
      program: effectiveProgram,
      waveform: generatorWaveform,
      pitchFrom,
      pitchTo,
      originalSample
    };
    newSample.name = oldSample.name;  // pertahankan nama user
  
    for (const inst of state.patch.instruments) {
      for (const layer of inst.layers) {
        const idx = layer.samples.indexOf(oldSample);
        if (idx >= 0) {
          layer.samples[idx] = newSample;
          state.selSample = newSample;
          state.selStart = state.selEnd = 0;
          state.undo = [];
          render();
          const variantKey = {
            default: "sample_variant_a",
            sine: "sample_variant_b",
            triangle: "sample_variant_c",
            saw: "sample_variant_d",
            square: "sample_variant_e"
          }[newWaveform] || newWaveform;
          showStatus(t("status_wave_form_autogenerate", {waveform: t(variantKey)}), "ok");
          return;
        }
      }
    }
    showStatus(t("status_sample_not_found_on_layer"), "bad");
  }

  static bindCanvas(){
    EditorController.bindLoopThresholdControls();
    const cv=$("waveCanvas");
    cv.addEventListener("wheel",e=>{
      if(!state.selSample)return;
      e.preventDefault();
      if(e.shiftKey){
        const n=ensureFloat(state.selSample).length;
        const visible=n/state.zoom;
        const delta=(e.deltaY||e.deltaX)/cv.getBoundingClientRect().width;
        state.offset+=delta*visible; clampView(n); drawWave();
      } else {
        const rect=cv.getBoundingClientRect();
        const mouseX=e.clientX-rect.left;
        const factor=e.deltaY<0?1.15:1/1.15;
        zoomCanvas(factor,mouseX);
      }
    },{passive:false});
  
    cv.addEventListener("mousedown",e=>{
      const s=state.selSample; if(!s)return;
      if(e.button===1||(e.button===0&&e.altKey)){
        e.preventDefault();
        state.panning={startX:e.clientX,startOffset:state.offset};
        cv.style.cursor="grabbing"; return;
      }
      const f=ensureFloat(s), n=f.length; if(!n)return;
      ensureAudio();
      const pt=canvasPt(e), idx=xToSmp(pt.x,pt.w,n);
      if(state.tool==="select"){
        state.selStart=idx; state.selEnd=idx;
        state.drag={mode:"sel",s,f,n};
      } else {
        pushUndo(s);
        state.drag={mode:"pen",s,f,n,last:idx};
        f[idx]=yToAmp(pt.y,pt.h);
      }
      drawWave();
    });
    cv.addEventListener("mousemove",e=>{
      if(state.panning){
        const n=ensureFloat(state.selSample).length;
        const dx=e.clientX-state.panning.startX;
        const w=cv.getBoundingClientRect().width;
        const visible=n/state.zoom;
        state.offset=state.panning.startOffset-(dx/w)*visible;
        clampView(n); drawWave(); return;
      }
      if(!state.drag)return;
      const {mode,s,f,n}=state.drag;
      const pt=canvasPt(e), idx=xToSmp(pt.x,pt.w,n);
      if(mode==="sel"){ state.selEnd=idx; }
      else {
        const amp=yToAmp(pt.y,pt.h);
        let a=state.drag.last, b=idx;
        if(a>b)[a,b]=[b,a];
        const steps=Math.max(1,b-a);
        for(let i=a;i<=b;i++)f[i]=amp;
        state.drag.last=idx;
      }
      drawWave();
    });
    cv.addEventListener("mouseup",e=>{
      if(state.panning){state.panning=null; cv.style.cursor="crosshair"; return;}
      if(!state.drag)return;
      if(state.drag.mode==="pen"){ commitFloat(state.drag.s); renderSampleEditor(); showStatus(t("waveform_drawn"),"ok"); }
      state.drag=null; drawWave();
    });
    cv.addEventListener("mouseleave",e=>{
      if(state.panning){state.panning=null; cv.style.cursor="crosshair";}
      if(state.drag){ if(state.drag.mode==="pen"){ commitFloat(state.drag.s); renderSampleEditor(); } state.drag=null; drawWave(); }
    });
    cv.addEventListener("touchstart",e=>{
      if(e.touches.length===1){const t=e.touches[0];cv.dispatchEvent(new MouseEvent("mousedown",{clientX:t.clientX,clientY:t.clientY,bubbles:true}));e.preventDefault();}
    },{passive:false});
    cv.addEventListener("touchmove",e=>{
      if(e.touches.length===1){const t=e.touches[0];cv.dispatchEvent(new MouseEvent("mousemove",{clientX:t.clientX,clientY:t.clientY,bubbles:true}));e.preventDefault();}
    },{passive:false});
    cv.addEventListener("touchend",e=>{cv.dispatchEvent(new MouseEvent("mouseup",{bubbles:true}));e.preventDefault();},{passive:false});
    window.addEventListener("resize",drawWave);
  }

  static renderSampleEditor(save=true){
    const s=state.selSample;
    if(!s){$("sampleEditor").hidden=true; if(save) scheduleSave(); return;}
    $("sampleEditor").hidden=false;
  
    $("sampleTitle").textContent=s.name||t("sample");
    $("sampleFormatPill").textContent=`${fmt(s).is16?"16-bit":"8-bit"} ${t(fmt(s).unsigned?"format_unsigned":"format_signed")} · ${(s.sampleRate||0).toLocaleString()} Hz`;
  
    $("sName").value=s.name||"";
    $("sRate").value=s.sampleRate||0;
    $("sRoot").value=s.rootFreq||0;
    $("sBalance").value=s.balance??7;
    $("sLow").value=s.lowFreq||0;
    $("sHigh").value=s.highFreq||0;
    const bps=fmt(s).bps, total=Math.floor(s.pcm.length/bps);
    const li=loopInfo(s);
    $("sLoopStart").value=Math.round(li.start);
    $("sLoopEnd").value=Math.round(li.end);
    $("sLoopStart").max=total; $("sLoopEnd").max=total;
    $("btnCreateLoop").hidden=EditorController.sampleHasValidLoop(s);
    $("sFractions").value=s.fractions??0;
    $("sTune").value=s.tune??0;
    $("sScaleFreq").value=s.scaleFreq??60;
    $("sScaleFactor").value=s.scaleFactor??1024;
  
    const names=["env_attack","env_decay","env_sustain","env_rate_1","env_rate_2","env_rate_3"];
    const rg=$("envRatesGrid"), og=$("envOffsetsGrid");
    rg.innerHTML=""; og.innerHTML="";
    for(let i=0;i<6;i++){
      const rf=document.createElement("div"); rf.className="field";
      rf.innerHTML=`<label>${t("rate_label", {name: t(names[i])})}</label><input type="number" min="0" max="255" data-er="${i}" value="${s.envRates[i]??0}">`;
      rg.appendChild(rf);
      const of=document.createElement("div"); of.className="field";
      of.innerHTML=`<label>${t("offset_label", {name: t(names[i])})}</label><input type="number" min="0" max="255" data-eo="${i}" value="${s.envOffsets[i]??0}">`;
      og.appendChild(of);
    }
  
    $("sTremSweep").value=s.tremoloSweep??0;
    $("sTremRate").value=s.tremoloRate??0;
    $("sTremDepth").value=s.tremoloDepth??0;
    $("sVibSweep").value=s.vibratoSweep??0;
    $("sVibRate").value=s.vibratoRate??0;
    $("sVibDepth").value=s.vibratoDepth??0;
  
    const mr=$("modesRow"); mr.innerHTML="";
    for(const [bit,label] of MODE_LABELS){
      const l=document.createElement("label"); l.className="check";
      l.innerHTML=`<input type="checkbox" data-mb="${bit}" ${(s.modes&bit)?"checked":""}><span>${t(label)}</span>`;
      mr.appendChild(l);
    }
  
    const pr=$("pianoRow"); pr.innerHTML="";
    const keys=[["A",57],["W",58],["S",59],["E",60],["D",61],["F",62],["T",63],["G",64],["Y",65],["H",66],["U",67],["J",68],["K",69]];
    for(const [k,note] of keys){
      const b=document.createElement("button");
      b.className="btn small"; b.textContent=t("play_instrument_key", {key: k, note});
      b.onmousedown=()=>{ensureAudio();playSample(s,note,100,false);};
      b.onmouseup=()=>releaseAllVoices(true);
      b.onmouseleave=()=>releaseAllVoices(true);
      pr.appendChild(b);
    }
  
    $("toolSelect").classList.toggle("active",state.tool==="select");
    $("toolPencil").classList.toggle("active",state.tool==="pencil");
    updateZoomUI();
    // === BARU: toggle panel regenerate sample ===
    const regenSection = document.getElementById("sampleRegenerateSection");
    if (regenSection) {
      const gi = s._generatorInfo;
      const canRegenerate = s._autoGenerated === true && !!gi;
      regenSection.hidden = !canRegenerate;
    }
    requestAnimationFrame(drawWave);
  }

  static populateAddSampleProgramOptions(isDrum, selectedProgram) {
    const select = $("addSampleGeneratorProgram");
    if (!select) return;
    select.replaceChildren();
    if (!projectPatchGenerator) projectPatchGenerator = new ProjectPatchGenerator();
    
    const programs = projectPatchGenerator.getPrograms(isDrum);
    for (const program of programs) {
      const option = document.createElement("option");
      option.value = String(program.id);
      option.textContent = `${String(program.id).padStart(isDrum ? 2 : 3, "0")} - ${program.name}`;
      select.appendChild(option);
    }
    
    if (selectedProgram !== undefined && selectedProgram !== null) {
      select.value = String(selectedProgram);
    }
    $("addSamplePitchRange").hidden = isDrum;
    $("addSamplePitchHint").hidden = isDrum;
  }

  static openAddSampleDialog(){
    const instrument=state.patch?.instruments[state.selInst];
    if(!state.patch||!instrument)return;
    sampleImportGeneration++;
    addSampleTarget={patchId:state.currentPatchId,instrumentIndex:state.selInst};
    pendingSampleDraft=null;
    $("addSampleError").textContent="";
    $("addSampleFileName").textContent="";
    $("addSampleRecordingStatus").textContent="";
    $("addSampleRecordingTimer").textContent="00:00";
    $("addSamplePreview").hidden=true;
    $("addSampleName").value="";
    $("btnConfirmAddSample").disabled=true;
    $("btnChooseSampleFile").disabled=false;
    $("btnStartSampleRecording").disabled=false;
    $("btnStopSampleRecording").disabled=true;
  
    const entry = state.patches.find(p => p.id === state.currentPatchId);
    const isDrum = (entry?.gmBank ?? 0) === 128;
    $("addSampleGeneratorType").value = isDrum ? "drum" : "melodic";
    $("addSamplePitchFrom").value = 0;
    $("addSamplePitchTo").value = 127;
    populateAddSampleProgramOptions(isDrum, entry?.gmProgram);
    $("addSampleGeneratorStatus").textContent = "";
  
    $("addSampleDialog").hidden=false;
    $("btnChooseSampleFile").focus();
  }

  static clearSampleRecordingTimer(recording=sampleRecording){
    if(recording?.timer){
      clearInterval(recording.timer);
      recording.timer=null;
    }
  }

  static stopSampleRecordingTracks(recording){
    clearSampleRecordingTimer(recording);
    for(const track of recording.stream.getTracks())track.stop();
  }

  static closeAddSampleDialog(){
    sampleImportGeneration++;
    if(sampleRecording){
      const recording=sampleRecording;
      recording.cancelled=true;
      sampleRecording=null;
      if(recording.recorder.state!=="inactive")recording.recorder.stop();
      stopSampleRecordingTracks(recording);
    }
    $("addSampleDialog").hidden=true;
    $("addSampleError").textContent="";
    pendingSampleDraft=null;
    addSampleTarget=null;
  }

  static updateSampleRecordingTimer(recording){
    if(sampleRecording!==recording)return;
    const seconds=Math.floor((performance.now()-recording.startedAt)/1000);
    $("addSampleRecordingTimer").textContent=
      `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  }

  static async decodeSampleBlob(blob){
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass)throw new Error(t("web_audio_unsupported"));
    const context=state.audio.ctx||new AudioContextClass();
    const closeContext=!state.audio.ctx;
    try{
      return await context.decodeAudioData(await blob.arrayBuffer());
    }catch(err){
      throw new Error(t("sample_audio_decode_failed"));
    }finally{
      if(closeContext)await context.close();
    }
  }

  static async monoSampleBuffer(audioBuffer){
    const sourceRate=audioBuffer.sampleRate;
    const targetRate=clamp(Math.min(sourceRate,48000),4000,48000);
    const mono=new Float32Array(audioBuffer.length);
    for(let channel=0;channel<audioBuffer.numberOfChannels;channel++){
      const samples=audioBuffer.getChannelData(channel);
      for(let i=0;i<samples.length;i++)mono[i]+=samples[i]/audioBuffer.numberOfChannels;
    }
    if(targetRate===sourceRate)return {samples:mono,sampleRate:targetRate};
  
    const OfflineContextClass=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    if(OfflineContextClass){
      const length=Math.max(1,Math.ceil(mono.length*targetRate/sourceRate));
      const offline=new OfflineContextClass(1,length,targetRate);
      const sourceBuffer=offline.createBuffer(1,mono.length,sourceRate);
      sourceBuffer.copyToChannel(mono,0);
      const source=offline.createBufferSource();
      source.buffer=sourceBuffer;
      source.connect(offline.destination);
      source.start();
      const rendered=await offline.startRendering();
      return {samples:rendered.getChannelData(0).slice(),sampleRate:targetRate};
    }
  
    const length=Math.max(1,Math.ceil(mono.length*targetRate/sourceRate));
    const resampled=new Float32Array(length);
    for(let i=0;i<length;i++){
      const position=i*sourceRate/targetRate;
      const left=Math.min(Math.floor(position),mono.length-1);
      const right=Math.min(left+1,mono.length-1);
      const fraction=position-left;
      resampled[i]=mono[left]*(1-fraction)+mono[right]*fraction;
    }
    return {samples:resampled,sampleRate:targetRate};
  }

  static estimateEnvelopeOffsets(samples,sampleRate){
    const windowSize=Math.max(1,Math.round(sampleRate*0.01));
    const levels=[];
    for(let start=0;start<samples.length;start+=windowSize){
      const end=Math.min(samples.length,start+windowSize);
      let energy=0;
      for(let i=start;i<end;i++)energy+=samples[i]*samples[i];
      levels.push(Math.sqrt(energy/(end-start)));
    }
    if(levels.length===0)return {offsets:[255,192,160,128,96,0],rates:[0,0,0,0,0,0]};
  
    let peak=0,peakIndex=0;
    for(let i=0;i<levels.length;i++){
      if(levels[i]>peak){peak=levels[i];peakIndex=i;}
    }
    if(peak<0.00001)return {offsets:[255,192,160,128,96,0],rates:[0,0,0,0,0,0]};
    const endIndex=levels.length-1;
    const attackIndex=levels.findIndex((level,index)=>index<=peakIndex&&level>=peak*0.9);
    const sustainStart=Math.min(endIndex,Math.max(peakIndex+1,Math.round(peakIndex+(endIndex-peakIndex)*0.35)));
    const sustainEnd=Math.max(sustainStart,Math.round(endIndex*0.75));
    const sustainSlice=levels.slice(sustainStart,sustainEnd+1);
    const sustainLevel=sustainSlice.length
      ? sustainSlice.reduce((sum,level)=>sum+level,0)/sustainSlice.length
      : levels[sustainStart];
    const toOffset=level=>clamp(Math.round(level/peak*255),0,255);
    const at=position=>levels[clamp(Math.round(endIndex*position),0,endIndex)];
    const offsets=[
      255,
      toOffset(levels[sustainStart]),
      toOffset(sustainLevel),
      toOffset(at(0.72)),
      toOffset(at(0.86)),
      toOffset(at(0.98))
    ];
    const durations=[
      Math.max(1,(attackIndex<0?peakIndex:attackIndex)*windowSize*1000/sampleRate),
      Math.max(1,(sustainStart-peakIndex)*windowSize*1000/sampleRate),
      Math.max(1,(sustainEnd-sustainStart)*windowSize*1000/sampleRate),
      Math.max(1,(endIndex-sustainEnd)*windowSize*1000/sampleRate),
      Math.max(1,(endIndex-sustainEnd)*windowSize*500/sampleRate),
      Math.max(1,(endIndex-sustainEnd)*windowSize*500/sampleRate)
    ];
    const rateStarts=[0,offsets[0],offsets[1],offsets[2],offsets[3],offsets[4]];
    const rateEnds=[offsets[0],offsets[1],offsets[2],0,offsets[4],offsets[5]];
    const rates=rateEnds.map((end,index)=>{
      let bestRate=0,bestDifference=Infinity;
      for(let rate=0;rate<=255;rate++){
        const difference=Math.abs(gusEnvMs(rate,rateStarts[index],end)-durations[index]);
        if(difference<bestDifference){bestDifference=difference;bestRate=rate;}
      }
      return bestRate;
    });
    return {offsets,rates};
  }

  static estimateRootFrequency(samples,sampleRate){
    const stride=Math.max(1,Math.floor(sampleRate/8000));
    const analyzedRate=sampleRate/stride;
    const length=Math.min(Math.floor(samples.length/stride),Math.floor(analyzedRate*0.12));
    if(length<32)return 440;
    const data=new Float32Array(length);
    let mean=0;
    for(let i=0;i<length;i++){data[i]=samples[i*stride];mean+=data[i];}
    mean/=length;
    for(let i=0;i<length;i++)data[i]-=mean;
    let energy=0;
    for(const value of data)energy+=value*value;
    if(energy<0.000001)return 440;
  
    const minLag=Math.max(2,Math.floor(analyzedRate/2000));
    const maxLag=Math.min(Math.floor(analyzedRate/40),Math.floor(length/2));
    let bestLag=0,bestCorrelation=0;
    for(let lag=minLag;lag<=maxLag;lag++){
      let correlation=0,referenceEnergy=0;
      for(let i=0;i<length-lag;i++){
        correlation+=data[i]*data[i+lag];
        referenceEnergy+=data[i]*data[i];
      }
      const normalized=referenceEnergy?correlation/referenceEnergy:0;
      if(normalized>bestCorrelation){bestCorrelation=normalized;bestLag=lag;}
    }
    return bestCorrelation>=0.55&&bestLag?clamp(analyzedRate/bestLag,40,2000):440;
  }

  static buildSampleDraft(audioBuffer, name) {
    const originalRate = audioBuffer.sampleRate;          // ← capture dulu
    return monoSampleBuffer(audioBuffer).then(({samples, sampleRate}) => {
      if (samples.length === 0) throw new Error(t("sample_audio_empty"));
      const envelope = estimateEnvelopeOffsets(samples, sampleRate);
      const pcm = new Uint8Array(samples.length * 2);
      for (let i = 0; i < samples.length; i++) {
        let value = Math.round(clamp(samples[i], -1, 1) * 32767);
        if (value < 0) value += 65536;
        pcm[i * 2] = value & 255;
        pcm[i * 2 + 1] = (value >> 8) & 255;
      }
      const rootFrequency = estimateRootFrequency(samples, sampleRate);
      const safeName = String(name || "SAMPLE")
        .replace(/\.[^.]+$/, "").replace(/[^\w-]/g, "").substring(0, 7) || "SAMPLE";
      const sample = {
        name: safeName, fractions: 0, dataSize: pcm.length,
        loopStart: 0, loopEnd: pcm.length, sampleRate,
        lowFreq: 8176, highFreq: 12543854,
        rootFreq: Math.round(rootFrequency * 1000),
        tune: 0, balance: 7, envRates: envelope.rates, envOffsets: envelope.offsets,
        tremoloSweep: 0, tremoloRate: 0, tremoloDepth: 0,
        vibratoSweep: 0, vibratoRate: 0, vibratoDepth: 0,
        modes: M16 | MENV, scaleFreq: 60, scaleFactor: 1024,
        reserved: new Uint8Array(36), pcm, _float: samples
      };
      return {
        sample,
        duration: samples.length / sampleRate,
        sourceName: name || "SAMPLE",
        resampleRatio: sampleRate / originalRate       // ← rasio resample
      };
    });
  }

  static populateAddSampleParameters(sample,duration){
    const bps=fmt(sample).bps;
    const fields={
      addSampleName:sample.name,
      addSampleRate:sample.sampleRate,
      addSampleRoot:sample.rootFreq,
      addSampleBalance:sample.balance,
      addSampleLow:sample.lowFreq,
      addSampleHigh:sample.highFreq,
      addSampleLoopStart:Math.round(sample.loopStart/bps),
      addSampleLoopEnd:Math.round(sample.loopEnd/bps),
      addSampleFractions:sample.fractions,
      addSampleTune:sample.tune,
      addSampleScaleFreq:sample.scaleFreq,
      addSampleScaleFactor:sample.scaleFactor,
      addSampleTremSweep:sample.tremoloSweep,
      addSampleTremRate:sample.tremoloRate,
      addSampleTremDepth:sample.tremoloDepth,
      addSampleVibSweep:sample.vibratoSweep,
      addSampleVibRate:sample.vibratoRate,
      addSampleVibDepth:sample.vibratoDepth
    };
    for(const [id,value] of Object.entries(fields))$(id).value=value??0;
    $("addSampleLoopStart").max=Math.floor(sample.pcm.length/bps);
    $("addSampleLoopEnd").max=Math.floor(sample.pcm.length/bps);
    $("addSampleDuration").textContent=`${duration.toFixed(2)} s`;
  
    const names=["env_attack","env_decay","env_sustain","env_rate_1","env_rate_2","env_rate_3"];
    for(const [kind,values] of [["rate",sample.envRates],["offset",sample.envOffsets]]){
      const grid=kind==="rate"?$("addSampleRates"):$("addSampleOffsets");
      const attribute=kind==="rate"?"data-add-sample-rate":"data-add-sample-offset";
      grid.innerHTML="";
      values.forEach((value,index)=>{
        const field=document.createElement("div");
        field.className="field";
        field.innerHTML=`<label>${t(`${kind}_label`,{name:t(names[index])})}</label><input type="number" min="0" max="255" ${attribute}="${index}" value="${value}">`;
        grid.appendChild(field);
      });
    }
  
    const modes=$("addSampleModes");
    modes.innerHTML="";
    for(const [bit,label] of MODE_LABELS){
      const field=document.createElement("label");
      field.className="check";
      field.innerHTML=`<input type="checkbox" data-add-sample-mode="${bit}" ${(sample.modes&bit)?"checked":""}><span>${t(label)}</span>`;
      modes.appendChild(field);
    }
  }

  static async loadSampleDraft(blob,name){
    const generation=++sampleImportGeneration;
    $("addSampleError").textContent="";
    $("btnConfirmAddSample").disabled=true;
    $("btnChooseSampleFile").disabled=true;
    $("btnStartSampleRecording").disabled=true;
    $("addSampleRecordingStatus").textContent=t("sample_processing");
    try{
      const audioBuffer=await decodeSampleBlob(blob);
      const draft=await buildSampleDraft(audioBuffer,name);
      if(generation!==sampleImportGeneration||$("addSampleDialog").hidden)return;
      pendingSampleDraft=draft;
      populateAddSampleParameters(draft.sample,draft.duration);
      $("addSamplePreview").hidden=false;
      $("addSampleRecordingStatus").textContent=t("sample_audio_ready");
      $("btnChooseSampleFile").disabled=false;
      $("btnStartSampleRecording").disabled=false;
      $("btnConfirmAddSample").disabled=false;
    }catch(err){
      if(generation!==sampleImportGeneration||$("addSampleDialog").hidden)return;
      console.error("Sample audio conversion failed:",err);
      $("addSampleError").textContent=err.message||t("sample_audio_decode_failed");
      $("addSampleRecordingStatus").textContent="";
      $("btnChooseSampleFile").disabled=false;
      $("btnStartSampleRecording").disabled=false;
    }
  }

  static startSampleRecording(){
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
      $("addSampleError").textContent=t("sample_microphone_unsupported");
      return;
    }
    pendingSampleDraft=null;
    $("addSamplePreview").hidden=true;
    $("addSampleFileName").textContent="";
    $("btnConfirmAddSample").disabled=true;
    $("addSampleError").textContent="";
    $("btnStartSampleRecording").disabled=true;
    $("btnChooseSampleFile").disabled=true;
    $("addSampleRecordingStatus").textContent=t("sample_microphone_permission");
    const generation=sampleImportGeneration;
    let requestedStream=null;
    navigator.mediaDevices.getUserMedia({audio:{
      channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false
    }}).then(stream=>{
      requestedStream=stream;
      if(generation!==sampleImportGeneration||$("addSampleDialog").hidden){
        for(const track of stream.getTracks())track.stop();
        return;
      }
      const mimeType=typeof MediaRecorder.isTypeSupported==="function"
        ?["audio/webm;codecs=opus","audio/ogg;codecs=opus"].find(type=>MediaRecorder.isTypeSupported(type))
        :null;
      const recorder=mimeType?new MediaRecorder(stream,{mimeType}):new MediaRecorder(stream);
      const recording={stream,recorder,chunks:[],startedAt:performance.now(),timer:null,cancelled:false};
      sampleRecording=recording;
      recorder.addEventListener("dataavailable",event=>{
        if(event.data.size)recording.chunks.push(event.data);
      });
      recorder.addEventListener("error",event=>{
        console.error("Microphone recording failed:",event.error||event);
        recording.failed=true;
        $("addSampleError").textContent=event.error?.message||t("sample_recording_failed");
        if(recorder.state!=="inactive")recorder.stop();
      });
      recorder.addEventListener("stop",async()=>{
        stopSampleRecordingTracks(recording);
        if(sampleRecording!==recording||recording.cancelled)return;
        sampleRecording=null;
        $("btnStartSampleRecording").disabled=false;
        $("btnStopSampleRecording").disabled=true;
        $("btnChooseSampleFile").disabled=false;
        if(recording.failed){
          $("addSampleRecordingStatus").textContent="";
          return;
        }
        const blob=new Blob(recording.chunks,{type:recorder.mimeType||"audio/webm"});
        await loadSampleDraft(blob,"RECORDING");
      });
      recorder.start(250);
      $("btnStartSampleRecording").disabled=true;
      $("btnStopSampleRecording").disabled=false;
      $("btnChooseSampleFile").disabled=true;
      $("addSampleRecordingStatus").textContent=t("sample_recording");
      recording.timer=setInterval(()=>updateSampleRecordingTimer(recording),250);
    }).catch(err=>{
      if(requestedStream)for(const track of requestedStream.getTracks())track.stop();
      if(generation!==sampleImportGeneration||$("addSampleDialog").hidden)return;
      console.error("Unable to access microphone:",err);
      $("addSampleError").textContent=t("sample_microphone_failed",{message:err.message});
      $("btnStartSampleRecording").disabled=false;
      $("btnChooseSampleFile").disabled=false;
      $("addSampleRecordingStatus").textContent="";
    });
  }

  static stopSampleRecording(){
    if(sampleRecording&&sampleRecording.recorder.state!=="inactive"){
      $("btnStopSampleRecording").disabled=true;
      sampleRecording.recorder.stop();
    }
  }

  static addSampleToPatch(){
    const target=addSampleTarget;
    const draft=pendingSampleDraft;
    if(!target||!draft)return;
    if(target.patchId!==state.currentPatchId||!state.patch?.instruments[target.instrumentIndex]){
      $("addSampleError").textContent=t("sample_patch_changed");
      return;
    }
    const instrument=state.patch.instruments[target.instrumentIndex];
    if(instrument.layers.length===0){
      instrument.layers.push({
        duplicate:0,layer:0,layerSize:0,reserved:new Uint8Array(40),samples:[]
      });
    }
    const layer=instrument.layers[0];
    if(layer.samples.length>=255){
      $("addSampleError").textContent=t("sample_layer_limit");
      return;
    }
    const sample=draft.sample;
    const readNumber=(id,min,max,fallback=0)=>{
      const parsed=parseInt($(id).value,10);
      return clamp(Number.isFinite(parsed)?parsed:fallback,min,max);
    };
    sample.name=String($("addSampleName").value||"SAMPLE").replace(/[^\w-]/g,"").substring(0,7)||"SAMPLE";
    sample.sampleRate=readNumber("addSampleRate",1,65535,22050);
    sample.rootFreq=readNumber("addSampleRoot",0,0xFFFFFFFF);
    sample.balance=readNumber("addSampleBalance",0,15,7);
    sample.lowFreq=readNumber("addSampleLow",0,0xFFFFFFFF);
    sample.highFreq=readNumber("addSampleHigh",0,0xFFFFFFFF);
    if (sample._generatorInfo && !sample._generatorInfo.isDrum) {
      sample._generatorInfo.pitchFrom = ProjectPatchGenerator.frequencyToMidiPitch(sample.lowFreq) ?? 0;
      sample._generatorInfo.pitchTo = ProjectPatchGenerator.frequencyToMidiPitch(sample.highFreq) ?? 127;
    }
    sample.fractions=readNumber("addSampleFractions",0,255);
    sample.tune=readNumber("addSampleTune",0,65535);
    sample.scaleFreq=readNumber("addSampleScaleFreq",0,65535,60);
    sample.scaleFactor=readNumber("addSampleScaleFactor",0,65535,1024);
    sample.tremoloSweep=readNumber("addSampleTremSweep",0,255);
    sample.tremoloRate=readNumber("addSampleTremRate",0,255);
    sample.tremoloDepth=readNumber("addSampleTremDepth",0,255);
    sample.vibratoSweep=readNumber("addSampleVibSweep",0,255);
    sample.vibratoRate=readNumber("addSampleVibRate",0,255);
    sample.vibratoDepth=readNumber("addSampleVibDepth",0,255);
    sample.envRates=Array.from($("addSampleRates").querySelectorAll("[data-add-sample-rate]"))
      .map(input=>clamp(parseInt(input.value,10)||0,0,255));
    sample.envOffsets=Array.from($("addSampleOffsets").querySelectorAll("[data-add-sample-offset]"))
      .map(input=>clamp(parseInt(input.value,10)||0,0,255));
    sample.modes=0;
    for(const input of $("addSampleModes").querySelectorAll("[data-add-sample-mode]")){
      if(input.checked)sample.modes|=parseInt(input.dataset.addSampleMode,10);
    }
    commitFloat(sample);
    const bps=fmt(sample).bps;
    const total=Math.floor(sample.pcm.length/bps);
    const loopStart=clamp(parseInt($("addSampleLoopStart").value,10)||0,0,total);
    let loopEnd=clamp(parseInt($("addSampleLoopEnd").value,10)||0,0,total);
    if(loopEnd<=loopStart)loopEnd=Math.min(total,loopStart+1);
    sample.loopStart=loopStart*bps;
    sample.loopEnd=loopEnd*bps;
    sample.dataSize=sample.pcm.length;
    $("addSampleName").value=sample.name;
    $("addSampleLoopStart").value=loopStart;
    $("addSampleLoopEnd").value=loopEnd;
    layer.samples.push(sample);
    state.selInst=target.instrumentIndex;
    state.selSample=sample;
    state.selStart=state.selEnd=0;
    state.undo=[];
    state.zoom=1; state.offset=0;
    const samples=allSamples();
    state.patch.header.waveForms=samples.length;
    state.patch.header.dataSize=samples.reduce((size,ref)=>size+ref.sample.pcm.length,0);
    closeAddSampleDialog();
    render();
    showStatus(t("sample_added"),"ok");
  }

  static savePAT(){
    if(!state.patch)return;
    try{
      const clean=cleanPatchForStorage(state.patch);
      const bytes=writePAT(clean);
      const blob=new Blob([bytes],{type:"application/octet-stream"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      const name=(state.patch.header.description||"patch").replace(/[^\w\-]+/g,"_");
      a.download=name+".pat";
      a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      showStatus(t("pat_downloaded"),"ok");
    }catch(err){
      showAlert("save_alert", {message: err.message});
      showStatus(t("save_failed_short"),"bad");
    }
  }

  static exportWav(){
    const s=state.selSample; if(!s)return;
    const blob=encodeWav(s);
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=(s.name||"sample")+".wav";
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showStatus(t("wav_downloaded"),"ok");
  }

  static importWav(e){
    const file=e.target.files&&e.target.files[0]; if(!file)return;
    const s=state.selSample; if(!s){showAlert("select_sample_first");e.target.value="";return;}
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const wav=decodeWav(reader.result);
        pushUndo(s);
        s._float=wav.samples;
        commitFloat(s);
        s.sampleRate=wav.sampleRate;
        if(wav.hasLoop){
          const bps=fmt(s).bps;
          s.loopStart=Math.round(wav.loopStart*bps);
          s.loopEnd=Math.round(wav.loopEnd*bps);
          s.modes|=MLOOP;
        }
        renderSampleEditor(); render();
        const count = s._float.length;
        showStatus(t("wav_imported", {samples: t(count === 1 ? "sample_count_one" : "sample_count_many", {count: count.toLocaleString()})}),"ok");
      }catch(err){
        showAlert("wav_import_alert", {message: err.message});
        showStatus(t("wav_import_failed"),"bad");
      }
      e.target.value="";
    };
    reader.readAsArrayBuffer(file);
  }

  static async enableMidi(){
    if(state.midi.enabled){disableMidi();return;}
    if(!navigator.requestMIDIAccess){showAlert("midi_not_supported");return;}
    try{
      const access=await navigator.requestMIDIAccess();
      state.midi.access=access;
      state.midi.enabled=true;
      refreshMidiInputs();
      access.onstatechange=refreshMidiInputs;
      $("midiDot").classList.add("on");
      $("btnMidi").textContent=t("disable");
      showStatus(t("midi_enabled"),"ok");
    }catch(err){ showAlert("midi_enable_failed", {message: err.message}); }
  }

  static disableMidi(){
    if(state.midi.input)state.midi.input.onmidimessage=null;
    state.midi.enabled=false; state.midi.input=null;
    $("midiDot").classList.remove("on");
    $("btnMidi").textContent=t("enable");
    $("midiSelect").innerHTML=`<option>${t("midi_off")}</option>`;
    $("midiSelect").disabled=true;
    showStatus(t("midi_disabled"));
    releaseAllVoices(true);
  }

  static refreshMidiInputs(){
    const access=state.midi.access; if(!access)return;
    const sel=$("midiSelect"); sel.innerHTML="";
    const inputs=Array.from(access.inputs.values());
    if(inputs.length===0){sel.innerHTML=`<option>${t("no_midi_input")}</option>`; return;}
    inputs.forEach(inp=>{
      const o=document.createElement("option");
      o.value=inp.id; o.textContent=inp.name||inp.id;
      sel.appendChild(o);
    });
    sel.disabled=false;
    const first=inputs[0];
    if(first){state.midi.input=first; first.onmidimessage=handleMidiMessage;}
  }

  static handleMidiMessage(e){
    const data=e.data, [st,d1,d2]=data;
    const cmd=st&0xf0;
    $("midiMonitor").textContent=`${new Date().toLocaleTimeString()} | ${cmd.toString(16).padStart(2,"0")} ${d1} ${d2??""}`;
    if(cmd===0x90&&d2>0){
      const s=state.selSample;
      if(s){ensureAudio(); playSample(s,d1,d2,true);}
    } else if(cmd===0x80||(cmd===0x90&&d2===0)){
      releaseAllVoices(true);
    } else if(cmd===0xC0){
      if(state.patch&&state.patch.instruments[d1]){
        state.selInst=d1; state.selSample=null;
        state.zoom=1; state.offset=0; updateZoomUI();
        render();
      }
    } else if(cmd===0xB0&&d1===7){
      if(state.patch)state.patch.header.masterVolume=clamp(d2,0,127);
    }
  }

  static bytesToBase64(u8) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < u8.length; i += chunkSize) {
      const chunk = u8.subarray(i, Math.min(i + chunkSize, u8.length));
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  static base64ToBytes(b64) {
    const binary = atob(b64);
    const u8 = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i);
    return u8;
  }

  static exportSampleToJson(sample) {
    const clean = cleanSampleForStorage(sample);
    return JSON.stringify({
      format: "gus-sample-json",
      version: 1,
      exportedAt: new Date().toISOString(),
      sample: {
        ...clean,
        reserved: bytesToBase64(clean.reserved),
        pcm: bytesToBase64(clean.pcm)
      }
    }, null, 2);
  }

  static parseSampleJsonText(text) {
    let obj;
    try { obj = JSON.parse(text); }
    catch (e) { throw new Error(t("sample_json_invalid")); }
  
    if (!obj || obj.format !== "gus-sample-json" || !obj.sample) {
      throw new Error(t("sample_json_invalid"));
    }
    const s = obj.sample;
    if (typeof s.pcm !== "string" || s.pcm.length === 0) {
      throw new Error(t("sample_json_invalid"));
    }
  
    let pcm, reserved;
    try {
      pcm = base64ToBytes(s.pcm);
      reserved = typeof s.reserved === "string" ? base64ToBytes(s.reserved) : new Uint8Array(36);
    } catch (e) {
      throw new Error(t("sample_json_invalid"));
    }
    if (pcm.length === 0) throw new Error(t("sample_json_invalid"));
  
    const num = (v, def, min, max) => {
      const n = Number(v);
      if (!isFinite(n)) return def;
      return clamp(n, min, max);
    };
    const safeReserved = new Uint8Array(36);
    safeReserved.set(reserved.subarray(0, 36));
  
    return {
      name: String(s.name || "SAMPLE").replace(/[^\w-]/g, "").slice(0, 7) || "SAMPLE",
      fractions: num(s.fractions, 0, 0, 255) | 0,
      dataSize: pcm.length,
      loopStart: Math.max(0, num(s.loopStart, 0, 0, pcm.length)),
      loopEnd: Math.max(0, num(s.loopEnd, 0, 0, pcm.length)),
      sampleRate: num(s.sampleRate, 22050, 1, 192000),
      lowFreq: Math.max(0, num(s.lowFreq, 0, 0, 0xFFFFFFFF)),
      highFreq: Math.max(0, num(s.highFreq, 0, 0, 0xFFFFFFFF)),
      rootFreq: Math.max(0, num(s.rootFreq, 0, 0, 0xFFFFFFFF)),
      tune: num(s.tune, 0, 0, 65535) | 0,
      balance: num(s.balance, 7, 0, 15) | 0,
      envRates: Array.isArray(s.envRates)
        ? Array.from({ length: 6 }, (_, i) => num(s.envRates[i], 0, 0, 255) | 0)
        : [0, 0, 0, 0, 0, 0],
      envOffsets: Array.isArray(s.envOffsets)
        ? Array.from({ length: 6 }, (_, i) => num(s.envOffsets[i], 0, 0, 255) | 0)
        : [0, 0, 0, 0, 0, 0],
      tremoloSweep: num(s.tremoloSweep, 0, 0, 255) | 0,
      tremoloRate: num(s.tremoloRate, 0, 0, 255) | 0,
      tremoloDepth: num(s.tremoloDepth, 0, 0, 255) | 0,
      vibratoSweep: num(s.vibratoSweep, 0, 0, 255) | 0,
      vibratoRate: num(s.vibratoRate, 0, 0, 255) | 0,
      vibratoDepth: num(s.vibratoDepth, 0, 0, 255) | 0,
      modes: num(s.modes, 0, 0, 65535) | 0,
      scaleFreq: num(s.scaleFreq, 60, 0, 65535) | 0,
      scaleFactor: num(s.scaleFactor, 1024, 0, 65535) | 0,
      reserved: safeReserved,
      pcm,
      _float: null
    };
  }

  static exportCurrentSampleJson() {
    const s = state.selSample;
    if (!s) return;
    try {
      const json = exportSampleToJson(s);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (sanitizeFilename(s.name || "sample")) + ".sample.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showStatus(t("sample_json_exported", { name: s.name }), "ok");
    } catch (err) {
      console.error("Export sample JSON error:", err);
      showStatus(t("sample_json_export_failed", { message: err.message }), "bad");
    }
  }

  static addImportedSampleToPatch(sample) {
    const patch = state.patch;
    if (!patch) throw new Error(t("sample_json_no_patch"));
    const inst = patch.instruments[state.selInst];
    if (!inst) throw new Error(t("sample_json_no_instrument"));
  
    if (inst.layers.length === 0) {
      inst.layers.push({ duplicate: 0, layer: 0, layerSize: 0, reserved: new Uint8Array(40), samples: [] });
    }
    const layer = inst.layers[0];
    if (layer.samples.length >= 255) throw new Error(t("sample_json_layer_limit"));
  
    layer.samples.push(sample);
  
    state.selSample = sample;
    state.selStart = state.selEnd = 0;
    state.undo = [];
    state.zoom = 1;
    state.offset = 0;
    updateZoomUI();
  
    const samples = allSamples();
    patch.header.waveForms = samples.length;
    patch.header.dataSize = samples.reduce((sum, ref) => sum + ref.sample.pcm.length, 0);
  
    render();
  }

  static importSampleFromJsonFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const sample = parseSampleJsonText(String(reader.result || ""));
        addImportedSampleToPatch(sample);
        showStatus(t("sample_json_imported", { name: sample.name }), "ok");
      } catch (err) {
        console.error("Import sample JSON error:", err);
        showStatus(t("sample_json_import_failed", { message: err.message }), "bad");
        showAlert("sample_json_import_alert", { message: err.message });
      }
    };
    reader.onerror = () => {
      showStatus(t("sample_json_import_failed", { message: t("file_read_failed") }), "bad");
    };
    reader.readAsText(file);
  }
}
