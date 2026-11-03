// =================================================================
// Aplikasi ProjectPatchGenerator
// =================================================================

class ProjectPatchGenerator {
  static MODE_16BIT         = 0x01;
  static MODE_UNSIGNED_PCM  = 0x02;
  static MODE_LOOP          = 0x04;
  static MODE_SUSTAIN       = 0x20;
  static MODE_ENVELOPE      = 0x40;

  constructor({sampleRate = 22050, duration = 0.25} = {}) {
    this.sampleRate = sampleRate;
    this.duration = duration;
    this.library = new InstrumentLibrary();
  }

  getPrograms(isDrum) {
    if (isDrum) {
      return this.library.drums.map(({note, name}) => ({id: note, name}));
    }
    return this.library.melodic.map(({name}, id) => ({id, name}));
  }

  generate({isDrum, program, waveform = null, pitchFrom = 0, pitchTo = 127}) {
    const id = Number(program);
    if (!Number.isInteger(id)) {
        throw new Error("Instrument program must be an integer.");
    }

    ({ pitchFrom, pitchTo } = ProjectPatchGenerator.normalizePitchRange(pitchFrom, pitchTo));

    let name;
    let rendered;
    let rootFreq;
    let appliedWaveform = null;
    let preset = null;

    if (isDrum) {
        const drum = this.library.findDrum(id);
        if (!drum) throw new Error(`Unknown drum instrument: ${id}.`);
        const {note, name: drumName, preset: drumPreset} = drum;
        name = drumName;
        preset = drumPreset;
        rendered = new DrumRenderer(preset, this.sampleRate).render();
        rootFreq = this.library.drumToFreq(note);
    } else {
        const instrument = this.library.melodic[id];
        if (!instrument) throw new Error(`Unknown melodic instrument: ${id}.`);
        let {name: instrumentName, preset: melodicPreset} = instrument;
        preset = melodicPreset;

        if (waveform != null) {
        let harm;
        if (Array.isArray(waveform)) {
            harm = waveform.slice();
            appliedWaveform = 'custom';
        } else {
            const harmLen = (preset.harm || [1]).length;
            harm = ProjectPatchGenerator.waveformHarmonics(waveform, harmLen);
            appliedWaveform = waveform;
        }
        if (!harm) {
            throw new Error(
            `Unknown waveform: ${waveform}. ` +
            `Use 'sine' | 'triangle' | 'square' | 'saw' | array amplitudo.`
            );
        }
        preset = { ...preset, harm };
        instrumentName = `${instrumentName} (${appliedWaveform})`;
        }
        // ---------------------------------------------------

        name = instrumentName;
        const isFullPitchRange = pitchFrom === 0 && pitchTo === 127;
        const rootNote = Math.round((pitchFrom + pitchTo) / 2);
        rootFreq = isFullPitchRange
            ? (preset.freq || 441)
            : ProjectPatchGenerator.midiPitchToFrequency(rootNote);
        rendered = new MelodicRenderer(preset, {
        sampleRate: this.sampleRate,
        freq: rootFreq,
        duration: this.duration
        }).render();
    }

    const vibDef = preset && preset.vibrato;
    let gusVibratoSweep = 0;
    let gusVibratoRate  = 0;
    let gusVibratoDepth = 0;

    if (rendered.loop && vibDef && (vibDef.rate > 0)) {
        const rateHz     = Math.max(0, Math.min(25,  vibDef.rate  || 5));
        const depthRatio = Math.max(0, Math.min(0.02, vibDef.depth || 0.005));
        gusVibratoRate  = Math.round(rateHz     * 255 / 25);
        gusVibratoDepth = Math.round(depthRatio * 500);
        gusVibratoSweep = Math.max(0, Math.min(255, vibDef.sweep || 0));
    }

    if (preset && preset.gain != null
        && (typeof preset.gain !== 'number' || !Number.isFinite(preset.gain) || preset.gain < 0)) {
        throw new Error(`Invalid output gain for instrument: ${name}.`);
    }
    const instrumentGain = preset && typeof preset.gain === 'number' ? preset.gain : 1.0;
    const masterGain = isDrum
        ? this.library.drumMasterGain
        : this.library.melodicMasterGain;
    const outputGain = masterGain * instrumentGain;

    const pcm = new Uint8Array(rendered.pcm.length * 2);
    for (let i = 0; i < rendered.pcm.length; i++) {
        let v = Math.round(Math.max(-1, Math.min(1, rendered.pcm[i] * outputGain)) * 32768);
        if (v >  32767) v =  32767;
        if (v < -32768) v = -32768;
        if (v < 0) v += 65536;
        pcm[i * 2]     =  v       & 0xff;
        pcm[i * 2 + 1] = (v >> 8) & 0xff;
    }

    const sampleName = this.slugify(name).slice(0, 7) || "PATCH";
    const lowFreq = isDrum || (pitchFrom === 0 && pitchTo === 127)
        ? Math.round(8.1757989156 * 1000)
        : Math.floor(ProjectPatchGenerator.midiPitchToFrequency(pitchFrom) * 1000);
    const highFreq = isDrum || (pitchFrom === 0 && pitchTo === 127)
        ? Math.round(12543.853951 * 1000)
        : Math.ceil(ProjectPatchGenerator.midiPitchToFrequency(pitchTo) * 1000);

    let modes = ProjectPatchGenerator.MODE_16BIT;
    if (rendered.loop) {
        modes |= ProjectPatchGenerator.MODE_LOOP | ProjectPatchGenerator.MODE_ENVELOPE;
        if (!preset || preset.sustainLoop !== false) {
            modes |= ProjectPatchGenerator.MODE_SUSTAIN;
        }
    }
    const patchEnvelope = preset && preset.patchEnvelope;

    const sample = {
        name: sampleName,
        fractions: 0,
        dataSize: pcm.length,
        loopStart: rendered.loop ? rendered.loopStart * 2 : 0,
        loopEnd:   rendered.loop ? rendered.loopEnd   * 2 : 0,
        sampleRate: this.sampleRate,
        lowFreq,
        highFreq,
        rootFreq: Math.round(rootFreq * 1000),
        tune: 0,
        balance: 7,
        envRates: rendered.loop
            ? (patchEnvelope ? patchEnvelope.rates.slice() : [9, 0, 0, 69, 0, 0])
            : [0, 0, 0, 0, 0, 0],
        envOffsets: rendered.loop
            ? (patchEnvelope ? patchEnvelope.offsets.slice() : [255, 255, 255, 0, 0, 0])
            : [255, 255, 255, 0, 0, 0],
        tremoloSweep: 0, tremoloRate: 0, tremoloDepth: 0,
        vibratoSweep: gusVibratoSweep, vibratoRate: gusVibratoRate, vibratoDepth: gusVibratoDepth,
        modes,
        scaleFreq: 60,
        scaleFactor: 1024,
        reserved: new Uint8Array(36),
        pcm,
        _float: null
    };

    const patch = {
        header: {
        magic: "GF1PATCH110",
        gravisId: "ID#000002",
        description: name,
        voices: 14,
        channels: 0,
        waveForms: 1,
        masterVolume: 120,
        dataSize: 0,
        reserved: new Uint8Array(36)
        },
        instruments: [{
        instrument: 0,
        name: this.slugify(name).slice(0, 15),
        size: 0,
        reserved: new Uint8Array(40),
        layers: [{
            duplicate: 0,
            layer: 0,
            layerSize: 0,
            reserved: new Uint8Array(40),
            samples: [sample]
        }]
        }]
    };

    return { patch, name, program: id, isDrum, waveform: appliedWaveform, pitchFrom, pitchTo };
    }

