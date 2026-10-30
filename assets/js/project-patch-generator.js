class ProjectPatchGenerator {
  static MODE_16BIT         = 0x01;   // BARU
  static MODE_UNSIGNED_PCM  = 0x02;
  static MODE_LOOP          = 0x04;
  static MODE_ENVELOPE      = 0x40;   // BARU — dipakai untuk loop

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

  generate({isDrum, program}) {
    const id = Number(program);
    if (!Number.isInteger(id)) {
      throw new Error("Instrument program must be an integer.");
    }

    let name;
    let rendered;
    let rootFreq;
    if (isDrum) {
      const drum = this.library.findDrum(id);
      if (!drum) throw new Error(`Unknown drum instrument: ${id}.`);
      const [note, drumName, preset] = drum;
      name = drumName;
      rendered = new DrumRenderer(preset, this.sampleRate).render();
      rootFreq = this.library.drumToFreq(note);
    } else {
      const instrument = this.library.melodic[id];
      if (!instrument) throw new Error(`Unknown melodic instrument: ${id}.`);
      const [, instrumentName, preset] = instrument;
      name = instrumentName;
      rootFreq = preset.freq || 441;
      rendered = new MelodicRenderer(preset, {
        sampleRate: this.sampleRate,
        freq: rootFreq,
        duration: this.duration
      }).render();
    }

    // --- PCM: signed 16-bit little-endian ---
    const pcm = new Uint8Array(rendered.pcm.length * 2);
    for (let i = 0; i < rendered.pcm.length; i++) {
      let v = Math.round(Math.max(-1, Math.min(1, rendered.pcm[i])) * 32768);
      if (v >  32767) v =  32767;
      if (v < -32768) v = -32768;
      if (v < 0) v += 65536;
      pcm[i * 2]     =  v       & 0xff;
      pcm[i * 2 + 1] = (v >> 8) & 0xff;
    }

    const sampleName = this.slugify(name).slice(0, 7) || "PATCH";
    const lowFreq  = Math.round(8.1757989156 * 1000);
    const highFreq = Math.round(12543.853951 * 1000);

    // modes: 16-bit selalu; loop menambah MLOOP + MENV
    let modes = ProjectPatchGenerator.MODE_16BIT;
    if (rendered.loop) {
      modes |= ProjectPatchGenerator.MODE_LOOP | ProjectPatchGenerator.MODE_ENVELOPE;
    }

    const sample = {
      name: sampleName,
      fractions: 0,
      dataSize: pcm.length,                                       // BYTES (2 × jumlah sampel)
      loopStart: rendered.loop ? rendered.loopStart * 2 : 0,      // BYTES
      loopEnd:   rendered.loop ? rendered.loopEnd   * 2 : 0,      // BYTES
      sampleRate: this.sampleRate,
      lowFreq,
      highFreq,
      rootFreq: Math.round(rootFreq * 1000),
      tune: 0,
      balance: 7,
      envRates:   rendered.loop ? [9, 0, 0, 69, 0, 0]      : [0, 0, 0, 0, 0, 0],
      envOffsets: rendered.loop ? [255, 255, 255, 0, 0, 0] : [255, 255, 255, 0, 0, 0],
      tremoloSweep: 0, tremoloRate: 0, tremoloDepth: 0,
      vibratoSweep: 0, vibratoRate: 0, vibratoDepth: 0,
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
    return {patch, name, program: id, isDrum};
  }

  slugify(value) {
    return String(value).replace(/[^A-Za-z0-9]/g, "_");
  }
}
