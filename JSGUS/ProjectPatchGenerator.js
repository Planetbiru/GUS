// =================================================================
// Aplikasi ProjectPatchGenerator
// =================================================================

class ProjectPatchGenerator {
  static MODE_16BIT         = 0x01;
  static MODE_UNSIGNED_PCM  = 0x02;
  static MODE_LOOP          = 0x04;
  static MODE_ENVELOPE      = 0x40;

  constructor({sampleRate = 22050, duration = 0.25} = {}) {
    this.sampleRate = sampleRate;
    this.duration = duration;
    this.library = new InstrumentLibrary();
  }

  getPrograms(isDrum) {
    if (isDrum) {
      return this.library.drums.map(([note, name]) => ({id: note, name}));
    }
    return this.library.melodic.map(([, name], id) => ({id, name}));
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
        const [note, drumName, drumPreset] = drum;
        name = drumName;
        preset = drumPreset;
        rendered = new DrumRenderer(preset, this.sampleRate).render();
        rootFreq = this.library.drumToFreq(note);
    } else {
        const instrument = this.library.melodic[id];
        if (!instrument) throw new Error(`Unknown melodic instrument: ${id}.`);
        let [, instrumentName, melodicPreset] = instrument;
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

    const outputGain = (preset && typeof preset.gain === 'number')
        ? Math.max(0, Math.min(1, preset.gain))
        : 1.0;

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
    }

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
        envRates:   rendered.loop ? [9, 0, 0, 69, 0, 0]      : [0, 0, 0, 0, 0, 0],
        envOffsets: rendered.loop ? [255, 255, 255, 0, 0, 0] : [255, 255, 255, 0, 0, 0],
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
    static encode({ name, pcm, loopStart, loopEnd, isLoop, rootFreq, sampleRate }) {
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
        str('Generated by JS oscillators', 60);
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
            u8(9); u8(0); u8(0); u8(69); u8(0); u8(0);                // envRates
            u8(255); u8(255); u8(255); u8(0); u8(0); u8(0);           // envOffsets
        } else {
            u8(0); u8(0); u8(0); u8(0); u8(0); u8(0);
            u8(255); u8(255); u8(255); u8(0); u8(0); u8(0);
        }
        // tremolo (3) + vibrato (3)
        u8(0); u8(0); u8(0);
        u8(0); u8(0); u8(0);

        // modes: 16-bit (0x01) + loop (0x04) + MENV (0x40) untuk loop saja
        u8(0x01 | (isLoop ? 0x04 | 0x40 : 0x00));

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
        const fm        = isLoop ? null : (p.fm || null);
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
// 1.4  DrumFactory — resep preset drum (factory statis)
// ----------------------------------------------------------------
class DrumFactory {
    static kick(o = {}) {
        return {
            duration: o.duration || 0.55,
            membrane: {
                freq: o.fEnd || 55,
                pitchDecay: o.pitchDecay || 0.05,
                decay: o.toneDecay || 0.35,
                modes: [
                    { ratio: 1.0,   amp: 1.0,  decay: 1.0 },
                    { ratio: 1.593, amp: 0.45, decay: 0.55 },
                    { ratio: 2.136, amp: 0.20, decay: 0.35 },
                    { ratio: 2.296, amp: 0.12, decay: 0.25 },
                ],
            },
            click: { duration: 0.006, amp: 0.55 },
            noise: { amp: 0.18, decay: 0.012, type: 'brown' },
            lowpass: o.lowpass || 2500,
        };
    }

    static snare(o = {}) {
        return {
            duration: o.duration || 0.28,
            membrane: {
                freq: o.fEnd || 180,
                pitchDecay: 0.02,
                decay: o.toneDecay || 0.10,
                modes: [
                    { ratio: 1.0,   amp: 0.55, decay: 1.0 },
                    { ratio: 1.83,  amp: 0.45, decay: 0.85 },
                    { ratio: 2.13,  amp: 0.25, decay: 0.55 },
                ],
            },
            noise: {
                amp: 0.95,
                decay: o.noiseDecay || 0.14,
                type: 'pink',
                bandpass: { center: 4200, q: 0.6 },
            },
            highpass: o.highpass || 400,
        };
    }

    static hihat(o = {}) {
        const type = o.type || 'closed';
        const profiles = {
            closed: {
                duration: 0.14,
                noiseLayers: [
                    { amp: .95, decay: .008, type: 'white', bandpass: { center: 8200, q: .48 } },
                    { amp: .68, decay: .024, type: 'pink', bandpass: { center: 6100, q: .52 } },
                    { amp: .38, decay: .032, type: 'white', bandpass: { center: 9300, q: .72 } }
                ],
                highpass: 3600,
                lowpass: 10200
            },
            pedal: {
                duration: 0.16,
                noiseLayers: [
                    { amp: .78, decay: .006, type: 'white', bandpass: { center: 7400, q: .52 } },
                    { amp: .7, decay: .019, type: 'pink', bandpass: { center: 4800, q: .55 } },
                    { amp: .34, decay: .028, type: 'pink', bandpass: { center: 2900, q: .68 } }
                ],
                highpass: 1800,
                lowpass: 9600
            },
            open: {
                duration: 0.62,
                noiseLayers: [
                    { amp: 1, decay: .14, type: 'white', bandpass: { center: 10200, q: .6 } },
                    { amp: .62, decay: .13, type: 'white', bandpass: { center: 9000, q: .65 } },
                    { amp: .18, decay: .11, type: 'pink', bandpass: { center: 4600, q: .65 } }
                ],
                highpass: 3700,
                lowpass: 10200
            }
        };
        const profile = profiles[type] || profiles.closed;
        const duration = o.duration || profile.duration;
        return {
            duration,
            noiseLayers: profile.noiseLayers.map(layer => ({
                ...layer,
                decay: o.decay
                    ? layer.decay * o.decay / (type === 'open' ? .32 : type === 'pedal' ? .035 : .02)
                    : layer.decay
            })),
            highpass: o.highpass || profile.highpass,
            lowpass: profile.lowpass
        };
    }

    static tom(freq, o = {}) {
        return {
            duration: o.duration || 0.55,
            membrane: {
                freq,
                pitchDecay: 0.06,
                decay: o.decay || 0.42,
                modes: [
                    { ratio: 1.0,   amp: 1.0,  decay: 1.0 },
                    { ratio: 1.593, amp: 0.5,  decay: 0.75 },
                    { ratio: 2.136, amp: 0.25, decay: 0.55 },
                    { ratio: 2.296, amp: 0.15, decay: 0.42 },
                ],
            },
            noise: o.noise ? { amp: o.noise, decay: 0.015, type: 'pink' } : null,
            lowpass: freq * 8,
        };
    }

    static cymbal(o = {}) {
        const decay = o.noiseDecay || 0.65;
        return {
            duration: o.duration || 1.4,
            noiseLayers: [
                { amp: 0.9, decay, type: 'white', bandpass: { center: 8500, q: 0.45 } },
                { amp: 0.7, decay: decay * 0.8, type: 'white', bandpass: { center: 6200, q: 0.5 } },
                { amp: 0.45, decay: decay * 0.55, type: 'pink', bandpass: { center: 3900, q: 0.6 } },
                { amp: 0.3, decay: decay * 0.35, type: 'white', bandpass: { center: 10200, q: 0.7 } }
            ],
            highpass: o.highpass || 3000,
        };
    }

    static ride(o = {}) {
        const decay = o.noiseDecay || o.decay || 0.5;
        return {
            duration: o.duration || 1.0,
            noiseLayers: [
                { amp: 0.85, decay: Math.min(0.035, decay * 0.15), type: 'white', bandpass: { center: 9000, q: 0.5 } },
                { amp: 0.7, decay, type: 'white', bandpass: { center: 6500, q: 0.48 } },
                { amp: 0.4, decay: decay * 0.65, type: 'pink', bandpass: { center: 4200, q: 0.6 } }
            ],
            highpass: 2500,
        };
    }