  slugify(value) {
    return String(value).replace(/[^A-Za-z0-9]/g, "_");
  }

  static midiPitchToFrequency(pitch) {
    return 440 * Math.pow(2, (pitch - 69) / 12);
  }

  static normalizePitchRange(pitchFrom = 0, pitchTo = 127) {
    const from = Number(pitchFrom);
    const to = Number(pitchTo);
    if (!Number.isInteger(from) || from < 0 || from > 127
        || !Number.isInteger(to) || to < 0 || to > 127
        || from > to) {
      throw new Error("Pitch range must be MIDI notes from 0 to 127, with pitchFrom no greater than pitchTo.");
    }
    return { pitchFrom: from, pitchTo: to };
  }

  static frequencyToMidiPitch(milliHz) {
    const frequency = Number(milliHz) / 1000;
    if (!(frequency > 0) || !Number.isFinite(frequency)) return null;
    return Math.max(0, Math.min(127, Math.round(69 + 12 * Math.log2(frequency / 440))));
  }

  /**
   * @param {string} type  'sine' | 'triangle' | 'square' | 'saw'
   * @param {number} n     jumlah harmonisa yang dihasilkan
   * @returns {number[]|null}
   */
  static waveformHarmonics(type, n) {
    const out = new Array(n).fill(0);
    switch (type) {
      case 'sine':
        out[0] = 1;
        break;
      case 'triangle':
        for (let k = 0; k < n; k++) {
          const order = k + 1;
          if (order % 2 === 1) {
            const sign = ((order - 1) / 2) % 2 === 0 ? 1 : -1;
            out[k] = sign / (order * order);          // +1, -1/9, +1/25, ...
          }
        }
        break;
      case 'square':
        for (let k = 0; k < n; k++) {
          const order = k + 1;
          if (order % 2 === 1) out[k] = 1 / order;    // 1, 0, 1/3, 0, 1/5, ...
        }
        break;
      case 'saw':
        for (let k = 0; k < n; k++) out[k] = 1 / (k + 1); // 1, 1/2, 1/3, ...
        break;
      default:
        return null;
    }
    return out;
  }
}

// =================================================



// =================================================================
//                          BAGIAN 1
//                      KELAS-KELAS (DEFINISI)
// =================================================================

// ----------------------------------------------------------------
// 1.1  GUSPatchGenerator — utilitas matematika waveform & DSP
// ----------------------------------------------------------------
class GUSPatchGenerator {
    static TAU = Math.PI * 2;

    static sin(p) { return Math.sin(Math.PI * 2 * p); }

    static partials(phase, amps) {
        let s = 0;
        for (let k = 0; k < amps.length; k++) s += amps[k] * Math.sin(Math.PI * 2 * phase * (k + 1));
        return s;
    }

    static normalize(buffer, target = 0.9) {
        let peak = 0;
        for (let i = 0; i < buffer.length; i++) {
            const a = Math.abs(buffer[i]);
            if (a > peak) peak = a;
        }
        if (peak > 0) {
            const k = target / peak;
            for (let i = 0; i < buffer.length; i++) buffer[i] *= k;
        }
    }

