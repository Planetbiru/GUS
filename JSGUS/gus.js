// =================================================================
// 1. ENGINE
// =================================================================
const TAU = Math.PI * 2;
const sin = p => Math.sin(TAU * p);

function partials(phase, amps) {
  let s = 0;
  for (let k = 0; k < amps.length; k++) s += amps[k] * sin(phase * (k + 1));
  return s;
}

function renderPreset(p, override = {}) {
  const SR = override.sampleRate || p.sampleRate || 22050;
  const isLoop = p.loop && !override.forceNoLoop;

  let length, baseFreq, loopStart = 0, loopEnd = 0, cs = 50;
  if (isLoop) {
    cs = p.cycleSamples || 50;
    const cycles = p.cycles || 12;
    length = cs * cycles;
    baseFreq = override.freq || SR / cs;
    loopStart = (p.loopSkip || 3) * cs;
    loopEnd = length;
  } else {
    length = p.length || Math.round(SR * (override.duration || 0.25));
    baseFreq = override.freq || p.freq || 441;
  }

  const env = p.env || { a: 0.005, d: 0.5, s: 0, r: 0.3 };
  const noiseAmt = p.noise || 0;
  const fm = p.fm || null;
  const harm = p.harm || [1];

  // ============================================================
  // FIX: untuk sample LOOP, semua modulasi waktu-absolut harus
  //      dimatikan karena phase-nya tidak akan match di titik loop:
  //      - vibrato  → pitch sweep antar iterasi loop
  //      - detune   → beda phase antar voice di titik loop
  //      Keduanya diserahkan ke synth GUS saat playback.
  // ============================================================
  const vib = isLoop ? null : (p.vibrato || null);
  const detunes = isLoop ? [0] : (p.detune || [0]);

  const voices = detunes.map(c => ({ phase: 0, ratio: Math.pow(2, c / 1200) }));
  const out = new Float32Array(length);

  // Noise periodik untuk loop (dari fix sebelumnya)
  let noiseBuf = null;
  if (isLoop && noiseAmt > 0) {
    noiseBuf = new Float32Array(cs);
    for (let i = 0; i < cs; i++) noiseBuf[i] = Math.random() * 2 - 1;
    for (let pass = 0; pass < 2; pass++) {
      const tmp = new Float32Array(cs);
      for (let i = 0; i < cs; i++) {
        tmp[i] = (noiseBuf[(i - 1 + cs) % cs] + 2*noiseBuf[i] + noiseBuf[(i + 1) % cs]) / 4;
      }
      noiseBuf = tmp;
    }
    let np = 0;
    for (let i = 0; i < cs; i++) np = Math.max(np, Math.abs(noiseBuf[i]));
    if (np > 0) for (let i = 0; i < cs; i++) noiseBuf[i] /= np;
  }

  const fadeSamples = isLoop ? cs : 0;

  for (let i = 0; i < length; i++) {
    const t = i / SR;
    const vDepth = vib ? vib.depth * sin(vib.rate * t) : 0;
    let sample = 0;

    for (const v of voices) {
      const f = baseFreq * v.ratio * (1 + vDepth);
      if (fm) {
        const mod = sin(f * fm.ratio * t) * fm.index;
        sample += sin(f * t + mod);
      } else {
        v.phase += f / SR;
        sample += partials(v.phase, harm);
      }
    }
    sample /= voices.length;

    if (noiseAmt > 0) {
      const n = noiseBuf ? noiseBuf[i % cs] : (Math.random() * 2 - 1);
      sample = sample * (1 - noiseAmt) + n * noiseAmt;
    }

    let e;
    if (isLoop) {
      e = i < fadeSamples ? (i / fadeSamples) : 1.0;
    } else {
      if (t < env.a) e = t / env.a;
      else if (t < env.a + env.d) e = 1 - (1 - env.s) * ((t - env.a) / env.d);
      else e = env.s;

      if (env.r > 0) {
        const relStart = length / SR - env.r;
        if (t > relStart) e *= Math.max(0, 1 - (t - relStart) / env.r);
      }
    }
    out[i] = sample * e;
  }

  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < length; i++) out[i] = (out[i] / peak) * 0.9;

  return { pcm: out, length, loopStart, loopEnd, loop: isLoop, SR };
}

// =================================================================
// DRUM SYNTHESIS ENGINE
// =================================================================
function renderDrum(p, SR = 22050) {
  const length = Math.round(SR * (p.duration || 0.5));
  const out = new Float32Array(length);

  // Phase accumulator per tonal voice (pitch envelope butuh ini)
  const tones = (p.tones || []).map(t => ({ ...t, phase: 0, modPhase: 0 }));

  for (let i = 0; i < length; i++) {
    const t = i / SR;
    let sample = 0;

    // --- Komponen tonal dengan pitch envelope ---
    for (const tn of tones) {
      const f = tn.fEnd + (tn.fStart - tn.fEnd) * Math.exp(-t / (tn.pitchDecay || 0.02));
      tn.phase += f / SR;
      if (tn.phase >= 1) tn.phase -= Math.floor(tn.phase);

      let val;
      if (tn.fm) {
        const mf = f * tn.fm.ratio;
        tn.modPhase += mf / SR;
        if (tn.modPhase >= 1) tn.modPhase -= Math.floor(tn.modPhase);
        const mod = Math.sin(2 * Math.PI * tn.modPhase) * tn.fm.index;
        val = Math.sin(2 * Math.PI * tn.phase + mod);
      } else {
        val = Math.sin(2 * Math.PI * tn.phase);
      }
      sample += val * (tn.amp || 1) * Math.exp(-t / (tn.decay || 0.3));
    }

    // --- Komponen noise ---
    if (p.noise && p.noise.amp > 0) {
      const n = Math.random() * 2 - 1;
      sample += n * p.noise.amp * Math.exp(-t / (p.noise.decay || 0.1));
    }

    // --- Click transient (attack) ---
    if (p.click && t < p.click.duration) {
      sample += (Math.random() * 2 - 1) * p.click.amp * (1 - t / p.click.duration);
    }

    // --- Burst pattern untuk hand-clap ---
    if (p.bursts) {
      let burst = 0;
      for (const bt of p.bursts) {
        if (t >= bt && t < bt + 0.012) burst = Math.max(burst, 1 - (t - bt) / 0.012);
      }
      if (burst > 0) sample = sample * 0.2 + (Math.random() * 2 - 1) * burst * 0.95;
    }

    out[i] = sample;
  }

  // --- Filter high-pass (1-pole RC) ---
  if (p.highpass) {
    const rc = 1 / (2 * Math.PI * p.highpass);
    const dt = 1 / SR;
    const a = rc / (rc + dt);
    let pi = 0, po = 0;
    for (let i = 0; i < length; i++) {
      const x = out[i];
      const y = a * (po + x - pi);
      pi = x; po = y;
      out[i] = y;
    }
  }
  // --- Filter low-pass (1-pole RC) ---
  if (p.lowpass) {
    const rc = 1 / (2 * Math.PI * p.lowpass);
    const dt = 1 / SR;
    const a = dt / (rc + dt);
    let prev = 0;
    for (let i = 0; i < length; i++) {
      prev += a * (out[i] - prev);
      out[i] = prev;
    }
  }

  // --- Fade-out di ekor (hindari klik saat note off) ---
  const fadeLen = Math.min(96, Math.floor(length * 0.05));
  for (let i = 0; i < fadeLen; i++) out[length - 1 - i] *= i / fadeLen;

  // --- Normalisasi ---
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < length; i++) out[i] = (out[i] / peak) * 0.9;

  return { pcm: out, length, loop: false, loopStart: 0, loopEnd: 0, SR };
}