    static bell(freq, o = {}) {
        return {
            duration: o.duration || 0.65,
            metallic: {
                baseFreq: freq,
                partials: [1, 2.76, 5.4, 8.93],
                decay: o.decay || 0.4,
                amp: 0.55,
            },
            highpass: freq * 0.5,
        };
    }

    static clap() {
        return {
            duration: 0.3,
            noise: { amp: 0.85, decay: 0.13, type: 'pink', bandpass: { center: 1400, q: 0.6 } },
            highpass: 900,
            bursts: [0, 0.011, 0.022, 0.033],
        };
    }

    static sideStick() {
        return {
            duration: 0.11,
            noiseLayers: [
                { amp: .95, decay: .005, type: 'white', bandpass: { center: 2600, q: .75 } },
                { amp: .7, decay: .018, type: 'white', bandpass: { center: 1100, q: .7 } },
                { amp: .35, decay: .003, type: 'white', bandpass: { center: 6000, q: .65 } }
            ],
            click: { duration: .0015, amp: .25 },
            highpass: 350,
            lowpass: 8500
        };
    }

    static cowbell() {
        return {
            duration: 0.5,
            tones: [
                { fStart: 800, fEnd: 800, pitchDecay: 1, decay: 0.35, amp: 0.55 },
                { fStart: 540, fEnd: 540, pitchDecay: 1, decay: 0.35, amp: 0.5 },
            ],
            highpass: 400,
        };
    }

    static woodblock(freq) {
        return {
            duration: 0.13,
            tones: [{ fStart: freq, fEnd: freq * 0.9, pitchDecay: 0.01, decay: 0.05, amp: 1.0 }],
            noise: { amp: 0.18, decay: 0.006, type: 'pink' },
            highpass: 300,
        };
    }

    static agogo(freq) {
        return {
            duration: 0.5,
            tones: [
                { fStart: freq, fEnd: freq, pitchDecay: 1, decay: 0.3, amp: 0.6 },
                { fStart: freq * 1.9, fEnd: freq * 1.9, pitchDecay: 1, decay: 0.2, amp: 0.3 },
            ],
            highpass: 500,
        };
    }

    static bongo(freq) {
        return {
            duration: 0.27,
            membrane: {
                freq,
                pitchDecay: 0.03,
                decay: 0.18,
                modes: [
                    { ratio: 1.0,   amp: 1.0, decay: 1.0 },
                    { ratio: 1.593, amp: 0.4, decay: 0.6 },
                ],
            },
            noise: { amp: 0.12, decay: 0.012, type: 'pink' },
            highpass: 200,
        };
    }

    static conga(freq) {
        return {
            duration: 0.42,
            membrane: {
                freq,
                pitchDecay: 0.05,
                decay: 0.28,
                modes: [
                    { ratio: 1.0,   amp: 1.0, decay: 1.0 },
                    { ratio: 1.593, amp: 0.5, decay: 0.7 },
                    { ratio: 2.136, amp: 0.25, decay: 0.4 },
                ],
            },
            noise: { amp: 0.10, decay: 0.012, type: 'pink' },
            lowpass: freq * 6,
        };
    }

    static cabasa() {
        return {
            duration: 0.16,
            noise: { amp: 1.0, decay: 0.06, type: 'pink', bandpass: { center: 7500, q: 0.6 } },
            highpass: 6000,
        };
    }

    static maracas() {
        return {
            duration: 0.13,
            noise: { amp: 1.0, decay: 0.04, type: 'pink', bandpass: { center: 8000, q: 0.6 } },
            highpass: 7000,
        };
    }

    static tambourine() {
        return {
            duration: 0.28,
            metallic: {
                baseFreq: 900,
                partials: [1, 1.83, 2.67, 3.51, 4.35, 5.19],
                decay: 0.14,
                amp: 0.35,
            },
            noise: { amp: 0.9, decay: 0.14, type: 'pink', bandpass: { center: 6000, q: 0.5 } },
            highpass: 5500,
        };
    }

    static whistle(o = {}) {
        return {
            duration: o.duration || 0.3,
            tones: [{ fStart: 2200, fEnd: 2200, pitchDecay: 1, decay: o.duration || 0.3, amp: 1.0 }],
            noise: { amp: 0.05, decay: 0.02, type: 'pink', bandpass: { center: 2200, q: 3 } },
            highpass: 1500,
        };
    }

    static guiro(o = {}) {
        return {
            duration: o.duration || 0.3,
            noise: { amp: 1.0, decay: o.duration || 0.3, type: 'pink', bandpass: { center: 3500, q: 1.5 } },
            highpass: 2500,
        };
    }

    static triangle(o = {}) {
        return {
            duration: o.duration || 0.5,
            metallic: {
                baseFreq: 5200,
                partials: [1, 1.71, 2.94, 4.62],
                decay: o.duration || 0.5,
                amp: 0.55,
            },
            highpass: 3000,
        };
    }

    static vibraslap() {
        return {
            duration: 0.55,
            tones: [{
                fStart: 400, fEnd: 400, pitchDecay: 1, decay: 0.4, amp: 0.5,
                fm: { ratio: 3.7, index: 2 }
            }],
            noise: { amp: 0.4, decay: 0.3, type: 'pink' },
            highpass: 800,
        };
    }

    static cuica(o = {}) {
        return {
            duration: o.duration || 0.25,
            tones: [{
                fStart: 400, fEnd: 700, pitchDecay: 0.15, decay: o.duration || 0.25, amp: 1.0,
                fm: { ratio: 2.3, index: 1 }
            }],
            highpass: 300,
        };
    }