    static fadeIn(buffer, fadeLen) {
        const L = buffer.length;
        fadeLen = Math.min(fadeLen, L);
        for (let i = 0; i < fadeLen; i++) buffer[i] *= i / fadeLen;
    }

    static fadeOut(buffer, fadeLen) {
        const L = buffer.length;
        fadeLen = Math.min(fadeLen, L);
        for (let i = 0; i < fadeLen; i++) buffer[L - 1 - i] *= i / fadeLen;
    }

    static highpass(buffer, cutoff, SR) {
        const rc = 1 / (2 * Math.PI * cutoff);
        const dt = 1 / SR;
        const a = rc / (rc + dt);
        let pi = 0, po = 0;
        for (let i = 0; i < buffer.length; i++) {
            const x = buffer[i];
            const y = a * (po + x - pi);
            pi = x; po = y;
            buffer[i] = y;
        }
    }

    static lowpass(buffer, cutoff, SR) {
        const rc = 1 / (2 * Math.PI * cutoff);
        const dt = 1 / SR;
        const a = dt / (rc + dt);
        let prev = 0;
        for (let i = 0; i < buffer.length; i++) {
            prev += a * (buffer[i] - prev);
            buffer[i] = prev;
        }
    }

    /* ─────────────── NEW: realism helpers ─────────────── */

    /** Pink noise (−3 dB/oct) — lebih "hangat" dari white, dasar snare wire/breath/wind */
    static pinkNoise(len) {
        const out = new Float32Array(len);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < len; i++) {
            const w = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + w * 0.0555179;
            b1 = 0.99332 * b1 + w * 0.0750759;
            b2 = 0.96900 * b2 + w * 0.1538520;
            b3 = 0.86650 * b3 + w * 0.3104856;
            b4 = 0.55000 * b4 + w * 0.5329522;
            b5 = -0.7616 * b5 - w * 0.0168980;
            out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
            b6 = w * 0.115926;
        }
        return out;
    }

    /** Brown noise (−6 dB/oct) — untuk body kick, low wind rumble */
    static brownNoise(len) {
        const out = new Float32Array(len);
        let last = 0;
        for (let i = 0; i < len; i++) {
            const w = Math.random() * 2 - 1;
            last = (last + 0.02 * w) / 1.02;
            out[i] = last * 3.5;
        }
        return out;
    }

    /** RBJ peaking filter — basis formant */
    static peakFilter(buf, freq, q, gainDb, SR) {
        if (!freq || freq >= SR * 0.49) return;
        const w0 = 2 * Math.PI * freq / SR;
        const cosW = Math.cos(w0);
        const alpha = Math.sin(w0) / (2 * Math.max(0.1, q || 1));
        const A = Math.pow(10, (gainDb == null ? 6 : gainDb) / 40);
        const a0 = 1 + alpha / A;
        const b0 = (1 + alpha * A) / a0;
        const b1 = (-2 * cosW) / a0;
        const b2 = (1 - alpha * A) / a0;
        const a1 = (-2 * cosW) / a0;
        const a2 = (1 - alpha / A) / a0;
        let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        for (let i = 0; i < buf.length; i++) {
            const x = buf[i];
            const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            x2 = x1; x1 = x; y2 = y1; y1 = y;
            buf[i] = y;
        }
    }

    /** Susun formant — mis. `[{freq:900,q:2,gain:4}, {freq:2200,q:3,gain:3}]` */
    static applyFormants(buf, formants, SR) {
        if (!formants) return;
        for (const f of formants) this.peakFilter(buf, f.freq, f.q, f.gain, SR);
    }

    /** Time-varying lowpass — startHz → endHz secara eksponensial sepanjang buffer */
    static brightnessSweep(buf, startHz, endHz, SR) {
        const N = buf.length;
        if (!N || !startHz || !endHz) return;
        let y = 0;
        for (let i = 0; i < N; i++) {
            const pos = i / (N - 1);
            const hz = Math.max(20, Math.min(SR * 0.49,
                startHz * Math.pow(endHz / startHz, pos)));
            const dt = 1 / SR;
            const rc = 1 / (2 * Math.PI * hz);
            const a = dt / (rc + dt);
            y += a * (buf[i] - y);
            buf[i] = y;
        }
    }

    /** Soft saturation — richness brass/tube/overdrive */
    static softClip(buf, drive = 2) {
        if (!drive || drive <= 0) return;
        const k = Math.tanh(drive);
        if (k < 1e-9) return;
        for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * drive) / k;
    }

    static guitarAmp(buf, config, SR) {
        const preampCutoff = config.preampCutoff || 0;
        if (preampCutoff > 0) this.highpass(buf, preampCutoff, SR);

        const drive = Math.max(0.1, config.drive || 1);
        const bias = config.bias || 0;
        const mix = Math.max(0, Math.min(1, config.mix == null ? 1 : config.mix));
        const biasOffset = Math.tanh(bias * drive);
        for (let i = 0; i < buf.length; i++) {
            const dry = buf[i];
            const saturated = Math.tanh((dry + bias) * drive) - biasOffset;
            buf[i] = dry * (1 - mix) + saturated * mix;
        }

        const cabinetCutoff = config.cabinetCutoff || 0;
        if (cabinetCutoff > 0) this.lowpass(buf, cabinetCutoff, SR);
    }

    /** Bandpass noise (white/pink/brown) — untuk snare wire, cymbal wash */
    static bandpassNoise(len, centerFreq, q, SR, type = 'white') {
        let buf;
        if (type === 'pink') buf = this.pinkNoise(len);
        else if (type === 'brown') buf = this.brownNoise(len);
        else {
            buf = new Float32Array(len);
            for (let i = 0; i < len; i++) buf[i] = Math.random() * 2 - 1;
        }
        const w0 = 2 * Math.PI * centerFreq / SR;
        const cosW = Math.cos(w0);
        const alpha = Math.sin(w0) / (2 * Math.max(0.1, q || 1));
        const a0 = 1 + alpha;
        const b0 = alpha / a0;
        const b2 = -alpha / a0;
        const a1 = -2 * cosW / a0;
        const a2 = (1 - alpha) / a0;
        let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        for (let i = 0; i < len; i++) {
            const x = buf[i];
            const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
            x2 = x1; x1 = x; y2 = y1; y1 = y;
            buf[i] = y;
        }
        return buf;
    }
}