// =================================================================
// DRUM FACTORY — preset per jenis drum
// =================================================================
const drumKit = {
  kick: (o = {}) => ({
    duration: o.duration || 0.5,
    tones: [{ fStart: o.fStart || 110, fEnd: o.fEnd || 45,
             pitchDecay: o.pitchDecay || 0.04, decay: o.toneDecay || 0.3, amp: 1.0 }],
    click: { duration: 0.004, amp: 0.4 },
    lowpass: o.lowpass || 1500,
  }),
  snare: (o = {}) => ({
    duration: o.duration || 0.25,
    tones: [{ fStart: o.fStart || 200, fEnd: o.fEnd || 160,
             pitchDecay: 0.015, decay: o.toneDecay || 0.08, amp: 0.5 }],
    noise: { amp: 0.9, decay: o.noiseDecay || 0.12 },
    highpass: o.highpass || 400,
  }),
  hihat: (o = {}) => ({
    duration: o.duration || 0.08,
    noise: { amp: 1.0, decay: o.decay || 0.02 },
    highpass: o.highpass || 7000,
  }),
  tom: (freq, o = {}) => ({
    duration: o.duration || 0.5,
    tones: [{ fStart: freq * 1.3, fEnd: freq,
             pitchDecay: 0.06, decay: o.decay || 0.4, amp: 1.0 }],
    noise: o.noise ? { amp: o.noise, decay: 0.02 } : null,
    lowpass: freq * 8,
  }),
  cymbal: (o = {}) => ({
    duration: o.duration || 1.2,
    tones: [
      { fStart: 3200, fEnd: 2800, pitchDecay: 0.1, decay: 0.7, amp: 0.3,
        fm: { ratio: 1.41, index: 3 } },
      { fStart: 4500, fEnd: 4000, pitchDecay: 0.1, decay: 0.9, amp: 0.25,
        fm: { ratio: 1.73, index: 4 } },
    ],
    noise: { amp: 0.9, decay: o.noiseDecay || 0.6 },
    highpass: o.highpass || 3000,
  }),
  ride: (o = {}) => ({
    duration: o.duration || 1.0,
    tones: [
      { fStart: 520, fEnd: 500, pitchDecay: 0.1, decay: 0.4, amp: 0.5,
        fm: { ratio: 1.41, index: 5 } },
      { fStart: 820, fEnd: 800, pitchDecay: 0.1, decay: 0.5, amp: 0.4,
        fm: { ratio: 1.62, index: 4 } },
    ],
    noise: { amp: 0.4, decay: 0.4 },
    highpass: 2500,
  }),
  bell: (freq, o = {}) => ({
    duration: o.duration || 0.6,
    tones: [
      { fStart: freq, fEnd: freq, pitchDecay: 1, decay: o.decay || 0.4, amp: 0.6 },
      { fStart: freq * 2.76, fEnd: freq * 2.76, pitchDecay: 1, decay: o.decay || 0.3, amp: 0.25 },
    ],
    highpass: freq * 0.5,
  }),
  clap: () => ({
    duration: 0.28,
    noise: { amp: 0.8, decay: 0.1 },
    highpass: 900,
    bursts: [0, 0.009, 0.019, 0.03],
  }),
  sideStick: () => ({
    duration: 0.12,
    tones: [
      { fStart: 1400, fEnd: 900, pitchDecay: 0.004, decay: 0.035, amp: 0.6 },
      { fStart: 2600, fEnd: 1700, pitchDecay: 0.004, decay: 0.025, amp: 0.4 },
    ],
    noise: { amp: 0.3, decay: 0.02 },
    highpass: 1000,
  }),
  cowbell: () => ({
    duration: 0.45,
    tones: [
      { fStart: 800, fEnd: 800, pitchDecay: 1, decay: 0.35, amp: 0.55 },
      { fStart: 540, fEnd: 540, pitchDecay: 1, decay: 0.35, amp: 0.5 },
    ],
    highpass: 400,
  }),
  woodblock: (freq) => ({
    duration: 0.12,
    tones: [
      { fStart: freq, fEnd: freq * 0.9, pitchDecay: 0.01, decay: 0.05, amp: 1.0 },
    ],
    noise: { amp: 0.15, decay: 0.005 },
    highpass: 300,
  }),
  agogo: (freq) => ({
    duration: 0.5,
    tones: [
      { fStart: freq, fEnd: freq, pitchDecay: 1, decay: 0.3, amp: 0.6 },
      { fStart: freq * 1.9, fEnd: freq * 1.9, pitchDecay: 1, decay: 0.2, amp: 0.3 },
    ],
    highpass: 500,
  }),
  bongo: (freq) => ({
    duration: 0.25,
    tones: [{ fStart: freq * 1.2, fEnd: freq, pitchDecay: 0.03, decay: 0.15, amp: 1.0 }],
    noise: { amp: 0.1, decay: 0.01 },
    highpass: 200,
  }),
  conga: (freq) => ({
    duration: 0.4,
    tones: [{ fStart: freq * 1.15, fEnd: freq, pitchDecay: 0.05, decay: 0.25, amp: 1.0 }],
    noise: { amp: 0.08, decay: 0.01 },
    lowpass: freq * 6,
  }),
  cabasa: () => ({
    duration: 0.15,
    noise: { amp: 1.0, decay: 0.06 },
    highpass: 6000,
  }),
  maracas: () => ({
    duration: 0.12,
    noise: { amp: 1.0, decay: 0.04 },
    highpass: 7000,
  }),
  tambourine: () => ({
    duration: 0.25,
    noise: { amp: 1.0, decay: 0.12 },
    highpass: 5500,
  }),
  whistle: (o = {}) => ({
    duration: o.duration || 0.3,
    tones: [{ fStart: 2200, fEnd: 2200, pitchDecay: 1, decay: o.duration || 0.3, amp: 1.0 }],
    highpass: 1500,
  }),
  guiro: (o = {}) => ({
    duration: o.duration || 0.3,
    noise: { amp: 1.0, decay: o.duration || 0.3 },
    highpass: 2500,
  }),
  triangle: (o = {}) => ({
    duration: o.duration || 0.5,
    tones: [
      { fStart: 5200, fEnd: 5200, pitchDecay: 1, decay: o.duration || 0.5, amp: 0.6 },
      { fStart: 8900, fEnd: 8900, pitchDecay: 1, decay: (o.duration || 0.5) * 0.7, amp: 0.3 },
    ],
    highpass: 3000,
  }),
  vibraslap: () => ({
    duration: 0.5,
    tones: [
      { fStart: 400, fEnd: 400, pitchDecay: 1, decay: 0.4, amp: 0.5,
        fm: { ratio: 3.7, index: 2 } },
    ],
    noise: { amp: 0.4, decay: 0.3 },
    highpass: 800,
  }),
  cuica: (o = {}) => ({
    duration: o.duration || 0.25,
    tones: [
      { fStart: 400, fEnd: 700, pitchDecay: 0.15, decay: o.duration || 0.25, amp: 1.0,
        fm: { ratio: 2.3, index: 1 } },
    ],
    highpass: 300,
  }),
  clave: () => ({
    duration: 0.12,
    tones: [
      { fStart: 2400, fEnd: 2000, pitchDecay: 0.005, decay: 0.05, amp: 0.8 },
      { fStart: 3600, fEnd: 3200, pitchDecay: 0.005, decay: 0.04, amp: 0.5 },
    ],
    highpass: 1500,
  }),
};