    static clave() {
        return {
            duration: 0.13,
            tones: [
                { fStart: 2400, fEnd: 2000, pitchDecay: 0.005, decay: 0.05, amp: 0.8 },
                { fStart: 3600, fEnd: 3200, pitchDecay: 0.005, decay: 0.04, amp: 0.5 },
            ],
            highpass: 1500,
        };
    }
}

// ----------------------------------------------------------------
// 1.5  DrumRenderer — render preset drum → PCM
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
        this.families = {
            piano:   { harm: [1, .75, .55, .4, .28, .2, .14, .1, .07, .05], env: { a: .002, d: 3.5, s: 0, r: .5 }, length: 66150, freq: 441 },
            epiano:  { harm: [1, .2, .08, .03], fm: { ratio: 3, index: 1.8 }, env: { a: .005, d: 1.2, s: .1, r: .5 }, length: 55125, freq: 441 },
            bell:    { harm: [1, .5, .25, .12, .06], env: { a: .001, d: 1.5, s: 0, r: .6 }, length: 55125, freq: 441 },
            organ:   { harm: [1, 0, .5, 0, .3, 0, .2, 0, .1], env: { a: .02, d: .1, s: 1, r: .1 }, loop: 1, cycles: 12 },
            guitar:  { harm: [1, .7, .5, .35, .2, .12, .08, .05, .03], env: { a: .002, d: .8, s: .1, r: .3 }, length: 44100, freq: 441 },
            bass:    { harm: [1, .7, .5, .3, .2, .1, .05], env: { a: .005, d: .5, s: .2, r: .3 }, length: 33075, freq: 220 },
            strings: { harm: [1, .5, .33, .25, .2, .16, .14, .12], env: { a: .15, d: .2, s: .9, r: .3 }, loop: 1, cycles: 14, vibrato: { rate: 5, depth: .005 }, detune: [0, 8] },
            ensemble:{ 
                harm: [1, .85, .7, .55, .4, .28, .18, .1, .05, .02], // Spektrum lebih padat dan hangat
                env: { a: .3, d: .2, s: .95, r: .4 },                // Attack lebih lambat (swell)
                loop: 1, cycles: 14, 
                vibrato: { rate: 4.5, depth: .004 },
                drive: 1.05,                                         // Sangat sedikit, hanya untuk "lemak" analog
                phases: [0, 0.1, 0.3, 0.6, 0.2, 0.8, 0.4, 0.9, 0.5]  // Phase tersebar (Ensemble effect)
            },
            brass:   { harm: [1, .7, .5, .4, .3, .22, .18, .14, .1], env: { a: .06, d: .1, s: .9, r: .2 }, loop: 1, cycles: 14, vibrato: { rate: 5, depth: .003 } },
            reed:    { harm: [1, .72, .58, .4, .28, .18, .1, .05], env: { a: .05, d: .1, s: .9, r: .2 }, loop: 1, cycles: 14, vibrato: { rate: 5.5, depth: .006 } },
            pipe:    { harm: [1, .15, .4, .05, .15, .03, .08], env: { a: .08, d: .1, s: .9, r: .2 }, loop: 1, cycles: 14, vibrato: { rate: 5, depth: .008 }, noise: .05 },
            lead:    { harm: [1, .5, .33, .25, .2, .16, .14, .12, .1], env: { a: .01, d: .2, s: .85, r: .15 }, loop: 1, cycles: 12 },
            pad:     { harm: [1, .4, .2, .1, .05], env: { a: .3, d: .3, s: .95, r: .5 }, loop: 1, cycles: 16, detune: [-15, 0, 15], vibrato: { rate: 2, depth: .003 } },
            voice:   { harm: [1, .85, .7, .55, .42, .32, .24, .18, .13, .09, .06, .04], env: { a: .12, d: .25, s: .9, r: .35 }, loop: 1, cycles: 14, vibrato: { rate: 5, depth: .006, sweep: 20 } },
            fx:      { harm: [1, .5, .33, .25, .2], fm: { ratio: 1.5, index: 3 }, env: { a: .05, d: .5, s: .5, r: .4 }, length: 44100, noise: .2 },
            ethnic:  { harm: [1, .6, .4, .25, .15, .1, .05], env: { a: .005, d: .7, s: .2, r: .35 }, length: 44100, freq: 441, vibrato: { rate: 5, depth: .01 } },
            perc:    { harm: [1, .4, .2, .1], env: { a: .001, d: .3, s: 0, r: .15 }, length: 22050, freq: 441, noise: .3 },
        };