// ----------------------------------------------------------------
// 1.2  GusPatchEncoder — membungkus PCM ke file .pat GUS
// ----------------------------------------------------------------
class GusPatchEncoder {
    static encode({
        name, pcm, loopStart, loopEnd, isLoop, rootFreq, sampleRate,
        sustainLoop = isLoop, envRates, envOffsets
    }) {
        const SR = sampleRate || 22050;
        const periodNs = Math.round(1e9 / SR);

        const bps = 2;                      // 16-bit = 2 bytes/sample
        const pcmBytes = pcm.length * bps;
        const sampleHeaderSize = 96;
        const layerSize   = 47 + sampleHeaderSize + pcmBytes;
        const instSize    = 63 + layerSize;          // instrument block = inst header + layers
        const dataSize    = instSize;                // main header data_size
        const buf = new ArrayBuffer(129 + dataSize); // main header 129 byte
        const view = new DataView(buf);
        const bytes = new Uint8Array(buf);
        let off = 0;

        const str  = (s, n) => { for (let i = 0; i < n; i++) bytes[off++] = i < s.length ? s.charCodeAt(i) & 0x7f : 0; };
        const u8   = v => { bytes[off++] = v & 0xff; };
        const u16  = v => { view.setUint16(off, v, true); off += 2; };
        const u32  = v => { view.setUint32(off, v, true); off += 4; };
        const zeros = n => { for (let i = 0; i < n; i++) bytes[off++] = 0; };

        // ---------- Main Header (129 byte) ----------
        str('GF1PATCH110', 12);
        str('ID#000002', 10);
        str('Generated by Planetbiru Instrument Editor', 60);
        u8(1);            // instruments
        u8(1);            // voices
        u8(1);            // channels
        u16(1);           // waveforms
        u16(100);         // master volume (16-bit!)
        u32(dataSize);
        zeros(36);

        // ---------- Instrument Header (63 byte) ----------
        u16(0);
        str(name, 16);
        u32(instSize);
        u8(1);
        zeros(40);

        // ---------- Layer Header (47 byte) ----------
        u8(0); u8(0);
        u32(layerSize);
        u8(1);
        zeros(40);

        // ---------- Sample Header (96 byte) ----------
        str(name.slice(0, 7), 7);
        u8(0);                                  // fractions
        u32(pcmBytes);                          // data size in BYTES
        u32(isLoop ? loopStart * bps : 0);      // loop start (BYTE offset)
        u32(isLoop ? loopEnd   * bps : 0);      // loop end   (BYTE offset)
        u16(periodNs);                          // sample rate (period in ns)
        u32(rootFreq);                          // lowFreq
        u32(rootFreq);                          // highFreq
        u32(rootFreq);                          // rootFreq
        u16(0);                                 // tune
        u8(7);                                  // balance

        // envRates[6] + envOffsets[6]
        if (isLoop) {
            const rates = envRates || [9, 0, 0, 69, 0, 0];
            const offsets = envOffsets || [255, 255, 255, 0, 0, 0];
            for (let i = 0; i < 6; i++) u8(rates[i] || 0);
            for (let i = 0; i < 6; i++) u8(offsets[i] || 0);
        } else {
            u8(0); u8(0); u8(0); u8(0); u8(0); u8(0);
            u8(255); u8(255); u8(255); u8(0); u8(0); u8(0);
        }
        // tremolo (3) + vibrato (3)
        u8(0); u8(0); u8(0);
        u8(0); u8(0); u8(0);

        // Sustain loop exits into the sample tail when the note is released.
        u8(0x01 | (isLoop ? 0x04 | 0x40 | (sustainLoop ? 0x20 : 0x00) : 0x00));

        u16(60);                                // scale frequency (MIDI note C4)
        u16(1024);                              // scale factor
        zeros(36);                              // reserved

        // ---------- Sample Data: signed 16-bit LE ----------
        for (let i = 0; i < pcm.length; i++) {
            let v = Math.round(Math.max(-1, Math.min(1, pcm[i])) * 32768);
            if (v >  32767) v =  32767;
            if (v < -32768) v = -32768;
            if (v < 0) v += 65536;
            bytes[off++] =  v        & 0xff;
            bytes[off++] = (v >> 8)  & 0xff;
        }

        return buf;
    }
}