// =================================================================
// 2. FAMILY
// =================================================================
const F = {
  piano:    { harm:[1,.55,.35,.22,.14,.09,.05,.03], env:{a:.003,d:.9,s:.15,r:.4}, length:5512, freq:441 },
  epiano:   { harm:[1,.2,.08,.03], fm:{ratio:3,index:1.8}, env:{a:.005,d:1.2,s:.1,r:.5}, length:6615, freq:441 },
  bell:     { harm:[1,.5,.25,.12,.06], env:{a:.001,d:1.5,s:0,r:.6}, length:6615, freq:441 },
  organ:    { harm:[1,0,.5,0,.3,0,.2,0,.1], env:{a:.02,d:.1,s:1,r:.1}, loop:1, cycles:12 },
  guitar:   { harm:[1,.7,.5,.35,.2,.12,.08,.05,.03], env:{a:.002,d:.8,s:.1,r:.3}, length:5512, freq:441 },
  bass:     { harm:[1,.7,.5,.3,.2,.1,.05], env:{a:.005,d:.5,s:.2,r:.3}, length:5512, freq:220 },
  strings:  { harm:[1,.5,.33,.25,.2,.16,.14,.12], env:{a:.15,d:.2,s:.9,r:.3}, loop:1, cycles:14, vibrato:{rate:5,depth:.005}, detune:[0,8] },
  ensemble: { harm:[1,.5,.33,.25,.2,.16,.14], env:{a:.2,d:.2,s:.95,r:.3}, loop:1, cycles:14, vibrato:{rate:4.5,depth:.004}, detune:[-12,0,12] },
  brass:    { harm:[1,.7,.5,.4,.3,.22,.18,.14,.1], env:{a:.06,d:.1,s:.9,r:.2}, loop:1, cycles:14, vibrato:{rate:5,depth:.003} },
  reed:     { harm:[1,.3,.7,.2,.4,.15,.2,.1], env:{a:.05,d:.1,s:.9,r:.2}, loop:1, cycles:14, vibrato:{rate:5.5,depth:.006} },
  pipe:     { harm:[1,.15,.4,.05,.15,.03,.08], env:{a:.08,d:.1,s:.9,r:.2}, loop:1, cycles:14, vibrato:{rate:5,depth:.008}, noise:.05 },
  lead:     { harm:[1,.5,.33,.25,.2,.16,.14,.12,.1], env:{a:.01,d:.2,s:.85,r:.15}, loop:1, cycles:12 },
  pad:      { harm:[1,.4,.2,.1,.05], env:{a:.3,d:.3,s:.95,r:.5}, loop:1, cycles:16, detune:[-15,0,15], vibrato:{rate:2,depth:.003} },
  fx:       { harm:[1,.5,.33,.25,.2], fm:{ratio:1.5,index:3}, env:{a:.05,d:.5,s:.5,r:.4}, length:8820, noise:.2 },
  ethnic:   { harm:[1,.6,.4,.25,.15,.1,.05], env:{a:.005,d:.7,s:.2,r:.35}, length:5512, freq:441, vibrato:{rate:5,depth:.01} },
  perc:     { harm:[1,.4,.2,.1], env:{a:.001,d:.3,s:0,r:.15}, length:3307, freq:441, noise:.3 },
};
const preset = (fam, over = {}) => ({ ...F[fam], ...over });