        this.melodic = this._buildMelodic();
        this.drums = this._buildDrums();
    }


    _piano(o = {}) {
        return {
            inharmonicity: 0.00035,
            attackNoise: { amp: 0.15, duration: 0.015 },   // hammer thump lebih nyata
            brightness: { start: 8000, end: 2000 },        // spectrum meredup natural
            pitchScoop: { depth: 0.003, time: 0.012 },     // pitch drop halus di onset
            partialDecay: [4.5, 3.0, 2.0, 1.4, 1.0, 0.75, 0.55, 0.4, 0.3, 0.22],
            ...o
        };
    }
    _guitar(o = {}) {
        return {
            attackNoise: { amp: 0.12, duration: 0.012 },
            brightness: { start: 7000, end: 1200 },
            partialDecay: [3.0, 2.2, 1.6, 1.2, 0.9, 0.7, 0.5, 0.4, 0.3],
            formants: [
                { freq: 100,  q: 1.5, gain: 4 },  // Resonansi rongga udara (Helmholtz)
                { freq: 220,  q: 2.0, gain: 5 },  // Getaran soundboard (papan kayu)
                { freq: 450,  q: 2.5, gain: 4 },  // Resonansi badan gitar
                { freq: 1200, q: 3.0, gain: 2 },  // Resonansi jembatan (bridge)
            ],
            ...o
        };
    }
    _bass(o = {}) {
        return {
            attackNoise: { amp: 0.07, duration: 0.008 },
            brightness: { start: 5000, end: 900 },
            ...o
        };
    }
    _wind(o = {}) {  // brass, reed, pipe — semua punya tiupan & scoop
        return {
            attackNoise: { amp: 0.08, duration: 0.018 },
            pitchScoop: { depth: 0.02, time: 0.03 },
            vibratoOnset: 0.18,
            brightness: { start: 7000, end: 2500 },
            ...o,
        }
    }
    _reed(o = {}) {
        // Reed instruments: sax, oboe, english horn, bassoon.
        // - Formant bell: karakter nasal khas double/single reed.
        // - Drive: saturasi reed ringan (analog "buzz" tanpa harsh).
        // - vibratoOnset: hanya berlaku untuk non-loop (saat ini semua reed loop).
        return {
            vibratoOnset: 0.20,
            drive: 1.5,
            formants: [
                { freq:  900, q: 1.5, gain: 4 },
                { freq: 1800, q: 2.0, gain: 3 },
                { freq: 3200, q: 2.5, gain: 1.5 },
            ],
            ...o
        };
    }
    _voice(o = {}) {
        // Human voice (choir aahs, voice oohs, solo voice).
        //
        // KUNCI REALISME: profil fase glottal.
        // Pita suara manusia menghasilkan pulse asimetris (buka pelan,
        // tutup cepat). Dalam domain harmonik, ini setara dengan fase
        // yang naik secara kuadratik terhadap orde harmonik.
        //
        // Profil fase kuadratik φ(k) ≈ -c·k² menghasilkan "pulse spread":
        // puncak gelombang di waktu-domain melebar, sehingga terdengar
        // seperti "aaah" yang bernafas, bukan beep sintetis.
        const numHarm = (o.harm || [1]).length;
        const phaseScale = (typeof o.phaseScale === 'number') ? o.phaseScale : 0.012;
        const defaultPhases = new Array(numHarm);
        for (let k = 1; k <= numHarm; k++) {
            defaultPhases[k - 1] = -phaseScale * k * k;
        }
        return {
            drive: 1.5,
            vibratoOnset: 0.20,
            phases: defaultPhases,
            formants: [
                { freq:  730, q: 3.0, gain: 6 },   // F1 (default: "ah")
                { freq: 1090, q: 3.5, gain: 5 },   // F2
                { freq: 2440, q: 4.0, gain: 3 },   // F3
                { freq: 3400, q: 4.5, gain: 2 },   // F4 (singer's formant)
            ],
            ...o
        };
    }
    _strings(o = {}) {
        return {
            vibratoOnset: 0.20,
            drive: 1.15, // Menggantikan attackNoise (karena loop tidak bisa pakai attackNoise)
            formants: [
                { freq: 250, q: 1.5, gain: 4 },   // Resonansi badan kayu
                { freq: 450, q: 2.0, gain: 5 },   // Resonansi utama
                { freq: 1100, q: 2.5, gain: 4 },  // Resonansi jembatan
                { freq: 2800, q: 3.0, gain: 3 },  // Kecerahan senar
                { freq: 4500, q: 3.5, gain: 1.5 } // Gesekan busur (rosin)
            ],
            ...o
        };
    }
    _bell(o = {}) {
        return {
            inharmonicity: 0.008,
            partialDecay: [3.0, 2.0, 1.4, 1.0, 0.7, 0.5],
            ...o
        };
    }

    preset(fam, over = {}) {
        return { ...this.families[fam], ...over };
    }

    findMelodic(midi) { return this.melodic[midi]; }
    findDrum(note) { return this.drums.find(d => d[0] === note); }

    drumToFreq(note) {
        return Math.round(440 * Math.pow(2, (note - 69) / 12));
    }

    _buildMelodic() {
        const P = (fam, over) => {
            let base = this.preset(fam, over);
            // Terapkan extras otomatis berdasarkan family
            switch (fam) {
                case 'piano':  base = this._piano(base);  break;
                case 'bell':   base = this._bell(base);   break;
                case 'guitar': base = this._guitar(base); break;
                case 'bass':   base = this._bass(base);   break;
                case 'strings':
                case 'ensemble': base = this._strings(base); break;
                case 'brass':
                case 'pipe':   base = this._wind(base);   break;
                case 'reed':   base = this._reed(base);   break;
                case 'voice':  base = this._voice(base);  break;
                case 'lead':   base = { ...base, drive: 1.4, brightness: { start: 8000, end: 2500 } }; break;
                case 'pad':    base = this._strings(base); break;
            }
            return base;
        };
        return [
            // 0-7 Piano
            ['Piano', 'Acoustic Grand', P('piano', {
                length: 44100,
                env: { a: .002, d: 1.8, s: 0, r: .25 },
                partialDecay: [2.6, 1.7, 1.15, .82, .6, .44, .32, .24, .18, .14],
                gain: 1.0
            })],
            ['Piano', 'Bright Piano', P('piano', {
                length: 44100,           // 2 detik — decay natural
                harm: [1, .85, .7, .55, .42, .3, .2, .13, .08, .05],
                gain: 2.0
            })],
            ['Piano', 'Electric Grand', P('epiano')],
            ['Piano', 'Honky-tonk', P('piano', { harm: [1, .7, .5, .4, .3, .2, .12, .08, .05], detune: [0, -10] })],
            ['Piano', 'E.Piano 1', P('epiano')],
            ['Piano', 'E.Piano 2', P('epiano', { fm: { ratio: 2, index: 2.5 } })],
            ['Piano', 'Harpsichord', P('piano', { harm: [1, .5, .7, .3, .4, .2, .25, .1], env: { a: .001, d: .5, s: .05, r: .2 } })],
            ['Piano', 'Clavinet', P('piano', { harm: [1, .4, .6, .3, .4, .2], env: { a: .002, d: .4, s: .1, r: .2 } })],

            // 8-15 Chromatic Perc
            ['Chromatic', 'Celesta', P('bell', { harm: [1, 0, .5, 0, .25, 0, .12] })],
            ['Chromatic', 'Glockenspiel', P('bell', { harm: [1, 0, .3, 0, .1, 0, .03] })],
            ['Chromatic', 'Music Box', P('bell', { harm: [1, .3, .1, .03] })],
            ['Chromatic', 'Vibraphone', P('bell', { vibrato: { rate: 5, depth: .02 }, env: { a: .01, d: 1.2, s: .1, r: .5 } })],
            ['Chromatic', 'Marimba', P('bell', { harm: [1, .4, .15, .05], env: { a: .001, d: .5, s: 0, r: .2 } })],
            ['Chromatic', 'Xylophone', P('bell', { harm: [1, .2, .05], env: { a: .001, d: .3, s: 0, r: .1 } })],
            ['Chromatic', 'Tubular Bells', P('bell', { harm: [1, .5, .25, .15, .08, .04], env: { a: .005, d: 2, s: 0, r: .8 } })],
            ['Chromatic', 'Dulcimer', P('piano', { harm: [1, .5, .3, .2, .12, .08], env: { a: .002, d: .9, s: .05, r: .3 } })],

            // 16-23 Organ
            ['Organ', 'Drawbar Organ', P('organ')],
            ['Organ', 'Percussive Organ', P('organ', { harm: [1, 0, .7, 0, .5, 0, .3, 0, .2, 0, .1] })],
            ['Organ', 'Rock Organ', P('organ', { harm: [1, 0, .5, 0, .4, 0, .3, 0, .25, 0, .2] })],
            ['Organ', 'Church Organ', P('organ', { harm: [1, .7, .5, .35, .25, .2, .15, .12, .1] })],
            ['Organ', 'Reed Organ', P('reed')],
            ['Organ', 'Accordion', P('reed', { harm: [1, .5, .3, .2, .15, .1, .08] })],
            ['Organ', 'Harmonica', P('reed', { harm: [1, .4, .6, .3, .4, .2, .15] })],
            ['Organ', 'Tango Accordion', P('reed')],

            // 24-31 Guitar
            ['Guitar', 'Nylon Guitar', P('guitar', {
                // Soft finger pluck, warm body resonance, and quick upper-partial decay.
                harm: [1, .8, .6, .4, .25, .15, .08, .04, .02],
                pluckPosition: .16,
                pluckTransient: { freq: 1700, q: .8, amp: .035, duration: .024, decay: .011 },
                inharmonicity: .00004,
                partialDecay: [3.2, 1.9, 1.15, .78, .52, .36, .25, .18, .13],
                formants: [
                    { freq: 105, q: 1.2, gain: 3 },
                    { freq: 210, q: 1.8, gain: 5 },
                    { freq: 390, q: 2.1, gain: 4 },
                    { freq: 850, q: 1.6, gain: 2 },
                    { freq: 2300, q: 1.3, gain: -2 }
                ],
                pitchScoop: { depth: .0012, time: .014 },
                env: { a: .002, d: 1.5, s: 0, r: .5 },
                length: 66150,
                gain: 0.9,
                attackNoise: { amp: 0.055, duration: .018 }
            })],
            
            ['Guitar', 'Steel Guitar', P('guitar', {
                // Brighter pick attack, a different pluck point, and a more metallic string decay.
                harm: [1, .9, .8, .7, .55, .4, .3, .2, .15, .1, .05],
                pluckPosition: .105,
                pluckTransient: { freq: 3400, q: 1.1, amp: .065, duration: .016, decay: .006 },
                inharmonicity: .00012,
                partialDecay: [2.8, 1.9, 1.35, 1.0, .74, .55, .4, .3, .23, .17, .12],
                formants: [
                    { freq: 115, q: 1.2, gain: 2 },
                    { freq: 230, q: 1.8, gain: 4 },
                    { freq: 520, q: 2.2, gain: 4 },
                    { freq: 1150, q: 1.7, gain: 3 },
                    { freq: 2900, q: 1.2, gain: 2 },
                    { freq: 4800, q: 1.0, gain: -1 }
                ],
                pitchScoop: { depth: .0022, time: .009 },
                env: { a: .001, d: 1.2, s: 0, r: .4 },
                length: 66150,
                gain: 0.85,
                attackNoise: { amp: .09, duration: .009 }
            })],
            ['Guitar', 'Jazz Guitar', P('guitar', { harm: [1, .5, .3, .2, .1], loop: 1, cycles: 14, loopSkip: 2 })],
            ['Guitar', 'Clean Guitar', P('guitar', { harm: [1, .6, .4, .25, .15, .08], loop: 1, cycles: 14, loopSkip: 2 })],

            ['Guitar', 'Muted Guitar', P('guitar', { env: { a: .001, d: .2, s: .05, r: .1 } })],
            
            ['Guitar', 'Overdriven Gtr', P('guitar', {
                harm: [1, .86, .72, .6, .49, .39, .31, .24, .18, .13, .09, .06, .04],
                guitarAmp: { drive: 2.1, bias: .035, mix: .82, preampCutoff: 95, cabinetCutoff: 5200 },
                formants: [
                    { freq: 150, q: .8, gain: 2 },
                    { freq: 720, q: 1.1, gain: 3 },
                    { freq: 1700, q: 1.4, gain: 2 },
                    { freq: 3400, q: 1.1, gain: -2 }
                ],
                loop: 1, cycles: 18, loopSkip: 10,
                loopAttackNoise: { amp: .12, duration: .02 },
                vibrato: { rate: 5.2, depth: .004, sweep: 12 }
            })],
            ['Guitar', 'Distortion Gtr', P('guitar', {
                harm: [1, .92, .82, .72, .62, .53, .44, .36, .29, .23, .18, .14, .1, .07, .05],
                guitarAmp: { drive: 3.4, bias: .02, mix: .94, preampCutoff: 115, cabinetCutoff: 4600 },
                formants: [
                    { freq: 180, q: .9, gain: 2 },
                    { freq: 520, q: 1.1, gain: 3 },
                    { freq: 1350, q: 1.3, gain: 3 },
                    { freq: 2500, q: 1.4, gain: 2 },
                    { freq: 3800, q: 1.2, gain: -3 }
                ],
                loop: 1, cycles: 20, loopSkip: 10,
                loopAttackNoise: { amp: .08, duration: .018 },
                vibrato: { rate: 5.5, depth: .003, sweep: 10 }
            })],
            
            ['Guitar', 'Gtr Harmonics', P('guitar', { harm: [1, 0, 0, 0, .3, 0, 0, 0, .1] })],

            // 32-39 Bass
            // 32-39 Bass — semua sustain-loop
            ['Bass', 'Acoustic Bass',  P('bass', { loop: 1, cycles: 14, loopSkip: 2 })],
            ['Bass', 'Finger Bass',    P('bass', { loop: 1, cycles: 14, loopSkip: 2 })],
            ['Bass', 'Pick Bass',      P('bass', { harm: [1, .6, .4, .3, .2, .15, .1], loop: 1, cycles: 14, loopSkip: 2 })],
            ['Bass', 'Fretless Bass',  P('bass', { vibrato: { rate: 5, depth: .01 }, loop: 1, cycles: 14, loopSkip: 2 })],
            ['Bass', 'Slap Bass 1',    P('bass', { harm: [1, .8, .6, .45, .35, .25, .2, .15], loop: 1, cycles: 14, loopSkip: 2 })],
            ['Bass', 'Slap Bass 2',    P('bass', { harm: [1, .7, .5, .4, .3, .22, .18], noise: .05, loop: 1, cycles: 14, loopSkip: 2 })],
            ['Bass', 'Synth Bass 1',   P('bass', { harm: [1, .7, .5, .4, .3, .2], loop: 1, cycles: 14, loopSkip: 2, gain: .60 })],
            ['Bass', 'Synth Bass 2',   P('bass', { detune: [-5, 5], harm: [1, .5, .3, .2], loop: 1, cycles: 14, loopSkip: 2, gain: .60 })],

            // 40-47 Strings
            ['Strings', 'Violin', P('strings', {
                harm: [1, .85, .7, .55, .4, .3, .22, .15, .1, .06], // Spektrum kaya & tajam
                noise: 0.03,           // Simulasi gesekan busur (rosin)
                phases: [0, 0.2, 0.5, 0.8, 0.1, 0.4, 0.7, 0.9, 0.3, 0.6], // Sebaran fase agar tidak kaku
                vibrato: { rate: 6, depth: .008, sweep: 15 },
                formants: [
                    { freq: 300, q: 1.5, gain: 4 },   // Resonansi badan kayu
                    { freq: 550, q: 2.0, gain: 5 },   // Resonansi utama
                    { freq: 1400, q: 2.5, gain: 4 },  // Resonansi jembatan
                    { freq: 3500, q: 3.0, gain: 3 },  // Kecerahan senar
                    { freq: 5500, q: 3.5, gain: 2 }   // Desis busur
                ],
                gain: 0.75 // Sedikit diturunkan karena spektrum lebih padat
            })],

            ['Strings', 'Viola', P('strings', {
                harm: [1, .75, .6, .45, .35, .25, .18, .12, .08, .04], // Sedikit lebih gelap dari biola
                noise: 0.02,           // Gesekan busur (lebih halus)
                phases: [0, 0.3, 0.6, 0.2, 0.7, 0.1, 0.5, 0.9, 0.4, 0.8],
                vibrato: { rate: 5.5, depth: .007, sweep: 15 },
                formants: [
                    { freq: 250, q: 1.5, gain: 5 },   // Body kayu lebih tebal
                    { freq: 450, q: 2.0, gain: 6 },   // Resonansi utama hangat
                    { freq: 1200, q: 2.5, gain: 4 },  // Jembatan
                    { freq: 3000, q: 3.0, gain: 2.5 },
                    { freq: 4500, q: 3.5, gain: 1.5 }
                ],
                gain: 0.8
            })],
            ['Strings', 'Cello', P('strings', { vibrato: { rate: 5.5, depth: .006, sweep: 15 }, harm: [1, .5, .3, .2, .14, .1, .07, .05] })],
            ['Strings', 'Contrabass', P('strings', { vibrato: { rate: 5, depth: .005, sweep: 15 }, freq: 220, harm: [1, .6, .4, .3, .2, .15] })],
            ['Strings', 'Tremolo Str', P('strings', { vibrato: { rate: 12, depth: .02, sweep: 15 } })],
            ['Strings', 'Pizzicato', P('guitar', { env: { a: .001, d: .3, s: 0, r: .1 }, length: 4410, detune: [-8, 8] })],
            ['Strings', 'Harp', P('guitar', { env: { a: .002, d: 1.5, s: .05, r: .6 } })],
            ['Strings', 'Timpani', P('perc', { harm: [1, .7, .4, .2], env: { a: .002, d: .7, s: 0, r: .3 }, length: 6615, noise: .1 })],

            // 48-55 Ensemble
            ['Ensemble', 'Strings 1', P('ensemble', {
                gain: 0.6,
                harm: [1, .7, .5, .4, .3, .22, .18, .14, .1], // Lebih cerah (Biola)
                formants: [
                    { freq: 280, q: 1.5, gain: 4 },
                    { freq: 500, q: 2.0, gain: 5 },
                    { freq: 1200, q: 2.5, gain: 4 },
                    { freq: 3000, q: 3.0, gain: 3 },
                    { freq: 5000, q: 3.5, gain: 2 }
                ]
            })],

            ['Ensemble', 'Strings 2', P('ensemble', {
                gain: 0.6,
                harm: [1, .6, .45, .35, .25, .18, .12, .08], // Lebih gelap (Viola/Cello)
                formants: [
                    { freq: 220, q: 1.5, gain: 5 },
                    { freq: 400, q: 2.0, gain: 6 },
                    { freq: 900, q: 2.5, gain: 4 },
                    { freq: 2500, q: 3.0, gain: 2 },
                    { freq: 4000, q: 3.5, gain: 1 }
                ]
            })],
            ['Ensemble', 'SynthStrings 1', P('pad', {
                harm: [1, .62, .42, .28, .18, .11, .065, .035, .018],
                phases: [0, .06, .16, .29, .45, .64, .85, .09, .35],
                detune: [0],
                loopSkip: 20,
                cycles: 34,
                loopAttack: .025,
                loopAttackNoise: { amp: .018, duration: .02 },
                noise: 0,
                drive: 1.08,
                formants: [
                    { freq: 420, q: 1.1, gain: 1.5 },
                    { freq: 1250, q: 1.4, gain: 2 },
                    { freq: 3200, q: 1.8, gain: 1.5 }
                ],
                vibrato: { rate: 4.8, depth: .003, sweep: 24 }
            })],
            ['Ensemble', 'SynthStrings 2', P('pad', {
                harm: [1, .78, .58, .42, .3, .21, .14, .09, .055, .03],
                phases: [0, .1, .24, .42, .63, .87, .14, .43, .76, .12],
                detune: [0],
                loopSkip: 24,
                cycles: 38,
                loopAttack: .04,
                loopAttackNoise: { amp: .012, duration: .03 },
                noise: 0,
                drive: 1.04,
                formants: [
                    { freq: 300, q: 1, gain: 2 },
                    { freq: 850, q: 1.3, gain: 2.5 },
                    { freq: 2100, q: 1.7, gain: 1.5 }
                ],
                vibrato: { rate: 4.2, depth: .004, sweep: 30 }
            })],
            
            ['Ensemble', 'Choir Aahs', P('voice', {
                harm: [1, .85, .7, .55, .42, .3, .22, .16, .11, .07, .04],
                drive: 1.3,
                noise: 0.04,
                phaseScale: 0.012,           // glottal pulse — sedikit lebih "terbuka"
                formants: [
                    { freq:  700, q: 2.5, gain: 7 },   // F1 "ah" — jaw terbuka
                    { freq: 1150, q: 3.0, gain: 5 },   // F2 "ah"
                    { freq: 2500, q: 3.5, gain: 3 },   // F3 — warna vowel
                    { freq: 3500, q: 4.0, gain: 2 },   // F4 singer's formant
                ],
                vibrato: { rate: 4.5, depth: .005, sweep: 25 },
                gain: 0.8
            })],

            ['Ensemble', 'Voice Oohs', P('voice', {
                harm: [1, .9, .75, .6, .45, .32, .22, .14, .09, .05],
                drive: 1.5,
                noise: 0.02,
                phaseScale: 0.015,           // sedikit lebih "tertutup" — pulse lebih sempit
                formants: [
                    { freq:  320, q: 2.5, gain: 8 },   // F1 "oo" — sangat rendah
                    { freq:  850, q: 3.0, gain: 7 },   // F2 "oo" — rendah
                    { freq: 2300, q: 3.5, gain: 4 },   // F3
                    { freq: 3200, q: 4.0, gain: 2 },   // F4
                ],
                vibrato: { rate: 5, depth: .007, sweep: 15 },
                gain: 0.85
            })],

            ['Ensemble', 'Synth Voice', P('voice', {
                harm: [1, .8, .65, .5, .4, .3, .22, .16, .12, .09, .07, .05],
                drive: 1.8,
                noise: 0.02,
                phaseScale: 0.010,           // lebih dekat ke synth — pulse lebih tajam
                formants: [
                    { freq:  600, q: 2.0, gain: 4 },
                    { freq: 1050, q: 2.5, gain: 3.5 },
                    { freq: 2500, q: 3.0, gain: 2.5 },
                    { freq: 4000, q: 3.5, gain: 1.5 }, // top lebih terang → digital
                ],
                vibrato: { rate: 5.5, depth: .008, sweep: 15 },
                gain: 0.85
            })],  

            ['Ensemble', 'Orchestra Hit', P('brass', { env: { a: .001, d: .4, s: 0, r: .2 }, length: 4410, loop: false, harm: [1, .7, .5, .4, .3, .25, .2, .15] })],

            // 56-63 Brass
            ['Brass', 'Trumpet', P('brass', {
                harm: [1, .78, .65, .52, .4, .31, .23, .17, .12, .08],
                loopSkip: 12,
                cycles: 24,
                loopAttack: .01,
                loopAttackNoise: { amp: .045, duration: .012 },
                noise: 0,
                drive: 1.15,
                formants: [
                    { freq: 1400, q: 1.2, gain: 2.5 },
                    { freq: 2800, q: 1.8, gain: 3 },
                    { freq: 4200, q: 2.2, gain: 1.5 }
                ],
                vibrato: { rate: 5.2, depth: .004, sweep: 22 }
            })],
            ['Brass', 'Trombone', P('brass', {
                harm: [1, .72, .55, .4, .29, .2, .13, .08, .045],
                loopSkip: 16,
                cycles: 26,
                loopAttack: .018,
                loopAttackNoise: { amp: .035, duration: .016 },
                noise: 0,
                drive: 1.08,
                formants: [
                    { freq: 550, q: 1.1, gain: 2 },
                    { freq: 1150, q: 1.5, gain: 2.5 },
                    { freq: 2400, q: 2, gain: 1 }
                ],
                vibrato: { rate: 4.8, depth: .003, sweep: 24 }
            })],
            ['Brass', 'Tuba', P('brass', {
                freq: 220,
                harm: [1, .62, .38, .23, .14, .08, .045, .025],
                loopSkip: 10,
                cycles: 28,
                loopAttack: .025,
                loopAttackNoise: { amp: .025, duration: .02 },
                noise: 0,
                drive: 1.05,
                formants: [
                    { freq: 320, q: 1, gain: 2.5 },
                    { freq: 700, q: 1.2, gain: 2 },
                    { freq: 1400, q: 1.8, gain: 1 }
                ],
                vibrato: { rate: 4.2, depth: .0025, sweep: 28 }
            })],
            ['Brass', 'Muted Trpt', P('brass', {
                harm: [1, .42, .62, .3, .48, .25, .34, .18, .22],
                loopSkip: 12,
                cycles: 24,
                loopAttack: .007,
                loopAttackNoise: { amp: .06, duration: .009 },
                noise: 0,
                drive: 1.2,
                formants: [
                    { freq: 1700, q: 1.6, gain: 2.5 },
                    { freq: 3100, q: 2, gain: 3 },
                    { freq: 4600, q: 2.3, gain: 1.5 }
                ],
                vibrato: { rate: 5.5, depth: .004, sweep: 20 }
            })],
            ['Brass', 'French Horn', P('brass', {
                harm: [1, .68, .43, .28, .18, .11, .065, .035],
                loopSkip: 18,
                cycles: 28,
                loopAttack: .022,
                loopAttackNoise: { amp: .02, duration: .018 },
                noise: 0,
                drive: 1.04,
                formants: [
                    { freq: 500, q: 1, gain: 2 },
                    { freq: 950, q: 1.3, gain: 2.5 },
                    { freq: 1900, q: 1.8, gain: 1 }
                ],
                vibrato: { rate: 4.8, depth: .003, sweep: 26 }
            })],
            ['Brass', 'Brass Section', P('brass', {
                harm: [1, .82, .66, .5, .37, .27, .19, .13, .085, .05],
                phases: [0, .08, .19, .32, .47, .63, .8, .98, .17, .4],
                loopSkip: 16,
                cycles: 26,
                loopAttack: .02,
                loopAttackNoise: { amp: .045, duration: .018 },
                noise: 0,
                drive: 1.12,
                formants: [
                    { freq: 750, q: 1, gain: 1.5 },
                    { freq: 1550, q: 1.3, gain: 2 },
                    { freq: 3000, q: 1.8, gain: 1.5 }
                ],
                vibrato: { rate: 5, depth: .0035, sweep: 24 }
            })],
            ['Brass', 'SynthBrass 1', P('brass', {
                harm: [1, .65, .55, .3, .18, .1, .05, .025],
                drive: 1.7,
                formants: [
                    { freq:  900, q: 1.5, gain: 4 },
                    { freq: 2200, q: 2.0, gain: 3 },
                    { freq: 3800, q: 2.5, gain: 1.5 },
                ],
                vibrato: { rate: 5, depth: .003, sweep: 15 },
                gain: 0.5,
            })],

            ['Brass', 'SynthBrass 2', P('brass', {
                harm: [1, .55, .4, .2, .1, .05, .025],
                drive: 1.4,
                formants: [
                    { freq:  700, q: 1.5, gain: 3 },
                    { freq: 1800, q: 2.0, gain: 2.5 },
                ],
                vibrato: { rate: 5.5, depth: .004, sweep: 15 },
                gain: 0.5,
            })],

            // 64-71 Reed
            ['Reed', 'Soprano Sax', P('reed', {
                harm: [1, .6, .65, .45, .35, .25, .15, .08],   // lebih cerah, tipis
                drive: 1.3,
                formants: [
                    { freq: 1100, q: 1.5, gain: 5 },           // bell lebih tinggi
                    { freq: 2000, q: 2.0, gain: 4 },
                    { freq: 3800, q: 2.5, gain: 2 },
                ],
                vibrato: { rate: 5.5, depth: .008, sweep: 15 },
                gain: 0.85
            })],
            ['Reed', 'Alto Sax', P('reed', {
                harm: [1, .72, .58, .4, .28, .18, .1, .05],    // referensi alto
                drive: 1.6,
                formants: [
                    { freq:  900, q: 1.5, gain: 5 },
                    { freq: 1600, q: 2.0, gain: 4 },
                    { freq: 3200, q: 2.5, gain: 2 },
                ],
                vibrato: { rate: 5, depth: .008, sweep: 15 },
                gain: 0.85
            })],
            ['Reed', 'Tenor Sax', P('reed', {
                harm: [1, .78, .55, .38, .25, .15, .09, .04],  // full low-mid, top lebih tipis
                drive: 1.8,
                formants: [
                    { freq:  800, q: 1.5, gain: 5 },           // formant lebih hangat
                    { freq: 1400, q: 2.0, gain: 4 },
                    { freq: 2800, q: 2.5, gain: 2 },
                ],
                vibrato: { rate: 4.5, depth: .007, sweep: 15 },
                gain: 0.85
            })],
            ['Reed', 'Bari Sax', P('reed', {
                freq: 300,                                     // fundamental lebih rendah
                harm: [1, .8, .5, .32, .2, .12, .06, .03],     // rolloff lebih cepat, gelap
                drive: 2.0,
                formants: [
                    { freq:  650, q: 1.5, gain: 5 },
                    { freq: 1200, q: 2.0, gain: 4 },
                    { freq: 2400, q: 2.5, gain: 2 },
                ],
                vibrato: { rate: 4, depth: .006, sweep: 15 },
                gain: 0.85
            })],
            ['Reed', 'Oboe', P('reed', {
                harm: [.85, 1, .8, .65, .45, .28, .15, .08],   // nasal, 2nd & 3rd paling kuat
                drive: 1.4,
                formants: [
                    { freq: 1500, q: 1.8, gain: 6 },           // peak nasal khas oboe
                    { freq: 3000, q: 2.0, gain: 4 },
                    { freq: 4500, q: 2.5, gain: 2 },
                ],
                vibrato: { rate: 5.5, depth: .007, sweep: 15 }
            })],
            ['Reed', 'English Horn', P('reed', {
                harm: [1, .8, .6, .45, .3, .18, .1],
                drive: 1.5,
                formants: [
                    { freq: 1100, q: 1.5, gain: 5 },
                    { freq: 2200, q: 2.0, gain: 3 },
                ],
                vibrato: { rate: 5, depth: .006, sweep: 15 }
            })],
            ['Reed', 'Bassoon', P('reed', {
                freq: 220,
                harm: [1, .7, .5, .35, .22, .12, .06],
                drive: 1.8,
                formants: [
                    { freq: 500, q: 1.5, gain: 4 },
                    { freq: 1200, q: 2.0, gain: 3 },
                ],
                vibrato: { rate: 4, depth: .004, sweep: 15 }
            })],
            ['Reed', 'Clarinet', P('pipe', { harm: [1, 0, .5, 0, .3, 0, .15, 0, .08], vibrato: { rate: 5, depth: .005, sweep: 15 } })],

            // 72-79 Pipe
            ['Pipe', 'Piccolo', P('pipe', { freq: 880, vibrato: { rate: 6, depth: .01, sweep: 15 } })],
            ['Pipe', 'Flute', P('pipe', {
                freq: 880,
                harm: [1, .28, .1, .04, .018, .008, .003],
                loopSkip: 16,
                cycles: 28,
                loopAttack: .012,
                loopAttackNoise: { amp: .035, duration: .012 },
                noise: 0,
                vibrato: { rate: 5.2, depth: .004, sweep: 20 }
            })],
            ['Pipe', 'Recorder', P('pipe', {
                freq: 880,
                harm: [1, .34, .18, .12, .07, .035, .018],
                loopSkip: 14,
                cycles: 26,
                loopAttack: .01,
                loopAttackNoise: { amp: .025, duration: .01 },
                noise: 0,
                vibrato: { rate: 4.8, depth: .002, sweep: 18 }
            })],
            ['Pipe', 'Pan Flute', P('pipe', {
                freq: 880,
                harm: [1, .4, .22, .11, .06, .03, .015],
                loopSkip: 16,
                cycles: 28,
                loopAttack: .018,
                loopAttackNoise: { amp: .07, duration: .018 },
                noise: 0,
                vibrato: { rate: 5.5, depth: .003, sweep: 22 }
            })],
            ['Pipe', 'Blown Bottle', P('pipe', { noise: .15, harm: [1, .1, .05, .02] })],
            ['Pipe', 'Shakuhachi', P('pipe', { freq: 660, noise: .1, vibrato: { rate: 5, depth: .02, sweep: 15 } })],
            ['Pipe', 'Whistle', P('pipe', { freq: 880, harm: [1, .05, .02] })],
            ['Pipe', 'Ocarina', P('pipe', { harm: [1, .15, .08, .03] })],

            // 80-87 Synth Lead
            ['Lead', 'Lead (square)', P('lead', { harm: [1, 0, .33, 0, .2, 0, .14, 0, .11, 0, .09] })],
            ['Lead', 'Lead (saw)', P('lead')],
            ['Lead', 'Lead (calliope)', P('lead', { harm: [1, .5, .33, .25, .2, .16, .14, .12, .1, .09, .08] })],
            ['Lead', 'Lead (chiff)', P('lead', { noise: .1, env: { a: .02, d: .1, s: .9, r: .15 } })],
            ['Lead', 'Lead (charang)', P('lead', { harm: [1, .8, .6, .5, .4, .35, .3, .25] })],
            ['Lead', 'Lead (voice)', P('lead', { vibrato: { rate: 6, depth: .015, sweep: 15 }, harm: [1, .3, .15, .08] })],
            ['Lead', 'Lead (fifths)', P('lead', { harm: [1, 0, .6, 0, .4, 0, .25] })],
            ['Lead', 'Lead (bass+ld)', P('lead', { harm: [1, 1, .5, .5, .33, .33, .25, .25] })],

            // 88-95 Pad
            ['Pad', 'Pad (new age)', P('pad')],
            ['Pad', 'Pad (warm)', P('pad', { harm: [1, .3, .15, .08, .04] })],
            ['Pad', 'Pad (polysynth)', P('pad', { harm: [1, .5, .33, .25, .2, .16], detune: [-8, 0, 8] })],
            ['Pad', 'Pad (choir)', P('pad', { vibrato: { rate: 5, depth: .015, sweep: 15 } })],
            ['Pad', 'Pad (bowed)', P('pad', { harm: [1, .4, .2, .1, .05] })],
            ['Pad', 'Pad (metallic)', P('pad', { fm: { ratio: 2.5, index: 1 } })],
            ['Pad', 'Pad (halo)', P('pad', { harm: [1, .2, .4, .1, .2, .05] })],
            ['Pad', 'Pad (sweep)', P('pad', { noise: .05, fm: { ratio: 1, index: 2 } })],

            // 96-103 FX
            ['FX', 'FX (rain)', P('fx', { noise: .3 })],
            ['FX', 'FX (soundtrack)', P('fx')],
            ['FX', 'FX (crystal)', P('fx', { fm: { ratio: 3, index: 3 } })],
            ['FX', 'FX (atmosphere)', P('fx', { noise: .4 })],
            ['FX', 'FX (brightness)', P('fx', { fm: { ratio: 4, index: 2 } })],
            ['FX', 'FX (goblins)', P('fx', { fm: { ratio: .5, index: 4 } })],
            ['FX', 'FX (echoes)', P('fx', { fm: { ratio: 2.1, index: 2.5 } })],
            ['FX', 'FX (sci-fi)', P('fx', { fm: { ratio: 1.7, index: 3.5 } })],

            // 104-111 Ethnic
            ['Ethnic', 'Sitar', P('ethnic', { harm: [1, .5, .3, .7, .3, .4, .2, .25, .1] })],
            ['Ethnic', 'Banjo', P('guitar', { harm: [1, .6, .4, .25, .15, .1, .06], env: { a: .001, d: .4, s: .05, r: .2 } })],
            ['Ethnic', 'Shamisen', P('ethnic', { env: { a: .001, d: .4, s: 0, r: .15 } })],
            ['Ethnic', 'Koto', P('ethnic', { env: { a: .002, d: .6, s: .1, r: .3 } })],
            ['Ethnic', 'Kalimba', P('bell', { harm: [1, .3, .1], env: { a: .001, d: .4, s: 0, r: .15 } })],
            ['Ethnic', 'Bagpipe', P('pipe', { harm: [1, .5, .8, .3, .4, .2, .2], vibrato: { rate: 6, depth: .02, sweep: 15 }, noise: .05 })],
            ['Ethnic', 'Fiddle', P('strings', { vibrato: { rate: 6.5, depth: .01, sweep: 15 }, detune: [0] })],
            ['Ethnic', 'Shanai', P('reed', { vibrato: { rate: 7, depth: .02, sweep: 15 }, harm: [1, .4, .7, .3, .5, .2, .3] })],

            // 112-119 Percussive
            ['Perc', 'Tinkle Bell', P('bell', { harm: [1, .2, .1, .05], env: { a: .001, d: .6, s: 0, r: .2 } })],
            ['Perc', 'Agogo', P('bell', { harm: [1, .5, .25], env: { a: .001, d: .5, s: 0, r: .2 } })],
            ['Perc', 'Steel Drums', P('bell', { harm: [1, .4, .2, .15, .08, .04], env: { a: .001, d: .9, s: 0, r: .3 } })],
            ['Perc', 'Woodblock', P('perc', { harm: [1, .3, .15], env: { a: .001, d: .1, s: 0, r: .05 }, length: 2205, noise: .2 })],
            ['Perc', 'Taiko Drum', P('perc', { harm: [1, .6, .3, .15], freq: 220, env: { a: .001, d: .5, s: 0, r: .2 }, length: 4410, noise: .1 })],
            ['Perc', 'Melodic Tom', P('perc', { freq: 330, env: { a: .001, d: .3, s: 0, r: .1 }, length: 3307 })],
            ['Perc', 'Synth Drum', P('perc', { freq: 220, env: { a: .001, d: .3, s: 0, r: .1 }, noise: .15, length: 3307 })],
            ['Perc', 'Reverse Cymbal', P('fx', { noise: .6, env: { a: .5, d: 0, s: 1, r: .1 }, length: 8820 })],

            // 120-127 SFX
            ['SFX', 'Fret Noise', P('fx', { noise: .7, env: { a: .001, d: .1, s: 0, r: .05 }, length: 2205 })],
            ['SFX', 'Breath Noise', P('fx', { noise: .8, env: { a: .05, d: .2, s: 0, r: .1 }, length: 3307 })],
            ['SFX', 'Seashore', P('fx', { noise: .9, env: { a: .5, d: 1.5, s: .5, r: .5 }, length: 8820 })],
            ['SFX', 'Bird Tweet', P('fx', { fm: { ratio: 4, index: 5 }, env: { a: .01, d: .3, s: .2, r: .2 }, length: 4410 })],
            ['SFX', 'Telephone', P('fx', { harm: [1, 0, .5, 0, .25], vibrato: { rate: 15, depth: .05, sweep: 15 }, length: 6615 })],
            ['SFX', 'Helicopter', P('fx', { noise: .5, fm: { ratio: 1.02, index: 2 }, length: 8820 })],
            ['SFX', 'Applause', P('fx', { noise: .9, env: { a: .05, d: 2, s: .7, r: .5 }, length: 8820 })],
            ['SFX', 'Gunshot', P('fx', { noise: .9, env: { a: .001, d: .3, s: 0, r: .1 }, length: 4410 })],
        ];
    }

    _buildDrums() {
        const D = DrumFactory;
        return [
            [35, 'Acoustic Bass Drum', D.kick({ fStart: 100, fEnd: 42, toneDecay: 0.35, duration: 0.55 })],
            [36, 'Bass Drum 1', D.kick({ fStart: 120, fEnd: 48, toneDecay: 0.28 })],
            [37, 'Side Stick', D.sideStick()],
            [38, 'Acoustic Snare', D.snare({ fStart: 220, noiseDecay: 0.15 })],
            [39, 'Hand Clap', D.clap()],
            [40, 'Electric Snare', D.snare({ fStart: 180, noiseDecay: 0.22, highpass: 600 })],
            [41, 'Low Floor Tom', D.tom(75, { duration: 0.65, decay: 0.5 })],
            [42, 'Closed Hi-Hat', D.hihat({ type: 'closed' })],
            [43, 'High Floor Tom', D.tom(105, { duration: 0.6 })],
            [44, 'Pedal Hi-Hat', D.hihat({ type: 'pedal' })],
            [45, 'Low Tom', D.tom(140, { duration: 0.55 })],
            [46, 'Open Hi-Hat', D.hihat({ type: 'open' })],
            [47, 'Low-Mid Tom', D.tom(180)],
            [48, 'Hi-Mid Tom', D.tom(220)],
            [49, 'Crash Cymbal 1', D.cymbal({ duration: 1.5 })],
            [50, 'High Tom', D.tom(280)],
            [51, 'Ride Cymbal 1', D.ride({ duration: 1.1 })],
            [52, 'Chinese Cymbal', D.cymbal({ duration: 1.8, noiseDecay: 1.0 })],
            [53, 'Ride Bell', D.ride({ duration: 0.9, noiseDecay: 0.2 })],
            [54, 'Tambourine', D.tambourine()],
            [55, 'Splash Cymbal', D.cymbal({ duration: 0.6, noiseDecay: 0.35 })],
            [56, 'Cowbell', D.cowbell()],
            [57, 'Crash Cymbal 2', D.cymbal({ duration: 1.4 })],
            [58, 'Vibraslap', D.vibraslap()],
            [59, 'Ride Cymbal 2', D.ride({ duration: 0.9 })],
            [60, 'Hi Bongo', D.bongo(400)],
            [61, 'Low Bongo', D.bongo(280)],
            [62, 'Mute Hi Conga', D.conga(320)],
            [63, 'Open Hi Conga', D.conga(280)],
            [64, 'Low Conga', D.conga(200)],
            [65, 'High Timbale', D.tom(280, { noise: 0.15, duration: 0.35 })],
            [66, 'Low Timbale', D.tom(220, { noise: 0.15, duration: 0.4 })],
            [67, 'High Agogo', D.agogo(1200)],
            [68, 'Low Agogo', D.agogo(800)],
            [69, 'Cabasa', D.cabasa()],
            [70, 'Maracas', D.maracas()],
            [71, 'Short Whistle', D.whistle({ duration: 0.15 })],
            [72, 'Long Whistle', D.whistle({ duration: 0.5 })],
            [73, 'Short Guiro', D.guiro({ duration: 0.15 })],
            [74, 'Long Guiro', D.guiro({ duration: 0.5 })],
            [75, 'Claves', D.clave()],
            [76, 'Hi Wood Block', D.woodblock(900)],
            [77, 'Low Wood Block', D.woodblock(550)],
            [78, 'Mute Cuica', D.cuica({ duration: 0.18 })],
            [79, 'Open Cuica', D.cuica({ duration: 0.4 })],
            [80, 'Mute Triangle', D.triangle({ duration: 0.2 })],
            [81, 'Open Triangle', D.triangle({ duration: 1.0 })],
        ];
    }
}