// ----------------------------------------------------------------
// 1.3  MelodicRenderer — render preset melodis → PCM
// ----------------------------------------------------------------
class MelodicRenderer {
    constructor(preset, override = {}) {
        this.p = preset;
        this.o = override;
        this.SR = override.sampleRate || preset.sampleRate || 22050;
        this.isLoop = preset.loop && !override.forceNoLoop;
    }

    render() {
        const { p, o, SR, isLoop } = this;

        let length, baseFreq, loopStart = 0, loopEnd = 0, cs = 50;
        let naturalFreq;

        if (isLoop) {
            const targetFreq = o.freq || p.freq || 441;
            cs = p.cycleSamples || Math.max(2, Math.round(SR / targetFreq));
            naturalFreq = SR / cs;
            const cycles = p.cycles || 12;
            const tailCycles = p.tailCycles || 4;
            loopStart = (p.loopSkip || 3) * cs;
            loopEnd = cs * cycles;
            // Loop sample size is defined by cycles/tailCycles; p.length only applies to one-shots.
            length = loopEnd + cs * tailCycles;
            baseFreq = naturalFreq;
        } else {
            length = p.length
                ? Math.round(p.length * SR / 22050)
                : Math.round(SR * (o.duration || 0.25));
            baseFreq    = o.freq || p.freq || 441;
            naturalFreq = baseFreq;
        }

        // ─────────────────────────────────────────────────────────────
        // LOOP PERIODICITY RULES
        // Untuk loop mulus, sinyal di [loopStart, loopEnd) HARUS periodik
        // dengan periode `cs`, sehingga out[loopEnd] == out[loopStart]
        // (fasa + amplitudo identik). Konsekuensinya semua modulasi waktu
        // (vibrato, detune, FM, inharmonicity, pitchScoop, attack burst,
        // partialDecay) DIMATIKAN untuk loop. Kalau tidak, fasa drift →
        // klik/pop atau modulasi amplitudo ("patah-patah").
        // `loopAttackNoise` hanya ditambahkan sebelum loopStart.
        // Vibrato/tremolo tetap bisa diberikan lewat header GUS
        // (vibratoRate/vibratoDepth/tremolo*) supaya pemutar yang
        // men-modulasi, bukan sample-nya.
        // ─────────────────────────────────────────────────────────────
        const vib       = isLoop ? null : (p.vibrato || null);
        const detunes   = isLoop ? [0]  : (p.detune || [0]);
        const env       = p.env || { a: 0.005, d: 0.5, s: 0, r: 0.3 };
        const noiseAmt  = p.noise || 0;
        const fm        = p.fm && (!isLoop || Number.isInteger(p.fm.ratio)) ? p.fm : null;
        const harm      = p.harm || [1];
        const inharmB   = isLoop ? 0    : (p.inharmonicity || 0);
        const atk       = isLoop ? (p.loopAttackNoise || null) : (p.attackNoise || null);
        const pluck     = isLoop ? null : (p.pluckTransient || null);
        const pluckPosition = Number.isFinite(p.pluckPosition)
            ? Math.max(0.01, Math.min(0.49, p.pluckPosition))
            : null;
        const scoop     = isLoop ? null : (p.pitchScoop || null);
        const scoopTime  = scoop ? (scoop.time  || 0.03) : 0;
        const scoopDepth = scoop ? (scoop.depth || 0.05) : 0;
        const vibOnset   = p.vibratoOnset != null ? p.vibratoOnset : (isLoop ? 0 : 0.12);
        const pDecay    = isLoop ? null : (p.partialDecay || null);

        const nP = harm.length;
        const voices = detunes.map(c => {
            // Fase awal per harmonik.
            // Default 0 (pulse simetris). Untuk voice, `p.phases` berisi
            // profil kuadratik yang membentuk gelombang glottal asimetris.
            const phases = new Float32Array(nP);
            if (Array.isArray(p.phases)) {
                for (let k = 0; k < nP; k++) {
                    const v = p.phases[k];
                    phases[k] = (typeof v === 'number') ? (v - Math.floor(v)) : 0;
                }
            }
            return {
                phases,
                modPhase: 0,
                ratio: Math.pow(2, c / 1200),
            };
        });
        const out = new Float32Array(length);
        const noiseBuf    = (isLoop && noiseAmt > 0) ? this._buildLoopNoise(cs) : null;
        const fadeSamples = isLoop ? cs : 0;
        const loopAttackSamples = isLoop && p.loopAttack
            ? Math.min(loopStart, Math.max(1, Math.round(SR * p.loopAttack)))
            : 0;

        for (let i = 0; i < length; i++) {
            const t = i / SR;

            let sc = 0;
            if (scoopTime > 0 && t < scoopTime * 4) sc = scoopDepth * Math.exp(-t / scoopTime);

            let vDepth = 0;
            if (vib) {
                const onset = Math.min(1, t / Math.max(0.001, vibOnset));
                vDepth = vib.depth * onset * Math.sin(Math.PI * 2 * vib.rate * t);
            }

            let sample = 0;

            for (const v of voices) {
                const f0 = baseFreq * v.ratio * (1 + vDepth) * (1 + sc);

                if (fm) {
                    v.modPhase += f0 * fm.ratio / SR;
                    v.modPhase -= Math.floor(v.modPhase);
                    const mod = Math.sin(Math.PI * 2 * v.modPhase) * fm.index;
                    v.phases[0] += f0 / SR;
                    v.phases[0] -= Math.floor(v.phases[0]);
                    sample += Math.sin(Math.PI * 2 * v.phases[0] + mod);
                } else {
                    for (let k = 0; k < nP; k++) {
                        const a = harm[k];
                        if (a === 0) continue;
                        const order = k + 1;
                        const stretch = inharmB > 0
                            ? order * Math.sqrt(1 + inharmB * order * order)
                            : order;
                        v.phases[k] += (f0 * stretch) / SR;
                        v.phases[k] -= Math.floor(v.phases[k]);
                        let pAmp = a;
                        if (pluckPosition !== null) {
                            const fundamentalExcitation = Math.max(0.01, Math.abs(Math.sin(Math.PI * pluckPosition)));
                            pAmp *= Math.abs(Math.sin(Math.PI * order * pluckPosition)) / fundamentalExcitation;
                        }
                        if (pDecay) pAmp *= Math.exp(-t / (pDecay[k] || 1));
                        sample += pAmp * Math.sin(Math.PI * 2 * v.phases[k]);
                    }
                }
            }
            sample /= voices.length;

            if (noiseAmt > 0) {
                const n = noiseBuf ? noiseBuf[i % cs] : (Math.random() * 2 - 1);
                sample = sample * (1 - noiseAmt) + n * noiseAmt;
            }

            out[i] = sample * this._envelope(
                t, length, env, isLoop, i, fadeSamples, loopAttackSamples
            );
        }

        // Transient loop hanya berada di bagian awal, di luar area loop periodik.
        if (atk) {
            const dur = Math.max(1, Math.round(SR * (atk.duration || 0.015)));
            const L   = Math.min(length, dur, isLoop ? loopStart : length);
            const burst = GUSPatchGenerator.pinkNoise(L);
            const amp = atk.amp || 0.1;
            for (let i = 0; i < L; i++) {
                const e = Math.exp(-i / (SR * (atk.duration || 0.015) * 0.3));
                out[i] += burst[i] * amp * e;
            }
        }

        if (pluck && !isLoop) {
            const dur = Math.max(1, Math.round(SR * (pluck.duration || 0.012)));
            const L = Math.min(length, dur);
            const burst = GUSPatchGenerator.bandpassNoise(
                L,
                pluck.freq || 2500,
                pluck.q || 1,
                SR,
                pluck.type || 'pink'
            );
            const amp = pluck.amp || 0.03;
            for (let i = 0; i < L; i++) {
                const t = i / SR;
                const envelope = Math.exp(-t / (pluck.decay || dur / SR * 0.45));
                out[i] += burst[i] * amp * envelope;
            }
        }

        // (Crossfade lama DIHAPUS.)
        // Dengan periodisitas sempurna, wrap loopEnd→loopStart sudah kontinu
        // secara alami (out[loopEnd-1] ≈ out[loopStart-1] karena loopLength
        // kelipatan bulat `cs`). Crossfade justru mencampur dua sinyal yang
        // fase/amplitude-nya beda bila ada modulasi sisa → AM "patah-patah".

        // Fade-out ekor (dipertahankan; ekor mulai dari fasa 0 == fasa loopStart,
        // jadi transisi loopEnd → ekor juga mulus saat note release)
        if (isLoop && length > loopEnd) {
            const tailLength = length - loopEnd;
            for (let i = 0; i < tailLength; i++) {
                const g = 0.5 * (1 + Math.cos(Math.PI * ((i + 1) / tailLength)));
                out[loopEnd + i] *= g;
            }
        }

        // Formants + brightness sweep + saturation
        if (p.brightness && !isLoop) {
            GUSPatchGenerator.brightnessSweep(out,
                p.brightness.start || 8000,
                p.brightness.end || 1200,
                SR);
        }
        if (p.guitarAmp) GUSPatchGenerator.guitarAmp(out, p.guitarAmp, SR);
        if (p.formants) GUSPatchGenerator.applyFormants(out, p.formants, SR);
        if (p.drive)    GUSPatchGenerator.softClip(out, p.drive);

        // Fade-in 2 ms (non-loop)
        if (!isLoop) {
            const fi = Math.min(Math.round(SR * 0.002), length);
            for (let i = 0; i < fi; i++) out[i] *= i / fi;
        }

        GUSPatchGenerator.normalize(out, 0.9);
        return { pcm: out, length, loopStart, loopEnd, loop: isLoop, SR, naturalFreq };
    }