// =================================================================
// 3. GM 128 PROGRAM (dengan label family)
// =================================================================
const GM = [
  // 0-7 Piano
  ['Piano','Acoustic Grand', preset('piano')],
  ['Piano','Bright Piano',   preset('piano',{harm:[1,.8,.6,.4,.25,.15,.09,.05]})],
  ['Piano','Electric Grand', preset('epiano')],
  ['Piano','Honky-tonk',     preset('piano',{harm:[1,.7,.5,.4,.3,.2,.12,.08,.05],detune:[0,-10]})],
  ['Piano','E.Piano 1',      preset('epiano')],
  ['Piano','E.Piano 2',      preset('epiano',{fm:{ratio:2,index:2.5}})],
  ['Piano','Harpsichord',    preset('piano',{harm:[1,.5,.7,.3,.4,.2,.25,.1],env:{a:.001,d:.5,s:.05,r:.2}})],
  ['Piano','Clavinet',       preset('piano',{harm:[1,.4,.6,.3,.4,.2],env:{a:.002,d:.4,s:.1,r:.2}})],

  // 8-15 Chromatic Perc
  ['Chromatic','Celesta',       preset('bell',{harm:[1,0,.5,0,.25,0,.12]})],
  ['Chromatic','Glockenspiel',  preset('bell',{harm:[1,0,.3,0,.1,0,.03]})],
  ['Chromatic','Music Box',     preset('bell',{harm:[1,.3,.1,.03]})],
  ['Chromatic','Vibraphone',    preset('bell',{vibrato:{rate:5,depth:.02},env:{a:.01,d:1.2,s:.1,r:.5}})],
  ['Chromatic','Marimba',       preset('bell',{harm:[1,.4,.15,.05],env:{a:.001,d:.5,s:0,r:.2}})],
  ['Chromatic','Xylophone',     preset('bell',{harm:[1,.2,.05],env:{a:.001,d:.3,s:0,r:.1}})],
  ['Chromatic','Tubular Bells', preset('bell',{harm:[1,.5,.25,.15,.08,.04],env:{a:.005,d:2,s:0,r:.8}})],
  ['Chromatic','Dulcimer',      preset('piano',{harm:[1,.5,.3,.2,.12,.08],env:{a:.002,d:.9,s:.05,r:.3}})],

  // 16-23 Organ
  ['Organ','Drawbar Organ',    preset('organ')],
  ['Organ','Percussive Organ', preset('organ',{harm:[1,0,.7,0,.5,0,.3,0,.2,0,.1]})],
  ['Organ','Rock Organ',       preset('organ',{harm:[1,0,.5,0,.4,0,.3,0,.25,0,.2]})],
  ['Organ','Church Organ',     preset('organ',{harm:[1,.7,.5,.35,.25,.2,.15,.12,.1]})],
  ['Organ','Reed Organ',       preset('reed')],
  ['Organ','Accordion',        preset('reed',{harm:[1,.5,.3,.2,.15,.1,.08]})],
  ['Organ','Harmonica',        preset('reed',{harm:[1,.4,.6,.3,.4,.2,.15]})],
  ['Organ','Tango Accordion',  preset('reed')],

  // 24-31 Guitar
  ['Guitar','Nylon Guitar',   preset('guitar')],
  ['Guitar','Steel Guitar',   preset('guitar',{harm:[1,.8,.6,.45,.3,.2,.12,.08]})],
  ['Guitar','Jazz Guitar',    preset('guitar',{harm:[1,.5,.3,.2,.1]})],
  ['Guitar','Clean Guitar',   preset('guitar',{harm:[1,.6,.4,.25,.15,.08]})],
  ['Guitar','Muted Guitar',   preset('guitar',{env:{a:.001,d:.2,s:.05,r:.1}})],
  ['Guitar','Overdriven Gtr', preset('guitar',{harm:[1,.7,.5,.4,.3,.25,.2,.15],env:{a:.005,d:1,s:.3,r:.3}})],
  ['Guitar','Distortion Gtr', preset('guitar',{harm:[1,.8,.6,.5,.4,.35,.3,.25,.2,.15],env:{a:.005,d:1.2,s:.4,r:.3}})],
  ['Guitar','Gtr Harmonics',  preset('guitar',{harm:[1,0,0,0,.3,0,0,0,.1]})],

  // 32-39 Bass
  ['Bass','Acoustic Bass',  preset('bass')],
  ['Bass','Finger Bass',    preset('bass')],
  ['Bass','Pick Bass',      preset('bass',{length:4410,harm:[1,.6,.4,.3,.2,.15,.1]})],
  ['Bass','Fretless Bass',  preset('bass',{vibrato:{rate:5,depth:.01}})],
  ['Bass','Slap Bass 1',    preset('bass',{length:3307,noise:.15,env:{a:.001,d:.3,s:0,r:.1}})],
  ['Bass','Slap Bass 2',    preset('bass',{length:3307,noise:.2,env:{a:.001,d:.25,s:0,r:.1}})],
  ['Bass','Synth Bass 1',   preset('bass',{length:4410,harm:[1,.7,.5,.4,.3,.2]})],
  ['Bass','Synth Bass 2',   preset('bass',{length:4410,detune:[-5,5],harm:[1,.5,.3,.2]})],

  // 40-47 Strings
  ['Strings','Violin',     preset('strings',{vibrato:{rate:6,depth:.008},detune:[0]})],
  ['Strings','Viola',      preset('strings',{vibrato:{rate:6,depth:.007},harm:[1,.4,.25,.15,.1,.07,.05]})],
  ['Strings','Cello',      preset('strings',{vibrato:{rate:5.5,depth:.006},harm:[1,.5,.3,.2,.14,.1,.07,.05]})],
  ['Strings','Contrabass', preset('strings',{vibrato:{rate:5,depth:.005},freq:220,harm:[1,.6,.4,.3,.2,.15]})],
  ['Strings','Tremolo Str',preset('strings',{vibrato:{rate:12,depth:.02}})],
  ['Strings','Pizzicato',  preset('guitar',{env:{a:.001,d:.3,s:0,r:.1},length:4410,detune:[-8,8]})],
  ['Strings','Harp',       preset('guitar',{env:{a:.002,d:1.5,s:.05,r:.6}})],
  ['Strings','Timpani',    preset('perc',{harm:[1,.7,.4,.2],env:{a:.002,d:.7,s:0,r:.3},length:6615,noise:.1})],

  // 48-55 Ensemble
  ['Ensemble','Strings 1',       preset('ensemble')],
  ['Ensemble','Strings 2',       preset('ensemble',{detune:[-18,0,18]})],
  ['Ensemble','SynthStrings 1',  preset('pad',{harm:[1,.5,.3,.2,.1,.05],detune:[-10,10]})],
  ['Ensemble','SynthStrings 2',  preset('pad',{harm:[1,.6,.4,.3,.2,.15,.1],detune:[-15,0,15]})],
  ['Ensemble','Choir Aahs',      preset('pad',{harm:[1,.3,.15,.08,.04],vibrato:{rate:5,depth:.01},detune:[-10,0,10]})],
  ['Ensemble','Voice Oohs',      preset('pad',{harm:[1,.2,.1,.05],vibrato:{rate:5.5,depth:.012},detune:[-8,0,8]})],
  ['Ensemble','Synth Voice',     preset('pad',{harm:[1,.4,.2,.1,.05],fm:{ratio:2,index:.5}})],
  ['Ensemble','Orchestra Hit',   preset('brass',{env:{a:.001,d:.4,s:0,r:.2},length:4410,loop:false,harm:[1,.7,.5,.4,.3,.25,.2,.15]})],

  // 56-63 Brass
  ['Brass','Trumpet',       preset('brass',{vibrato:{rate:5.5,depth:.005}})],
  ['Brass','Trombone',      preset('brass',{vibrato:{rate:5,depth:.004},harm:[1,.8,.6,.45,.35,.25,.2,.15]})],
  ['Brass','Tuba',          preset('brass',{freq:220,vibrato:{rate:4.5,depth:.003},harm:[1,.7,.5,.35,.25,.18]})],
  ['Brass','Muted Trpt',    preset('brass',{harm:[1,.5,.7,.3,.4,.25,.3,.15],vibrato:{rate:6,depth:.008}})],
  ['Brass','French Horn',   preset('brass',{vibrato:{rate:5,depth:.004},harm:[1,.6,.4,.3,.2,.15,.1]})],
  ['Brass','Brass Section', preset('brass',{detune:[-8,8]})],
  ['Brass','SynthBrass 1',  preset('brass',{harm:[1,.9,.7,.5,.4,.3,.25,.2,.15,.1]})],
  ['Brass','SynthBrass 2',  preset('brass',{harm:[1,.7,.5,.4,.3,.25,.2,.15],detune:[-12,12]})],

  // 64-71 Reed
  ['Reed','Soprano Sax',  preset('reed',{vibrato:{rate:5.5,depth:.008}})],
  ['Reed','Alto Sax',     preset('reed',{vibrato:{rate:5,depth:.008}})],
  ['Reed','Tenor Sax',    preset('reed',{vibrato:{rate:4.5,depth:.007},harm:[1,.4,.6,.3,.4,.2,.3,.15]})],
  ['Reed','Bari Sax',     preset('reed',{vibrato:{rate:4,depth:.006},freq:300})],
  ['Reed','Oboe',         preset('reed',{harm:[1,.2,.8,.1,.6,.05,.4,.03],vibrato:{rate:5.5,depth:.007}})],
  ['Reed','English Horn', preset('reed',{vibrato:{rate:5,depth:.006},harm:[1,.3,.6,.2,.4,.1,.3]})],
  ['Reed','Bassoon',      preset('reed',{freq:220,vibrato:{rate:4,depth:.004},harm:[1,.5,.4,.3,.25,.2,.15]})],
  ['Reed','Clarinet',     preset('pipe',{harm:[1,0,.5,0,.3,0,.15,0,.08],vibrato:{rate:5,depth:.005}})],

  // 72-79 Pipe
  ['Pipe','Piccolo',       preset('pipe',{freq:880,vibrato:{rate:6,depth:.01}})],
  ['Pipe','Flute',         preset('pipe',{freq:880,vibrato:{rate:5.5,depth:.008}})],
  ['Pipe','Recorder',      preset('pipe',{freq:880,harm:[1,.2,.4,.1,.2,.05],vibrato:{rate:5,depth:.006}})],
  ['Pipe','Pan Flute',     preset('pipe',{freq:880,vibrato:{rate:6,depth:.015},noise:.08})],
  ['Pipe','Blown Bottle',  preset('pipe',{noise:.15,harm:[1,.1,.05,.02]})],
  ['Pipe','Shakuhachi',    preset('pipe',{freq:660,noise:.1,vibrato:{rate:5,depth:.02}})],
  ['Pipe','Whistle',       preset('pipe',{freq:880,harm:[1,.05,.02]})],
  ['Pipe','Ocarina',       preset('pipe',{harm:[1,.15,.08,.03]})],

  // 80-87 Synth Lead
  ['Lead','Lead (square)',   preset('lead',{harm:[1,0,.33,0,.2,0,.14,0,.11,0,.09]})],
  ['Lead','Lead (saw)',      preset('lead')],
  ['Lead','Lead (calliope)', preset('lead',{harm:[1,.5,.33,.25,.2,.16,.14,.12,.1,.09,.08]})],
  ['Lead','Lead (chiff)',    preset('lead',{noise:.1,env:{a:.02,d:.1,s:.9,r:.15}})],
  ['Lead','Lead (charang)',  preset('lead',{harm:[1,.8,.6,.5,.4,.35,.3,.25]})],
  ['Lead','Lead (voice)',    preset('lead',{vibrato:{rate:6,depth:.015},harm:[1,.3,.15,.08]})],
  ['Lead','Lead (fifths)',   preset('lead',{harm:[1,0,.6,0,.4,0,.25]})],
  ['Lead','Lead (bass+ld)',  preset('lead',{harm:[1,1,.5,.5,.33,.33,.25,.25]})],

  // 88-95 Pad
  ['Pad','Pad (new age)',   preset('pad')],
  ['Pad','Pad (warm)',      preset('pad',{harm:[1,.3,.15,.08,.04]})],
  ['Pad','Pad (polysynth)', preset('pad',{harm:[1,.5,.33,.25,.2,.16],detune:[-8,0,8]})],
  ['Pad','Pad (choir)',     preset('pad',{vibrato:{rate:5,depth:.015}})],
  ['Pad','Pad (bowed)',     preset('pad',{harm:[1,.4,.2,.1,.05]})],
  ['Pad','Pad (metallic)',  preset('pad',{fm:{ratio:2.5,index:1}})],
  ['Pad','Pad (halo)',      preset('pad',{harm:[1,.2,.4,.1,.2,.05]})],
  ['Pad','Pad (sweep)',     preset('pad',{noise:.05,fm:{ratio:1,index:2}})],

  // 96-103 FX
  ['FX','FX (rain)',        preset('fx',{noise:.3})],
  ['FX','FX (soundtrack)',  preset('fx')],
  ['FX','FX (crystal)',     preset('fx',{fm:{ratio:3,index:3}})],
  ['FX','FX (atmosphere)',  preset('fx',{noise:.4})],
  ['FX','FX (brightness)',  preset('fx',{fm:{ratio:4,index:2}})],
  ['FX','FX (goblins)',     preset('fx',{fm:{ratio:.5,index:4}})],
  ['FX','FX (echoes)',      preset('fx',{fm:{ratio:2.1,index:2.5}})],
  ['FX','FX (sci-fi)',      preset('fx',{fm:{ratio:1.7,index:3.5}})],

  // 104-111 Ethnic
  ['Ethnic','Sitar',    preset('ethnic',{harm:[1,.5,.3,.7,.3,.4,.2,.25,.1]})],
  ['Ethnic','Banjo',    preset('guitar',{harm:[1,.6,.4,.25,.15,.1,.06],env:{a:.001,d:.4,s:.05,r:.2}})],
  ['Ethnic','Shamisen', preset('ethnic',{env:{a:.001,d:.4,s:0,r:.15}})],
  ['Ethnic','Koto',     preset('ethnic',{env:{a:.002,d:.6,s:.1,r:.3}})],
  ['Ethnic','Kalimba',  preset('bell',{harm:[1,.3,.1],env:{a:.001,d:.4,s:0,r:.15}})],
  ['Ethnic','Bagpipe',  preset('pipe',{harm:[1,.5,.8,.3,.4,.2,.2],vibrato:{rate:6,depth:.02},noise:.05})],
  ['Ethnic','Fiddle',   preset('strings',{vibrato:{rate:6.5,depth:.01},detune:[0]})],
  ['Ethnic','Shanai',   preset('reed',{vibrato:{rate:7,depth:.02},harm:[1,.4,.7,.3,.5,.2,.3]})],

  // 112-119 Percussive
  ['Perc','Tinkle Bell',    preset('bell',{harm:[1,.2,.1,.05],env:{a:.001,d:.6,s:0,r:.2}})],
  ['Perc','Agogo',          preset('bell',{harm:[1,.5,.25],env:{a:.001,d:.5,s:0,r:.2}})],
  ['Perc','Steel Drums',    preset('bell',{harm:[1,.4,.2,.15,.08,.04],env:{a:.001,d:.9,s:0,r:.3}})],
  ['Perc','Woodblock',      preset('perc',{harm:[1,.3,.15],env:{a:.001,d:.1,s:0,r:.05},length:2205,noise:.2})],
  ['Perc','Taiko Drum',     preset('perc',{harm:[1,.6,.3,.15],freq:220,env:{a:.001,d:.5,s:0,r:.2},length:4410,noise:.1})],
  ['Perc','Melodic Tom',    preset('perc',{freq:330,env:{a:.001,d:.3,s:0,r:.1},length:3307})],
  ['Perc','Synth Drum',     preset('perc',{freq:220,env:{a:.001,d:.3,s:0,r:.1},noise:.15,length:3307})],
  ['Perc','Reverse Cymbal', preset('fx',{noise:.6,env:{a:.5,d:0,s:1,r:.1},length:8820})],

  // 120-127 SFX
  ['SFX','Fret Noise',   preset('fx',{noise:.7,env:{a:.001,d:.1,s:0,r:.05},length:2205})],
  ['SFX','Breath Noise', preset('fx',{noise:.8,env:{a:.05,d:.2,s:0,r:.1},length:3307})],
  ['SFX','Seashore',     preset('fx',{noise:.9,env:{a:.5,d:1.5,s:.5,r:.5},length:8820})],
  ['SFX','Bird Tweet',   preset('fx',{fm:{ratio:4,index:5},env:{a:.01,d:.3,s:.2,r:.2},length:4410})],
  ['SFX','Telephone',    preset('fx',{harm:[1,0,.5,0,.25],vibrato:{rate:15,depth:.05},length:6615})],
  ['SFX','Helicopter',   preset('fx',{noise:.5,fm:{ratio:1.02,index:2},length:8820})],
  ['SFX','Applause',     preset('fx',{noise:.9,env:{a:.05,d:2,s:.7,r:.5},length:8820})],
  ['SFX','Gunshot',      preset('fx',{noise:.9,env:{a:.001,d:.3,s:0,r:.1},length:4410})],
];

