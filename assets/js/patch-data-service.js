class PatchDataService {
  static capSampleRateTo65535(sample) {
    if (!sample.sampleRate || sample.sampleRate <= 65535) return sample;
    const is16 = (sample.modes & M16) !== 0;
    const targetRate = sample.sampleRate > 48000 ? 44100 : 48000;
    const resampled = resamplePcmTo(sample.pcm, sample.sampleRate, targetRate, is16);
    if (!resampled) {
      // fallback: paksa rate (lebih baik daripada clamp korup)
      sample.sampleRate = targetRate;
      return sample;
    }
    const bps = is16 ? 2 : 1;
    const ratio = targetRate / sample.sampleRate;
    const wasLoop = (sample.modes & MLOOP) !== 0;
    const oldStart = sample.loopStart;
    const oldEnd = sample.loopEnd;
    sample.pcm = resampled;
    sample.dataSize = sample.pcm.length;
    sample.sampleRate = targetRate;
    sample._float = null;
    if (wasLoop) {
      const total = sample.pcm.length;
      let ns = clamp(Math.round(oldStart * ratio), 0, total);
      let ne = clamp(Math.round(oldEnd * ratio), 0, total);
      if (ne > ns && (ne - ns) >= 4 * bps) {
        sample.loopStart = ns;
        sample.loopEnd = ne;
      } else {
        sample.modes &= ~MLOOP;
        sample.loopStart = 0;
        sample.loopEnd = 0;
      }
    }
    return sample;
  }

  static parsePAT(ab){
    const bytes=new Uint8Array(ab), dv=new DataView(ab); let p=0;
    const u8=()=>{const v=dv.getUint8(p);p+=1;return v;};
    const u16=()=>{const v=dv.getUint16(p,true);p+=2;return v;};
    const u32=()=>{const v=dv.getUint32(p,true);p+=4;return v;};
    const rB=n=>{const v=bytes.slice(p,p+n);p+=n;return v;};
    const rS=n=>decodeAscii(rB(n));
    if(bytes.length<129)throw new Error(t("file_too_small"));
    const magic=rS(12); if(!magic.startsWith("GF1PATCH"))throw new Error(t("not_pat_file"));
    const gravisId=rS(10), description=rS(60);
    let ic=u8(); if(ic===0)ic=1;
    const voices=u8(), channels=u8(), waveForms=u16(), masterVolume=u16(), dataSize=u32();
    const reserved=rB(36);
    const instruments=[];
    for(let i=0;i<ic;i++){
      if(p+63>bytes.length)throw new Error(t("truncated_instrument_header"));
      const instrument=u16(), name=rS(16), size=u32();
      let lc=u8(); if(lc===0)lc=1;
      const rI=rB(40), layers=[];
      for(let j=0;j<lc;j++){
        if(p+47>bytes.length)throw new Error(t("truncated_layer_header"));
        const duplicate=u8(), layer=u8(), layerSize=u32(), sc=u8(), rL=rB(40);
        const samples=[];
        for(let k=0;k<sc;k++){
          if(p+96>bytes.length)throw new Error(t("truncated_sample_header"));
          const waveName=rS(7), fractions=u8(), ws=u32(), loopStart=u32(), loopEnd=u32();
          
          let srRaw = u16();
          const stdRates = [8000, 11025, 16000, 22050, 24000, 32000, 44100, 48000, 96000];
          if (!stdRates.includes(srRaw)) {
            // Perbaikan bug biola
            // Heuristic: jika bukan rate standar, kemungkinan file lama (period ns)
            const converted = Math.round(1e9 / srRaw);
              if (stdRates.includes(converted)) {
                srRaw = converted;
              } else if (srRaw < 4000) {
                srRaw = converted;
              }
          }
          const sampleRate = srRaw;
          const lowFreq=u32();
          const highFreq=u32();
          const rootFreq=u32();
          const tune=u16(), balance=u8();
          const envRates=Array.from(rB(6)), envOffsets=Array.from(rB(6));
          const tremoloSweep=u8(), tremoloRate=u8(), tremoloDepth=u8();
          const vibratoSweep=u8(), vibratoRate=u8(), vibratoDepth=u8();
          const modes=u8(), scaleFreq=u16(), scaleFactor=u16(), rS2=rB(36);
          if(ws>bytes.length-p)throw new Error(t("sample_data_exceeds_file"));
          const pcm=bytes.slice(p,p+ws);p+=ws;
          samples.push({name:waveName,fractions,dataSize:ws,loopStart,loopEnd,sampleRate,lowFreq,highFreq,rootFreq,tune,balance,envRates,envOffsets,tremoloSweep,tremoloRate,tremoloDepth,vibratoSweep,vibratoRate,vibratoDepth,modes,scaleFreq,scaleFactor,reserved:rS2,pcm,_float:null});
        }
        layers.push({duplicate,layer,layerSize,samples,reserved:rL});
      }
      instruments.push({instrument,name,size,layers,reserved:rI});
    }
    return {header:{magic,gravisId,description,voices,channels,waveForms,masterVolume,dataSize,reserved},instruments};
  }

  static hzToPeriod(hz){
    hz = clamp(hz|0, 1, 65535);
    return clamp(Math.round(1e9 / hz), 1, 65535);
  }

  static periodToHz(p){
    p = p|0;
    return p > 0 ? Math.round(1e9 / p) : 22050;
  }

  static writePAT(patch){
    let totalData=0, totalSamples=0;
    for(const inst of patch.instruments){
      let iSize=63;
      for(const layer of inst.layers){
        let lSize=47;
        for(const s of layer.samples){s.dataSize=s.pcm.length;lSize+=96+s.pcm.length;totalSamples++;}
        layer.layerSize=lSize; iSize+=lSize;
      }
      inst.size=iSize; totalData+=iSize;
    }
    patch.header.dataSize=totalData; patch.header.waveForms=totalSamples;
    const buf=new ArrayBuffer(129+totalData), dv=new DataView(buf), bytes=new Uint8Array(buf);
    let p=0;
    const wS=(s,n)=>{bytes.set(encodeAscii(s,n),p);p+=n;};
    const w8=v=>{dv.setUint8(p,v&255);p+=1;};
    const w16=v=>{dv.setUint16(p,v&65535,true);p+=2;};
    const w32=v=>{dv.setUint32(p,v>>>0,true);p+=4;};
    const wB=(a,n)=>{if(a&&a.length)bytes.set(a.slice(0,n),p);p+=n;};
    wS(patch.header.magic||MAGIC,12); wS(patch.header.gravisId||GRAVIS_ID,10);
    wS(patch.header.description||"",60);
    w8(patch.instruments.length); w8(patch.header.voices??14); w8(patch.header.channels??0);
    w16(totalSamples); w16(patch.header.masterVolume??127); w32(totalData);
    wB(patch.header.reserved,36);
    for(const inst of patch.instruments){
      w16(inst.instrument); wS(inst.name,16); w32(inst.size); w8(inst.layers.length); wB(inst.reserved,40);
      for(const layer of inst.layers){
        w8(layer.duplicate); w8(layer.layer); w32(layer.layerSize); w8(layer.samples.length); wB(layer.reserved,40);
        for(const s of layer.samples){
          wS(s.name,7); w8(s.fractions); w32(s.pcm.length); w32(s.loopStart); w32(s.loopEnd);
          
          // Perbaikan bug biola
          let outRate = s.sampleRate || 22050;
          if (outRate > 65535) {
            console.warn(`[writePAT] Sample "${s.name}" rate ${outRate} melebihi u16; clamp ke 65535.`);
            outRate = 65535;
          }
          w16(outRate);
          
          w32(s.lowFreq); w32(s.highFreq); w32(s.rootFreq);
          w16(s.tune); w8(s.balance);
          for(let i=0;i<6;i++)w8(s.envRates[i]??0);
          for(let i=0;i<6;i++)w8(s.envOffsets[i]??0);
          w8(s.tremoloSweep);w8(s.tremoloRate);w8(s.tremoloDepth);
          w8(s.vibratoSweep);w8(s.vibratoRate);w8(s.vibratoDepth);
          w8(s.modes); w16(s.scaleFreq); w16(s.scaleFactor); wB(s.reserved,36);
          bytes.set(s.pcm,p);p+=s.pcm.length;
        }
      }
    }
    return bytes;
  }

  static fmt(s){return{is16:(s.modes&M16)!==0,unsigned:(s.modes&MUNS)!==0,bps:(s.modes&M16)?2:1};}

  static pcmToFloat(s){
    const {is16,unsigned,bps}=fmt(s), n=Math.floor(s.pcm.length/bps), o=new Float32Array(n);
    if(is16){
      for(let i=0;i<n;i++){
        let v=s.pcm[i*2]|(s.pcm[i*2+1]<<8);
        if(unsigned)v-=32768; else if(v>=32768)v-=65536;
        o[i]=v/32768;
      }
    }else{
      for(let i=0;i<n;i++){
        let v=s.pcm[i];
        if(unsigned)v-=128; else if(v>=128)v-=256;
        o[i]=v/128;
      }
    }
    return o;
  }

  static floatToPcm(s,f){
    const {is16,unsigned}=fmt(s), n=f.length, b=new Uint8Array(n*(is16?2:1));
    if(is16){
      for(let i=0;i<n;i++){
        let v=clamp(f[i],-1,1);
        let iv = Math.round(v * 32768);
        if (iv > 32767) iv = 32767;
        if (iv < -32768) iv = -32768;
        if(unsigned) iv += 32768;
        else if(iv < 0) iv += 65536;
        b[i*2]=iv&255;
        b[i*2+1]=(iv>>8)&255;
      }
    }else{
      for(let i=0;i<n;i++){
        let v=clamp(f[i],-1,1);
        let iv = Math.round(v * 128);
        if (iv > 127) iv = 127;
        if (iv < -128) iv = -128;
        if(unsigned) iv += 128;
        else if(iv < 0) iv += 256;
        b[i]=iv&255;
      }
    }
    s.pcm=b;
    s.dataSize=b.length;
  }

  static computeSf2Pitch(rootFreq, scaleFreq) {
    let rootHz = (rootFreq && rootFreq > 0) ? rootFreq / 1000 : null;
  
    if (rootHz === null) {
      const scaleNote = (scaleFreq >= 0 && scaleFreq <= 127) ? scaleFreq : 60;
      rootHz = 440 * Math.pow(2, (scaleNote - 69) / 12);
    }
  
    const midiNoteFloat = 69 + 12 * Math.log2(rootHz / 440);
    let originalPitch = Math.round(midiNoteFloat);
    if (originalPitch < 0) originalPitch = 0;
    if (originalPitch > 127) originalPitch = 127;
  
    const freqOfOriginalPitch = 440 * Math.pow(2, (originalPitch - 69) / 12);
    let pitchCorrection = Math.round(1200 * Math.log2(rootHz / freqOfOriginalPitch));
  
    // Clamp defensif (tidak akan pernah kena karena originalPitch = round(midiNoteFloat))
    if (pitchCorrection < -128) pitchCorrection = -128;
    if (pitchCorrection > 127) pitchCorrection = 127;
  
    return { originalPitch, pitchCorrection };
  }

  static ensureFloat(s){ if(!s._float)s._float=pcmToFloat(s); return s._float; }

  static commitFloat(s){ if(s._float)floatToPcm(s,s._float); }

  static loopInfo(s){
    const bps=fmt(s).bps, total=Math.floor(s.pcm.length/bps);
    const sf=(s.fractions&0x0f)/16, ef=((s.fractions>>4)&0x0f)/16;
    let a=(s.loopStart+sf)/bps, b=(s.loopEnd+ef)/bps;
    a=clamp(a,0,total); b=clamp(b,0,total);
    const enabled=(s.modes&MLOOP)!==0;
    if(b<=a+1)b=Math.min(total,a+1);
    return {enabled:enabled&&b>a+1, start:a, end:b, total};
  }

  static encodeWav(s){
    const f=ensureFloat(s), sr=clamp(s.sampleRate||22050,1,192000), n=f.length;
    const dataBytes=n*2, loop=loopInfo(s), hasLoop=loop.enabled&&loop.end>loop.start;
    const smplSize=hasLoop?60:0, total=12+8+16+8+dataBytes+(hasLoop?8+smplSize:0);
    const buf=new ArrayBuffer(total), dv=new DataView(buf); let p=0;
    const wS=str=>{for(let i=0;i<str.length;i++)dv.setUint8(p+i,str.charCodeAt(i));p+=str.length;};
    const w32=v=>{dv.setUint32(p,v>>>0,true);p+=4;};
    const w16=v=>{dv.setUint16(p,v&65535,true);p+=2;};
    wS("RIFF");w32(total-8);wS("WAVE");wS("fmt ");w32(16);w16(1);w16(1);w32(sr);w32(sr*2);w16(2);w16(16);
    wS("data");w32(dataBytes);
    for(let i=0;i<n;i++){
      let v=clamp(f[i],-1,1), iv=Math.round(v*32767);
      if(iv<0)iv+=65536;
      dv.setUint16(p,iv,true); p+=2;
    }
    if(hasLoop){
      wS("smpl");w32(smplSize);w32(0);w32(0);w32(Math.round(1e9/sr));
      w32(60);w32(0);w32(0);w32(0);w32(1);w32(0);w32(0);w32(0);
      w32(Math.max(0,Math.round(loop.start)));w32(Math.max(0,Math.round(loop.end)));
      w32(0);w32(0);
    }
    return new Blob([buf],{type:"audio/wav"});
  }

  static decodeWav(ab){
    const dv=new DataView(ab), bytes=new Uint8Array(ab);
    const s4=o=>String.fromCharCode(bytes[o],bytes[o+1],bytes[o+2],bytes[o+3]);
    if(s4(0)!=="RIFF"||s4(8)!=="WAVE")throw new Error(t("not_wav_file"));
    let p=12, fmtC=null, dataC=null, smplC=null;
    while(p+8<=bytes.length){
      const id=s4(p), sz=dv.getUint32(p+4,true); p+=8;
      if(p+sz>bytes.length)break;
      const c=bytes.slice(p,p+sz);
      if(id==="fmt ")fmtC=c; else if(id==="data")dataC=c; else if(id==="smpl")smplC=c;
      p+=sz+(sz&1);
    }
    if(!fmtC||!dataC)throw new Error(t("incomplete_wav"));
    const fd=new DataView(fmtC.buffer,fmtC.byteOffset,fmtC.byteLength);
    const tag=fd.getUint16(0,true), ch=fd.getUint16(2,true), sr=fd.getUint32(4,true), bits=fd.getUint16(14,true);
    const bps=Math.ceil(bits/8), frameB=bps*ch, frames=Math.floor(dataC.length/frameB);
    const out=new Float32Array(frames);
    const rd=(o)=>{
      if(tag===3){if(bits===32)return dv.getFloat32(o,true);return 0;}
      if(bits===8)return (dataC[o]-128)/128;
      if(bits===16){let v=dataC[o]|(dataC[o+1]<<8);if(v>=32768)v-=65536;return v/32768;}
      if(bits===24){let v=dataC[o]|(dataC[o+1]<<8)|(dataC[o+2]<<16);if(v>=0x800000)v-=0x1000000;return v/8388608;}
      if(bits===32){let v=(dataC[o]|(dataC[o+1]<<8)|(dataC[o+2]<<16)|(dataC[o+3]<<24))>>>0;if(v>=0x80000000)v-=0x100000000;return v/2147483648;}
      return 0;
    };
    for(let i=0;i<frames;i++){
      let sum=0, base=i*frameB;
      for(let c=0;c<ch;c++)sum+=rd(base+c*bps);
      out[i]=sum/ch;
    }
    let ls=0, le=frames, hasLoop=false;
    if(smplC&&smplC.length>=60){
      const sd=new DataView(smplC.buffer,smplC.byteOffset,smplC.byteLength);
      if(sd.getUint32(28,true)>0){
        const a=sd.getUint32(44,true), b=sd.getUint32(48,true);
        if(b>a&&b<=frames){ls=a;le=b;hasLoop=true;}
      }
    }
    return {sampleRate:sr, samples:out, loopStart:ls, loopEnd:le, hasLoop};
  }

  static parseSF2(ab){
    const bytes=new Uint8Array(ab), dv=new DataView(ab);
    const s4=o=>String.fromCharCode(bytes[o]||0,bytes[o+1]||0,bytes[o+2]||0,bytes[o+3]||0);
    const u16=o=>dv.getUint16(o,true), u32=o=>dv.getUint32(o,true);
    if(s4(0)!=="RIFF"||s4(8)!=="sfbk")throw new Error(t("not_sf2_file"));
  
    const chunks={info:{},sdta:{},pdta:{}};
    let p=12;
    while(p+8<=bytes.length){
      const id=s4(p), sz=u32(p+4), start=p+8;
      if(id==="LIST"){
        const type=s4(start);
        let q=start+4; const end=start+sz;
        while(q+8<=end){
          const cid=s4(q), csz=u32(q+4);
          const cdata=bytes.subarray(q+8,q+8+csz);
          if(type==="INFO")chunks.info[cid]=cdata;
          else if(type==="sdta")chunks.sdta[cid]=cdata;
          else if(type==="pdta")chunks.pdta[cid]=cdata;
          q=q+8+csz+(csz&1);
        }
      }
      p=start+sz+(sz&1);
    }
  
    if(!chunks.sdta.smpl)throw new Error(t("sf2_missing_sample_data"));
    const smplData = chunks.sdta.smpl;
  
    const getDV=name=>{
      const d=chunks.pdta[name];
      if(!d)throw new Error(t("sf2_missing_chunk", {name}));
      return new DataView(d.buffer,d.byteOffset,d.byteLength);
    };
    const getName=(d,off,len)=>{
      let s="";
      for(let i=0;i<len;i++){const c=d[off+i];if(c===0)break;s+=String.fromCharCode(c);}
      return s.replace(/\s+$/,"");
    };
  
    const shdrData=chunks.pdta.shdr, shdrDV=getDV("shdr"), shdr=[];
    for(let i=0;i+46<=shdrData.length;i+=46){
      shdr.push({
        name:getName(shdrData,i,20),
        dwStart:shdrDV.getUint32(i+20,true),
        dwEnd:shdrDV.getUint32(i+24,true),
        dwStartloop:shdrDV.getUint32(i+28,true),
        dwEndloop:shdrDV.getUint32(i+32,true),
        dwSampleRate:shdrDV.getUint32(i+36,true),
        byOriginalPitch:shdrDV.getUint8(i+40),
        chPitchCorrection:shdrDV.getInt8(i+41),
        wSampleLink:shdrDV.getUint16(i+42,true),
        sfSampleType:shdrDV.getUint16(i+44,true)
      });
    }
    if(shdr.length)shdr.pop();
  
    const phdrData=chunks.pdta.phdr, phdrDV=getDV("phdr"), phdr=[];
    for(let i=0;i+38<=phdrData.length;i+=38){
      phdr.push({
        name:getName(phdrData,i,20),
        preset:phdrDV.getUint16(i+20,true),
        bank:phdrDV.getUint16(i+22,true),
        bagIdx:phdrDV.getUint16(i+24,true)
      });
    }
    if(phdr.length)phdr.pop();
  
    const pbagData=chunks.pdta.pbag, pbagDV=getDV("pbag"), pbag=[];
    for(let i=0;i+4<=pbagData.length;i+=4){
      pbag.push({genIdx:pbagDV.getUint16(i,true),modIdx:pbagDV.getUint16(i+2,true)});
    }
    if(pbag.length)pbag.pop();
  
    const pgenData=chunks.pdta.pgen, pgenDV=getDV("pgen"), pgen=[];
    for(let i=0;i+4<=pgenData.length;i+=4){
      pgen.push({genOper:pgenDV.getUint16(i,true),genAmount:pgenDV.getUint16(i+2,true)});
    }
  
    const instData=chunks.pdta.inst, instDV=getDV("inst"), inst=[];
    for(let i=0;i+22<=instData.length;i+=22){
      inst.push({name:getName(instData,i,20),bagIdx:instDV.getUint16(i+20,true)});
    }
    if(inst.length)inst.pop();
  
    const ibagData=chunks.pdta.ibag, ibagDV=getDV("ibag"), ibag=[];
    for(let i=0;i+4<=ibagData.length;i+=4){
      ibag.push({genIdx:ibagDV.getUint16(i,true),modIdx:ibagDV.getUint16(i+2,true)});
    }
    if(ibag.length)ibag.pop();
  
    const igenData=chunks.pdta.igen, igenDV=getDV("igen"), igen=[];
    for(let i=0;i+4<=igenData.length;i+=4){
      igen.push({genOper:igenDV.getUint16(i,true),genAmount:igenDV.getUint16(i+2,true)});
    }
  
    return {shdr,phdr,pbag,pgen,inst,ibag,igen,smplData};
  }

  static async sf2ToGusPatches(sf2, fileName){
    const {shdr,phdr,pbag,pgen,inst,ibag,igen,smplData}=sf2;
    const s16=v=>v>32767?v-65536:v;

    const compressedSamples = new Map();
    const decodeContexts = new Map();
    try {
      const sampleIndices = new Set(
        igen.filter(gen => gen.genOper === 53).map(gen => gen.genAmount)
      );
      for (const sampleIndex of sampleIndices) {
        const sample = shdr[sampleIndex];
        if (!sample || (sample.sfSampleType & 0x10) === 0) continue;
        if (sample.dwStart > sample.dwEnd || sample.dwEnd >= smplData.length) {
          throw new Error(t("soundfont_invalid_compressed_sample", { name: sample.name }));
        }

        const sampleBytes = smplData.subarray(sample.dwStart, sample.dwEnd + 1);
        if (sampleBytes.length < 4
          || sampleBytes[0] !== 0x4f
          || sampleBytes[1] !== 0x67
          || sampleBytes[2] !== 0x67
          || sampleBytes[3] !== 0x53) {
          throw new Error(t("soundfont_unsupported_compression", { name: sample.name }));
        }

        const targetRate = clamp(sample.dwSampleRate || 22050, 4000, 192000);
        let decodeContext = decodeContexts.get(targetRate);
        if (!decodeContext) {
          decodeContext = PatchDataService.createDecodeContext(targetRate);
          decodeContexts.set(targetRate, decodeContext);
        }

        let audioBuffer;
        try {
          audioBuffer = await decodeContext.decodeAudioData(sampleBytes.slice().buffer);
        } catch (error) {
          throw new Error(t("soundfont_sample_decode_failed", {
            name: sample.name,
            message: error.message
          }));
        }
        if (audioBuffer.numberOfChannels !== 1) {
          throw new Error(t("soundfont_compressed_sample_must_be_mono", { name: sample.name }));
        }

        const channel = audioBuffer.getChannelData(0);
        const pcm = new Uint8Array(channel.length * 2);
        const pcmView = new DataView(pcm.buffer);
        for (let i = 0; i < channel.length; i++) {
          pcmView.setInt16(i * 2, Math.round(clamp(channel[i], -1, 1) * 32767), true);
        }
        compressedSamples.set(sampleIndex, {
          pcm,
          sampleRate: audioBuffer.sampleRate
        });
      }
    } finally {
      await Promise.all([...decodeContexts.values()]
        .filter(context => typeof context.close === "function" && context.state !== "closed")
        .map(context => context.close()));
    }
  
    function getGens(genArr,startIdx,endIdx){
      const out=[];
      const safeEnd = Math.min(endIdx, genArr.length);
      for(let i=startIdx;i<safeEnd;i++)out.push({op:genArr[i].genOper,amt:genArr[i].genAmount});
      return out;
    }
    function findGen(gens,op){for(const g of gens)if(g.op===op)return g;return null;}
  
    const sampleCache = new Map();
  
    function getKeyRange(gens){
      const range=findGen(gens,43);
      return range?[range.amt&0xff,(range.amt>>8)&0xff]:[0,127];
    }
  
    function convertSample(sIdx, overrideRoot, coarseSemis, fineCents, keyLow, keyHigh, loopFromZone){
      const cacheKey = `${sIdx}_${overrideRoot}_${coarseSemis}_${fineCents}_${keyLow}_${keyHigh}_${loopFromZone}`;
      let cached = sampleCache.get(cacheKey);
      
      if (!cached) {
        const sh=shdr[sIdx]; if(!sh)return null;
        const compressedSample = compressedSamples.get(sIdx);
        let pcm;
        let sampleRate;
        let loopStartSmp;
        let loopEndSmp;
        if (compressedSample) {
          pcm = compressedSample.pcm;
          sampleRate = compressedSample.sampleRate;
          const loopScale = sampleRate / clamp(sh.dwSampleRate || sampleRate, 1, 192000);
          loopStartSmp = Math.round(sh.dwStartloop * loopScale);
          loopEndSmp = Math.round(sh.dwEndloop * loopScale);
        } else {
          const startByte = sh.dwStart * 2;
          const endByte = Math.min(sh.dwEnd * 2, smplData.length);
          if (endByte <= startByte) return null;
          pcm = smplData.slice(startByte, endByte);
          sampleRate = sh.dwSampleRate || 22050;
          loopStartSmp = sh.dwStartloop - sh.dwStart;
          loopEndSmp = sh.dwEndloop - sh.dwStart;
        }
        const frameCount = pcm.length / 2;
        const hasLoop = loopFromZone === true
          && loopEndSmp > loopStartSmp
          && loopStartSmp >= 0
          && loopEndSmp <= frameCount;
  
        let rootNote = (overrideRoot !== undefined && overrideRoot > 0 && overrideRoot < 128)
                 ? overrideRoot
                 : sh.byOriginalPitch;
        if (!rootNote || rootNote <= 0 || rootNote >= 128) rootNote = 60; // fallback C4
        const pitchCorr=sh.chPitchCorrection||0;
        let rootFreq=440*Math.pow(2,(rootNote-69)/12)*Math.pow(2,pitchCorr/1200);
        if(coarseSemis) rootFreq*=Math.pow(2,coarseSemis/12);
        if(fineCents) rootFreq*=Math.pow(2,fineCents/1200);
        rootFreq=Math.round(rootFreq*1000);
        const lowFreq=Math.floor(440*Math.pow(2,(keyLow-69)/12)*1000);
        const highFreq=Math.ceil(440*Math.pow(2,(keyHigh-69)/12)*1000);
  
        let modes = M16;
        let envRates   = [0, 0, 0, 0, 0, 0];
        let envOffsets = [255, 255, 255, 0, 0, 0];
  
        if (hasLoop) {
          modes |= MLOOP;
  
          // FIX: tanpa MENV, TiMidity mengabaikan envRates/envOffsets dan memutar
          // sampel loop selamanya setelah note-off → "reverb panjang".
          modes |= MENV;
  
          // Envelope default ringan: attack ~10ms, sustain 100%, release ~148ms.
          // Nilai rate mengikuti kurva gusEnvMs().
          envRates   = [9, 0, 0, 69, 0, 0];
          envOffsets = [255, 255, 255, 0, 0, 0];
        }
  
        const safeName=(sh.name||"SMP").replace(/[^\x20-\x7E]/g,"").trim().substring(0,7)||"SMP";
  
        cached = {
          name:safeName, fractions:0, dataSize:pcm.length,
          loopStart:hasLoop?loopStartSmp*2:0, loopEnd:hasLoop?loopEndSmp*2:0,
          sampleRate:clamp(sampleRate,1,192000),
          lowFreq, highFreq,
          rootFreq, tune:0, balance:7,
          envRates,
          envOffsets,
          tremoloSweep:0,tremoloRate:0,tremoloDepth:0,
          vibratoSweep:0,vibratoRate:0,vibratoDepth:0,
          modes, scaleFreq: rootNote, scaleFactor:1024,
          reserved:new Uint8Array(36), pcm, _float:null
        };
        sampleCache.set(cacheKey, cached);
      }
      
      return {
        ...cached,
        envRates: [...cached.envRates],
        envOffsets: [...cached.envOffsets],
        reserved: new Uint8Array(cached.reserved),
        _float: null
      };
    }
  
    const entries=[];
    for(let pi=0;pi<phdr.length;pi++){
      const preset=phdr[pi];
      const nextPreset=phdr[pi+1];
      const pbagStart=preset.bagIdx;
      const pbagEnd=nextPreset?nextPreset.bagIdx:pbag.length;
  
      const gusInstruments=[];
      for(let pb=pbagStart;pb<pbagEnd;pb++){
        const pzone=pbag[pb];
        const nextPzone=pbag[pb+1];
        const pgenEnd=nextPzone?nextPzone.genIdx:pgen.length;
        const pgens=getGens(pgen,pzone.genIdx,pgenEnd);
        const [presetKeyLow,presetKeyHigh]=getKeyRange(pgens);
  
        const instGen=findGen(pgens,41);
        if(!instGen)continue;
        const instIdx=instGen.amt;
        if(instIdx>=inst.length)continue;
  
        const sf2inst=inst[instIdx];
        const nextInst=inst[instIdx+1];
        const ibagStart=sf2inst.bagIdx;
        const ibagEnd=nextInst?nextInst.bagIdx:ibag.length;
  
        const layers=[];
        for(let ib=ibagStart;ib<ibagEnd;ib++){
          const izone=ibag[ib];
          const nextIzone=ibag[ib+1];
          const igenEnd=nextIzone?nextIzone.genIdx:igen.length;
          const igens=getGens(igen,izone.genIdx,igenEnd);
          const [instrumentKeyLow,instrumentKeyHigh]=getKeyRange(igens);
          const keyLow=Math.max(presetKeyLow,instrumentKeyLow);
          const keyHigh=Math.min(presetKeyHigh,instrumentKeyHigh);
          if(keyLow>keyHigh)continue;
  
          const sampGen=findGen(igens,53);
          if(!sampGen)continue;
  
          // Baca generator sampleModes (op 54) — sumber kebenaran loop
          const sampleModesGen = findGen(igens, 54);
          const loopFromZone = sampleModesGen ? (sampleModesGen.amt & 0x03) !== 0 : false;
  
          const rootKeyGen=findGen(igens,58);
          const coarseGen=findGen(igens,51);
          const fineGen=findGen(igens,52);
          const coarseSemis=coarseGen?s16(coarseGen.amt):0;
          const fineCents=fineGen?s16(fineGen.amt):0;
  
          const gusSample=convertSample(
            sampGen.amt,
            rootKeyGen?rootKeyGen.amt:undefined,
            coarseSemis, fineCents,
            keyLow, keyHigh,
            loopFromZone                       // <-- parameter ke-7 (BARU)
          );
          if(!gusSample) continue;
  
          layers.push({
            duplicate:0, layer:layers.length, layerSize:0,
            reserved:new Uint8Array(40),
            samples:[gusSample]
          });
        }
        if(layers.length===0)continue;
  
        gusInstruments.push({
          instrument:instIdx,
          name:(sf2inst.name||("Inst "+instIdx)).substring(0,16),
          size:0, reserved:new Uint8Array(40),
          layers
        });
      }
      if(gusInstruments.length===0)continue;
  
      if (preset.bank === 128) {
    // === DRUM KIT: split per note ===
    const zones = [];
    for (let pb = pbagStart; pb < pbagEnd; pb++) {
      const pzone = pbag[pb];
      const nextPzone = pbag[pb + 1];
      const pgens = getGens(pgen, pzone.genIdx, nextPzone ? nextPzone.genIdx : pgen.length);
  
      // (1) Baca key range dari preset level (pgen 43) — sering dipakai di drum SF2
      const [presetKeyLow, presetKeyHigh] = getKeyRange(pgens);
  
      const instGen = findGen(pgens, 41);
      if (!instGen) continue;
      const instIdx = instGen.amt;
      const sf2inst = inst[instIdx];
      if (!sf2inst) continue;
  
      const ibagStart = sf2inst.bagIdx;
      const nextInst = inst[instIdx + 1];
      const ibagEnd = nextInst ? nextInst.bagIdx : ibag.length;
  
      for (let ib = ibagStart; ib < ibagEnd; ib++) {
        const izone = ibag[ib];
        const nextIzone = ibag[ib + 1];
        const igens = getGens(igen, izone.genIdx, nextIzone ? nextIzone.genIdx : igen.length);
  
        const sampGen = findGen(igens, 53);
        if (!sampGen) continue;
  
        const sampleModesGen = findGen(igens, 54);
        const loopFromZone = sampleModesGen ? (sampleModesGen.amt & 0x03) !== 0 : false;
  
        const [instKeyLow, instKeyHigh] = getKeyRange(igens);
        const keyLo = Math.max(presetKeyLow, instKeyLow);
        const keyHi = Math.min(presetKeyHigh, instKeyHigh);
        if (keyLo > keyHi) continue;
  
        const rootGen = findGen(igens, 58);
        const coarseGen = findGen(igens, 51);
        const fineGen = findGen(igens, 52);
        const coarseSemis = coarseGen ? s16(coarseGen.amt) : 0;
        const fineCents = fineGen ? s16(fineGen.amt) : 0;
  
        const sample = convertSample(
          sampGen.amt,
          rootGen ? rootGen.amt : undefined,
          coarseSemis, fineCents,
          keyLo, keyHi,
          loopFromZone                       // <-- parameter ke-7 (BARU)
        );
        if (!sample) continue;
        zones.push({ keyLo, keyHi, sample, sampIdx: sampGen.amt });
      }
    }
  
    // Buat SATU patch per MIDI note (35..81) yang tercakup
    for (let note = 0; note < 128; note++) {
      const z = zones.find(zz => note >= zz.keyLo && note <= zz.keyHi);
      if (!z) continue;
  
      const noteSample = {
        ...z.sample,
        envRates: [...z.sample.envRates],
        envOffsets: [...z.sample.envOffsets],
        reserved: new Uint8Array(z.sample.reserved),
        _float: null
      };
  
      const drumPatch = {
        header: {
          magic: MAGIC, gravisId: GRAVIS_ID,
          description: `${preset.name||"Drum"} N${note}`.substring(0, 60),
          voices: 14, channels: 0, waveForms: 0, masterVolume: 127, dataSize: 0,
          reserved: new Uint8Array(36)
        },
        instruments: [{
          instrument: 0,
          name: (preset.name || "Drum").substring(0, 16),
          size: 0, reserved: new Uint8Array(40),
          layers: [{
            duplicate: 0, layer: 0, layerSize: 0,
            reserved: new Uint8Array(40),
            samples: [noteSample]
          }]
        }]
      };
  
      entries.push({
        id: uid("soundfontdrum"),
        name: `drum_${String(note).padStart(2, "0")}_${preset.name||"Kit"}`.substring(0, 48),
        source: "soundfont:" + fileName,
        gmProgram: note,
        gmBank: 128,
        drumSet: preset.preset,  
        originalOrder: preset.preset,
        patch: drumPatch
      });
    }
  } else {
      const patch={
        header:{
          magic:MAGIC, gravisId:GRAVIS_ID,
          description:(preset.name||("Preset "+preset.preset)).substring(0,60),
          voices:14, channels:0, waveForms:0, masterVolume:127, dataSize:0,
          reserved:new Uint8Array(36)
        },
        instruments:gusInstruments
      };
  
      let displayName=preset.name||("Preset "+preset.preset);
      if(preset.bank>0) displayName+=" [bank "+preset.bank+"]";
      if(preset.preset!==undefined) displayName+=" #"+preset.preset;
  
      entries.push({
        id: uid("soundfont"),
        name: displayName.substring(0,48),
        source: "soundfont:"+fileName,
        gmProgram: preset.preset,
        gmBank: preset.bank,
        originalOrder: preset.bank,
        patch
      });
    }
  }
    return entries;
  }

  static resamplePcmTo(pcm, fromRate, toRate, is16) {
    if (!fromRate || !toRate || fromRate === toRate) return null;
    const bps = is16 ? 2 : 1;
    const fromN = Math.floor(pcm.length / bps);
    if (fromN < 16) return null;                       // terlalu pendek
    const toN = Math.floor(fromN * toRate / fromRate);
    if (toN < 16) return null;                         // hasil terlalu pendek
    const out = new Uint8Array(toN * bps);
    const ratio = fromRate / toRate;
  
    if (is16) {
      const src = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
      const dst = new DataView(out.buffer);
      for (let i = 0; i < toN; i++) {
        const s = i * ratio, s0 = s | 0, frac = s - s0;
        const s1 = Math.min(s0 + 1, fromN - 1);
        const a = src.getInt16(s0 * 2, true);
        const b = src.getInt16(s1 * 2, true);
        dst.setInt16(i * 2, Math.round(a + (b - a) * frac), true);
      }
    } else {
      for (let i = 0; i < toN; i++) {
        const s = i * ratio, s0 = s | 0, frac = s - s0;
        const s1 = Math.min(s0 + 1, fromN - 1);
        const a = pcm[s0], b = pcm[s1];
        out[i] = Math.round(a + (b - a) * frac);
      }
    }
    return out;
  }

  static validateAndSanitizePatch(patch) {
    if (!patch) throw new Error("Invalid patch object");
    if (!patch.header) {
      patch.header = { 
        magic: MAGIC, gravisId: GRAVIS_ID, description: "Recovered", 
        voices: 14, channels: 0, waveForms: 0, masterVolume: 127, dataSize: 0, 
        reserved: new Uint8Array(36) 
      };
    }
    
    // Pastikan voices dan masterVolume valid
    if (typeof patch.header.voices !== 'number' || patch.header.voices <= 0 || patch.header.voices > 64) {
      patch.header.voices = 14;
    }
    if (typeof patch.header.masterVolume !== 'number' || patch.header.masterVolume < 0 || patch.header.masterVolume > 127) {
      patch.header.masterVolume = 127;
    }
  
    if (!patch.instruments || !Array.isArray(patch.instruments) || patch.instruments.length === 0) {
      throw new Error("Patch has no instruments");
    }
  
    let totalSamples = 0;
    for (const inst of patch.instruments) {
      if (!inst.layers || !Array.isArray(inst.layers) || inst.layers.length === 0) {
        throw new Error("Instrument has no layers");
      }
      for (const layer of inst.layers) {
        if (!layer.samples || !Array.isArray(layer.samples) || layer.samples.length === 0) {
          throw new Error("Layer has no samples");
        }
        for (const s of layer.samples) {
          if (!s.pcm || !(s.pcm instanceof Uint8Array) || s.pcm.length === 0) {
            throw new Error("Sample has empty or invalid PCM data");
          }
          
          const bps = (s.modes & M16) ? 2 : 1;
          const totalFrames = Math.floor(s.pcm.length / bps);
          if (totalFrames === 0) {
            throw new Error("Sample PCM data too short");
          }
  
          // Perbaiki sampleRate (Cegah pembagian nol / resampling ekstrem)
          if (typeof s.sampleRate !== 'number' || s.sampleRate <= 0 || s.sampleRate > 192000) {
            s.sampleRate = 22050;
          } else if (s.sampleRate < 4000) {
            s.sampleRate = 4000; 
          }
  
          // Perbaiki rootFreq
          if (typeof s.rootFreq !== 'number' || s.rootFreq <= 0) {
            s.rootFreq = 440 * 1000;
          }
  
          // Perbaiki scaleFactor
          if (typeof s.scaleFactor !== 'number' || s.scaleFactor <= 0) {
            s.scaleFactor = 1024;
          }
          if (typeof s.scaleFreq !== 'number') {
            s.scaleFreq = 60;
          }
  
          // Perbaiki array envelope
          if (!Array.isArray(s.envRates) || s.envRates.length !== 6) {
            s.envRates = [0, 0, 0, 0, 0, 0];
          }
          if (!Array.isArray(s.envOffsets) || s.envOffsets.length !== 6) {
            s.envOffsets = [0, 0, 0, 0, 0, 0];
          }
  
          // Validasi loop (cegah infinite loop di TiMidity)
          if (s.modes & MLOOP) {
            if (s.loopStart >= s.loopEnd || s.loopEnd > s.pcm.length) {
              s.modes &= ~MLOOP;
              s.loopStart = 0;
              s.loopEnd = 0;
            } else if (s.loopEnd - s.loopStart < 4 * bps) {
              s.modes &= ~MLOOP;
              s.loopStart = 0;
              s.loopEnd = 0;
            }
          }
          totalSamples++;
        }
      }
    }
    
    if (totalSamples > 255) {
      throw new Error(`Too many samples (${totalSamples}), max is 255`);
    }
    
    return patch;
  }

  static isPatchSafeForTimidity(patch) {
    if (!patch || !patch.instruments || !Array.isArray(patch.instruments) || patch.instruments.length === 0) return false;
    let totalSamples = 0;
    for (const inst of patch.instruments) {
      if (!inst.layers || !Array.isArray(inst.layers) || inst.layers.length === 0) return false;
      for (const layer of inst.layers) {
        if (!layer.samples || !Array.isArray(layer.samples) || layer.samples.length === 0) return false;
        for (const s of layer.samples) {
          if (!s.pcm || !(s.pcm instanceof Uint8Array) || s.pcm.length === 0) return false;
          const bps = (s.modes & M16) ? 2 : 1;
          const totalFrames = Math.floor(s.pcm.length / bps);
          if (totalFrames === 0) return false;
          totalSamples++;
        }
      }
    }
    return totalSamples > 0 && totalSamples <= 255;
  }

  static createSilentPatch() {
    const silentPcm = new Uint8Array(64); // 32 frame hening
    const sample = {
      name: "SILENT", fractions: 0, dataSize: silentPcm.length,
      loopStart: 0, loopEnd: silentPcm.length, sampleRate: 22050,
      lowFreq: 0, highFreq: 20000000, rootFreq: 440000,
      tune: 0, balance: 7, envRates: [0,0,0,0,0,0], envOffsets: [255,255,255,0,0,0],
      tremoloSweep: 0, tremoloRate: 0, tremoloDepth: 0,
      vibratoSweep: 0, vibratoRate: 0, vibratoDepth: 0,
      modes: M16, scaleFreq: 60, scaleFactor: 1024,
      reserved: new Uint8Array(36), pcm: silentPcm
    };
    const patch = {
      header: {
        magic: MAGIC, gravisId: GRAVIS_ID, description: "Silent Fallback",
        voices: 14, channels: 0, waveForms: 0, masterVolume: 127, dataSize: 0,
        reserved: new Uint8Array(36)
      },
      instruments: [{
        instrument: 0, name: "Silent", size: 0, reserved: new Uint8Array(40),
        layers: [{ duplicate: 0, layer: 0, layerSize: 0, reserved: new Uint8Array(40), samples: [sample] }]
      }]
    };
    return writePAT(patch);
  }

  static writeTimidityPatch(patch) {
    validateAndSanitizePatch(patch);
    const norm = cleanPatchForStorage(patch);
    const inst = norm.instruments[0];
    if (!inst) throw new Error(t("empty_patch"));
  
    const samples = norm.instruments.flatMap(instrument =>
      instrument.layers.flatMap(layer => layer.samples)
    );
    if (samples.length === 0) throw new Error(t("no_samples"));
    if (samples.length > 255) {
      throw new Error(t("too_many_samples", {count: samples.length}));
    }
  
    // ---------------------------------------------------------------------
    // Legacy normalization: patch lama mungkin menyimpan rootFreq/lowFreq/highFreq
    // sebagai nomor nada MIDI (<=127) atau Hz (<8000), bukan mHz.
    // JANGAN dihapus — dibutuhkan untuk backward compatibility patch lama.
    // ---------------------------------------------------------------------
    for (const sample of samples) {
      if (sample.rootFreq > 0 && sample.rootFreq < 8000) {
        sample.rootFreq = sample.rootFreq <= 127
          ? Math.round(440 * Math.pow(2, (sample.rootFreq - 69) / 12) * 1000)
          : Math.round(sample.rootFreq * 1000);
        if (sample.lowFreq > 0) sample.lowFreq = Math.round(sample.lowFreq * 1000);
        if (sample.highFreq > 0) sample.highFreq = Math.round(sample.highFreq * 1000);
      }
    }
  
    // ---------------------------------------------------------------------
    // Resample ke 22050 Hz (fix pitch 2x)
    // ---------------------------------------------------------------------
    const OUT_RATE = 22050;
    for (const s of samples) {
      if (!s.sampleRate || s.sampleRate === OUT_RATE) continue;
      const is16 = (s.modes & M16) !== 0;
      const bps = is16 ? 2 : 1;
      const ratio = OUT_RATE / s.sampleRate;
      const wasLoop = (s.modes & MLOOP) !== 0;
      const oldStart = s.loopStart;
      const oldEnd = s.loopEnd;
      const resampled = resamplePcmTo(s.pcm, s.sampleRate, OUT_RATE, is16);
  
      if (!resampled) continue;
  
      s.pcm = resampled;
      s.dataSize = s.pcm.length;
      s.sampleRate = OUT_RATE;
      s._float = null;
  
      if (wasLoop) {
        const totalBytes = s.pcm.length; // penting: byte, bukan frame
        let ns = Math.round(oldStart * ratio);
        let ne = Math.round(oldEnd * ratio);
  
        ns = clamp(ns, 0, totalBytes);
        ne = clamp(ne, 0, totalBytes);
  
        // loopStart/loopEnd pada PAT adalah byte offset.
        // Panjang loop minimal 4 byte, sama seperti validateAndSanitizePatch.
        if (ne > ns && (ne - ns) >= 4 * bps) {
          s.loopStart = ns;
          s.loopEnd = ne;
        } else {
          s.modes &= ~MLOOP;
          s.loopStart = 0;
          s.loopEnd = 0;
        }
      }
    }
  
    // =====================================================================
    // === FIX: SAFETY NET — loop tanpa MENV ===
    // Sampel yang ber-loop tapi tidak punya envelope akan berputar selamanya
    // di TiMidity setelah note-off → gejala "reverb panjang".
    // Pasang MENV + envelope default ringan (attack ~10ms, sustain 100%,
    // release ~148ms) bila belum ada envelope yang bermakna.
    //
    // Diletakkan SETELAH resample, karena resample bisa menonaktifkan MLOOP
    // untuk loop yang terlalu pendek — dalam hal itu sampel tidak lagi
    // butuh release envelope.
    // =====================================================================
    for (const s of samples) {
      if ((s.modes & MLOOP) && !(s.modes & MENV)) {
        s.modes |= MENV;
        if (!Array.isArray(s.envRates) || s.envRates.every(r => r === 0)) {
          s.envRates = [9, 0, 0, 69, 0, 0];
        }
        if (!Array.isArray(s.envOffsets) ||
            (s.envOffsets.every(o => o === 0))) {
          s.envOffsets = [255, 255, 255, 0, 0, 0];
        }
      }
    }
    // === END SAFETY NET ===
  
    // ---------------------------------------------------------------------
    // Distribusi pitch-range untuk sampel "unrestricted range"
    // ---------------------------------------------------------------------
    const usesUnrestrictedSampleRanges = samples.length > 1 && samples.every(sample =>
      sample.lowFreq === 0 &&
      sample.sampleRate > 0 &&
      sample.highFreq >= sample.sampleRate * 500
    );
    if (usesUnrestrictedSampleRanges) {
      const rootFrequencies = [...new Set(samples
        .map(sample => sample.rootFreq)
        .filter(frequency => Number.isFinite(frequency) && frequency > 0))]
        .sort((a, b) => a - b);
      if (rootFrequencies.length > 1) {
        const ranges = new Map();
        rootFrequencies.forEach((frequency, index) => {
          const previous = rootFrequencies[index - 1];
          const next = rootFrequencies[index + 1];
          ranges.set(frequency, {
            lowFreq: previous ? Math.floor(Math.sqrt(previous * frequency)) : 0,
            highFreq: next ? Math.ceil(Math.sqrt(frequency * next)) : 200000
          });
        });
        for (const sample of samples) {
          const range = ranges.get(sample.rootFreq);
          if (range) Object.assign(sample, range);
        }
      }
    }
  
    return writePAT({
      header: norm.header,
      instruments: [{
        instrument: 0,
        name: inst.name || "Inst",
        size: 0,
        reserved: new Uint8Array(40),
        layers: [{
          duplicate: 0, layer: 0, layerSize: 0,
          reserved: new Uint8Array(40),
          samples
        }]
      }]
    });
  }

  static async readZip(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);
    let eocdOffset = -1;
    
    // Cari End of Central Directory (EOCD)
    for (let i = bytes.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocdOffset = i; break;
      }
    }
    if (eocdOffset === -1) throw new Error("Invalid zip format");
  
    const cdEntries = view.getUint16(eocdOffset + 10, true);
    let cdOffset = view.getUint32(eocdOffset + 16, true);
    const files = new Map();
  
    for (let i = 0; i < cdEntries; i++) {
      if (view.getUint32(cdOffset, true) !== 0x02014b50) break;
      const method = view.getUint16(cdOffset + 10, true);
      const compSize = view.getUint32(cdOffset + 20, true);
      const uncompSize = view.getUint32(cdOffset + 24, true);
      const nameLen = view.getUint16(cdOffset + 28, true);
      const extraLen = view.getUint16(cdOffset + 30, true);
      const commentLen = view.getUint16(cdOffset + 32, true);
      const localOffset = view.getUint32(cdOffset + 42, true);
  
      const nameBytes = bytes.slice(cdOffset + 46, cdOffset + 46 + nameLen);
      const name = new TextDecoder().decode(nameBytes);
  
      files.set(name, { method, compSize, uncompSize, localOffset, name });
      cdOffset += 46 + nameLen + extraLen + commentLen;
    }
    return { files, bytes, view };
  }

  static async extractFile(zip, file) {
    const { bytes, view } = zip;
    const off = file.localOffset;
    if (view.getUint32(off, true) !== 0x04034b50) throw new Error("Invalid zip header");
    const nameLen = view.getUint16(off + 26, true);
    const extraLen = view.getUint16(off + 28, true);
    const dataOffset = off + 30 + nameLen + extraLen;
  
    const compData = bytes.slice(dataOffset, dataOffset + file.compSize);
  
    if (file.method === 0) {
      return compData.buffer;
    } else if (file.method === 8) {
      if (typeof DecompressionStream === 'undefined') {
        throw new Error("Your browser does not support DecompressionStream (Deflate). Please use a modern browser.");
      }
      const ds = new DecompressionStream('deflate-raw');
      const stream = new Blob([compData]).stream().pipeThrough(ds);
      return await new Response(stream).arrayBuffer();
    }
    throw new Error("Unsupported ZIP compression method: " + file.method);
  }

  static normalizePath(p) {
    const path = String(p ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
    const parts = [];
    for (const seg of path.split("/")) {
      if (seg === "" || seg === ".") continue;
      if (seg === "..") { if (parts.length) parts.pop(); continue; }
      parts.push(seg);
    }
    return parts.join("/");
  }

  static resolvePath(base, rel) {
    const r = String(rel ?? "").replace(/\\/g, "/");
    if (!r) return normalizePath(base);
    if (r.startsWith("/")) return normalizePath(r);
    const b = String(base || "").replace(/\\/g, "/");
    const combined = b && !b.endsWith("/") ? b + "/" + r : b + r;
    return normalizePath(combined);
  }

  static zipDirname(path) {
    const norm = String(path).replace(/\\/g, '/');
    const idx = norm.lastIndexOf('/');
    return idx < 0 ? "" : norm.slice(0, idx + 1);
  }

  static detectWrapperFolder(zip) {
    const roots = new Set();
    let hasRootFile = false;
  
    for (const name of zip.files.keys()) {
      const parts = name.replace(/\\/g, '/').split('/').filter(Boolean);
      if (parts.length === 0) continue;
  
      if (parts.length === 1) {
        // Entry langsung di root — folder (trailing /) atau file?
        if (name.endsWith('/')) {
          roots.add(parts[0]);
        } else {
          hasRootFile = true;
        }
      } else {
        // Entry di dalam subfolder → parts[0] adalah folder top-level
        roots.add(parts[0]);
      }
    }
  
    if (hasRootFile) return "";
    if (roots.size === 1) return Array.from(roots)[0] + "/";
    return "";
  }

  static parseTimidityCfg(text) {
    const patches = [];
    let currentBank = null;
    let currentDrumSet = null;
    let currentDir = "";
  
    const lines = text.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
  
      const dirMatch = line.match(/^dir\s+(.+)$/i);
      if (dirMatch) {
        currentDir = normalizePath(dirMatch[1]);
        if (currentDir && !currentDir.endsWith('/')) currentDir += '/';
        continue;
      }
  
      const bankMatch = line.match(/^bank\s+(\d+)$/i);
      if (bankMatch) {
        currentBank = parseInt(bankMatch[1], 10);
        currentDrumSet = null;
        continue;
      }
  
      const drumMatch = line.match(/^drumset\s+(\d+)$/i);
      if (drumMatch) {
        currentDrumSet = parseInt(drumMatch[1], 10);
        currentBank = null;
        continue;
      }
  
      const progMatch = line.match(/^(\d+)\s+(.+)$/);
      if (progMatch && (currentBank !== null || currentDrumSet !== null)) {
        const program = parseInt(progMatch[1], 10);
        let filename = progMatch[2].trim();
        
        let fullPath = normalizePath(filename);
        if (currentDir && !filename.startsWith('/')) {
          // PERBAIKAN: Bersihkan kembali path setelah digabung
          fullPath = normalizePath(currentDir + fullPath);
        }
  
        patches.push({
          program,
          filename: fullPath,
          isDrum: currentDrumSet !== null,
          targetBank: currentDrumSet !== null ? currentDrumSet : currentBank
        });
      }
    }
    return patches;
  }

  static parseUltramidIni(text) {
    const patches = [];
    const lines = text.split(/\r?\n/);
  
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith('#') || line.startsWith(';')) continue;
      // Baris data harus diawali angka (nomor program)
      if (!/^\d/.test(line)) continue;
  
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 2) continue;
  
      const program = parseInt(parts[0], 10);
      const name = parts[parts.length - 1];
  
      if (!Number.isFinite(program) || !name) continue;
      if (program < 0 || program > 255) continue;
  
      // Program 128 = placeholder "blank" — jangan diimpor
      if (program === 128) continue;
  
      let isDrum, gmProgram, gmBank;
      if (program < 128) {
        isDrum = false;
        gmProgram = program;
        gmBank = 0;
      } else {
        // 129..255 -> drum note 1..127
        isDrum = true;
        gmProgram = program - 128;
        gmBank = 128;
        if (gmProgram > 127) continue; // safety
      }
  
      patches.push({
        program: gmProgram,
        filename: name + ".pat",
        isDrum,
        targetBank: 0
      });
    }
  
    return patches;
  }

  static zipBasename(path) {
    return String(path).split(/[\\/]/).pop() || "";
  }

  static normalizeBasenameKey(name) {
    return zipBasename(name).toLowerCase().replace(/\.[^.]+$/, "");
  }

  static findConfigFileCandidates(zip) {
    const names = Array.from(zip.files.keys());
    const candidates = [];
    const seen = new Set();
    const push = (name, format) => {
      const key = name + "|" + format;
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({ name, format });
    };
  
    // Prioritas 1: timidity.cfg
    names.forEach(name => {
      if (zipBasename(name).toLowerCase() === "timidity.cfg") push(name, "timidity");
    });
    // Prioritas 2: *.cfg (selain timidity.cfg yang sudah masuk)
    names.forEach(name => {
      if (/\.cfg$/i.test(name) && zipBasename(name).toLowerCase() !== "timidity.cfg") {
        push(name, "timidity");
      }
    });
    // Prioritas 3: *.ini — coba sebagai TiMidity dulu, lalu sebagai UltraMID
    names.forEach(name => {
      if (/\.ini$/i.test(name)) {
        push(name, "timidity");
        push(name, "ultramid");
      }
    });
  
    return candidates;
  }

  static findPatchFileInZip(zip, targetPath) {
    const targetNorm = normalizePath(targetPath).toLowerCase();
    const targetBasename = zipBasename(targetPath).toLowerCase();
    const targetKey = normalizeBasenameKey(targetPath);
  
    // Pass 1: exact normalized path
    for (const [name, entry] of zip.files) {
      if (normalizePath(name).toLowerCase() === targetNorm) return entry;
    }
    // Pass 2: endsWith (folder berbeda di root ZIP)
    for (const [name, entry] of zip.files) {
      const normName = normalizePath(name).toLowerCase();
      if (normName.endsWith("/" + targetNorm)) return entry;
    }
    // Pass 3: exact basename (case-insensitive, dengan ekstensi)
    for (const [name, entry] of zip.files) {
      if (zipBasename(name).toLowerCase() === targetBasename) return entry;
    }
    // Pass 4: basename tanpa ekstensi — preferensi file .pat
    const candidates = [];
    for (const [name, entry] of zip.files) {
      if (normalizeBasenameKey(name) === targetKey) candidates.push({ name, entry });
    }
    if (candidates.length > 0) {
      const patMatch = candidates.find(c => /\.pat$/i.test(c.name));
      return (patMatch || candidates[0]).entry;
    }
    return null;
  }

  static tokenizeSfzLine(line) {
    const tokens = [];
    let current = "";
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (!inQuote && /\s/.test(ch)) {
        if (current) { tokens.push(current); current = ""; }
      } else {
        current += ch;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }

  static parseSfzText(text) {
    const result = { control: {}, global: {}, regions: [] };
    // Hapus komentar blok
    text = text.replace(/\/\*[\s\S]*?\*\//g, "");
  
    const lines = text.split(/\r?\n/).map(l => l.replace(/\/\/.*$/, "").trim());
    let currentTarget = null;
    let currentMaster = {};
    let currentGroup = null;
    const defines = {};
  
    for (let line of lines) {
      if (!line) continue;
  
      // Handle #define
      if (/^#define\s/i.test(line)) {
        const m = line.match(/^#define\s+\$([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/i);
        if (m) defines[m[1]] = m[2].trim();
        continue;
      }
  
      // Deteksi blok <header> (misal <region>, <group>)
      let headerMatch = line.match(/<([a-zA-Z0-9_]+)>/);
      if (headerMatch) {
        const section = headerMatch[1].toLowerCase();
        if (section === "control") currentTarget = result.control;
        else if (section === "global") currentTarget = result.global;
        else if (section === "master") {
          currentMaster = {};
          currentTarget = currentMaster;
          currentGroup = null;
        } else if (section === "group") {
          currentGroup = { opcodes: {}, master: currentMaster };
          currentTarget = currentGroup.opcodes;
        } else if (section === "region") {
          const region = { opcodes: {}, group: currentGroup, master: currentMaster };
          result.regions.push(region);
          currentTarget = region.opcodes;
        } else {
          currentTarget = null;
        }
        
        // Buang bagian <header> agar sisa opcode di baris yang sama tetap terbaca
        line = line.substring(headerMatch.index + headerMatch[0].length).trim();
        if (!line) continue;
      }
  
      if (!currentTarget) continue;
  
      // ✨ INI KUNCINYA: Regex untuk memisahkan key=value dengan aman
      // Mendukung value berspasi asalkan tidak diikuti oleh "kata="
      const regex = /([a-zA-Z0-9_]+)=(?:"([^"]*)"|(.*?)(?=\s+[a-zA-Z0-9_]+=|$))/g;
      let match;
      
      while ((match = regex.exec(line)) !== null) {
        const key = match[1].toLowerCase();
        // match[2] jika diapit tanda kutip, match[3] jika tanpa kutip
        let value = match[2] !== undefined ? match[2] : match[3];
        value = value.trim();
        
        // Ganti variabel #define (misal $foo)
        value = value.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (m, name) =>
          Object.prototype.hasOwnProperty.call(defines, name) ? defines[name] : m
        );
  
        currentTarget[key] = value;
      }
    }
    return result;
  }

  static mergeSfzOpcodes(sfz, region) {
    return {
      ...sfz.global,
      ...(region.master || {}),
      ...(region.group?.opcodes || {}),
      ...region.opcodes
    };
  }

  static detectSfzDrumKit(sfz, sfzName) {
    const name = (sfzName || "").toLowerCase();
    if (/drum|kit|percussion|perc_/i.test(name)) return true;
  
    for (const region of sfz.regions) {
      const opcodes = mergeSfzOpcodes(sfz, region);
      if (opcodes.group || opcodes.off_group || opcodes.off_time) return true;
      if (opcodes.trigger === "release") return true;
      if (opcodes.sample &&
          /(kick|snare|hat|tom|crash|ride|clap|conga|bongo|timbale|shaker|tambourine|cowbell|cymbal)/i.test(opcodes.sample)) {
        return true;
      }
    }
    return false;
  }

  static findAudioFileInZip(zip, targetPath) {
    const targetRaw  = String(targetPath).replace(/\\/g, "/");
    const targetNorm = normalizePath(targetRaw).toLowerCase();
    const targetBase = zipBasename(targetRaw).toLowerCase();
    const targetKey  = normalizeBasenameKey(targetRaw);
    let targetDecode = targetNorm;
    try { targetDecode = decodeURIComponent(targetNorm); } catch (_) {}
  
    for (const [name, entry] of zip.files) {
      if (normalizePath(name).toLowerCase() === targetDecode) return entry;
    }
    for (const [name, entry] of zip.files) {
      if (normalizePath(name).toLowerCase() === targetNorm) return entry;
    }
    for (const [name, entry] of zip.files) {
      const n = normalizePath(name).toLowerCase();
      if (n.endsWith("/" + targetNorm) || n.endsWith("/" + targetDecode)) return entry;
    }
    for (const [name, entry] of zip.files) {
      if (zipBasename(name).toLowerCase() === targetBase) return entry;
    }
    const candidates = [];
    for (const [name, entry] of zip.files) {
      if (normalizeBasenameKey(name) === targetKey) candidates.push({ name, entry });
    }
    if (candidates.length > 0) {
      const audioMatch = candidates.find(c => /\.(wav|mp3|ogg|flac|aif|aiff)$/i.test(c.name));
      return (audioMatch || candidates[0]).entry;
    }
    return null;
  }

  static applySfzToSample(sample, opcodes) {
    const bps = (sample.modes & M16) ? 2 : 1;
  
    // Loop (SFZ memakai frame, GUS memakai byte)
    const loopMode = String(opcodes.loop_mode || "").toLowerCase();
    const isLooping = loopMode === "loop_continuous" || loopMode === "loop_sustain" || loopMode === "loop";
  
    if (isLooping) {
      const ls = parseInt(opcodes.loop_start, 10);
      const le = parseInt(opcodes.loop_end, 10);
      if (isFinite(ls)) sample.loopStart = Math.max(0, Math.round(ls * bps));
      if (isFinite(le)) sample.loopEnd   = Math.max(0, Math.round(le * bps));
  
      if (sample.loopEnd > sample.loopStart) {
        sample.modes |= MLOOP;
        sample.modes |= MENV;
        // Envelope default ringan (attack ~10ms, sustain 100%, release ~148ms)
        // Konsisten dengan safety net di writeTimidityPatch().
        sample.envRates   = [9, 0, 0, 69, 0, 0];
        sample.envOffsets = [255, 255, 255, 0, 0, 0];
      }
    }
  
    // Tuning (tune = cents, transpose = semitone)
    const tuneCents =
      parseFloat(opcodes.tune || "0") +
      (parseInt(opcodes.transpose || "0", 10) * 100);
    if (isFinite(tuneCents) && tuneCents !== 0) {
      const factor = Math.pow(2, tuneCents / 1200);
      sample.rootFreq = Math.max(1, Math.round(sample.rootFreq * factor));
    }
  
    // Volume/pan SFZ diabaikan — envelope + velocity mengatur gain di engine.
  }

  static async sfzToGusEntries(sfz, zip, sfzName, sourceFileName, onProgress) {
    const entries = [];
    const missingSamples = [];
    const failedSamples  = [];
  
    const sfzDir = zipDirname(sfzName);
    const defaultPath = sfz.control.default_path || "";
    const sampleCache = new Map();
  
    async function loadSample(samplePath) {
      if (!samplePath) return null;
      if (sampleCache.has(samplePath)) return sampleCache.get(samplePath);
  
      let rel = String(samplePath).replace(/\\/g, "/");
      try { rel = decodeURIComponent(rel); } catch (_) {}
  
      if (defaultPath && !rel.startsWith("/")) {
        const dp = String(defaultPath).replace(/\\/g, "/");
        rel = dp.endsWith("/") ? dp + rel : dp + "/" + rel;
      }
  
      const resolved = resolvePath(sfzDir, rel);
  
      const zipEntry = findAudioFileInZip(zip, resolved)
                    || findAudioFileInZip(zip, rel)
                    || findAudioFileInZip(zip, samplePath);
  
      if (!zipEntry) {
        missingSamples.push(samplePath);
        sampleCache.set(samplePath, null);
        return null;
      }
      try {
        const audioData = await extractFile(zip, zipEntry);
        const audioBuffer = await decodeSampleBlob(new Blob([audioData]));
        const draft = await buildSampleDraft(audioBuffer, zipBasename(samplePath));
        sampleCache.set(samplePath, draft);
        return draft;
      } catch (err) {
        failedSamples.push({ path: samplePath, error: err.message || String(err) });
        console.error(`[SFZ] Decode failed "${samplePath}" (zip: "${zipEntry.name}"):`, err);
        sampleCache.set(samplePath, null);
        return null;
      }
    }
  
    const isDrum = detectSfzDrumKit(sfz, sfzName);
    const baseName = (sfzName || "SFZ").replace(/\.sfz$/i, "");
  
    if (isDrum) {
      // ═══ DRUM: satu patch per region ═══
      for (let i = 0; i < sfz.regions.length; i++) {
        const region = sfz.regions[i];
        const opcodes = mergeSfzOpcodes(sfz, region);
        if (!opcodes.sample) continue;
  
        let note = 36;
        if (opcodes.key !== undefined) note = parseInt(opcodes.key, 10);
        else if (opcodes.lokey !== undefined) note = parseInt(opcodes.lokey, 10);
        else if (opcodes.pitch_keycenter !== undefined) note = parseInt(opcodes.pitch_keycenter, 10);
        if (!isFinite(note) || note < 0 || note > 127) continue;
  
        onProgress?.(i + 1, sfz.regions.length, zipBasename(opcodes.sample));
        const draft = await loadSample(opcodes.sample);
        if (!draft) continue;
  
        const sample = { ...draft.sample, _float: null };
        applySfzToSample(sample, opcodes);
        if (draft.resampleRatio && draft.resampleRatio !== 1) {
          sample.loopStart = Math.round(sample.loopStart * draft.resampleRatio);
          sample.loopEnd   = Math.round(sample.loopEnd   * draft.resampleRatio);
        }
        sample.lowFreq  = Math.floor(midiToFreq(note) * 1000);
        sample.highFreq = Math.ceil(midiToFreq(note) * 1000);
        sample.rootFreq = Math.round(midiToFreq(note) * 1000);
        sample.name = zipBasename(opcodes.sample)
          .replace(/\.[^.]+$/, "").replace(/[^\w-]/g, "").slice(0, 7) || "SMP";
  
        const drumName = GM_DRUM_NAMES[note] || `Note ${note}`;
        entries.push({
          id: uid("sfzdrum"),
          name: `${String(note).padStart(2, "0")}_${drumName}`.substring(0, 48),
          source: "sfz:" + sourceFileName,
          gmProgram: note, gmBank: 128, drumSet: 0, originalOrder: 0,
          patch: {
            header: { magic: MAGIC, gravisId: GRAVIS_ID,
              description: drumName.substring(0, 60),
              voices: 14, channels: 0, waveForms: 1,
              masterVolume: 127, dataSize: sample.pcm.length,
              reserved: new Uint8Array(36) },
            instruments: [{ instrument: 0, name: drumName.substring(0, 16),
              size: 0, reserved: new Uint8Array(40),
              layers: [{ duplicate: 0, layer: 0, layerSize: 0,
                reserved: new Uint8Array(40), samples: [sample] }] }]
          }
        });
      }
    } else {
      // ═══ MELODIC: satu patch, semua region jadi sample ═══
      const allSamples = [];
      for (let i = 0; i < sfz.regions.length; i++) {
        const region = sfz.regions[i];
        const opcodes = mergeSfzOpcodes(sfz, region);
        if (!opcodes.sample) continue;
  
        onProgress?.(i + 1, sfz.regions.length, zipBasename(opcodes.sample));
        const draft = await loadSample(opcodes.sample);
        if (!draft) continue;
  
        const sample = { ...draft.sample, _float: null };
        const loKey   = opcodes.lokey !== undefined ? parseInt(opcodes.lokey, 10) : 0;
        const hiKey   = opcodes.hikey !== undefined ? parseInt(opcodes.hikey, 10) : 127;
        const rootKey = opcodes.pitch_keycenter !== undefined
          ? parseInt(opcodes.pitch_keycenter, 10)
          : (opcodes.key !== undefined ? parseInt(opcodes.key, 10) : 60);
  
        const safeLo   = clamp(isFinite(loKey)   ? loKey   : 0,   0, 127);
        const safeHi   = clamp(isFinite(hiKey)   ? hiKey   : 127, 0, 127);
        const safeRoot = clamp(isFinite(rootKey) ? rootKey : 60,  0, 127);
  
        sample.lowFreq  = Math.floor(midiToFreq(safeLo) * 1000);
        sample.highFreq = Math.ceil(midiToFreq(safeHi) * 1000);
        sample.rootFreq = Math.round(midiToFreq(safeRoot) * 1000);
        sample.name = zipBasename(opcodes.sample)
          .replace(/\.[^.]+$/, "").replace(/[^\w-]/g, "").slice(0, 7) || "SMP";
  
        applySfzToSample(sample, opcodes);
        if (draft.resampleRatio && draft.resampleRatio !== 1) {
          sample.loopStart = Math.round(sample.loopStart * draft.resampleRatio);
          sample.loopEnd   = Math.round(sample.loopEnd   * draft.resampleRatio);
        }
        allSamples.push(sample);
      }
  
      if (allSamples.length > 0) {
        const instName = String(sfz.control.description || baseName).substring(0, 60);
        entries.push({
          id: uid("sfz"),
          name: instName.substring(0, 48),
          source: "sfz:" + sourceFileName,
          gmProgram: -1, gmBank: 0,
          patch: {
            header: { magic: MAGIC, gravisId: GRAVIS_ID, description: instName,
              voices: 14, channels: 0, waveForms: allSamples.length,
              masterVolume: 127,
              dataSize: allSamples.reduce((s, x) => s + x.pcm.length, 0),
              reserved: new Uint8Array(36) },
            instruments: [{ instrument: 0, name: instName.substring(0, 16),
              size: 0, reserved: new Uint8Array(40),
              layers: [{ duplicate: 0, layer: 0, layerSize: 0,
                reserved: new Uint8Array(40), samples: allSamples }] }]
          }
        });
      }
    }
  
    return { entries, missingSamples, failedSamples, totalRegions: sfz.regions.length };
  }

  static async handleSfzZip(zip) {
    const sfzNames = [];
    for (const name of zip.files.keys()) {
      if (/\.sfz$/i.test(name)) sfzNames.push(name);
    }
    if (sfzNames.length === 0) return null;
  
    const allEntries = [];
    const failures = [];
  
    for (let i = 0; i < sfzNames.length; i++) {
      const sfzName = sfzNames[i];
  
      // Status level FILE (1× per SFZ)
      showStatus(t("status_reading_from_zip_file", {
        read: i + 1,
        total: sfzNames.length,
        zip_file_name: zipBasename(sfzName)
      }));
  
      try {
        const sfzData = await extractFile(zip, zip.files.get(sfzName));
        const sfzText = new TextDecoder().decode(sfzData);
        const sfz = parseSfzText(sfzText);
  
        if (sfz.regions.length === 0) {
          failures.push(t("sfz_error_no_regions", { filename: sfzName }));
          continue;
        }
  
        const result = await sfzToGusEntries(
          sfz, zip, sfzName, zipBasename(sfzName),
          // Status level SAMPLE (1× per region di dalam file SFZ ini)
          (current, totalRegions, sampleName) =>
            showStatus(t("status_reading_from_zip_sample", {
              file_read:    i + 1,
              file_total:   sfzNames.length,
              sample_read:  current,
              sample_total: totalRegions,
              sample_name:  sampleName,
              zip_file_name: zipBasename(sfzName)
            }))
        );
  
        if (result.entries.length > 0) {
          allEntries.push(...result.entries);
        } else {
          const detail = [];
          if (result.missingSamples.length > 0) {
            detail.push(t("sfz_error_missing_samples", {
              missing: result.missingSamples.length,
              total:   result.totalRegions,
              example: result.missingSamples[0]
            }));
          }
          if (result.failedSamples.length > 0) {
            detail.push(t("sfz_error_decode_failed", {
              failed: result.failedSamples.length,
              total:  result.totalRegions,
              path:   result.failedSamples[0].path,
              error:  result.failedSamples[0].error
            }));
          }
          const detailText = detail.join("; ");
          failures.push(t("sfz_error_no_patches_with_reason", {
            filename: sfzName,
            reason: detailText || t("sfz_error_no_patches")
          }));
        }
      } catch (err) {
        console.error(`[SFZ] Failed to process ${sfzName}:`, err);
        failures.push(t("sfz_error_processing", {
          filename: sfzName,
          message: err.message || err
        }));
      }
    }
  
    return { entries: allEntries, failures, sfzNames };
  }

  static async handleZipOpen(ab) {
    showStatus(t("reading_zip"));
    const zip = await readZip(ab);
  
      // PRIORITAS 1: Cek apakah ada file .sfz
    const hasSfz = Array.from(zip.files.keys()).some(n => /\.sfz$/i.test(n));
  
    if (hasSfz) {
      showStatus(t("sfz_processing"));
  
      let sfzResult;
      try {
        sfzResult = await handleSfzZip(zip);
      } catch (err) {
        console.error("[SFZ] Import threw:", err);
        throw new Error(t("sfz_import_failed", {
          message: err.message || String(err)
        }));
      }
  
      if (!sfzResult || !Array.isArray(sfzResult.entries)) {
        throw new Error(t("sfz_invalid_return"));
      }
  
      if (sfzResult.entries.length === 0) {
        const detail = (sfzResult.failures && sfzResult.failures.length > 0)
          ? sfzResult.failures.join("\n")
          : t("sfz_error_no_patches");
        throw new Error(t("sfz_import_failed", { message: detail }));
      }
  
      const added = await addPatchEntries(sfzResult.entries);
  
      if (added) {
        const n = sfzResult.entries.length;
        showStatus(
          t(n === 1 ? "sfz_imported_one" : "sfz_imported_many", {
            count: n,
            files: sfzResult.sfzNames.length
          }),
          "ok"
        );
      }
      return;
    }
  
    // PRIORITAS 2: Tanpa .sfz, gunakan jalur TiMidity cfg seperti biasa
    const cfgCandidates = findConfigFileCandidates(zip);
    if (cfgCandidates.length === 0) throw new Error(t("zip_no_cfg"));
  
    let cfgName = null;
    let parsed = null;
    for (const candidate of cfgCandidates) {
      try {
        const cfgData = await extractFile(zip, zip.files.get(candidate.name));
        const text = new TextDecoder().decode(cfgData);
        const result = (candidate.format === "ultramid") ? parseUltramidIni(text) : parseTimidityCfg(text);
        if (result.length > 0) {
          cfgName = candidate.name;
          parsed = result;
          break;
        }
      } catch (e) {
        console.warn(`Gagal parse kandidat config "${candidate.name}":`, e);
      }
    }
  
    if (!parsed) throw new Error(t("zip_no_patches"));
  
    const cfgDir = zipDirname(cfgName);
    const wrapperFolder = detectWrapperFolder(zip);
    const baseDir = cfgDir || "";
  
    const entries = [];
    let processed = 0;
  
    for (const item of parsed) {
      const targetPath = normalizePath(item.filename);
  
      let zipFileEntry = null;
  
      if (baseDir) {
        const prefixed = normalizePath(baseDir + targetPath);
        zipFileEntry = findPatchFileInZip(zip, prefixed);
      }
  
      if (!zipFileEntry) {
        zipFileEntry = findPatchFileInZip(zip, targetPath);
      }
  
      if (!zipFileEntry && wrapperFolder && wrapperFolder !== baseDir) {
        const wrapped = normalizePath(wrapperFolder + targetPath);
        zipFileEntry = findPatchFileInZip(zip, wrapped);
      }
  
      if (!zipFileEntry) {
        console.warn(`File tidak ditemukan di ZIP: ${targetPath}`);
        continue;
      }
  
      try {
        const patData = await extractFile(zip, zipFileEntry);
        const patch = parsePAT(patData);
        const fallbackName = item.filename.split('/').pop().replace(/\.pat$/i, "");
        const entryName = getImportedPatchName(patch, item, fallbackName);
  
        if (patch.instruments && patch.instruments.length > 0) {
          for (const inst of patch.instruments) {
            if (!inst.name || !inst.name.trim()) {
              inst.name = entryName.substring(0, 16);
            }
          }
        }
  
        const entry = {
          id: uid("pat"),
          name: entryName,
          source: "zip:" + cfgName,
          gmProgram: item.program,
          gmBank: item.isDrum ? 128 : 0,
          ...(item.isDrum ? { drumSet: item.targetBank } : {}),
          originalOrder: item.targetBank,
          targetBank: item.targetBank,
          patch
        };
        entries.push(entry);
        processed++;
        if (processed % 10 === 0) {
          showStatus(t("importing_zip", { current: processed, total: parsed.length }));
          await new Promise(r => setTimeout(r, 0));
        }
      } catch (e) {
        console.warn(`Gagal memproses ${targetPath}:`, e);
      }
    }
  
    if (entries.length === 0) throw new Error(t("zip_no_valid_patches"));
  
    await addPatchEntries(entries);
    showStatus(t("zip_import_success", { count: entries.length }), "ok");
  }

  static detectFileType(ab) {
    if (!ab || ab.byteLength < 12) return null;
    const b = new Uint8Array(ab, 0, 12);
    let s = "";
    for (let i = 0; i < 12; i++) s += String.fromCharCode(b[i]);
    if (s.startsWith("GF1PATCH")) return "pat";
    if (s.startsWith("RIFF") && s.substring(8, 12) === "sfbk") return "sf2";
    if (s.startsWith("CcnK") && s.substring(8, 12) === "FPCh") return "fxp";
    if (b[0] === 0x50 && b[1] === 0x4B) return "zip"; // ZIP signature 'PK'
  
    // MIDI.js Soundfont: file teks yang mengandung "MIDI.Soundfont"
    const probeLen = Math.min(512, ab.byteLength);
    const head = new TextDecoder("utf-8").decode(new Uint8Array(ab, 0, probeLen));
    if (head.includes("MIDI.Soundfont") || head.includes("MIDI.SoundFont")) return "midijs";
  
    return null;
  }

  static surgeFxpToGusEntry(ab, fileName) {
    const bytes = new Uint8Array(ab);
    const dv = new DataView(ab);
    const readTag = (offset, length) =>
      String.fromCharCode(...bytes.subarray(offset, offset + length));
    const fail = key => { throw new Error(t(key)); };
    if (bytes.length < 92 || readTag(0, 4) !== "CcnK" || readTag(8, 4) !== "FPCh") {
      fail("fxp_invalid_file");
    }
    if (readTag(16, 4) !== "cjs3") fail("fxp_unsupported_plugin");

    const chunkSize = dv.getUint32(56, false);
    const chunkEnd = 60 + chunkSize;
    if (chunkSize < 32 || chunkEnd > bytes.length || readTag(60, 4) !== "sub3") {
      fail("fxp_invalid_file");
    }

    const xmlSize = dv.getUint32(64, true);
    const wavetableSizes = Array.from({ length: 6 }, (_, index) =>
      dv.getUint32(68 + index * 4, true)
    );
    const wavetableOffset = 92 + xmlSize;
    if (xmlSize === 0 || xmlSize > 1024 * 1024
      || wavetableOffset > chunkEnd
      || wavetableOffset + wavetableSizes.reduce((sum, size) => sum + size, 0) !== chunkEnd) {
      fail("fxp_invalid_file");
    }

    const xml = new TextDecoder("utf-8", { fatal: true })
      .decode(bytes.subarray(92, wavetableOffset));
    const Parser = window.DOMParser;
    if (!Parser) fail("fxp_xml_parser_unavailable");
    const document = new Parser().parseFromString(xml, "application/xml");
    if (document.querySelector("parsererror") || document.documentElement?.localName !== "patch") {
      fail("fxp_invalid_file");
    }

    const rawPatchName = document.getElementsByTagName("meta")[0]?.getAttribute("name")
      || fileName.replace(/\.fxp$/i, "");
    const patchName = rawPatchName.replace(/[^\x20-\x7E]/g, " ").trim().substring(0, 60)
      || fileName.replace(/\.fxp$/i, "").substring(0, 60);
    const layers = [];
    let dataOffset = wavetableOffset;
    for (let slot = 0; slot < 6; slot++) {
      const blockSize = wavetableSizes[slot];
      if (blockSize === 0) continue;
      if (blockSize < 12 || dataOffset + blockSize > chunkEnd) fail("fxp_invalid_file");

      const scene = Math.floor(slot / 3);
      const oscillator = slot % 3;
      const prefix = `${String.fromCharCode(97 + scene)}_osc${oscillator + 1}`;
      const typeNode = document.getElementsByTagName(`${prefix}_type`)[0];
      const oscillatorType = Number(typeNode?.getAttribute("value"));
      if (oscillatorType !== 2 && oscillatorType !== 7) {
        dataOffset += blockSize;
        continue;
      }

      const blockView = new DataView(ab, dataOffset, blockSize);
      const frameSize = blockView.getUint32(4, true);
      const frameCount = blockView.getUint16(8, true);
      const flags = blockView.getUint16(10, true);
      const isInt16 = (flags & 4) !== 0;
      const isSample = (flags & 1) !== 0;
      const shouldLoop = !isSample || (flags & 2) !== 0;
      const bytesPerValue = isInt16 ? 2 : 4;
      const expectedDataSize = frameSize * frameCount * bytesPerValue;
      if (frameSize < 16 || frameSize > 4096 || frameCount < 1 || frameCount > 512
        || expectedDataSize + 12 !== blockSize) {
        fail("fxp_invalid_wavetable");
      }

      const valueCount = isSample ? frameSize * frameCount : frameSize;
      const pcm = new Uint8Array(valueCount * 2);
      const pcmView = new DataView(pcm.buffer);
      for (let index = 0; index < valueCount; index++) {
        const value = isInt16
          ? blockView.getInt16(12 + index * 2, true) / ((flags & 8) ? 32768 : 16384)
          : blockView.getFloat32(12 + index * 4, true);
        if (!Number.isFinite(value)) fail("fxp_invalid_wavetable");
        pcmView.setInt16(index * 2, Math.round(clamp(value, -1, 32767 / 32768) * 32768), true);
      }

      const octaveNode = document.getElementsByTagName(`${prefix}_octave`)[0];
      const octave = Number(octaveNode?.getAttribute("value")) || 0;
      const oscillatorName = document.getElementsByTagName(`osc_extra_sc${scene}_osc${oscillator}`)[0]
        ?.getAttribute("wavetable_display_name") || `${patchName} ${oscillator + 1}`;
      const sampleRate = isSample ? 44100 : 22050;
      const pitchRatio = Math.pow(2, -clamp(octave, -8, 8));
      const hasLoop = shouldLoop && pcm.length >= 8;
      const sampleName = oscillatorName.replace(/[^\x20-\x7E]/g, "").trim().substring(0, 7) || "FXP";
      const sample = {
        name: sampleName,
        fractions: 0,
        dataSize: pcm.length,
        loopStart: 0,
        loopEnd: hasLoop ? pcm.length : 0,
        sampleRate,
        lowFreq: 0,
        highFreq: 20000000,
        rootFreq: Math.round((hasLoop ? sampleRate / frameSize : 261.625565) * pitchRatio * 1000),
        tune: 0,
        balance: 7,
        envRates: hasLoop ? [9, 0, 0, 69, 0, 0] : [0, 0, 0, 0, 0, 0],
        envOffsets: [255, 255, 255, 0, 0, 0],
        tremoloSweep: 0,
        tremoloRate: 0,
        tremoloDepth: 0,
        vibratoSweep: 0,
        vibratoRate: 0,
        vibratoDepth: 0,
        modes: M16 | (hasLoop ? MLOOP | MENV : 0),
        scaleFreq: 60,
        scaleFactor: 1024,
        reserved: new Uint8Array(36),
        pcm,
        _float: null
      };
      layers.push({
        duplicate: 0,
        layer: layers.length,
        layerSize: 0,
        reserved: new Uint8Array(40),
        samples: [sample]
      });
      dataOffset += blockSize;
    }

    if (layers.length === 0) fail("fxp_no_embedded_wavetables");
    const description = patchName.substring(0, 60);
    const patch = {
      header: {
        magic: MAGIC,
        gravisId: GRAVIS_ID,
        description,
        voices: 14,
        channels: 0,
        waveForms: 0,
        masterVolume: 127,
        dataSize: 0,
        reserved: new Uint8Array(36)
      },
      instruments: [{
        instrument: 0,
        name: patchName.substring(0, 16),
        size: 0,
        reserved: new Uint8Array(40),
        layers
      }]
    };

    const project = state.projects.find(item => item.id === state.currentProjectId);
    const usedPrograms = new Set(
      project ? getProjectPatches(project)
        .filter(entry => (entry.gmBank ?? 0) !== 128 && (entry.targetBank ?? 0) === 0)
        .map(entry => Number(entry.gmProgram))
        .filter(program => Number.isInteger(program) && program >= 0 && program <= 127)
        : []
    );
    const gmProgram = Array.from({length: 128}, (_, program) => program)
      .find(program => !usedPrograms.has(program)) ?? -1;

    return {
      id: uid("fxp"),
      name: patchName.substring(0, 48),
      source: `fxp:${fileName}`,
      gmProgram,
      gmBank: 0,
      patch
    };
  }

  static getImportedPatchName(patch, cfgItem, fallbackFilename) {
  
    if (patch?.instruments?.length === 1) {
      const instName = (patch.instruments[0]?.name || "").trim();
      if (instName) return instName.substring(0, IMPORT_NAME_MAX_LEN);
    }
  
    if (cfgItem) {
      const prog = cfgItem.program;
      if (cfgItem.isDrum) {
        const drumName = GM_DRUM_NAMES[prog];
        if (drumName) return drumName.substring(0, IMPORT_NAME_MAX_LEN);
      } else if (Number.isInteger(prog) && prog >= 0 && prog < GM_MELODIC_NAMES.length) {
        return GM_MELODIC_NAMES[prog].substring(0, IMPORT_NAME_MAX_LEN);
      }
    }
  
    const desc = (patch?.header?.description || "").trim();
    if (desc && !/^\d+$/.test(desc)) {
      return desc.substring(0, IMPORT_NAME_MAX_LEN);
    }
  
    // 4. Fallback terakhir: nama file
    return (fallbackFilename || "patch").substring(0, IMPORT_NAME_MAX_LEN);
  }

  static getPatchDisplayName(patch, fallbackName) {
    if (!patch || !patch.instruments) return fallbackName || "patch";
    // Jika hanya ada 1 instrumen dan namanya tidak kosong, gunakan nama instrumen
    if (patch.instruments.length === 1) {
      const instName = patch.instruments[0]?.name?.trim();
      if (instName) return instName.substring(0, 64);
    }
    // Jika multi-instrumen atau nama instrumen kosong, gunakan deskripsi atau fallback
    return (patch.header.description || fallbackName || "patch").substring(0, 64);
  }

  static handleFileOpen(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!state.projects.some(project => project.id === state.currentProjectId)) {
      e.target.value = "";
      requestProjectForImport();
      return;
    }
  
    // Gunakan FileReader untuk membaca ArrayBuffer
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const ab = reader.result;
        const type = detectFileType(ab);
        
        if (type === "zip") {
          await handleZipOpen(ab);
        } else if (type === "pat") {
          const patch = parsePAT(ab);
          const fallbackName = file.name.replace(/\.pat$/i, "");
          const entryName = getPatchDisplayName(patch, fallbackName);
  
          // Auto-fill nama instrumen jika kosong
          if (patch.instruments && patch.instruments.length > 0) {
            for (const inst of patch.instruments) {
              if (!inst.name || !inst.name.trim()) {
                inst.name = entryName.substring(0, 16);
              }
            }
          }
  
          const entry = {
            id: uid("pat"),
            name: entryName,
            source: "pat",
            gmProgram: -1,
            gmBank: 0,
            patch
          };
          if (await addPatchEntries([entry])) {
            const count = allSamples().length;
            showStatus(t("file_loading", { filename: file.name, samples: t(count === 1 ? "sample_count_one" : "sample_count_many", { count }) }), "ok");
          }
        } else if (type === "fxp") {
          showStatus(t("converting_fxp"));
          setTimeout(async () => {
            try {
              const entry = PatchDataService.surgeFxpToGusEntry(ab, file.name);
              if (await addPatchEntries([entry])) {
                showStatus(t("fxp_imported", { filename: file.name }), "ok");
              }
            } catch (err) {
              console.error("FXP conversion error:", err);
              showStatus(t("fxp_conversion_failed", { message: err.message }), "bad");
              showAlert("fxp_conversion_alert", { message: err.message });
            }
          }, 100);
        } else if (type === "sf2") {
          showStatus(t("converting_soundfont"));
          setTimeout(async () => {
            try {
              const sf2 = parseSF2(ab);
              const entries = await sf2ToGusPatches(sf2, file.name);
              if (entries.length === 0) {
                showStatus(t("soundfont_no_preset"), "bad");
                showAlert("sf2_no_samples_alert");
              } else {
                if (await addPatchEntries(entries)) {
                  const count = entries.length;
                  showStatus(t("soundfont_added_to_project", { filename: file.name, patches: t(count === 1 ? "patch_count_one" : "patch_count_many", { count }) }), "ok");
                }
              }
            } catch (err) {
              console.error(err);
              showStatus(t("soundfont_conversion_failed", { message: err.message }), "bad");
              showAlert("soundfont_conversion_alert", { message: err.message });
            }
          }, 100);
        } else {
          throw new Error(t("unknown_file_format"));
        }
        e.target.value = "";
      } catch (err) {
        console.error(err);
        showStatus(t("file_parse_failed", { message: err.message }), "bad");
        showAlert("file_load_alert", { message: err.message });
        e.target.value = "";
      }
    };
    reader.onerror = () => { showStatus(t("file_read_failed"), "bad"); e.target.value = ""; };
    reader.readAsArrayBuffer(file);
  }

  static async handleFileOpen(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    if (!state.projects.some(project => project.id === state.currentProjectId)) {
      e.target.value = "";
      requestProjectForImport();
      return;
    }
  
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const ab = reader.result;
        const type = detectFileType(ab);
  
        if (type === "zip") {
          await handleZipOpen(ab);
          
        } else if (type === "pat") {
          const patch = parsePAT(ab);
          const entry = {
            id: uid("pat"),
            name: (patch.header.description || file.name.replace(/\.pat$/i, "")).substring(0, 64),
            source: "pat",
            gmProgram: -1,
            gmBank: 0,
            patch
          };
          
          const added = await addPatchEntries([entry]);
          if (added) {
            const count = allSamples().length;
            showStatus(t("file_loading", {
              filename: file.name,
              samples: t(count === 1 ? "sample_count_one" : "sample_count_many", { count })
            }), "ok");
          }
          
        } else if (type === "fxp") {
          showStatus(t("converting_fxp"));
          await new Promise(resolve => setTimeout(resolve, 50));
          try {
            const entry = PatchDataService.surgeFxpToGusEntry(ab, file.name);
            if (await addPatchEntries([entry])) {
              showStatus(t("fxp_imported", { filename: file.name }), "ok");
            }
          } catch (err) {
            console.error("FXP conversion error:", err);
            showStatus(t("fxp_conversion_failed", { message: err.message }), "bad");
            showAlert("fxp_conversion_alert", { message: err.message });
          }

        } else if (type === "sf2") {
          // Menangani file SF2 (SoundFont)
          showStatus(t("converting_soundfont"));
          await new Promise(resolve => setTimeout(resolve, 50));
          try {
            const sf2 = parseSF2(ab);
            const entries = await sf2ToGusPatches(sf2, file.name);
            if (entries.length === 0) {
              showStatus(t("soundfont_no_preset"), "bad");
              showAlert("sf2_no_samples_alert");
            } else {
              const added = await addPatchEntries(entries);
              if (added) {
                const count = entries.length;
                showStatus(t("soundfont_added_to_project", {
                  filename: file.name,
                  patches: t(count === 1 ? "patch_count_one" : "patch_count_many", { count })
                }), "ok");
              }
            }
          } catch (err) {
            console.error("SoundFont conversion error:", err);
            showStatus(t("soundfont_conversion_failed", { message: err.message }), "bad");
            showAlert("soundfont_conversion_alert", { message: err.message });
          }
  
        } else if (type === "midijs") {
          // MIDI.js Soundfont (.js dengan base64 OGG/MP3)
          try {
            const text = new TextDecoder("utf-8").decode(ab);
            await handleMidiJsImport(text, file.name);
          } catch (err) {
            console.error("MIDI.js import error:", err);
            showStatus(t("midijs_failed", { message: err.message }), "bad");
            showAlert("midijs_alert", { message: err.message });
          }
  
        } else {
          throw new Error(t("unknown_file_format"));
        }
        
        e.target.value = ""; // Reset input
        
      } catch (err) {
        console.error("File Open Error:", err);
        showStatus(t("file_parse_failed", { message: err.message }), "bad");
        showAlert("file_load_alert", { message: err.message });
        e.target.value = "";
      }
    };
    
    reader.onerror = () => {
      showStatus(t("file_read_failed"), "bad");
      e.target.value = "";
    };
    
    reader.readAsArrayBuffer(file);
  }

  static midiJsNoteToNumber(name) {
    const m = String(name).match(/^([A-G])([#b]?)(-?\d+)$/);
    if (!m) return null;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
    let semi = base;
    if (m[2] === "#") semi += 1;
    else if (m[2] === "b") semi -= 1;
    const octave = parseInt(m[3], 10);
    const n = (octave + 1) * 12 + semi;
    return n >= 0 && n <= 127 ? n : null;
  }

  static midiJsSampleName(noteName) {
    return String(noteName).replace(/#/g, "s").replace(/b/g, "f").replace(/[^\w-]/g, "").slice(0, 7) || "SMP";
  }

  static findMatchingBrace(text, openBrace) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = openBrace; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (escaped) { escaped = false; continue; }
        if (ch === "\\") { escaped = true; continue; }
        if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  static parseMidiJsSoundfont(text) {
    const results = [];
    // Dot notation:  MIDI.Soundfont.acoustic_grand_piano = {
    // Bracket notation (jaga-jaga): MIDI.Soundfont["acoustic_grand_piano"] = {
    const assignRe = /MIDI\.Soundfont\s*(?:\.([A-Za-z0-9_]+)|\[\s*["']([^"']+)["']\s*\])\s*=\s*\{/g;
    let m;
    while ((m = assignRe.exec(text))) {
      const instrumentName = m[1] || m[2];
      const openBrace = m.index + m[0].length - 1;        // posisi '{'
      const closeBrace = findMatchingBrace(text, openBrace);
      if (closeBrace < 0) continue;
  
      const body = text.slice(openBrace + 1, closeBrace);
      const notes = {};
      const noteRe = /"([A-G][#b]?-?\d+)"\s*:\s*"data:audio\/[^;"]+;base64,([A-Za-z0-9+/=]+)"/g;
      let nm;
      while ((nm = noteRe.exec(body))) notes[nm[1]] = nm[2];
      if (Object.keys(notes).length > 0) results.push({ instrumentName, notes });
    }
    if (results.length === 0) throw new Error(t("midijs_invalid"));
    return results;
  }

  static createDecodeContext(targetRate = 22050) {
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (OfflineCtx) {
      try { return new OfflineCtx(1, 1, targetRate); } catch (_) {}
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error(t("web_audio_unsupported"));
    try { return new AC({ sampleRate: targetRate }); } catch (_) { return new AC(); }
  }

  static async decodeBase64AudioToMono16(base64, decodeCtx) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  
    const audioBuf = await decodeCtx.decodeAudioData(bytes.buffer);
    const ch = audioBuf.numberOfChannels;
    const n = audioBuf.length;
    const mono = new Float32Array(n);
    for (let c = 0; c < ch; c++) {
      const data = audioBuf.getChannelData(c);
      for (let i = 0; i < n; i++) mono[i] += data[i] / ch;
    }
    const pcm = new Uint8Array(n * 2);
    for (let i = 0; i < n; i++) {
      let v = Math.round(clamp(mono[i], -1, 1) * 32767);
      if (v < 0) v += 65536;
      pcm[i * 2] = v & 255;
      pcm[i * 2 + 1] = (v >> 8) & 255;
    }
    return { pcm, sampleRate: audioBuf.sampleRate, frames: n };
  }

  static async midiJsInstrumentToEntry(parsed, fileName, decodeCtx, onProgress) {
    const noteList = Object.entries(parsed.notes)
      .map(([name, b64]) => ({ name, note: midiJsNoteToNumber(name), b64 }))
      .filter(x => x.note !== null)
      .sort((a, b) => a.note - b.note);
  
    if (noteList.length === 0) throw new Error(t("midijs_no_notes"));
  
    const samples = [];
    for (let i = 0; i < noteList.length; i++) {
      const { name, note, b64 } = noteList[i];
      onProgress?.(i + 1, noteList.length, name);
      let decoded;
      try {
        decoded = await decodeBase64AudioToMono16(b64, decodeCtx);
      } catch (err) {
        console.warn(`[MIDI.js] Failed to decode note ${name}:`, err);
        continue;
      }
      // Beri napas ke UI setiap beberapa note
      if (i % 8 === 7) await new Promise(r => setTimeout(r, 0));
  
      const rootFreq = Math.round(midiToFreq(note) * 1000);
      samples.push({
        name: midiJsSampleName(name),
        fractions: 0,
        dataSize: decoded.pcm.length,
        loopStart: 0,
        loopEnd: 0,
        sampleRate: decoded.sampleRate,
        lowFreq: 0,
        highFreq: 0,
        rootFreq,
        tune: 0,
        balance: 7,
        envRates: [0, 0, 0, 0, 0, 0],
        envOffsets: [255, 255, 255, 0, 0, 0],
        tremoloSweep: 0, tremoloRate: 0, tremoloDepth: 0,
        vibratoSweep: 0, vibratoRate: 0, vibratoDepth: 0,
        modes: M16,                       // 16-bit signed, tanpa loop, tanpa envelope
        scaleFreq: 60,
        scaleFactor: 1024,
        reserved: new Uint8Array(36),
        pcm: decoded.pcm,
        _float: null,
        _midiNote: note
      });
    }
  
    if (samples.length === 0) throw new Error(t("midijs_no_notes"));
  
    // Rentang frekuensi: batas antar-note = rata-rata geometrik root frequency tetangga
    for (let i = 0; i < samples.length; i++) {
      const f = samples[i].rootFreq;
      const prev = i > 0 ? samples[i - 1].rootFreq : null;
      const next = i < samples.length - 1 ? samples[i + 1].rootFreq : null;
      samples[i].lowFreq = prev ? Math.floor(Math.sqrt(prev * f)) : Math.max(1, Math.floor(f / 2));
      samples[i].highFreq = next ? Math.ceil(Math.sqrt(f * next)) : Math.min(20000000, Math.ceil(f * 2));
    }
  
    const instrumentName = parsed.instrumentName;
    const totalBytes = samples.reduce((s, x) => s + x.pcm.length, 0);
  
    const patch = {
      header: {
        magic: MAGIC, gravisId: GRAVIS_ID,
        description: `MIDI.js ${instrumentName}`.substring(0, 60),
        voices: 14, channels: 0, waveForms: samples.length,
        masterVolume: 127, dataSize: totalBytes,
        reserved: new Uint8Array(36)
      },
      instruments: [{
        instrument: 0,
        name: instrumentName.substring(0, 16),
        size: 0,
        reserved: new Uint8Array(40),
        layers: [{
          duplicate: 0, layer: 0, layerSize: 0,
          reserved: new Uint8Array(40),
          samples
        }]
      }]
    };
  
    return {
      id: uid("midijs"),
      name: instrumentName.substring(0, 48),
      source: "midijs:" + fileName,
      gmProgram: -1,
      gmBank: 0,
      patch
    };
  }

  static async handleMidiJsImport(text, fileName) {
    if (!state.projects.some(p => p.id === state.currentProjectId)) {
      requestProjectForImport();
      return;
    }
  
    const parsedList = parseMidiJsSoundfont(text);
    const decodeCtx = createDecodeContext(22050);
    const entries = [];
  
    try {
      for (const parsed of parsedList) {
        const entry = await midiJsInstrumentToEntry(parsed, fileName, decodeCtx, (cur, total, note) => {
          showStatus(t("midijs_converting", { current: cur, total, note }));
        });
        entries.push(entry);
      }
    } finally {
      if (typeof decodeCtx.close === "function") {
        try { decodeCtx.close(); } catch (_) {}
      }
    }
  
    if (entries.length === 0) throw new Error(t("midijs_no_notes"));
  
    const added = await addPatchEntries(entries);
    if (added) {
      const first = entries[0];
      const sampleCount = first.patch.instruments[0].layers[0].samples.length;
      showStatus(t("midijs_done", { name: first.name, count: sampleCount }), "ok");
    }
  }
}