    _envelope(t, length, env, isLoop, i, fadeSamples, loopAttackSamples) {
        if (isLoop) {
            if (loopAttackSamples > 0) {
                return i < loopAttackSamples
                    ? 0.5 * (1 - Math.cos(Math.PI * i / loopAttackSamples))
                    : 1.0;
            }
            return i < fadeSamples ? (i / fadeSamples) : 1.0;
        }

        // Exponential attack/decay — jauh lebih natural dari linear
        let e;
        if (t < env.a) {
            const tau = Math.max(env.a / 3, 0.001);
            e = 1 - Math.exp(-t / tau);
        } else if (t < env.a + env.d) {
            const dt = t - env.a;
            const tau = Math.max(env.d / 3, 0.001);
            e = env.s + (1 - env.s) * Math.exp(-dt / tau);
        } else {
            e = env.s;
        }
        if (env.r > 0) {
            const relStart = length / this.SR - env.r;
            if (t > relStart) e *= Math.exp(-3 * ((t - relStart) / env.r));
        }
        return e;
    }

    _buildLoopNoise(cs) {
        const buf = GUSPatchGenerator.pinkNoise(cs);
        let np = 0;
        for (let i = 0; i < cs; i++) np = Math.max(np, Math.abs(buf[i]));
        if (np > 0) for (let i = 0; i < cs; i++) buf[i] /= np;
        return buf;
    }
}