// =================================================================
// GM DRUM MAP (Channel 10)
// Format: [midiNote, name, preset]
// =================================================================
const DRUMS = [
  [35, 'Acoustic Bass Drum', drumKit.kick({ fStart: 100, fEnd: 42, toneDecay: 0.35, duration: 0.55 })],
  [36, 'Bass Drum 1',        drumKit.kick({ fStart: 120, fEnd: 48, toneDecay: 0.28 })],
  [37, 'Side Stick',         drumKit.sideStick()],
  [38, 'Acoustic Snare',     drumKit.snare({ fStart: 220, noiseDecay: 0.15 })],
  [39, 'Hand Clap',          drumKit.clap()],
  [40, 'Electric Snare',     drumKit.snare({ fStart: 180, noiseDecay: 0.22, highpass: 600 })],
  [41, 'Low Floor Tom',      drumKit.tom(75, { duration: 0.65, decay: 0.5 })],
  [42, 'Closed Hi-Hat',      drumKit.hihat({ duration: 0.07, decay: 0.02, highpass: 8000 })],
  [43, 'High Floor Tom',     drumKit.tom(105, { duration: 0.6 })],
  [44, 'Pedal Hi-Hat',       drumKit.hihat({ duration: 0.1, decay: 0.035, highpass: 5500 })],
  [45, 'Low Tom',            drumKit.tom(140, { duration: 0.55 })],
  [46, 'Open Hi-Hat',        drumKit.hihat({ duration: 0.55, decay: 0.32, highpass: 6000 })],
  [47, 'Low-Mid Tom',        drumKit.tom(180)],
  [48, 'Hi-Mid Tom',         drumKit.tom(220)],
  [49, 'Crash Cymbal 1',     drumKit.cymbal({ duration: 1.5 })],
  [50, 'High Tom',           drumKit.tom(280)],
  [51, 'Ride Cymbal 1',      drumKit.ride({ duration: 1.1 })],
  [52, 'Chinese Cymbal',     drumKit.cymbal({ duration: 1.8, noiseDecay: 1.0 })],
  [53, 'Ride Bell',          drumKit.ride({ duration: 0.9, noiseDecay: 0.2 })],
  [54, 'Tambourine',         drumKit.tambourine()],
  [55, 'Splash Cymbal',      drumKit.cymbal({ duration: 0.6, noiseDecay: 0.35 })],
  [56, 'Cowbell',            drumKit.cowbell()],
  [57, 'Crash Cymbal 2',     drumKit.cymbal({ duration: 1.4 })],
  [58, 'Vibraslap',          drumKit.vibraslap()],
  [59, 'Ride Cymbal 2',      drumKit.ride({ duration: 0.9 })],
  [60, 'Hi Bongo',           drumKit.bongo(400)],
  [61, 'Low Bongo',          drumKit.bongo(280)],
  [62, 'Mute Hi Conga',      drumKit.conga(320)],
  [63, 'Open Hi Conga',      drumKit.conga(280)],
  [64, 'Low Conga',          drumKit.conga(200)],
  [65, 'High Timbale',       drumKit.tom(280, { noise: 0.15, duration: 0.35 })],
  [66, 'Low Timbale',        drumKit.tom(220, { noise: 0.15, duration: 0.4 })],
  [67, 'High Agogo',         drumKit.agogo(1200)],
  [68, 'Low Agogo',          drumKit.agogo(800)],
  [69, 'Cabasa',             drumKit.cabasa()],
  [70, 'Maracas',            drumKit.maracas()],
  [71, 'Short Whistle',      drumKit.whistle({ duration: 0.15 })],
  [72, 'Long Whistle',       drumKit.whistle({ duration: 0.5 })],
  [73, 'Short Guiro',        drumKit.guiro({ duration: 0.15 })],
  [74, 'Long Guiro',         drumKit.guiro({ duration: 0.5 })],
  [75, 'Claves',             drumKit.clave()],
  [76, 'Hi Wood Block',      drumKit.woodblock(900)],
  [77, 'Low Wood Block',     drumKit.woodblock(550)],
  [78, 'Mute Cuica',         drumKit.cuica({ duration: 0.18 })],
  [79, 'Open Cuica',         drumKit.cuica({ duration: 0.4 })],
  [80, 'Mute Triangle',      drumKit.triangle({ duration: 0.2 })],
  [81, 'Open Triangle',      drumKit.triangle({ duration: 1.0 })],
];

// =================================================================
// 4. GUS PATCH ENCODER
// =================================================================
function encodeGusPatch({ name, pcm, loopStart, loopEnd, isLoop, rootFreq, sampleRate }) {
  const SR = sampleRate || 22050;
  const periodNs = Math.round(1e9 / SR);

  const instSize = 47 + 63 + pcm.length;
  const dataSize = 63 + instSize;
  const buf = new ArrayBuffer(128 + dataSize);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  let off = 0;

  const str = (s, n) => { for (let i = 0; i < n; i++) bytes[off++] = i < s.length ? s.charCodeAt(i) & 0x7f : 0; };
  const u8  = v => { bytes[off++] = v & 0xff; };
  const u16 = v => { view.setUint16(off, v, true); off += 2; };
  const u32 = v => { view.setUint32(off, v, true); off += 4; };
  const zeros = n => { for (let i = 0; i < n; i++) bytes[off++] = 0; };

  // Main Header (128)
  str('GF1PATCH110', 12);
  str('ID#000002',   10);
  str('Generated by JS oscillators', 60);
  u8(1); u8(1); u8(1); u16(1); u8(100);
  u32(dataSize);
  zeros(36);

  // Instrument Header (63)
  u16(0);
  str(name, 16);
  u32(instSize);
  u8(1);
  zeros(40);

  // Layer Header (47)
  u8(0); u8(0);
  u32(63 + pcm.length);
  u8(1);
  zeros(40);

  // Sample Header (63)
  str(name.slice(0, 7), 7);
  u8(0);
  u32(pcm.length);
  u32(isLoop ? loopStart : 0);
  u32(isLoop ? loopEnd : 0);
  u16(periodNs);
  u32(rootFreq);
  u32(rootFreq);
  u32(rootFreq);
  u16(0);
  u8(7);
  // envelope
  u8(0x00); u8(0xFF);
  u8(0x00); u8(0x00);
  u8(0x00); u8(0x00);
  u8(0x00); u8(0x00);
  u8(0x00); u8(0x00);
  u8(0x00); u8(0x00);
  u8(0); u8(0); u8(0);
  u8(0); u8(0); u8(0);
  u8(isLoop ? 0x01 : 0x09);
  zeros(7);

  // Sample Data
  for (let i = 0; i < pcm.length; i++) {
    const v = Math.max(-128, Math.min(127, Math.round(pcm[i] * 127)));
    bytes[off++] = v & 0xff;
  }
  return buf;
}