// ----------------------------------------------------------------
// 1.4  DrumRenderer — render preset drum → PCM
// ----------------------------------------------------------------
class DrumRenderer {
    constructor(preset, sampleRate = 22050) {
        this.p = preset;
        this.SR = sampleRate;
        this.length = Math.round(sampleRate * (preset.duration || 0.5));
    }

    render() {
        const { p, SR, length } = this;
        const out = new Float32Array(length);
        const tones     = (p.tones    || []).map(t => ({ ...t, phase: 0, modPhase: 0 }));
        const membrane  = p.membrane  ? this._setupMembrane(p.membrane, SR) : null;
        const metallic  = p.metallic  ? this._setupMetallic(p.metallic)     : null;
        const noiseBuf  = p.noise     ? this._buildNoise(p.noise, length, SR) : null;
        const noiseLayers = (p.noiseLayers || []).map(cfg => ({
            cfg,
            buffer: this._buildNoise(cfg, length, SR)
        }));

        for (let i = 0; i < length; i++) {
            const t = i / SR;
            let sample = 0;
            sample += this._tones(t, tones);
            if (membrane) sample += this._membrane(t, membrane);
            if (metallic) sample += this._metallic(t, metallic);
            if (noiseBuf) sample += this._noise(t, noiseBuf, p.noise);
            for (const layer of noiseLayers) {
                sample += this._noise(t, layer.buffer, layer.cfg);
            }
            sample += this._click(t);
            sample = this._bursts(t, sample);
            out[i] = sample;
        }

        if (p.highpass) GUSPatchGenerator.highpass(out, p.highpass, SR);
        if (p.lowpass)  GUSPatchGenerator.lowpass(out, p.lowpass, SR);
        GUSPatchGenerator.fadeIn(out, Math.min(64, Math.floor(length * 0.01)));
        GUSPatchGenerator.fadeOut(out, Math.min(96, Math.floor(length * 0.05)));
        GUSPatchGenerator.normalize(out, 0.9);
        return { pcm: out, length, loop: false, loopStart: 0, loopEnd: 0, SR };
    }

    _tones(t, tones) {
        let s = 0;
        for (const tn of tones) {
            const f = tn.fEnd + (tn.fStart - tn.fEnd) * Math.exp(-t / (tn.pitchDecay || 0.02));
            tn.phase += f / this.SR;
            if (tn.phase >= 1) tn.phase -= Math.floor(tn.phase);
            let val;
            if (tn.fm) {
                const mf = f * tn.fm.ratio;
                tn.modPhase += mf / this.SR;
                if (tn.modPhase >= 1) tn.modPhase -= Math.floor(tn.modPhase);
                const mod = Math.sin(Math.PI * 2 * tn.modPhase) * tn.fm.index;
                val = Math.sin(Math.PI * 2 * tn.phase + mod);
            } else {
                val = Math.sin(Math.PI * 2 * tn.phase);
            }
            s += val * (tn.amp || 1) * Math.exp(-t / (tn.decay || 0.3));
        }
        return s;
    }

    _setupMembrane(cfg, SR) {
        const baseFreq = cfg.freq || 200;
        const ratios = [1.0, 1.593, 2.136, 2.295, 2.653, 2.917, 3.156];
        const amps   = [1.0, 0.55, 0.30, 0.20, 0.13, 0.08, 0.05];
        const decays = [1.0, 0.75, 0.55, 0.45, 0.35, 0.28, 0.22];
        const baseDecay = cfg.decay || 0.4;
        const list = cfg.modes || ratios.map((r, i) => ({
            ratio: r, amp: amps[i] || 0.1, decay: decays[i] || 0.3
        }));
        return list.map(m => ({
            fStart: baseFreq * m.ratio * (m.startRatio || 1.2),
            fEnd: baseFreq * m.ratio,
            pitchDecay: cfg.pitchDecay || 0.05,
            amp: m.amp,
            decay: baseDecay * m.decay,
            phase: 0,
        }));
    }

    _membrane(t, modes) {
        let s = 0;
        for (const m of modes) {
            const f = m.fEnd + (m.fStart - m.fEnd) * Math.exp(-t / (m.pitchDecay || 0.05));
            m.phase += f / this.SR;
            if (m.phase >= 1) m.phase -= Math.floor(m.phase);
            s += Math.sin(Math.PI * 2 * m.phase) * m.amp * Math.exp(-t / m.decay);
        }
        return s;
    }

    _setupMetallic(cfg) {
        const base = cfg.baseFreq || 400;
        const ratios = cfg.partials || [1, 1.34, 1.71, 2.04, 2.42, 2.83, 3.17, 3.62, 4.15, 4.68];
        const decay = cfg.decay || 0.3;
        const amp   = cfg.amp   || 0.5;
        return ratios.map((r, i) => ({
            freq: base * r,
            phase: 0,
            amp: amp / (1 + i * 0.35),
            decay: decay / (1 + i * 0.25),
        }));
    }

    _metallic(t, partials) {
        let s = 0;
        for (const pt of partials) {
            pt.phase += pt.freq / this.SR;
            if (pt.phase >= 1) pt.phase -= Math.floor(pt.phase);
            s += Math.sin(Math.PI * 2 * pt.phase) * pt.amp * Math.exp(-t / pt.decay);
        }
        return s;
    }

    _buildNoise(cfg, length, SR) {
        const type = cfg.type || 'white';
        if (cfg.bandpass) {
            return GUSPatchGenerator.bandpassNoise(
                length,
                cfg.bandpass.center,
                cfg.bandpass.q || 1,
                SR,
                type
            );
        }
        let buf;
        if (type === 'pink') buf = GUSPatchGenerator.pinkNoise(length);
        else if (type === 'brown') buf = GUSPatchGenerator.brownNoise(length);
        else {
            buf = new Float32Array(length);
            for (let i = 0; i < length; i++) buf[i] = Math.random() * 2 - 1;
        }
        return buf;
    }

    _noise(t, noiseBuf, cfg) {
        if (!cfg || !cfg.amp) return 0;
        const idx = Math.min(noiseBuf.length - 1, Math.floor(t * this.SR));
        return noiseBuf[idx] * cfg.amp * Math.exp(-t / (cfg.decay || 0.1));
    }

    _click(t) {
        const c = this.p.click;
        if (!c || t >= c.duration) return 0;
        return (Math.random() * 2 - 1) * c.amp * (1 - t / c.duration);
    }

    _bursts(t, sample) {
        if (!this.p.bursts) return sample;
        let burst = 0;
        for (const bt of this.p.bursts) {
            if (t >= bt && t < bt + 0.012) burst = Math.max(burst, 1 - (t - bt) / 0.012);
        }
        return burst > 0 ? sample * 0.2 + (Math.random() * 2 - 1) * burst * 0.95 : sample;
    }
}

// ----------------------------------------------------------------
// 1.6  InstrumentLibrary — basis data GM + Drum
// ----------------------------------------------------------------
class InstrumentLibrary {
    constructor() {
        this.melodic = this._buildMelodic();
        this.drums = this._buildDrums();
    }


    findMelodic(midi) { return this.melodic[midi]; }
    findDrum(note) { return this.drums.find(d => d.note === note); }

    drumToFreq(note) {
        return Math.round(440 * Math.pow(2, (note - 69) / 12));
    }

    _buildMelodic() {
        if (typeof GUS_MELODIC_PRESETS === 'undefined'
            || !GUS_MELODIC_PRESETS
            || typeof GUS_MELODIC_PRESETS !== 'object'
            || Array.isArray(GUS_MELODIC_PRESETS)
            || typeof GUS_MELODIC_PRESETS.gain !== 'number'
            || !Number.isFinite(GUS_MELODIC_PRESETS.gain)
            || GUS_MELODIC_PRESETS.gain < 0
            || !Array.isArray(GUS_MELODIC_PRESETS.instruments)
            || GUS_MELODIC_PRESETS.instruments.length !== 128
            || GUS_MELODIC_PRESETS.instruments.some(instrument =>
                !instrument
                || typeof instrument !== 'object'
                || Array.isArray(instrument)
                || !Number.isInteger(instrument.program)
                || instrument.program < 0
                || instrument.program > 127
                || typeof instrument.family !== 'string'
                || typeof instrument.name !== 'string'
                || !instrument.preset
                || typeof instrument.preset !== 'object'
                || Array.isArray(instrument.preset)
            )) {
            throw new Error("Melodic preset data is unavailable or invalid.");
        }
        this.melodicMasterGain = GUS_MELODIC_PRESETS.gain;
        const programs = new Array(128);
        for (const instrument of GUS_MELODIC_PRESETS.instruments) {
            if (programs[instrument.program]) {
                throw new Error(`Duplicate melodic preset program: ${instrument.program}.`);
            }
            programs[instrument.program] = instrument;
        }
        if (programs.some(instrument => !instrument)) {
            throw new Error("Melodic preset data must define every program from 0 to 127.");
        }
        return programs;
    }

    _buildDrums() {
        if (typeof GUS_DRUM_PRESETS === 'undefined'
            || !GUS_DRUM_PRESETS
            || typeof GUS_DRUM_PRESETS !== 'object'
            || Array.isArray(GUS_DRUM_PRESETS)
            || typeof GUS_DRUM_PRESETS.gain !== 'number'
            || !Number.isFinite(GUS_DRUM_PRESETS.gain)
            || GUS_DRUM_PRESETS.gain < 0
            || !Array.isArray(GUS_DRUM_PRESETS.instruments)
            || GUS_DRUM_PRESETS.instruments.length !== 47
            || GUS_DRUM_PRESETS.instruments.some(instrument =>
                !instrument
                || typeof instrument !== 'object'
                || Array.isArray(instrument)
                || !Number.isInteger(instrument.note)
                || instrument.note < 0
                || instrument.note > 127
                || typeof instrument.name !== 'string'
                || !instrument.preset
                || typeof instrument.preset !== 'object'
                || Array.isArray(instrument.preset)
            )) {
            throw new Error("Drum preset data is unavailable or invalid.");
        }
        this.drumMasterGain = GUS_DRUM_PRESETS.gain;
        const notes = new Set();
        for (const instrument of GUS_DRUM_PRESETS.instruments) {
            if (notes.has(instrument.note)) {
                throw new Error(`Duplicate drum preset note: ${instrument.note}.`);
            }
            notes.add(instrument.note);
        }
        return GUS_DRUM_PRESETS.instruments;
    }
}