// =================================================================
// 5. UI LOGIC
// =================================================================
const $ = id => document.getElementById(id);
const logEl = $('log');
function log(msg, cls='') {
  const t = new Date().toTimeString().slice(0,8);
  logEl.innerHTML += `<div><span style="opacity:.5">[${t}]</span> <span class="${cls}">${msg}</span></div>`;
  logEl.scrollTop = logEl.scrollHeight;
}

let currentIdx = -1;
let audioCtx = null;
let activeSource = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// -- Bangun daftar instrumen --
const listEl = $('instrumentList');
let lastFamily = '';

// ---- Melodic 128 ----
GM.forEach(([family, name], i) => {
  if (family !== lastFamily) {
    const h = document.createElement('div');
    h.className = 'family';
    h.textContent = family;
    listEl.appendChild(h);
    lastFamily = family;
  }
  const d = document.createElement('div');
  d.className = 'inst';
  d.dataset.idx = `m${i}`;
  d.dataset.type = 'melodic';
  d.dataset.midi = i;
  d.innerHTML = `<span>${name}</span><span class="num">${String(i).padStart(3,'0')}</span>`;
  d.onclick = () => selectInstrument('melodic', i);
  listEl.appendChild(d);
});

// ---- Drum Kit (GM Channel 10) ----
{
  const h = document.createElement('div');
  h.className = 'family';
  h.textContent = 'Drum Kit (GM Ch.10)';
  h.style.color = 'var(--warn)';
  listEl.appendChild(h);
}
DRUMS.forEach(([note, name]) => {
  const d = document.createElement('div');
  d.className = 'inst';
  d.dataset.idx = `d${note}`;
  d.dataset.type = 'drum';
  d.dataset.midi = note;
  d.innerHTML = `<span>${name}</span><span class="num">${note}</span>`;
  d.onclick = () => selectInstrument('drum', note);
  listEl.appendChild(d);
});

let currentType = 'melodic';
let currentMidi = 0;

// -- Pilih instrumen --
function selectInstrument(type, midi) {
  currentType = type;
  currentMidi = midi;

  document.querySelectorAll('.inst').forEach(el => {
    el.classList.toggle('active',
      el.dataset.type === type && +el.dataset.midi === midi);
  });

  if (type === 'melodic') {
    const [family, name, p] = GM[midi];
    $('title').textContent = `${String(midi).padStart(3,'0')} — ${name}`;
    $('familyLabel').textContent = `Family: ${family}`;
    $('root').value = p.freq || 441;
    $('wave').disabled = false;
  } else {
    const [note, name] = DRUMS.find(d => d[0] === midi);
    $('title').textContent = `Drum ${note} — ${name}`;
    $('familyLabel').textContent = 'Family: Drum Kit (GM Channel 10)';
    $('root').value = Math.round(440 * Math.pow(2, (note - 69) / 12));
    $('wave').disabled = true;
  }
  drawPreview();
}

// -- Render ke PCM --
function getCurrentPCM() {
  const SR = +$('sr').value;
  const freq = +$('root').value;
  const dur = +$('dur').value;

  if (currentType === 'drum') {
    const [, , p] = DRUMS.find(d => d[0] === currentMidi);
    return renderDrum(p, SR);
  }

  // melodic: seperti sebelumnya
  const [, , p] = GM[currentMidi];
  const waveOverride = $('wave').value;
  const p2 = { ...p };
  if (waveOverride !== 'preset') {
    const waves = {
      sine:     [1],
      square:   [1,0,.33,0,.2,0,.14,0,.11,0,.09],
      saw:      [1,.5,.33,.25,.2,.16,.14,.12,.1,.09,.08,.07],
      triangle: [1,0,-.11,0,.04,0,-.02,0,.012],
    };
    p2.harm = waves[waveOverride];
    delete p2.fm;
  }
  return renderPreset(p2, { sampleRate: SR, freq, duration: dur });
}

// -- Gambar waveform --
function drawPreview() {
  const r = getCurrentPCM();
  if (!r) return;
  const c = $('waveCanvas');
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);

  // grid
  ctx.strokeStyle = '#21262d';
  ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) {
    ctx.beginPath(); ctx.moveTo(i*W/8, 0); ctx.lineTo(i*W/8, H); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();

  // waveform
  ctx.strokeStyle = '#58a6ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const N = Math.min(r.pcm.length, W);
  for (let i = 0; i < N; i++) {
    const idx = Math.floor(i * r.pcm.length / N);
    const x = i;
    const y = H/2 - r.pcm[idx] * (H/2 - 4);
    i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  }
  ctx.stroke();

  // stats
  $('statLen').textContent = r.length;
  $('statLoop').textContent = r.loop ? `${r.loopStart} → ${r.loopEnd}` : 'no';
  $('statBytes').textContent = (128 + 63 + 47 + 63 + r.length).toLocaleString();
}

// -- Preview playback --
function playPreview(freqRatio = 1) {
  const r = getCurrentPCM();
  if (!r) return;
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
  if (activeSource) { try { activeSource.stop(); } catch(e){} }

  const buf = ctx.createBuffer(1, r.pcm.length, r.SR);
  buf.getChannelData(0).set(r.pcm);

  const src = ctx.createBufferSource();
  src.buffer = buf;

  // Drum: selalu mainkan pada pitch natural (rate 1.0)
  // Melodic: bisa di-transpose untuk scale
  src.playbackRate.value = currentType === 'drum' ? 1.0 : freqRatio;

  src.connect(ctx.destination);
  src.start();
  activeSource = src;
  // drum: biarkan selesai sendiri
  log(`Preview: ${currentType === 'drum' ? 'Drum ' + currentMidi : GM[currentMidi][1]} @ ${src.playbackRate.value.toFixed(2)}x`);
}

function playScale() {
  if (currentType === 'drum') {
    // Mainkan beberapa drum berurutan
    const notes = [36, 38, 42, 38, 36, 38, 46, 49];
    notes.forEach((n, i) => setTimeout(() => {
      selectInstrument('drum', n);
      playPreview();
    }, i * 220));
    return;
  }
  const notes = [0, 2, 4, 5, 7, 9, 11, 12];
  notes.forEach((semi, i) => {
    setTimeout(() => playPreview(Math.pow(2, semi/12)), i * 180);
  });
}


// -- Download --
function slugify(s) { return s.replace(/[^A-Za-z0-9]/g, '_'); }

function buildPatForCurrent() {
  const SR = +$('sr').value;

  if (currentType === 'drum') {
    const [note, name, p] = DRUMS.find(d => d[0] === currentMidi);
    const r = renderDrum(p, SR);
    const rootFreq = Math.round(440 * Math.pow(2, (note - 69) / 12));
    const buf = encodeGusPatch({
      name: slugify(name).slice(0, 15) || `drum${note}`,
      pcm: r.pcm,
      loopStart: 0, loopEnd: 0, isLoop: false,
      rootFreq,
      sampleRate: SR,
    });
    return {
      buf, r,
      fname: `drum_${String(note).padStart(2,'0')}_${slugify(name)}.pat`
    };
  }

  // melodic
  const [, name, p] = GM[currentMidi];
  const freq = +$('root').value || p.freq || 441;
  const dur = +$('dur').value;
  const r = renderPreset(p, { sampleRate: SR, freq, duration: dur });
  const buf = encodeGusPatch({
    name: slugify(name).slice(0, 15) || `gm${currentMidi}`,
    pcm: r.pcm,
    loopStart: r.loopStart, loopEnd: r.loopEnd, isLoop: r.loop,
    rootFreq: freq, sampleRate: SR,
  });
  return {
    buf, r,
    fname: `${String(currentMidi).padStart(3,'0')}_${slugify(name)}.pat`
  };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function downloadCurrent() {
  if (currentMidi == null) { log('Pilih instrumen dulu', 'err'); return; }
  const { buf, fname } = buildPatForCurrent();
  downloadBlob(new Blob([buf], { type:'application/octet-stream' }), fname);
  log(`✓ ${fname} — ${buf.byteLength.toLocaleString()} bytes`, 'ok');
}

async function downloadAllZip() {
  if (typeof JSZip === 'undefined') { log('JSZip tidak tersedia', 'err'); return; }
  const btn = $('btnZip'); btn.disabled = true;
  $('progressWrap').classList.add('show');
  const zip = new JSZip();
  const SR = +$('sr').value;

  // --- 128 melodic ---
  log('Membangun 128 patch melodic...', 'info');
  for (let i = 0; i < 128; i++) {
    const [, name, p] = GM[i];
    const freq = p.freq || 441;
    const r = renderPreset(p, { sampleRate: SR, freq, duration: +$('dur').value });
    const buf = encodeGusPatch({
      name: slugify(name).slice(0, 15) || `gm${i}`,
      pcm: r.pcm, loopStart: r.loopStart, loopEnd: r.loopEnd,
      isLoop: r.loop, rootFreq: freq, sampleRate: SR,
    });
    zip.folder('melodic').file(`${String(i).padStart(3,'0')}_${slugify(name)}.pat`, buf);
    $('progressBar').style.width = ((i+1)/175*100) + '%';
    if (i % 16 === 0) await new Promise(r => setTimeout(r, 0));
  }

  // --- 47 drum ---
  log('Membangun 47 patch drum...', 'info');
  for (let i = 0; i < DRUMS.length; i++) {
    const [note, name, p] = DRUMS[i];
    const r = renderDrum(p, SR);
    const rootFreq = Math.round(440 * Math.pow(2, (note - 69) / 12));
    const buf = encodeGusPatch({
      name: slugify(name).slice(0, 15) || `drum${note}`,
      pcm: r.pcm, loopStart: 0, loopEnd: 0, isLoop: false,
      rootFreq, sampleRate: SR,
    });
    zip.folder('drums').file(`drum_${String(note).padStart(2,'0')}_${slugify(name)}.pat`, buf);
    $('progressBar').style.width = ((128 + i + 1)/175*100) + '%';
    if (i % 8 === 0) await new Promise(r => setTimeout(r, 0));
  }

  log('Membuat ZIP...', 'info');
  const blob = await zip.generateAsync({ type:'blob', compression:'DEFLATE' });
  downloadBlob(blob, `gm128_plus_drums_${SR}hz.zip`);
  log(`✓ Selesai: ${(blob.size/1024).toFixed(1)} KB`, 'ok');

  $('progressWrap').classList.remove('show');
  btn.disabled = false;
}

// -- Bind UI --
$('btnPreview').onclick   = () => playPreview();
$('btnPlayNote').onclick  = () => playPreview();
$('btnPlayScale').onclick = playScale;
$('btnStop').onclick = () => { if (activeSource) try{activeSource.stop();}catch(e){} activeSource=null; };
$('btnDownload').onclick = downloadCurrent;
$('btnZip').onclick = downloadAllZip;

['sr','root','dur','wave'].forEach(id => {
  $(id).addEventListener('input', drawPreview);
});

// shortcut keyboard
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.code === 'Space') { e.preventDefault(); playPreview(); }
  if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
    e.preventDefault();
    const dir = e.code === 'ArrowDown' ? 1 : -1;
    const all = document.querySelectorAll('.inst');
    const cur = Array.from(all).findIndex(el =>
      el.dataset.type === currentType && +el.dataset.midi === currentMidi);
    const next = Math.max(0, Math.min(all.length - 1, cur + dir));
    const el = all[next];
    selectInstrument(el.dataset.type, +el.dataset.midi);
    el.scrollIntoView({ block: 'nearest' });
  }
});

// start
log('Aplikasi siap. Pilih instrumen di kiri.', 'ok');
log('Shortcut: ↑/↓ navigasi, Spasi = preview', 'info');
selectInstrument('melodic', 0);