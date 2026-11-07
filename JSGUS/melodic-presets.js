var GUS_MELODIC_PRESETS = {
  "gain": 0.38,
  "instruments": [
  {
    "program": 0,
    "family": "Piano",
    "name": "Acoustic Grand Piano",
    "shortName": "Ac. Grand Piano",
    "description": "Ac. Grand: struck-key tone with a resonant decay.",
    "preset": {
      "defaultWaveform": "saw",
      "gain": 0.42,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 3.0,
        "s": 0,
        "r": 0.35
      },
      "harm": [
        1, 0.68, 0.48, 0.34, 0.24, 0.17, 0.12, 0.085, 0.06, 0.042, 0.03, 0.021
      ],
      "partialDecay": [
        4.5, 2.8, 1.7, 1.15, 0.82, 0.6, 0.44, 0.32, 0.23, 0.17, 0.12, 0.085
      ],
      "phases": [
        0, 0.06, 0.16, 0.29, 0.44, 0.6, 0.78, 0.97, 0.18, 0.4, 0.63, 0.87
      ],
      "inharmonicity": 0.0005,
      "attackNoise": {
        "amp": 0.9,
        "duration": 0.007
      },
      "pluckTransient": {
        "freq": 3800,
        "q": 1.4,
        "amp": 0.12,
        "duration": 0.02,
        "decay": 0.006,
        "type": "pink"
      },
      "pitchScoop": {
        "depth": 0.003,
        "time": 0.006
      },
      "brightness": {
        "start": 10000,
        "end": 3800
      },
      "antiAlias": true
    }
  },
  {
    "program": 1,
    "family": "Piano",
    "name": "Bright Piano",
    "shortName": "Bright Piano",
    "description": "Bright Piano: struck-key tone with a resonant decay.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "freq": 441,
      "length": 44100,
      "loop": false,
      "cycles": 36,
      "sustainLoop": true,
      "loopSkip": 16,
      "tailCycles": 180,
      "loopAttack": 0.01,
      "loopAttackNoise": {
        "amp": 0.08,
        "duration": 0.014
      },
      "env": {
        "a": 0.002,
        "d": 3.5,
        "s": 0,
        "r": 0.5
      },
      "patchEnvelope": {
        "rates": [
          12,
          132,
          0,
          137,
          0,
          0
        ],
        "offsets": [
          255,
          135,
          135,
          0,
          0,
          0
        ]
      },
      "harm": [
        1,
        0.85,
        0.7,
        0.55,
        0.42,
        0.3,
        0.2,
        0.13,
        0.08,
        0.05
      ],
      "partialDecay": [
        4.5,
        3,
        2,
        1.4,
        1,
        0.75,
        0.55,
        0.4,
        0.3,
        0.22
      ],
      "inharmonicity": 0.00035,
      "attackNoise": {
        "amp": 0.15,
        "duration": 0.015
      },
      "pitchScoop": {
        "depth": 0.003,
        "time": 0.012
      },
      "brightness": {
        "start": 8000,
        "end": 2000
      },
      "antiAlias": true
    }
  },
  {
    "program": 2,
    "family": "Piano",
    "name": "Electric Grand",
    "shortName": "Elec. Grand",
    "description": "Elec. Grand: struck-key tone with a resonant decay.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "cycles": 36,
      "sustainLoop": true,
      "loopSkip": 16,
      "tailCycles": 180,
      "loopAttack": 0.01,
      "loopAttackNoise": {
        "amp": 0.08,
        "duration": 0.014
      },
      "env": {
        "a": 0.005,
        "d": 1.2,
        "s": 0.1,
        "r": 0.5
      },
      "patchEnvelope": {
        "rates": [
          12,
          132,
          0,
          137,
          0,
          0
        ],
        "offsets": [
          255,
          135,
          135,
          0,
          0,
          0
        ]
      },
      "harm": [
        1,
        0.2,
        0.08,
        0.03
      ],
      "fm": {
        "ratio": 3,
        "index": 1.8
      },
      "antiAlias": true
    }
  },
  {
    "program": 3,
    "family": "Piano",
    "name": "Honky-tonk",
    "shortName": "Honky-tonk",
    "description": "Honky-tonk: struck-key tone with a resonant decay.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.20,
      "gain": 0.42,
      "freq": 441,
      "length": 66150,
      "loop": false,
      "cycles": 36,
      "sustainLoop": true,
      "loopSkip": 16,
      "tailCycles": 180,
      "loopAttack": 0.01,
      "loopAttackNoise": {
        "amp": 0.08,
        "duration": 0.014
      },
      "env": {
        "a": 0.002,
        "d": 3.5,
        "s": 0,
        "r": 0.5
      },
      "patchEnvelope": {
        "rates": [
          12,
          132,
          0,
          137,
          0,
          0
        ],
        "offsets": [
          255,
          135,
          135,
          0,
          0,
          0
        ]
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.4,
        0.3,
        0.2,
        0.12,
        0.08,
        0.05
      ],
      "partialDecay": [
        4.5,
        3,
        2,
        1.4,
        1,
        0.75,
        0.55,
        0.4,
        0.3,
        0.22
      ],
      "inharmonicity": 0.00035,
      "detune": [
        0,
        -10
      ],
      "attackNoise": {
        "amp": 0.15,
        "duration": 0.015
      },
      "pitchScoop": {
        "depth": 0.003,
        "time": 0.012
      },
      "brightness": {
        "start": 8000,
        "end": 2000
      },
      "antiAlias": true
    }
  },
  {
    "program": 4,
    "family": "Piano",
    "name": "E.Piano 1",
    "shortName": "E.Piano 1",
    "description": "E.Piano 1: struck-key tone with a resonant decay.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "cycles": 36,
      "sustainLoop": true,
      "loopSkip": 16,
      "tailCycles": 180,
      "loopAttack": 0.01,
      "loopAttackNoise": {
        "amp": 0.08,
        "duration": 0.014
      },
      "env": {
        "a": 0.005,
        "d": 1.2,
        "s": 0.1,
        "r": 0.5
      },
      "patchEnvelope": {
        "rates": [
          12,
          132,
          0,
          137,
          0,
          0
        ],
        "offsets": [
          255,
          135,
          135,
          0,
          0,
          0
        ]
      },
      "harm": [
        1,
        0.2,
        0.08,
        0.03
      ],
      "fm": {
        "ratio": 3,
        "index": 1.8
      },
      "antiAlias": true
    }
  },
  {
    "program": 5,
    "family": "Piano",
    "name": "E.Piano 2",
    "shortName": "E.Piano 2",
    "description": "E.Piano 2: struck-key tone with a resonant decay.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "cycles": 36,
      "sustainLoop": true,
      "loopSkip": 16,
      "tailCycles": 180,
      "loopAttack": 0.01,
      "loopAttackNoise": {
        "amp": 0.08,
        "duration": 0.014
      },
      "env": {
        "a": 0.005,
        "d": 1.2,
        "s": 0.1,
        "r": 0.5
      },
      "patchEnvelope": {
        "rates": [
          12,
          132,
          0,
          137,
          0,
          0
        ],
        "offsets": [
          255,
          135,
          135,
          0,
          0,
          0
        ]
      },
      "harm": [
        1,
        0.2,
        0.08,
        0.03
      ],
      "fm": {
        "ratio": 2,
        "index": 2.5
      },
      "antiAlias": true
    }
  },
  {
    "program": 6,
    "family": "Piano",
    "name": "Harpsichord",
    "shortName": "Harpsichord",
    "description": "Harpsichord: struck-key tone with a resonant decay.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "freq": 441,
      "length": 66150,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.5,
        "s": 0.05,
        "r": 0.2
      },
      "harm": [
        1,
        0.5,
        0.7,
        0.3,
        0.4,
        0.2,
        0.25,
        0.1
      ],
      "partialDecay": [
        4.5,
        3,
        2,
        1.4,
        1,
        0.75,
        0.55,
        0.4,
        0.3,
        0.22
      ],
      "inharmonicity": 0.00035,
      "attackNoise": {
        "amp": 0.15,
        "duration": 0.015
      },
      "pitchScoop": {
        "depth": 0.003,
        "time": 0.012
      },
      "brightness": {
        "start": 8000,
        "end": 2000
      },
      "antiAlias": true
    }
  },
  {
    "program": 7,
    "family": "Piano",
    "name": "Clavinet",
    "shortName": "Clavinet",
    "description": "Clavinet: struck-key tone with a resonant decay.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "freq": 441,
      "length": 66150,
      "loop": false,
      "env": {
        "a": 0.002,
        "d": 0.4,
        "s": 0.1,
        "r": 0.2
      },
      "harm": [
        1,
        0.4,
        0.6,
        0.3,
        0.4,
        0.2
      ],
      "partialDecay": [
        4.5,
        3,
        2,
        1.4,
        1,
        0.75,
        0.55,
        0.4,
        0.3,
        0.22
      ],
      "inharmonicity": 0.00035,
      "attackNoise": {
        "amp": 0.15,
        "duration": 0.015
      },
      "pitchScoop": {
        "depth": 0.003,
        "time": 0.012
      },
      "brightness": {
        "start": 8000,
        "end": 2000
      },
      "antiAlias": true
    }
  },
  {
    "program": 8,
    "family": "Chromatic",
    "name": "Celesta",
    "shortName": "Celesta",
    "description": "Celesta: a bright strike with a clear ringing tone.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 1.5,
        "s": 0,
        "r": 0.6
      },
      "harm": [
        1,
        0,
        0.5,
        0,
        0.25,
        0,
        0.12
      ],
      "partialDecay": [
        3,
        2,
        1.4,
        1,
        0.7,
        0.5
      ],
      "inharmonicity": 0.008,
      "antiAlias": true
    }
  },
  {
    "program": 9,
    "family": "Chromatic",
    "name": "Glockenspiel",
    "shortName": "Glockenspiel",
    "description": "Glockenspiel: a bright strike with a clear ringing tone.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 1.5,
        "s": 0,
        "r": 0.6
      },
      "harm": [
        1,
        0,
        0.3,
        0,
        0.1,
        0,
        0.03
      ],
      "partialDecay": [
        3,
        2,
        1.4,
        1,
        0.7,
        0.5
      ],
      "inharmonicity": 0.008,
      "antiAlias": true
    }
  },
  {
    "program": 10,
    "family": "Chromatic",
    "name": "Music Box",
    "shortName": "Music Box",
    "description": "Music Box: a bright strike with a clear ringing tone.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 1.5,
        "s": 0,
        "r": 0.6
      },
      "harm": [
        1,
        0.3,
        0.1,
        0.03
      ],
      "partialDecay": [
        3,
        2,
        1.4,
        1,
        0.7,
        0.5
      ],
      "inharmonicity": 0.008,
      "antiAlias": true
    }
  },
  {
    "program": 11,
    "family": "Chromatic",
    "name": "Vibraphone",
    "shortName": "Vibraphone",
    "description": "Vibraphone: a bright strike with a clear ringing tone.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "env": {
        "a": 0.01,
        "d": 1.2,
        "s": 0.1,
        "r": 0.5
      },
      "harm": [
        1,
        0.5,
        0.25,
        0.12,
        0.06
      ],
      "partialDecay": [
        3,
        2,
        1.4,
        1,
        0.7,
        0.5
      ],
      "inharmonicity": 0.008,
      "vibrato": {
        "rate": 5,
        "depth": 0.02
      },
      "antiAlias": true
    }
  },
  {
    "program": 12,
    "family": "Chromatic",
    "name": "Marimba",
    "shortName": "Marimba",
    "description": "Marimba: a bright strike with a clear ringing tone.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.5,
        "s": 0,
        "r": 0.2
      },
      "harm": [
        1,
        0.4,
        0.15,
        0.05
      ],
      "partialDecay": [
        3,
        2,
        1.4,
        1,
        0.7,
        0.5
      ],
      "inharmonicity": 0.008,
      "antiAlias": true
    }
  },
  {
    "program": 13,
    "family": "Chromatic",
    "name": "Xylophone",
    "shortName": "Xylophone",
    "description": "Xylophone: a bright strike with a clear ringing tone.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.3,
        "s": 0,
        "r": 0.1
      },
      "harm": [
        1,
        0.2,
        0.05
      ],
      "partialDecay": [
        3,
        2,
        1.4,
        1,
        0.7,
        0.5
      ],
      "inharmonicity": 0.008,
      "antiAlias": true
    }
  },
  {
    "program": 14,
    "family": "Chromatic",
    "name": "Tubular Bells",
    "shortName": "Tubular Bells",
    "description": "Tubular Bells: a bright strike with a clear ringing tone.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "env": {
        "a": 0.005,
        "d": 2,
        "s": 0,
        "r": 0.8
      },
      "harm": [
        1,
        0.5,
        0.25,
        0.15,
        0.08,
        0.04
      ],
      "partialDecay": [
        3,
        2,
        1.4,
        1,
        0.7,
        0.5
      ],
      "inharmonicity": 0.008,
      "antiAlias": true
    }
  },
  {
    "program": 15,
    "family": "Chromatic",
    "name": "Dulcimer",
    "shortName": "Dulcimer",
    "description": "Dulcimer: a bright strike with a clear ringing tone.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 66150,
      "loop": false,
      "env": {
        "a": 0.002,
        "d": 0.9,
        "s": 0.05,
        "r": 0.3
      },
      "harm": [
        1,
        0.5,
        0.3,
        0.2,
        0.12,
        0.08
      ],
      "partialDecay": [
        4.5,
        3,
        2,
        1.4,
        1,
        0.75,
        0.55,
        0.4,
        0.3,
        0.22
      ],
      "inharmonicity": 0.00035,
      "attackNoise": {
        "amp": 0.15,
        "duration": 0.015
      },
      "pitchScoop": {
        "depth": 0.003,
        "time": 0.012
      },
      "brightness": {
        "start": 8000,
        "end": 2000
      },
      "antiAlias": true
    }
  },
  {
    "program": 16,
    "family": "Organ",
    "name": "Drawbar Organ",
    "shortName": "Drawbar Organ",
    "description": "Drawbar Organ: a steady tone with layered harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.4,
      "loop": true,
      "cycles": 12,
      "env": {
        "a": 0.02,
        "d": 0.1,
        "s": 1,
        "r": 0.1
      },
      "harm": [
        1,
        0,
        0.5,
        0,
        0.3,
        0,
        0.2,
        0,
        0.1
      ],
      "antiAlias": true
    }
  },
  {
    "program": 17,
    "family": "Organ",
    "name": "Percussive Organ",
    "shortName": "Percussive Organ",
    "description": "Percussive Organ: a steady tone with layered harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.4,
      "loop": true,
      "cycles": 12,
      "env": {
        "a": 0.02,
        "d": 0.1,
        "s": 1,
        "r": 0.1
      },
      "harm": [
        1,
        0,
        0.7,
        0,
        0.5,
        0,
        0.3,
        0,
        0.2,
        0,
        0.1
      ],
      "antiAlias": true
    }
  },
  {
    "program": 18,
    "family": "Organ",
    "name": "Rock Organ",
    "shortName": "Rock Organ",
    "description": "Rock Organ: a steady tone with layered harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.4,
      "loop": true,
      "cycles": 12,
      "env": {
        "a": 0.02,
        "d": 0.1,
        "s": 1,
        "r": 0.1
      },
      "harm": [
        1,
        0,
        0.5,
        0,
        0.4,
        0,
        0.3,
        0,
        0.25,
        0,
        0.2
      ],
      "antiAlias": true
    }
  },
  {
    "program": 19,
    "family": "Organ",
    "name": "Church Organ",
    "shortName": "Church Organ",
    "description": "Church Organ: a steady tone with layered harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.4,
      "loop": true,
      "cycles": 12,
      "env": {
        "a": 0.02,
        "d": 0.1,
        "s": 1,
        "r": 0.1
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.35,
        0.25,
        0.2,
        0.15,
        0.12,
        0.1
      ],
      "antiAlias": true
    }
  },
  {
    "program": 20,
    "family": "Organ",
    "name": "Reed Organ",
    "shortName": "Reed Organ",
    "description": "Reed Organ: a steady tone with layered harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.4,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.05,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.72,
        0.58,
        0.4,
        0.28,
        0.18,
        0.1,
        0.05
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 5.5,
        "depth": 0.006
      },
      "drive": 1.5,
      "formants": [
        {
          "freq": 900,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 1800,
          "q": 2,
          "gain": 3
        },
        {
          "freq": 3200,
          "q": 2.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 21,
    "family": "Organ",
    "name": "Accordion",
    "shortName": "Accordion",
    "description": "Accordion: a steady tone with layered harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.4,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.05,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.5,
        0.3,
        0.2,
        0.15,
        0.1,
        0.08
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 5.5,
        "depth": 0.006
      },
      "drive": 1.3,
      "formants": [
        {
          "freq": 900,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 1800,
          "q": 2,
          "gain": 3
        },
        {
          "freq": 3200,
          "q": 2.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 22,
    "family": "Organ",
    "name": "Harmonica",
    "shortName": "Harmonica",
    "description": "Harmonica: a steady tone with layered harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.4,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.05,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.4,
        0.6,
        0.3,
        0.4,
        0.2,
        0.15
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 5.5,
        "depth": 0.006
      },
      "drive": 1.5,
      "formants": [
        {
          "freq": 900,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 1800,
          "q": 2,
          "gain": 3
        },
        {
          "freq": 3200,
          "q": 2.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 23,
    "family": "Organ",
    "name": "Tango Accordion",
    "shortName": "Tango Accordion",
    "description": "Tango Accordion: a steady tone with layered harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.4,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.05,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.72,
        0.58,
        0.4,
        0.28,
        0.18,
        0.1,
        0.05
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 5.5,
        "depth": 0.006
      },
      "drive": 1.5,
      "formants": [
        {
          "freq": 900,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 1800,
          "q": 2,
          "gain": 3
        },
        {
          "freq": 3200,
          "q": 2.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 24,
    "family": "Guitar",
    "name": "Nylon Guitar",
    "shortName": "Nylon Guitar",
    "description": "Nylon Guitar: warm finger-plucked tone with a soft decay.",
    "preset": {
      "defaultWaveform": "saw",
      "gain": 0.40,
      "freq": 441,
      "length": 66150,
      "loop": false,
      "env": {
        "a": 0.002,
        "d": 1.5,
        "s": 0,
        "r": 0.5
      },
      "harm": [
        1,
        0.25,
        0.1111,
        0.0625,
        0.04,
        0.0278,
        0.0204,
        0.0156,
        0.0123,
        0.01,
        0.0083,
        0.0069,
        0.0059,
        0.0051,
        0.0044,
        0.0039,
        0.0035,
        0.0031,
        0.0028,
        0.0025,
        0.0023,
        0.0021,
        0.0019,
        0.0017
      ],
      "partialDecay": [
        2.4, 1.6, 1.1, 0.78, 0.58, 0.44, 0.34, 0.27, 0.22,
        0.18, 0.15, 0.13, 0.11, 0.095, 0.082, 0.072, 0.063,
        0.056, 0.05, 0.045, 0.041, 0.037, 0.034, 0.031
      ],
      "inharmonicity": 0.00004,
      "attackNoise": {
        "amp": 0.012,
        "duration": 0.009
      },
      "pluckPosition": 0.12,
      "pluckTransient": {
        "freq": 2600,
        "q": 0.9,
        "amp": 0.025,
        "duration": 0.016,
        "decay": 0.007
      },
      "pitchScoop": {
        "depth": 0.0012,
        "time": 0.014
      },
      "brightness": {
        "start": 10500,
        "end": 2500
      },
      "formants": [
        {
          "freq": 150,
          "q": 0.8,
          "gain": 4
        },
        {
          "freq": 230,
          "q": 0.8,
          "gain": 5
        },
        {
          "freq": 410,
          "q": 0.85,
          "gain": 3.5
        },
        {
          "freq": 780,
          "q": 0.95,
          "gain": 2
        },
        {
          "freq": 3000,
          "q": 1,
          "gain": 1
        },
        {
          "freq": 4600,
          "q": 1,
          "gain": 0.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 25,
    "family": "Guitar",
    "name": "Steel Guitar",
    "shortName": "Steel Guitar",
    "description": "Steel Guitar: a plucked-string attack with natural decay.",
    "preset": {
      "defaultWaveform": "saw",
      "gain": 0.40,
      "freq": 441,
      "length": 66150,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 1.2,
        "s": 0,
        "r": 0.4
      },
      "harm": [
        1,
        0.9,
        0.8,
        0.7,
        0.55,
        0.4,
        0.3,
        0.2,
        0.15,
        0.1,
        0.05
      ],
      "partialDecay": [
        2.8,
        1.9,
        1.35,
        1,
        0.74,
        0.55,
        0.4,
        0.3,
        0.23,
        0.17,
        0.12
      ],
      "inharmonicity": 0.00012,
      "attackNoise": {
        "amp": 0.09,
        "duration": 0.009
      },
      "pluckPosition": 0.105,
      "pluckTransient": {
        "freq": 4500,
        "q": 1.1,
        "amp": 0.08,
        "duration": 0.016,
        "decay": 0.006
      },
      "pitchScoop": {
        "depth": 0.0022,
        "time": 0.009
      },
      "brightness": {
        "start": 14000,
        "end": 3000
      },
      "formants": [
        {
          "freq": 115,
          "q": 1.2,
          "gain": 2
        },
        {
          "freq": 230,
          "q": 1.8,
          "gain": 4
        },
        {
          "freq": 520,
          "q": 2.2,
          "gain": 4
        },
        {
          "freq": 1150,
          "q": 1.7,
          "gain": 3
        },
        {
          "freq": 2900,
          "q": 1.2,
          "gain": 2
        },
        {
          "freq": 4800,
          "q": 1,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 26,
    "family": "Guitar",
    "name": "Jazz Guitar",
    "shortName": "Jazz Guitar",
    "description": "Jazz Guitar: a plucked-string attack with natural decay.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.35,
      "freq": 441,
      "length": 44100,
      "loop": false,
      "cycles": 14,
      "loopSkip": 2,
      "env": {
        "a": 0.002,
        "d": 0.8,
        "s": 0.1,
        "r": 0.3
      },
      "harm": [
        1,
        0.5,
        0.3,
        0.2,
        0.1
      ],
      "partialDecay": [
        3,
        2.2,
        1.6,
        1.2,
        0.9,
        0.7,
        0.5,
        0.4,
        0.3
      ],
      "attackNoise": {
        "amp": 0.12,
        "duration": 0.012
      },
      "brightness": {
        "start": 11000,
        "end": 1200
      },
      "formants": [
        {
          "freq": 100,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 220,
          "q": 2,
          "gain": 2
        },
        {
          "freq": 450,
          "q": 2.5,
          "gain": 2
        },
        {
          "freq": 1200,
          "q": 3,
          "gain": 1
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 27,
    "family": "Guitar",
    "name": "Clean Guitar",
    "shortName": "Clean Guitar",
    "description": "Clean Guitar: a plucked-string attack with natural decay.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.35,
      "freq": 441,
      "length": 44100,
      "loop": false,
      "cycles": 14,
      "loopSkip": 2,
      "env": {
        "a": 0.002,
        "d": 0.8,
        "s": 0.1,
        "r": 0.3
      },
      "harm": [
        1,
        0.6,
        0.4,
        0.25,
        0.15,
        0.08
      ],
      "partialDecay": [
        3,
        2.2,
        1.6,
        1.2,
        0.9,
        0.7,
        0.5,
        0.4,
        0.3
      ],
      "attackNoise": {
        "amp": 0.12,
        "duration": 0.012
      },
      "guitarAmp": {
        "drive": 1.2,
        "bias": 0,
        "mix": 0.25,
        "preampCutoff": 75,
        "cabinetCutoff": 6500
      },
      "brightness": {
        "start": 7000,
        "end": 2600,
        "loopCutoff": 5200
      },
      "antiAlias": true
    }
  },
  {
    "program": 28,
    "family": "Guitar",
    "name": "Muted Guitar",
    "shortName": "Muted Guitar",
    "description": "Muted Guitar: a plucked-string attack with natural decay.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.35,
      "freq": 441,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.2,
        "s": 0.05,
        "r": 0.1
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.35,
        0.2,
        0.12,
        0.08,
        0.05,
        0.03
      ],
      "partialDecay": [
        3,
        2.2,
        1.6,
        1.2,
        0.9,
        0.7,
        0.5,
        0.4,
        0.3
      ],
      "attackNoise": {
        "amp": 0.12,
        "duration": 0.012
      },
      "brightness": {
        "start": 7000,
        "end": 1200
      },
      "formants": [
        {
          "freq": 100,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 220,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 450,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 1200,
          "q": 3,
          "gain": 2
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 29,
    "family": "Guitar",
    "name": "Overdriven Gtr",
    "shortName": "Overdriven Gtr",
    "description": "Overdriven Gtr: driven guitar with a sustained loop.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.45,
      "freq": 441,
      "length": 44100,
      "loop": true,
      "cycles": 18,
      "loopSkip": 10,
      "loopAttackNoise": {
        "amp": 0.2,
        "duration": 0.024
      },
      "env": {
        "a": 0.002,
        "d": 0.8,
        "s": 0.1,
        "r": 0.3
      },
      "harm": [
        1,
        0.86,
        0.72,
        0.6,
        0.49,
        0.39,
        0.31,
        0.24,
        0.18,
        0.13,
        0.09,
        0.06,
        0.04,
        0.03,
        0.022,
        0.016,
        0.012
      ],
      "partialDecay": [
        3,
        2.2,
        1.6,
        1.2,
        0.9,
        0.7,
        0.5,
        0.4,
        0.3
      ],
      "noise": 0.025,
      "attackNoise": {
        "amp": 0.12,
        "duration": 0.012
      },
      "vibrato": {
        "rate": 5.2,
        "depth": 0.004,
        "sweep": 12
      },
      "guitarAmp": {
        "drive": 2.6,
        "bias": 0.005,
        "mix": 0.84,
        "preampCutoff": 90,
        "cabinetCutoff": 6200
      },
      "brightness": {
        "start": 7000,
        "end": 1200
      },
      "antiAlias": true
    }
  },
  {
    "program": 30,
    "family": "Guitar",
    "name": "Distortion Gtr",
    "shortName": "Distortion Gtr",
    "description": "Distortion Gtr: driven guitar with a sustained loop.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.45,
      "freq": 441,
      "length": 44100,
      "loop": true,
      "cycles": 20,
      "loopSkip": 10,
      "loopAttackNoise": {
        "amp": 0.18,
        "duration": 0.018
      },
      "env": {
        "a": 0.002,
        "d": 0.8,
        "s": 0.1,
        "r": 0.3
      },
      "harm": [
        1,
        0.92,
        0.82,
        0.72,
        0.62,
        0.53,
        0.44,
        0.36,
        0.29,
        0.23,
        0.18,
        0.14,
        0.1,
        0.07,
        0.05,
        0.04,
        0.032,
        0.025,
        0.02,
        0.016
      ],
      "partialDecay": [
        3,
        2.2,
        1.6,
        1.2,
        0.9,
        0.7,
        0.5,
        0.4,
        0.3
      ],
      "noise": 0.035,
      "attackNoise": {
        "amp": 0.12,
        "duration": 0.012
      },
      "vibrato": {
        "rate": 5.5,
        "depth": 0.003,
        "sweep": 10
      },
      "guitarAmp": {
        "drive": 3.6,
        "bias": 0.005,
        "mix": 0.9,
        "preampCutoff": 90,
        "cabinetCutoff": 6000
      },
      "brightness": {
        "start": 7000,
        "end": 3200,
        "loopCutoff": 3600
      },
      "antiAlias": true
    }
  },
  {
    "program": 31,
    "family": "Guitar",
    "name": "Gtr Harmonics",
    "shortName": "Gtr Harmonics",
    "description": "Gtr Harmonics: sustained guitar overtone with loop.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.6,
      "freq": 441,
      "loop": true,
      "cycles": 24,
      "loopSkip": 4,
      "loopAttack": 0.008,
      "loopAttackNoise": {
        "amp": 0.04,
        "duration": 0.012
      },
      "harm": [
        0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3
      ],
      "brightness": {
        "loopCutoff": 10500
      },
      "formants": [
        {
          "freq": 400,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 880,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 1800,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 4800,
          "q": 3,
          "gain": 2
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 32,
    "family": "Bass",
    "name": "Acoustic Bass",
    "shortName": "Ac. Bass",
    "description": "Ac. Bass: a focused low end and firm fundamental.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "freq": 220,
      "length": 33075,
      "loop": false,
      "cycles": 14,
      "loopSkip": 2,
      "env": {
        "a": 0.005,
        "d": 0.5,
        "s": 0.2,
        "r": 0.3
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.3,
        0.2,
        0.1,
        0.05
      ],
      "attackNoise": {
        "amp": 0.07,
        "duration": 0.008
      },
      "brightness": {
        "start": 5000,
        "end": 900
      },
      "antiAlias": true
    }
  },
  {
    "program": 33,
    "family": "Bass",
    "name": "Finger Bass",
    "shortName": "Finger Bass",
    "description": "Finger Bass: a focused low end and firm fundamental.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "freq": 220,
      "length": 33075,
      "loop": false,
      "cycles": 14,
      "loopSkip": 2,
      "env": {
        "a": 0.005,
        "d": 0.5,
        "s": 0.2,
        "r": 0.3
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.3,
        0.2,
        0.1,
        0.05
      ],
      "attackNoise": {
        "amp": 0.07,
        "duration": 0.008
      },
      "brightness": {
        "start": 5000,
        "end": 900
      },
      "antiAlias": true
    }
  },
  {
    "program": 34,
    "family": "Bass",
    "name": "Pick Bass",
    "shortName": "Pick Bass",
    "description": "Pick Bass: a focused low end and firm fundamental.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "freq": 220,
      "length": 33075,
      "loop": false,
      "cycles": 14,
      "loopSkip": 2,
      "env": {
        "a": 0.005,
        "d": 0.5,
        "s": 0.2,
        "r": 0.3
      },
      "harm": [
        1,
        0.6,
        0.4,
        0.3,
        0.2,
        0.15,
        0.1
      ],
      "attackNoise": {
        "amp": 0.07,
        "duration": 0.008
      },
      "brightness": {
        "start": 5000,
        "end": 900
      },
      "antiAlias": true
    }
  },
  {
    "program": 35,
    "family": "Bass",
    "name": "Fretless Bass",
    "shortName": "Fretless Bass",
    "description": "Fretless Bass: a focused low end and firm fundamental.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "freq": 220,
      "length": 33075,
      "loop": false,
      "cycles": 14,
      "loopSkip": 2,
      "env": {
        "a": 0.005,
        "d": 0.5,
        "s": 0.2,
        "r": 0.3
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.3,
        0.2,
        0.1,
        0.05
      ],
      "attackNoise": {
        "amp": 0.07,
        "duration": 0.008
      },
      "vibrato": {
        "rate": 5,
        "depth": 0.01
      },
      "brightness": {
        "start": 5000,
        "end": 900
      },
      "antiAlias": true
    }
  },
  {
    "program": 36,
    "family": "Bass",
    "name": "Slap Bass 1",
    "shortName": "Slap Bass 1",
    "description": "Slap Bass 1: a focused low end and firm fundamental.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.36,
      "freq": 220,
      "length": 33075,
      "loop": false,
      "cycles": 14,
      "loopSkip": 2,
      "env": {
        "a": 0.005,
        "d": 0.5,
        "s": 0.2,
        "r": 0.3
      },
      "harm": [
        1,
        0.8,
        0.6,
        0.45,
        0.35,
        0.25,
        0.2,
        0.15
      ],
      "attackNoise": {
        "amp": 0.07,
        "duration": 0.008
      },
      "brightness": {
        "start": 5000,
        "end": 900
      },
      "antiAlias": true
    }
  },
  {
    "program": 37,
    "family": "Bass",
    "name": "Slap Bass 2",
    "shortName": "Slap Bass 2",
    "description": "Slap Bass 2: a focused low end and firm fundamental.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "freq": 220,
      "length": 33075,
      "loop": false,
      "cycles": 14,
      "loopSkip": 2,
      "env": {
        "a": 0.005,
        "d": 0.5,
        "s": 0.2,
        "r": 0.3
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.4,
        0.3,
        0.22,
        0.18
      ],
      "noise": 0.05,
      "attackNoise": {
        "amp": 0.07,
        "duration": 0.008
      },
      "brightness": {
        "start": 5000,
        "end": 900
      },
      "antiAlias": true
    }
  },
  {
    "program": 38,
    "family": "Bass",
    "name": "Synth Bass 1",
    "shortName": "Synth Bass 1",
    "description": "Synth Bass 1: a focused low end and firm fundamental.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "freq": 220,
      "length": 33075,
      "loop": true,
      "cycles": 14,
      "loopSkip": 2,
      "env": {
        "a": 0.005,
        "d": 0.5,
        "s": 0.2,
        "r": 0.3
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.4,
        0.3,
        0.2
      ],
      "attackNoise": {
        "amp": 0.07,
        "duration": 0.008
      },
      "brightness": {
        "start": 5000,
        "end": 900
      },
      "antiAlias": true
    }
  },
  {
    "program": 39,
    "family": "Bass",
    "name": "Synth Bass 2",
    "shortName": "Synth Bass 2",
    "description": "Synth Bass 2: a focused low end and firm fundamental.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "freq": 220,
      "length": 33075,
      "loop": true,
      "cycles": 14,
      "loopSkip": 2,
      "env": {
        "a": 0.005,
        "d": 0.5,
        "s": 0.2,
        "r": 0.3
      },
      "harm": [
        1,
        0.5,
        0.3,
        0.2
      ],
      "detune": [
        -5,
        5
      ],
      "attackNoise": {
        "amp": 0.07,
        "duration": 0.008
      },
      "brightness": {
        "start": 5000,
        "end": 900
      },
      "antiAlias": true
    }
  },
  {
    "program": 40,
    "family": "Strings",
    "name": "Violin",
    "shortName": "Violin",
    "description": "Violin: a bowed or plucked tone with rich harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.50,
      "loop": true,
      "cycles": 22,
      "loopSkip": 8,
      "loopAttackNoise": {
        "amp": 0.16,
        "duration": 0.017
      },
      "env": {
        "a": 0.10,
        "d": 0.2,
        "s": 0.9,
        "r": 0.3
      },
      "harm": [
        1,
        0.76,
        0.58,
        0.42,
        0.29,
        0.19,
        0.12,
        0.075,
        0.043,
        0.022
      ],
      "phases": [
        0,
        0.08,
        0.2,
        0.36,
        0.55,
        0.76,
        0.98,
        0.22,
        0.48,
        0.75
      ],
      "detune": [
        0,
        8
      ],
      "noise": 0.025,
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 5.2,
        "depth": 0.008,
        "sweep": 22
      },
      "drive": 0.15,
      "formants": [
        {
          "freq": 300,
          "q": 1.2,
          "gain": 1.5
        },
        {
          "freq": 550,
          "q": 1.6,
          "gain": 1.5
        },
        {
          "freq": 1400,
          "q": 2,
          "gain": 1
        },
        {
          "freq": 3500,
          "q": 2.2,
          "gain": 0.5
        },
        {
          "freq": 5500,
          "q": 2.5,
          "gain": -1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 41,
    "family": "Strings",
    "name": "Viola",
    "shortName": "Viola",
    "description": "Viola: a bowed or plucked tone with rich harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.50,
      "loop": true,
      "cycles": 22,
      "loopSkip": 8,
      "loopAttackNoise": {
        "amp": 0.13,
        "duration": 0.017
      },
      "env": {
        "a": 0.10,
        "d": 0.2,
        "s": 0.9,
        "r": 0.3
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.35,
        0.24,
        0.16,
        0.1,
        0.06,
        0.032
      ],
      "phases": [
        0,
        0.3,
        0.6,
        0.2,
        0.7,
        0.1,
        0.5,
        0.9,
        0.4,
        0.8
      ],
      "detune": [
        0,
        8
      ],
      "noise": 0.02,
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 4.8,
        "depth": 0.007,
        "sweep": 24
      },
      "drive": 0.15,
      "formants": [
        {
          "freq": 250,
          "q": 1.2,
          "gain": 1.5
        },
        {
          "freq": 450,
          "q": 1.5,
          "gain": 1.5
        },
        {
          "freq": 1200,
          "q": 1.8,
          "gain": 1
        },
        {
          "freq": 3000,
          "q": 2.2,
          "gain": 2.5
        },
        {
          "freq": 4500,
          "q": 2.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 42,
    "family": "Strings",
    "name": "Cello",
    "shortName": "Cello",
    "description": "Cello: a bowed or plucked tone with rich harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.34,
      "loop": true,
      "cycles": 22,
      "loopSkip": 8,
      "env": {
        "a": 0.10,
        "d": 0.2,
        "s": 0.9,
        "r": 0.3
      },
      "harm": [
        1,
        0.58,
        0.34,
        0.2,
        0.12,
        0.07,
        0.04,
        0.022
      ],
      "detune": [
        0,
        8
      ],
      "noise": 0.005,
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 4.6,
        "depth": 0.004,
        "sweep": 26
      },
      "drive": 0,
      "formants": [
        {
          "freq": 180,
          "q": 1.1,
          "gain": 1.5
        },
        {
          "freq": 320,
          "q": 1.4,
          "gain": 2
        },
        {
          "freq": 750,
          "q": 1.8,
          "gain": 1
        },
        {
          "freq": 1900,
          "q": 2.2,
          "gain": -1
        },
        {
          "freq": 3600,
          "q": 2.5,
          "gain": -2.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 43,
    "family": "Strings",
    "name": "Contrabass",
    "shortName": "Contrabass",
    "description": "Contrabass: a bowed or plucked tone with rich harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.34,
      "freq": 220,
      "loop": true,
      "cycles": 22,
      "loopSkip": 8,
      "env": {
        "a": 0.15,
        "d": 0.2,
        "s": 0.9,
        "r": 0.3
      },
      "harm": [
        1,
        0.52,
        0.3,
        0.18,
        0.1,
        0.055,
        0.03
      ],
      "detune": [
        0,
        8
      ],
      "noise": 0.004,
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 4.2,
        "depth": 0.003,
        "sweep": 28
      },
      "drive": 0,
      "formants": [
        {
          "freq": 100,
          "q": 1,
          "gain": 1.5
        },
        {
          "freq": 220,
          "q": 1.3,
          "gain": 2
        },
        {
          "freq": 500,
          "q": 1.7,
          "gain": 1
        },
        {
          "freq": 1300,
          "q": 2,
          "gain": -1
        },
        {
          "freq": 2600,
          "q": 2.4,
          "gain": -2.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 44,
    "family": "Strings",
    "name": "Tremolo Str",
    "shortName": "Tremolo Str",
    "description": "Tremolo Str: a bowed or plucked tone with rich harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.34,
      "loop": true,
      "cycles": 22,
      "loopSkip": 8,
      "env": {
        "a": 0.10,
        "d": 0.2,
        "s": 0.9,
        "r": 0.3
      },
      "harm": [
        1,
        0.58,
        0.36,
        0.22,
        0.13,
        0.075,
        0.04,
        0.02
      ],
      "detune": [
        0,
        8
      ],
      "noise": 0.006,
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 8,
        "depth": 0.008,
        "sweep": 18
      },
      "drive": 0,
      "formants": [
        {
          "freq": 300,
          "q": 1.2,
          "gain": 1.5
        },
        {
          "freq": 550,
          "q": 1.5,
          "gain": 1.5
        },
        {
          "freq": 1300,
          "q": 1.8,
          "gain": 0.5
        },
        {
          "freq": 3200,
          "q": 2.2,
          "gain": -1.5
        },
        {
          "freq": 5000,
          "q": 2.5,
          "gain": -3
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 45,
    "family": "Strings",
    "name": "Pizzicato",
    "shortName": "Pizzicato",
    "description": "Pizzicato: a bowed or plucked tone with rich harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.34,
      "freq": 441,
      "length": 4410,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.3,
        "s": 0,
        "r": 0.1
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.35,
        0.2,
        0.12,
        0.08,
        0.05,
        0.03
      ],
      "partialDecay": [
        3,
        2.2,
        1.6,
        1.2,
        0.9,
        0.7,
        0.5,
        0.4,
        0.3
      ],
      "detune": [
        -8,
        8
      ],
      "attackNoise": {
        "amp": 0.12,
        "duration": 0.012
      },
      "brightness": {
        "start": 7000,
        "end": 1200
      },
      "formants": [
        {
          "freq": 100,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 220,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 450,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 1200,
          "q": 3,
          "gain": 2
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 46,
    "family": "Strings",
    "name": "Harp",
    "shortName": "Harp",
    "description": "Harp: a bowed or plucked tone with rich harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.34,
      "freq": 441,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.002,
        "d": 1.5,
        "s": 0.05,
        "r": 0.6
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.35,
        0.2,
        0.12,
        0.08,
        0.05,
        0.03
      ],
      "partialDecay": [
        3,
        2.2,
        1.6,
        1.2,
        0.9,
        0.7,
        0.5,
        0.4,
        0.3
      ],
      "attackNoise": {
        "amp": 0.12,
        "duration": 0.012
      },
      "brightness": {
        "start": 7000,
        "end": 1200
      },
      "formants": [
        {
          "freq": 100,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 220,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 450,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 1200,
          "q": 3,
          "gain": 2
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 47,
    "family": "Strings",
    "name": "Timpani",
    "shortName": "Timpani",
    "description": "Timpani: a bowed or plucked tone with rich harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.34,
      "freq": 441,
      "length": 6615,
      "loop": false,
      "env": {
        "a": 0.002,
        "d": 0.7,
        "s": 0,
        "r": 0.3
      },
      "harm": [
        1,
        0.7,
        0.4,
        0.2
      ],
      "noise": 0.1,
      "antiAlias": true
    }
  },
  {
    "program": 48,
    "family": "Ensemble",
    "name": "Strings 1",
    "shortName": "Strings 1",
    "description": "Strings 1: a layered orchestral blend with smooth sustain.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.35,
      "loop": true,
      "cycles": 22,
      "loopSkip": 8,
      "env": {
        "a": 0.20,
        "d": 0.2,
        "s": 0.95,
        "r": 0.4
      },
      "harm": [
        1,
        0.62,
        0.42,
        0.29,
        0.19,
        0.12,
        0.075,
        0.045,
        0.025
      ],
      "phases": [
        0,
        0.1,
        0.3,
        0.6,
        0.2,
        0.8,
        0.4,
        0.9,
        0.5
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 4.5,
        "depth": 0.004
      },
      "drive": 0,
      "formants": [
        {
          "freq": 280,
          "q": 1.2,
          "gain": 1.5
        },
        {
          "freq": 500,
          "q": 1.5,
          "gain": 1.5
        },
        {
          "freq": 1200,
          "q": 1.8,
          "gain": 1
        },
        {
          "freq": 3000,
          "q": 2.2,
          "gain": -1
        },
        {
          "freq": 5000,
          "q": 2.5,
          "gain": -2
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 49,
    "family": "Ensemble",
    "name": "Strings 2",
    "shortName": "Strings 2",
    "description": "Strings 2: a layered orchestral blend with smooth sustain.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.35,
      "loop": true,
      "cycles": 22,
      "loopSkip": 8,
      "env": {
        "a": 0.20,
        "d": 0.2,
        "s": 0.95,
        "r": 0.4
      },
      "harm": [
        1,
        0.55,
        0.34,
        0.2,
        0.12,
        0.07,
        0.04,
        0.02
      ],
      "phases": [
        0,
        0.1,
        0.3,
        0.6,
        0.2,
        0.8,
        0.4,
        0.9,
        0.5
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 4.5,
        "depth": 0.004
      },
      "drive": 0,
      "formants": [
        {
          "freq": 220,
          "q": 1.2,
          "gain": 1.5
        },
        {
          "freq": 400,
          "q": 1.5,
          "gain": 2
        },
        {
          "freq": 900,
          "q": 1.8,
          "gain": 1
        },
        {
          "freq": 2500,
          "q": 2.2,
          "gain": -1
        },
        {
          "freq": 4000,
          "q": 2.5,
          "gain": -2
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 50,
    "family": "Ensemble",
    "name": "SynthStrings 1",
    "shortName": "SynthStrings 1",
    "description": "SynthStrings 1: a layered orchestral blend with smooth.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.24,
      "gain": 0.33,
      "loop": true,
      "cycles": 34,
      "loopSkip": 20,
      "loopAttack": 0.025,
      "loopAttackNoise": {
        "amp": 0.018,
        "duration": 0.02
      },
      "env": {
        "a": 0.3,
        "d": 0.3,
        "s": 0.95,
        "r": 0.5
      },
      "harm": [
        1,
        0.62,
        0.42,
        0.28,
        0.18,
        0.11,
        0.065,
        0.035,
        0.018
      ],
      "phases": [
        0,
        0.06,
        0.16,
        0.29,
        0.45,
        0.64,
        0.85,
        0.09,
        0.35
      ],
      "detune": [
        0
      ],
      "noise": 0,
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 4.8,
        "depth": 0.003,
        "sweep": 24
      },
      "drive": 1.08,
      "formants": [
        {
          "freq": 420,
          "q": 1.1,
          "gain": 1.5
        },
        {
          "freq": 1250,
          "q": 1.4,
          "gain": 2
        },
        {
          "freq": 3200,
          "q": 1.8,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 51,
    "family": "Ensemble",
    "name": "SynthStrings 2",
    "shortName": "SynthStrings 2",
    "description": "SynthStrings 2: a layered orchestral blend with smooth.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.24,
      "gain": 0.33,
      "loop": true,
      "cycles": 38,
      "loopSkip": 24,
      "loopAttack": 0.04,
      "loopAttackNoise": {
        "amp": 0.012,
        "duration": 0.03
      },
      "env": {
        "a": 0.20,
        "d": 0.3,
        "s": 0.95,
        "r": 0.5
      },
      "harm": [
        1,
        0.78,
        0.58,
        0.42,
        0.3,
        0.21,
        0.14,
        0.09,
        0.055,
        0.03
      ],
      "phases": [
        0,
        0.1,
        0.24,
        0.42,
        0.63,
        0.87,
        0.14,
        0.43,
        0.76,
        0.12
      ],
      "detune": [
        0
      ],
      "noise": 0,
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 4.2,
        "depth": 0.004,
        "sweep": 30
      },
      "drive": 1.04,
      "formants": [
        {
          "freq": 300,
          "q": 1,
          "gain": 2
        },
        {
          "freq": 850,
          "q": 1.3,
          "gain": 2.5
        },
        {
          "freq": 2100,
          "q": 1.7,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 52,
    "family": "Ensemble",
    "name": "Choir Aahs",
    "shortName": "Choir Aahs",
    "description": "Choir Aahs: a layered orchestral blend with smooth sustain.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.24,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.12,
        "d": 0.25,
        "s": 0.9,
        "r": 0.35
      },
      "harm": [
        1,
        0.85,
        0.7,
        0.55,
        0.42,
        0.3,
        0.22,
        0.16,
        0.11,
        0.07,
        0.04
      ],
      "phases": [
        -0.012,
        -0.048,
        -0.10800000000000001,
        -0.192,
        -0.3,
        -0.43200000000000005,
        -0.5880000000000001,
        -0.768,
        -0.972,
        -1.2,
        -1.452
      ],
      "phaseScale": 0.012,
      "noise": 0.04,
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 4.5,
        "depth": 0.005,
        "sweep": 25
      },
      "drive": 1.3,
      "formants": [
        {
          "freq": 700,
          "q": 2.5,
          "gain": 7
        },
        {
          "freq": 1150,
          "q": 3,
          "gain": 5
        },
        {
          "freq": 2500,
          "q": 3.5,
          "gain": 3
        },
        {
          "freq": 3500,
          "q": 4,
          "gain": 2
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 53,
    "family": "Ensemble",
    "name": "Voice Oohs",
    "shortName": "Voice Oohs",
    "description": "Voice Oohs: a layered orchestral blend with smooth sustain.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.24,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.12,
        "d": 0.25,
        "s": 0.9,
        "r": 0.35
      },
      "harm": [
        1,
        0.9,
        0.75,
        0.6,
        0.45,
        0.32,
        0.22,
        0.14,
        0.09,
        0.05
      ],
      "phases": [
        -0.015,
        -0.06,
        -0.135,
        -0.24,
        -0.375,
        -0.54,
        -0.735,
        -0.96,
        -1.215,
        -1.5
      ],
      "phaseScale": 0.015,
      "noise": 0.02,
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 5,
        "depth": 0.007,
        "sweep": 15
      },
      "drive": 1.5,
      "formants": [
        {
          "freq": 320,
          "q": 2.5,
          "gain": 8
        },
        {
          "freq": 850,
          "q": 3,
          "gain": 7
        },
        {
          "freq": 1900,
          "q": 3.5,
          "gain": 4
        },
        {
          "freq": 3200,
          "q": 4,
          "gain": 2
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 54,
    "family": "Ensemble",
    "name": "Synth Voice",
    "shortName": "Synth Voice",
    "description": "Synth Voice: a layered orchestral blend with smooth sustain.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.24,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.12,
        "d": 0.25,
        "s": 0.9,
        "r": 0.35
      },
      "harm": [
        1,
        0.8,
        0.65,
        0.5,
        0.4,
        0.3,
        0.22,
        0.16,
        0.12,
        0.09,
        0.07,
        0.05
      ],
      "phases": [
        -0.01,
        -0.04,
        -0.09,
        -0.16,
        -0.25,
        -0.36,
        -0.49000000000000005,
        -0.64,
        -0.8099999999999999,
        -1,
        -1.21,
        -1.44
      ],
      "phaseScale": 0.01,
      "noise": 0.02,
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 5.5,
        "depth": 0.008,
        "sweep": 15
      },
      "drive": 1.8,
      "formants": [
        {
          "freq": 600,
          "q": 2,
          "gain": 4
        },
        {
          "freq": 1050,
          "q": 2.5,
          "gain": 3.5
        },
        {
          "freq": 2500,
          "q": 3,
          "gain": 2.5
        },
        {
          "freq": 4000,
          "q": 3.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 55,
    "family": "Ensemble",
    "name": "Orchestra Hit",
    "shortName": "Orchestra Hit",
    "description": "Orchestra Hit: a layered orchestral blend with smooth.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.65,
      "length": 4410,
      "loop": false,
      "cycles": 14,
      "env": {
        "a": 0.001,
        "d": 0.4,
        "s": 0,
        "r": 0.2
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.4,
        0.3,
        0.25,
        0.2,
        0.15
      ],
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5,
        "depth": 0.003
      },
      "brightness": {
        "start": 7000,
        "end": 2500
      },
      "antiAlias": true
    }
  },
  {
    "program": 56,
    "family": "Brass",
    "name": "Trumpet",
    "shortName": "Trumpet",
    "description": "Trumpet: a bold attack and bright, focused tone.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.24,
      "loop": true,
      "cycles": 24,
      "loopSkip": 12,
      "loopAttack": 0.01,
      "loopAttackNoise": {
        "amp": 0.045,
        "duration": 0.012
      },
      "env": {
        "a": 0.06,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.75,
        0.6,
        0.48,
        0.38,
        0.3,
        0.25,
        0.23,
        0.21,
        0.19,
        0.17,
        0.15,
        0.13,
        0.11,
        0.09
      ],
      "noise": 0,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5.2,
        "depth": 0.004,
        "sweep": 22
      },
      "drive": 1.15,
      "brightness": {
        "start": 7000,
        "end": 2500
      },
      "formants": [
        {
          "freq": 1400,
          "q": 1.2,
          "gain": 1.4
        },
        {
          "freq": 2800,
          "q": 1.8,
          "gain": 2.2
        },
        {
          "freq": 4200,
          "q": 2.2,
          "gain": 4.2
        },
        {
          "freq": 5400,
          "q": 1.8,
          "gain": 7.4
        },
        {
          "freq": 7000,
          "q": 1.5,
          "gain": 5.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 57,
    "family": "Brass",
    "name": "Trombone",
    "shortName": "Trombone",
    "description": "Trombone: a bold attack and bright, focused tone.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.12,
      "loop": true,
      "cycles": 26,
      "loopSkip": 16,
      "loopAttack": 0.018,
      "loopAttackNoise": {
        "amp": 0.035,
        "duration": 0.016
      },
      "env": {
        "a": 0.06,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.72,
        0.55,
        0.4,
        0.29,
        0.2,
        0.13,
        0.08,
        0.045
      ],
      "noise": 0,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 4.8,
        "depth": 0.003,
        "sweep": 24
      },
      "drive": 1.08,
      "brightness": {
        "start": 7000,
        "end": 2500
      },
      "formants": [
        {
          "freq": 550,
          "q": 1.1,
          "gain": 2
        },
        {
          "freq": 1150,
          "q": 1.5,
          "gain": 2.5
        },
        {
          "freq": 2400,
          "q": 2,
          "gain": 1
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 58,
    "family": "Brass",
    "name": "Tuba",
    "shortName": "Tuba",
    "description": "Tuba: a bold attack and bright, focused tone.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.12,
      "freq": 220,
      "loop": true,
      "cycles": 28,
      "loopSkip": 10,
      "loopAttack": 0.025,
      "loopAttackNoise": {
        "amp": 0.025,
        "duration": 0.02
      },
      "env": {
        "a": 0.06,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.62,
        0.38,
        0.23,
        0.14,
        0.08,
        0.045,
        0.025
      ],
      "noise": 0,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 4.2,
        "depth": 0.0025,
        "sweep": 28
      },
      "drive": 1.05,
      "brightness": {
        "start": 7000,
        "end": 2500
      },
      "formants": [
        {
          "freq": 320,
          "q": 1,
          "gain": 2.5
        },
        {
          "freq": 700,
          "q": 1.2,
          "gain": 2
        },
        {
          "freq": 1400,
          "q": 1.8,
          "gain": 1
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 59,
    "family": "Brass",
    "name": "Muted Trpt",
    "shortName": "Muted Trpt",
    "description": "Muted Trpt: a bold attack and bright, focused tone.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.12,
      "loop": true,
      "cycles": 24,
      "loopSkip": 12,
      "loopAttack": 0.007,
      "loopAttackNoise": {
        "amp": 0.06,
        "duration": 0.009
      },
      "env": {
        "a": 0.06,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.42,
        0.62,
        0.3,
        0.48,
        0.25,
        0.34,
        0.18,
        0.22
      ],
      "noise": 0,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5.5,
        "depth": 0.004,
        "sweep": 20
      },
      "drive": 1.2,
      "brightness": {
        "start": 7000,
        "end": 2500
      },
      "formants": [
        {
          "freq": 1700,
          "q": 1.6,
          "gain": 2.5
        },
        {
          "freq": 3100,
          "q": 2,
          "gain": 3
        },
        {
          "freq": 4600,
          "q": 2.3,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 60,
    "family": "Brass",
    "name": "French Horn",
    "shortName": "French Horn",
    "description": "French Horn: a bold attack and bright, focused tone.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.12,
      "loop": true,
      "cycles": 28,
      "loopSkip": 18,
      "loopAttack": 0.022,
      "loopAttackNoise": {
        "amp": 0.02,
        "duration": 0.018
      },
      "env": {
        "a": 0.06,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.68,
        0.43,
        0.28,
        0.18,
        0.11,
        0.065,
        0.035
      ],
      "noise": 0,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 4.8,
        "depth": 0.003,
        "sweep": 26
      },
      "drive": 1.04,
      "brightness": {
        "start": 7000,
        "end": 2500
      },
      "formants": [
        {
          "freq": 500,
          "q": 1,
          "gain": 2
        },
        {
          "freq": 950,
          "q": 1.3,
          "gain": 2.5
        },
        {
          "freq": 1900,
          "q": 1.8,
          "gain": 1
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 61,
    "family": "Brass",
    "name": "Brass Section",
    "shortName": "Brass Section",
    "description": "Brass Section: a bold attack and bright, focused tone.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.12,
      "loop": true,
      "cycles": 26,
      "loopSkip": 16,
      "loopAttack": 0.02,
      "loopAttackNoise": {
        "amp": 0.045,
        "duration": 0.018
      },
      "env": {
        "a": 0.06,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.82,
        0.66,
        0.5,
        0.37,
        0.27,
        0.19,
        0.13,
        0.085,
        0.05
      ],
      "phases": [
        0,
        0.08,
        0.19,
        0.32,
        0.47,
        0.63,
        0.8,
        0.98,
        0.17,
        0.4
      ],
      "noise": 0,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5,
        "depth": 0.0035,
        "sweep": 24
      },
      "drive": 1.12,
      "brightness": {
        "start": 7000,
        "end": 2500
      },
      "formants": [
        {
          "freq": 750,
          "q": 1,
          "gain": 1.5
        },
        {
          "freq": 1550,
          "q": 1.3,
          "gain": 2
        },
        {
          "freq": 3000,
          "q": 1.8,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 62,
    "family": "Brass",
    "name": "SynthBrass 1",
    "shortName": "SynthBrass 1",
    "description": "SynthBrass 1: a bold attack and bright, focused tone.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.1,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.06,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.65,
        0.55,
        0.3,
        0.18,
        0.1,
        0.05,
        0.025
      ],
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5,
        "depth": 0.003,
        "sweep": 15
      },
      "drive": 1.7,
      "brightness": {
        "start": 7000,
        "end": 2500
      },
      "formants": [
        {
          "freq": 900,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 2200,
          "q": 2,
          "gain": 3
        },
        {
          "freq": 3800,
          "q": 2.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 63,
    "family": "Brass",
    "name": "SynthBrass 2",
    "shortName": "SynthBrass 2",
    "description": "SynthBrass 2: a bold attack and bright, focused tone.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.1,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.06,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.55,
        0.4,
        0.2,
        0.1,
        0.05,
        0.025
      ],
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5.5,
        "depth": 0.004,
        "sweep": 15
      },
      "drive": 1.4,
      "brightness": {
        "start": 7000,
        "end": 2500
      },
      "formants": [
        {
          "freq": 700,
          "q": 1.5,
          "gain": 3
        },
        {
          "freq": 1800,
          "q": 2,
          "gain": 2.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 64,
    "family": "Reed",
    "name": "Soprano Sax",
    "shortName": "Soprano Sax",
    "description": "Soprano Sax: a reedy wind tone with expressive harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.31,
      "freq": 620,
      "loop": true,
      "cycles": 14,
      "loopSkip": 8,
      "loopAttack": 0.008,
      "env": { "a": 0.05, "d": 0.1, "s": 0.9, "r": 0.2 },
      "harm": [1, 0.68, 0.55, 0.42, 0.30, 0.21, 0.14, 0.09, 0.06, 0.04],
      "phases": [0, 0.1, 0.22, 0.4, 0.6, 0.8, 0.05, 0.28, 0.5, 0.7],
      "vibratoOnset": 0.2,
      "vibrato": { "rate": 6, "depth": 0.006, "sweep": 12 },
      "drive": 1.3,
      "formants": [
        { "freq": 1400, "q": 1.5, "gain": 5 },
        { "freq": 2600, "q": 2,   "gain": 5 },
        { "freq": 4300, "q": 2.5, "gain": 6 }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 65,
    "family": "Reed",
    "name": "Alto Sax",
    "shortName": "Alto Sax",
    "description": "Alto Sax: a reedy wind tone with expressive harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.31,
      "freq": 460,
      "loop": true,
      "cycles": 14,
      "env": { "a": 0.05, "d": 0.1, "s": 0.9, "r": 0.2 },
      "harm": [
        1, 0.62, 0.70, 0.42, 0.36, 0.20, 0.15, 0.08, 0.05
      ],
      "vibratoOnset": 0.2,
      "vibrato": { "rate": 5.5, "depth": 0.007, "sweep": 15 },
      "drive": 1.9,
      "brightness": { "start": 10000, "end": 5500 },
      "formants": [
        { "freq": 1050, "q": 1.5, "gain": 5   },
        { "freq": 1950, "q": 2,   "gain": 4   },
        { "freq": 3650, "q": 2.5, "gain": 5   }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 66,
    "family": "Reed",
    "name": "Tenor Sax",
    "shortName": "Tenor Sax",
    "description": "Tenor Sax: a reedy wind tone with expressive harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.31,
      "freq": 320,
      "loop": true,
      "cycles": 14,
      "loopSkip": 8,
      "loopAttack": 0.012,
      "env": { "a": 0.05, "d": 0.1, "s": 0.9, "r": 0.2 },
      "harm": [1, 0.88, 0.45, 0.28, 0.16, 0.09, 0.05, 0.03],
      "phases": [0, 0.08, 0.18, 0.3, 0.45, 0.6, 0.75, 0.9],
      "noise": 0.012,
      "vibratoOnset": 0.2,
      "vibrato": { "rate": 4, "depth": 0.011, "sweep": 18 },
      "drive": 1.4,
      "formants": [
        { "freq": 680,  "q": 1.4, "gain": 6 },
        { "freq": 1300, "q": 1.8, "gain": 4 },
        { "freq": 2400, "q": 2.2, "gain": 4 }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 67,
    "family": "Reed",
    "name": "Bari Sax",
    "shortName": "Bari Sax",
    "description": "Bari Sax: a reedy wind tone with expressive harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.31,
      "freq": 460,
      "loop": true,
      "cycles": 14,
      "loopSkip": 8,
      "loopAttack": 0.01,
      "env": { "a": 0.05, "d": 0.1, "s": 0.9, "r": 0.2 },
      "harm": [1, 0.60, 0.72, 0.42, 0.34, 0.20, 0.13, 0.08, 0.05],
      "phases": [0, 0.2, 0.4, 0.6, 0.8, 0.1, 0.35, 0.6, 0.85],
      "vibratoOnset": 0.2,
      "vibrato": { "rate": 5.5, "depth": 0.007, "sweep": 15 },
      "drive": 1.9,
      "formants": [
        { "freq": 1100, "q": 1.5, "gain": 5 },
        { "freq": 2000, "q": 2,   "gain": 5 },
        { "freq": 3400, "q": 2.5, "gain": 6 }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 68,
    "family": "Reed",
    "name": "Oboe",
    "shortName": "Oboe",
    "description": "Oboe: a reedy wind tone with expressive harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.31,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.05,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        0.85,
        1,
        0.8,
        0.65,
        0.45,
        0.28,
        0.15,
        0.08
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 5.5,
        "depth": 0.007,
        "sweep": 15
      },
      "drive": 1.4,
      "brightness": { "start": 9000, "end": 4800 },
      "formants": [
        {
          "freq": 1500,
          "q": 1.8,
          "gain": 6
        },
        {
          "freq": 3000,
          "q": 2,
          "gain": 4
        },
        {
          "freq": 4500,
          "q": 2.5,
          "gain": 2
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 69,
    "family": "Reed",
    "name": "English Horn",
    "shortName": "English Horn",
    "description": "English Horn: a reedy wind tone with expressive harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.31,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.05,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.8,
        0.6,
        0.45,
        0.3,
        0.18,
        0.1
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 5,
        "depth": 0.006,
        "sweep": 15
      },
      "drive": 1.5,
      "brightness": { "start": 9000, "end": 4800 },
      "formants": [
        {
          "freq": 1100,
          "q": 1.5,
          "gain": 5
        },
        {
          "freq": 2200,
          "q": 2,
          "gain": 3
        },
        { 
          "freq": 3300, 
          "q": 2, 
          "gain": 4 
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 70,
    "family": "Reed",
    "name": "Bassoon",
    "shortName": "Bassoon",
    "description": "Bassoon: a reedy wind tone with expressive harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.31,
      "freq": 220,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.05,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.7,
        0.5,
        0.35,
        0.22,
        0.12,
        0.06
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 4,
        "depth": 0.004,
        "sweep": 15
      },
      "drive": 1.8,
      "brightness": { "start": 9000, "end": 4800 },
      "formants": [
        {
          "freq": 500,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 1200,
          "q": 2,
          "gain": 3
        },
        { "freq": 2600, 
          "q": 2, 
          "gain": 3.5 
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 71,
    "family": "Reed",
    "name": "Clarinet",
    "shortName": "Clarinet",
    "description": "Clarinet: a reedy wind tone with expressive harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.31,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.08,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0,
        0.5,
        0,
        0.3,
        0,
        0.15,
        0,
        0.08
      ],
      "noise": 0.05,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5,
        "depth": 0.005,
        "sweep": 15
      },
      "brightness": {
        "start": 7000,
        "end": 2500
      },
      "brightness": { "start": 9000, "end": 5200 },
      "antiAlias": true
    }
  },
  {
    "program": 72,
    "family": "Pipe",
    "name": "Piccolo",
    "shortName": "Piccolo",
    "description": "Piccolo: a breath-driven tone with a rounded body.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.31,
      "freq": 880,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.08,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.15,
        0.4,
        0.05,
        0.15,
        0.03,
        0.08
      ],
      "noise": 0.05,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 6,
        "depth": 0.01,
        "sweep": 15
      },
      "brightness": {
        "start": 7000,
        "end": 2500
      },
      "antiAlias": true
    }
  },
  {
    "program": 73,
    "family": "Pipe",
    "name": "Flute",
    "shortName": "Flute",
    "description": "Flute: a breath-driven tone with a rounded body.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.63,
      "freq": 880,
      "loop": true,
      "cycles": 28,
      "loopSkip": 16,
      "loopAttack": 0.012,
      "loopAttackNoise": {
        "amp": 0.035,
        "duration": 0.012
      },
      "env": {
        "a": 0.08,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.28,
        0.1,
        0.04,
        0.018,
        0.008,
        0.003
      ],
      "noise": 0,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5.2,
        "depth": 0.004,
        "sweep": 20
      },
      "brightness": { "start": 9000, "end": 5200 },
      "antiAlias": true
    }
  },
  {
    "program": 74,
    "family": "Pipe",
    "name": "Recorder",
    "shortName": "Recorder",
    "description": "Recorder: a breath-driven tone with a rounded body.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "freq": 880,
      "loop": true,
      "cycles": 26,
      "loopSkip": 14,
      "loopAttack": 0.01,
      "loopAttackNoise": {
        "amp": 0.025,
        "duration": 0.01
      },
      "env": {
        "a": 0.08,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.34,
        0.18,
        0.12,
        0.07,
        0.035,
        0.018
      ],
      "noise": 0,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 4.8,
        "depth": 0.002,
        "sweep": 18
      },
      "brightness": {
        "start": 9000,
        "end": 5200
      },
      "antiAlias": true
    }
  },
  {
    "program": 75,
    "family": "Pipe",
    "name": "Pan Flute",
    "shortName": "Pan Flute",
    "description": "Pan Flute: a breath-driven tone with a rounded body.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "freq": 880,
      "loop": true,
      "cycles": 28,
      "loopSkip": 16,
      "loopAttack": 0.018,
      "loopAttackNoise": {
        "amp": 0.07,
        "duration": 0.018
      },
      "env": {
        "a": 0.08,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.4,
        0.22,
        0.11,
        0.06,
        0.03,
        0.015
      ],
      "noise": 0,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5.5,
        "depth": 0.003,
        "sweep": 22
      },
      "brightness": {
        "start": 9000,
        "end": 5200
      },
      "antiAlias": true
    }
  },
  {
    "program": 76,
    "family": "Pipe",
    "name": "Blown Bottle",
    "shortName": "Blown Bottle",
    "description": "Blown Bottle: a breath-driven tone with a rounded body.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.08,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.1,
        0.05,
        0.02
      ],
      "noise": 0.15,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5,
        "depth": 0.008
      },
      "brightness": {
        "start": 9000,
        "end": 5200
      },
      "antiAlias": true
    }
  },
  {
    "program": 77,
    "family": "Pipe",
    "name": "Shakuhachi",
    "shortName": "Shakuhachi",
    "description": "Shakuhachi: a breath-driven tone with a rounded body.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "freq": 660,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.08,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.15,
        0.4,
        0.05,
        0.15,
        0.03,
        0.08
      ],
      "noise": 0.1,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5,
        "depth": 0.02,
        "sweep": 15
      },
      "brightness": {
        "start": 9000,
        "end": 5200
      },
      "antiAlias": true
    }
  },
  {
    "program": 78,
    "family": "Pipe",
    "name": "Whistle",
    "shortName": "Whistle",
    "description": "Whistle: a breath-driven tone with a rounded body.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "freq": 880,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.08,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.05,
        0.02
      ],
      "noise": 0.05,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5,
        "depth": 0.008
      },
      "brightness": {
        "start": 9000,
        "end": 5200
      },
      "antiAlias": true
    }
  },
  {
    "program": 79,
    "family": "Pipe",
    "name": "Ocarina",
    "shortName": "Ocarina",
    "description": "Ocarina: a breath-driven tone with a rounded body.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.42,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.08,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.15,
        0.08,
        0.03
      ],
      "noise": 0.05,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 5,
        "depth": 0.008
      },
      "brightness": {
        "start": 9000,
        "end": 5200
      },
      "antiAlias": true
    }
  },
  {
    "program": 80,
    "family": "Lead",
    "name": "Lead (square)",
    "shortName": "Lead (square)",
    "description": "Lead (square): a focused synth tone with strong harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "loop": true,
      "cycles": 12,
      "env": {
        "a": 0.01,
        "d": 0.2,
        "s": 0.85,
        "r": 0.15
      },
      "harm": [
        1,
        0,
        0.33,
        0,
        0.2,
        0,
        0.14,
        0,
        0.11,
        0,
        0.09
      ],
      "drive": 1.4,
      "brightness": {
        "start": 8000,
        "end": 2500
      },
      "antiAlias": true
    }
  },
  {
    "program": 81,
    "family": "Lead",
    "name": "Lead (saw)",
    "shortName": "Lead (saw)",
    "description": "Lead (saw): a focused synth tone with strong harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "loop": true,
      "cycles": 12,
      "env": {
        "a": 0.01,
        "d": 0.2,
        "s": 0.85,
        "r": 0.15
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2,
        0.16,
        0.14,
        0.12,
        0.1
      ],
      "drive": 1.4,
      "brightness": {
        "start": 8000,
        "end": 2500
      },
      "antiAlias": true
    }
  },
  {
    "program": 82,
    "family": "Lead",
    "name": "Lead (calliope)",
    "shortName": "Lead (calliope)",
    "description": "Lead (calliope): a focused synth tone with strong harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "loop": true,
      "cycles": 12,
      "env": {
        "a": 0.01,
        "d": 0.2,
        "s": 0.85,
        "r": 0.15
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2,
        0.16,
        0.14,
        0.12,
        0.1,
        0.09,
        0.08
      ],
      "drive": 1.4,
      "brightness": {
        "start": 8000,
        "end": 2500
      },
      "antiAlias": true
    }
  },
  {
    "program": 83,
    "family": "Lead",
    "name": "Lead (chiff)",
    "shortName": "Lead (chiff)",
    "description": "Lead (chiff): a focused synth tone with strong harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "loop": true,
      "cycles": 12,
      "env": {
        "a": 0.02,
        "d": 0.1,
        "s": 0.9,
        "r": 0.15
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2,
        0.16,
        0.14,
        0.12,
        0.1
      ],
      "noise": 0.1,
      "drive": 1.4,
      "brightness": {
        "start": 8000,
        "end": 2500
      },
      "antiAlias": true
    }
  },
  {
    "program": 84,
    "family": "Lead",
    "name": "Lead (charang)",
    "shortName": "Lead (charang)",
    "description": "Lead (charang): a focused synth tone with strong harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "loop": true,
      "cycles": 12,
      "env": {
        "a": 0.01,
        "d": 0.2,
        "s": 0.85,
        "r": 0.15
      },
      "harm": [
        1,
        0.8,
        0.6,
        0.5,
        0.4,
        0.35,
        0.3,
        0.25
      ],
      "drive": 1.4,
      "brightness": {
        "start": 8000,
        "end": 2500
      },
      "antiAlias": true
    }
  },
  {
    "program": 85,
    "family": "Lead",
    "name": "Lead (voice)",
    "shortName": "Lead (voice)",
    "description": "Lead (voice): a focused synth tone with strong harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "loop": true,
      "cycles": 12,
      "env": {
        "a": 0.01,
        "d": 0.2,
        "s": 0.85,
        "r": 0.15
      },
      "harm": [
        1,
        0.3,
        0.15,
        0.08
      ],
      "vibrato": {
        "rate": 6,
        "depth": 0.015,
        "sweep": 15
      },
      "drive": 1.4,
      "brightness": {
        "start": 8000,
        "end": 2500
      },
      "antiAlias": true
    }
  },
  {
    "program": 86,
    "family": "Lead",
    "name": "Lead (fifths)",
    "shortName": "Lead (fifths)",
    "description": "Lead (fifths): a focused synth tone with strong harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "loop": true,
      "cycles": 12,
      "env": {
        "a": 0.01,
        "d": 0.2,
        "s": 0.85,
        "r": 0.15
      },
      "harm": [
        1,
        0,
        0.6,
        0,
        0.4,
        0,
        0.25
      ],
      "drive": 1.4,
      "brightness": {
        "start": 8000,
        "end": 2500
      },
      "antiAlias": true
    }
  },
  {
    "program": 87,
    "family": "Lead",
    "name": "Lead (bass+ld)",
    "shortName": "Lead (bass+ld)",
    "description": "Lead (bass+ld): a focused synth tone with strong harmonics.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.38,
      "loop": true,
      "cycles": 12,
      "env": {
        "a": 0.01,
        "d": 0.2,
        "s": 0.85,
        "r": 0.15
      },
      "harm": [
        1,
        1,
        0.5,
        0.5,
        0.33,
        0.33,
        0.25,
        0.25
      ],
      "drive": 1.4,
      "brightness": {
        "start": 8000,
        "end": 2500
      },
      "antiAlias": true
    }
  },
  {
    "program": 88,
    "family": "Pad",
    "name": "Pad (new age)",
    "shortName": "Pad (new age)",
    "description": "Pad (new age): a soft sustained synth texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.65,
      "loop": true,
      "cycles": 16,
      "env": {
        "a": 0.3,
        "d": 0.3,
        "s": 0.95,
        "r": 0.5
      },
      "harm": [
        1,
        0.4,
        0.2,
        0.1,
        0.05
      ],
      "detune": [
        -15,
        0,
        15
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 2,
        "depth": 0.003
      },
      "drive": 1.15,
      "formants": [
        {
          "freq": 250,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 450,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 1100,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 2800,
          "q": 3,
          "gain": 3
        },
        {
          "freq": 4500,
          "q": 3.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 89,
    "family": "Pad",
    "name": "Pad (warm)",
    "shortName": "Pad (warm)",
    "description": "Pad (warm): a soft sustained synth texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.65,
      "loop": true,
      "cycles": 16,
      "env": {
        "a": 0.3,
        "d": 0.3,
        "s": 0.95,
        "r": 0.5
      },
      "harm": [
        1,
        0.3,
        0.15,
        0.08,
        0.04
      ],
      "detune": [
        -15,
        0,
        15
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 2,
        "depth": 0.003
      },
      "drive": 1.15,
      "formants": [
        {
          "freq": 250,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 450,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 1100,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 2800,
          "q": 3,
          "gain": 3
        },
        {
          "freq": 4500,
          "q": 3.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 90,
    "family": "Pad",
    "name": "Pad (polysynth)",
    "shortName": "Pad (polysynth)",
    "description": "Pad (polysynth): a soft sustained synth texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.65,
      "loop": true,
      "cycles": 16,
      "env": {
        "a": 0.3,
        "d": 0.3,
        "s": 0.95,
        "r": 0.5
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2,
        0.16
      ],
      "detune": [
        -8,
        0,
        8
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 2,
        "depth": 0.003
      },
      "drive": 1.15,
      "formants": [
        {
          "freq": 250,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 450,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 1100,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 2800,
          "q": 3,
          "gain": 3
        },
        {
          "freq": 4500,
          "q": 3.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 91,
    "family": "Pad",
    "name": "Pad (choir)",
    "shortName": "Pad (choir)",
    "description": "Pad (choir): a soft sustained synth texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.65,
      "loop": true,
      "cycles": 16,
      "env": {
        "a": 0.3,
        "d": 0.3,
        "s": 0.95,
        "r": 0.5
      },
      "harm": [
        1,
        0.4,
        0.2,
        0.1,
        0.05
      ],
      "detune": [
        -15,
        0,
        15
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 5,
        "depth": 0.015,
        "sweep": 15
      },
      "drive": 1.15,
      "formants": [
        {
          "freq": 250,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 450,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 1100,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 2800,
          "q": 3,
          "gain": 3
        },
        {
          "freq": 4500,
          "q": 3.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 92,
    "family": "Pad",
    "name": "Pad (bowed)",
    "shortName": "Pad (bowed)",
    "description": "Pad (bowed): a soft sustained synth texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.65,
      "loop": true,
      "cycles": 16,
      "env": {
        "a": 0.3,
        "d": 0.3,
        "s": 0.95,
        "r": 0.5
      },
      "harm": [
        1,
        0.4,
        0.2,
        0.1,
        0.05
      ],
      "detune": [
        -15,
        0,
        15
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 2,
        "depth": 0.003
      },
      "drive": 1.15,
      "formants": [
        {
          "freq": 250,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 450,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 1100,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 2800,
          "q": 3,
          "gain": 3
        },
        {
          "freq": 4500,
          "q": 3.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 93,
    "family": "Pad",
    "name": "Pad (metallic)",
    "shortName": "Pad (metallic)",
    "description": "Pad (metallic): a soft sustained synth texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.65,
      "loop": true,
      "cycles": 16,
      "env": {
        "a": 0.3,
        "d": 0.3,
        "s": 0.95,
        "r": 0.5
      },
      "harm": [
        1,
        0.4,
        0.2,
        0.1,
        0.05
      ],
      "detune": [
        -15,
        0,
        15
      ],
      "fm": {
        "ratio": 2.5,
        "index": 1
      },
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 2,
        "depth": 0.003
      },
      "drive": 1.15,
      "formants": [
        {
          "freq": 250,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 450,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 1100,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 2800,
          "q": 3,
          "gain": 3
        },
        {
          "freq": 4500,
          "q": 3.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 94,
    "family": "Pad",
    "name": "Pad (halo)",
    "shortName": "Pad (halo)",
    "description": "Pad (halo): a soft sustained synth texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.65,
      "loop": true,
      "cycles": 16,
      "env": {
        "a": 0.3,
        "d": 0.3,
        "s": 0.95,
        "r": 0.5
      },
      "harm": [
        1,
        0.2,
        0.4,
        0.1,
        0.2,
        0.05
      ],
      "detune": [
        -15,
        0,
        15
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 2,
        "depth": 0.003
      },
      "drive": 1.15,
      "formants": [
        {
          "freq": 250,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 450,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 1100,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 2800,
          "q": 3,
          "gain": 3
        },
        {
          "freq": 4500,
          "q": 3.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 95,
    "family": "Pad",
    "name": "Pad (sweep)",
    "shortName": "Pad (sweep)",
    "description": "Pad (sweep): a soft sustained synth texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.65,
      "loop": true,
      "cycles": 16,
      "env": {
        "a": 0.3,
        "d": 0.3,
        "s": 0.95,
        "r": 0.5
      },
      "harm": [
        1,
        0.4,
        0.2,
        0.1,
        0.05
      ],
      "detune": [
        -15,
        0,
        15
      ],
      "fm": {
        "ratio": 1,
        "index": 2
      },
      "noise": 0.05,
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 2,
        "depth": 0.003
      },
      "drive": 1.15,
      "formants": [
        {
          "freq": 250,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 450,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 1100,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 2800,
          "q": 3,
          "gain": 3
        },
        {
          "freq": 4500,
          "q": 3.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 96,
    "family": "FX",
    "name": "FX (rain)",
    "shortName": "FX (rain)",
    "description": "FX (rain): an evolving synthetic texture with distinct.",
    "preset": {
      "defaultWaveform": null,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.05,
        "d": 0.5,
        "s": 0.5,
        "r": 0.4
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 1.5,
        "index": 3
      },
      "noise": 0.3,
      "antiAlias": true
    }
  },
  {
    "program": 97,
    "family": "FX",
    "name": "FX (soundtrack)",
    "shortName": "FX (soundtrack)",
    "description": "FX (soundtrack): an evolving synthetic texture with.",
    "preset": {
      "defaultWaveform": null,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.05,
        "d": 0.5,
        "s": 0.5,
        "r": 0.4
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 1.5,
        "index": 3
      },
      "noise": 0.2,
      "antiAlias": true
    }
  },
  {
    "program": 98,
    "family": "FX",
    "name": "FX (crystal)",
    "shortName": "FX (crystal)",
    "description": "FX (crystal): an evolving synthetic texture with distinct.",
    "preset": {
      "defaultWaveform": null,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.05,
        "d": 0.5,
        "s": 0.5,
        "r": 0.4
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 3,
        "index": 3
      },
      "noise": 0.2,
      "antiAlias": true
    }
  },
  {
    "program": 99,
    "family": "FX",
    "name": "FX (atmosphere)",
    "shortName": "FX (atmosphere)",
    "description": "FX (atmosphere): nylon pluck with a faint airy shimmer.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.002,
        "d": 1.5,
        "s": 0,
        "r": 0.5
      },
      "harm": [
        1,
        0.8,
        0.6,
        0.4,
        0.25,
        0.15,
        0.08,
        0.04,
        0.02
      ],
      "partialDecay": [
        3.2,
        1.9,
        1.15,
        0.78,
        0.52,
        0.36,
        0.25,
        0.18,
        0.13
      ],
      "inharmonicity": 0.00008,
      "detune": [
        -3,
        3
      ],
      "attackNoise": {
        "amp": 0.045,
        "duration": 0.016
      },
      "pluckPosition": 0.2,
      "pluckTransient": {
        "freq": 2600,
        "q": 0.9,
        "amp": 0.035,
        "duration": 0.022,
        "decay": 0.01,
        "type": "pink"
      },
      "brightness": {
        "start": 9500,
        "end": 2600
      },
      "antiAlias": true
    }
  },
  {
    "program": 100,
    "family": "FX",
    "name": "FX (brightness)",
    "shortName": "FX (brightness)",
    "description": "FX (brightness): an evolving synthetic texture with.",
    "preset": {
      "defaultWaveform": null,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.05,
        "d": 0.5,
        "s": 0.5,
        "r": 0.4
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 4,
        "index": 2
      },
      "noise": 0.2,
      "antiAlias": true
    }
  },
  {
    "program": 101,
    "family": "FX",
    "name": "FX (goblins)",
    "shortName": "FX (goblins)",
    "description": "FX (goblins): an evolving synthetic texture with distinct.",
    "preset": {
      "defaultWaveform": null,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.05,
        "d": 0.5,
        "s": 0.5,
        "r": 0.4
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 0.5,
        "index": 4
      },
      "noise": 0.2,
      "antiAlias": true
    }
  },
  {
    "program": 102,
    "family": "FX",
    "name": "FX (echoes)",
    "shortName": "FX (echoes)",
    "description": "FX (echoes): an evolving synthetic texture with distinct.",
    "preset": {
      "defaultWaveform": null,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.05,
        "d": 0.5,
        "s": 0.5,
        "r": 0.4
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 2.1,
        "index": 2.5
      },
      "noise": 0.2,
      "antiAlias": true
    }
  },
  {
    "program": 103,
    "family": "FX",
    "name": "FX (sci-fi)",
    "shortName": "FX (sci-fi)",
    "description": "FX (sci-fi): an evolving synthetic texture with distinct.",
    "preset": {
      "defaultWaveform": null,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.05,
        "d": 0.5,
        "s": 0.5,
        "r": 0.4
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 1.7,
        "index": 3.5
      },
      "noise": 0.2,
      "antiAlias": true
    }
  },
  {
    "program": 104,
    "family": "Ethnic",
    "name": "Sitar",
    "shortName": "Sitar",
    "description": "Sitar: a distinctive folk tone with a bright attack.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.005,
        "d": 0.7,
        "s": 0.2,
        "r": 0.35
      },
      "harm": [
        1,
        0.5,
        0.3,
        0.7,
        0.3,
        0.4,
        0.2,
        0.25,
        0.1
      ],
      "vibrato": {
        "rate": 5,
        "depth": 0.01
      },
      "antiAlias": true
    }
  },
  {
    "program": 105,
    "family": "Ethnic",
    "name": "Banjo",
    "shortName": "Banjo",
    "description": "Banjo: a distinctive folk tone with a bright attack.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.4,
        "s": 0.05,
        "r": 0.2
      },
      "harm": [
        1,
        0.6,
        0.4,
        0.25,
        0.15,
        0.1,
        0.06
      ],
      "partialDecay": [
        3,
        2.2,
        1.6,
        1.2,
        0.9,
        0.7,
        0.5,
        0.4,
        0.3
      ],
      "attackNoise": {
        "amp": 0.12,
        "duration": 0.012
      },
      "brightness": {
        "start": 7000,
        "end": 1200
      },
      "formants": [
        {
          "freq": 100,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 220,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 450,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 1200,
          "q": 3,
          "gain": 2
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 106,
    "family": "Ethnic",
    "name": "Shamisen",
    "shortName": "Shamisen",
    "description": "Shamisen: a distinctive folk tone with a bright attack.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.4,
        "s": 0,
        "r": 0.15
      },
      "harm": [
        1,
        0.6,
        0.4,
        0.25,
        0.15,
        0.1,
        0.05
      ],
      "vibrato": {
        "rate": 5,
        "depth": 0.01
      },
      "antiAlias": true
    }
  },
  {
    "program": 107,
    "family": "Ethnic",
    "name": "Koto",
    "shortName": "Koto",
    "description": "Koto: a distinctive folk tone with a bright attack.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 44100,
      "loop": false,
      "env": {
        "a": 0.002,
        "d": 0.6,
        "s": 0.1,
        "r": 0.3
      },
      "harm": [
        1,
        0.6,
        0.4,
        0.25,
        0.15,
        0.1,
        0.05
      ],
      "vibrato": {
        "rate": 5,
        "depth": 0.01
      },
      "antiAlias": true
    }
  },
  {
    "program": 108,
    "family": "Ethnic",
    "name": "Kalimba",
    "shortName": "Kalimba",
    "description": "Kalimba: a distinctive folk tone with a bright attack.",
    "preset": {
      "defaultWaveform": null,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.4,
        "s": 0,
        "r": 0.15
      },
      "harm": [
        1,
        0.3,
        0.1
      ],
      "partialDecay": [
        3,
        2,
        1.4,
        1,
        0.7,
        0.5
      ],
      "inharmonicity": 0.008,
      "antiAlias": true
    }
  },
  {
    "program": 109,
    "family": "Ethnic",
    "name": "Bagpipe",
    "shortName": "Bagpipe",
    "description": "Bagpipe: a distinctive folk tone with a bright attack.",
    "preset": {
      "defaultWaveform": null,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.08,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.5,
        0.8,
        0.3,
        0.4,
        0.2,
        0.2
      ],
      "noise": 0.05,
      "attackNoise": {
        "amp": 0.08,
        "duration": 0.018
      },
      "pitchScoop": {
        "depth": 0.02,
        "time": 0.03
      },
      "vibratoOnset": 0.18,
      "vibrato": {
        "rate": 6,
        "depth": 0.02,
        "sweep": 15
      },
      "brightness": {
        "start": 7000,
        "end": 2500
      },
      "antiAlias": true
    }
  },
  {
    "program": 110,
    "family": "Ethnic",
    "name": "Fiddle",
    "shortName": "Fiddle",
    "description": "Fiddle: a distinctive folk tone with a bright attack.",
    "preset": {
      "defaultWaveform": null,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.10,
        "d": 0.2,
        "s": 0.9,
        "r": 0.3
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2,
        0.16,
        0.14,
        0.12
      ],
      "detune": [
        0
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 6.5,
        "depth": 0.01,
        "sweep": 15
      },
      "drive": 1.15,
      "formants": [
        {
          "freq": 250,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 450,
          "q": 2,
          "gain": 5
        },
        {
          "freq": 1100,
          "q": 2.5,
          "gain": 4
        },
        {
          "freq": 2800,
          "q": 3,
          "gain": 3
        },
        {
          "freq": 4500,
          "q": 3.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 111,
    "family": "Ethnic",
    "name": "Shanai",
    "shortName": "Shanai",
    "description": "Shanai: a distinctive folk tone with a bright attack.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "loop": true,
      "cycles": 14,
      "env": {
        "a": 0.05,
        "d": 0.1,
        "s": 0.9,
        "r": 0.2
      },
      "harm": [
        1,
        0.4,
        0.7,
        0.3,
        0.5,
        0.2,
        0.3
      ],
      "vibratoOnset": 0.2,
      "vibrato": {
        "rate": 7,
        "depth": 0.02,
        "sweep": 15
      },
      "drive": 1.5,
      "formants": [
        {
          "freq": 900,
          "q": 1.5,
          "gain": 4
        },
        {
          "freq": 1800,
          "q": 2,
          "gain": 3
        },
        {
          "freq": 3200,
          "q": 2.5,
          "gain": 1.5
        }
      ],
      "antiAlias": true
    }
  },
  {
    "program": 112,
    "family": "Perc",
    "name": "Tinkle Bell",
    "shortName": "Tinkle Bell",
    "description": "Tinkle Bell: a pitched strike with clear resonance.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.6,
        "s": 0,
        "r": 0.2
      },
      "harm": [
        1,
        0.2,
        0.1,
        0.05
      ],
      "partialDecay": [
        3,
        2,
        1.4,
        1,
        0.7,
        0.5
      ],
      "inharmonicity": 0.008,
      "antiAlias": true
    }
  },
  {
    "program": 113,
    "family": "Perc",
    "name": "Agogo",
    "shortName": "Agogo",
    "description": "Agogo: a pitched strike with clear resonance.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.5,
        "s": 0,
        "r": 0.2
      },
      "harm": [
        1,
        0.5,
        0.25
      ],
      "partialDecay": [
        3,
        2,
        1.4,
        1,
        0.7,
        0.5
      ],
      "inharmonicity": 0.008,
      "antiAlias": true
    }
  },
  {
    "program": 114,
    "family": "Perc",
    "name": "Steel Drums",
    "shortName": "Steel Drums",
    "description": "Steel Drums: a pitched strike with clear resonance.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "freq": 441,
      "length": 55125,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.9,
        "s": 0,
        "r": 0.3
      },
      "harm": [
        1,
        0.4,
        0.2,
        0.15,
        0.08,
        0.04
      ],
      "partialDecay": [
        3,
        2,
        1.4,
        1,
        0.7,
        0.5
      ],
      "inharmonicity": 0.008,
      "antiAlias": true
    }
  },
  {
    "program": 115,
    "family": "Perc",
    "name": "Woodblock",
    "shortName": "Woodblock",
    "description": "Woodblock: a pitched strike with clear resonance.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "freq": 441,
      "length": 2205,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.1,
        "s": 0,
        "r": 0.05
      },
      "harm": [
        1,
        0.3,
        0.15
      ],
      "noise": 0.2,
      "antiAlias": true
    }
  },
  {
    "program": 116,
    "family": "Perc",
    "name": "Taiko Drum",
    "shortName": "Taiko Drum",
    "description": "Taiko Drum: a pitched strike with clear resonance.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "freq": 220,
      "length": 4410,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.5,
        "s": 0,
        "r": 0.2
      },
      "harm": [
        1,
        0.6,
        0.3,
        0.15
      ],
      "noise": 0.1,
      "antiAlias": true
    }
  },
  {
    "program": 117,
    "family": "Perc",
    "name": "Melodic Tom",
    "shortName": "Melodic Tom",
    "description": "Melodic Tom: a pitched strike with clear resonance.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "freq": 330,
      "length": 3307,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.3,
        "s": 0,
        "r": 0.1
      },
      "harm": [
        1,
        0.4,
        0.2,
        0.1
      ],
      "noise": 0.3,
      "antiAlias": true
    }
  },
  {
    "program": 118,
    "family": "Perc",
    "name": "Synth Drum",
    "shortName": "Synth Drum",
    "description": "Synth Drum: a pitched strike with clear resonance.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "freq": 220,
      "length": 3307,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.3,
        "s": 0,
        "r": 0.1
      },
      "harm": [
        1,
        0.4,
        0.2,
        0.1
      ],
      "noise": 0.15,
      "antiAlias": true
    }
  },
  {
    "program": 119,
    "family": "Perc",
    "name": "Reverse Cymbal",
    "shortName": "Reverse Cymbal",
    "description": "Reverse Cymbal: a pitched strike with clear resonance.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "length": 8820,
      "loop": false,
      "env": {
        "a": 0.5,
        "d": 0,
        "s": 1,
        "r": 0.1
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 1.5,
        "index": 3
      },
      "noise": 0.6,
      "antiAlias": true
    }
  },
  {
    "program": 120,
    "family": "SFX",
    "name": "Fret Noise",
    "shortName": "Fret Noise",
    "description": "Fret Noise: a recognizable effect with a distinct texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "length": 2205,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.1,
        "s": 0,
        "r": 0.05
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 1.5,
        "index": 3
      },
      "noise": 0.7,
      "antiAlias": true
    }
  },
  {
    "program": 121,
    "family": "SFX",
    "name": "Breath Noise",
    "shortName": "Breath Noise",
    "description": "Breath Noise: a recognizable effect with a distinct texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "length": 3307,
      "loop": false,
      "env": {
        "a": 0.05,
        "d": 0.2,
        "s": 0,
        "r": 0.1
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 1.5,
        "index": 3
      },
      "noise": 0.8,
      "antiAlias": true
    }
  },
  {
    "program": 122,
    "family": "SFX",
    "name": "Seashore",
    "shortName": "Seashore",
    "description": "Seashore: a recognizable effect with a distinct texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "length": 8820,
      "loop": false,
      "env": {
        "a": 0.5,
        "d": 1.5,
        "s": 0.5,
        "r": 0.5
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 1.5,
        "index": 3
      },
      "noise": 0.9,
      "antiAlias": true
    }
  },
  {
    "program": 123,
    "family": "SFX",
    "name": "Bird Tweet",
    "shortName": "Bird Tweet",
    "description": "Bird Tweet: a recognizable effect with a distinct texture.",
    "preset": {
      "defaultWaveform": null,
      "length": 4410,
      "loop": false,
      "env": {
        "a": 0.01,
        "d": 0.3,
        "s": 0.2,
        "r": 0.2
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 4,
        "index": 5
      },
      "noise": 0.2,
      "antiAlias": true
    }
  },
  {
    "program": 124,
    "family": "SFX",
    "name": "Telephone",
    "shortName": "Telephone",
    "description": "Telephone: a recognizable effect with a distinct texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "length": 6615,
      "loop": false,
      "env": {
        "a": 0.05,
        "d": 0.5,
        "s": 0.5,
        "r": 0.4
      },
      "harm": [
        1,
        0,
        0.5,
        0,
        0.25
      ],
      "fm": {
        "ratio": 1.5,
        "index": 3
      },
      "noise": 0.2,
      "vibrato": {
        "rate": 15,
        "depth": 0.05,
        "sweep": 15
      },
      "antiAlias": true
    }
  },
  {
    "program": 125,
    "family": "SFX",
    "name": "Helicopter",
    "shortName": "Helicopter",
    "description": "Helicopter: a recognizable effect with a distinct texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "length": 8820,
      "loop": false,
      "env": {
        "a": 0.05,
        "d": 0.5,
        "s": 0.5,
        "r": 0.4
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 1.02,
        "index": 2
      },
      "noise": 0.5,
      "antiAlias": true
    }
  },
  {
    "program": 126,
    "family": "SFX",
    "name": "Applause",
    "shortName": "Applause",
    "description": "Applause: a recognizable effect with a distinct texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "length": 8820,
      "loop": false,
      "env": {
        "a": 0.05,
        "d": 2,
        "s": 0.7,
        "r": 0.5
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 1.5,
        "index": 3
      },
      "noise": 0.9,
      "antiAlias": true
    }
  },
  {
    "program": 127,
    "family": "SFX",
    "name": "Gunshot",
    "shortName": "Gunshot",
    "description": "Gunshot: a recognizable effect with a distinct texture.",
    "preset": {
      "defaultWaveform": null,
      "gain": 0.3,
      "length": 4410,
      "loop": false,
      "env": {
        "a": 0.001,
        "d": 0.3,
        "s": 0,
        "r": 0.1
      },
      "harm": [
        1,
        0.5,
        0.33,
        0.25,
        0.2
      ],
      "fm": {
        "ratio": 1.5,
        "index": 3
      },
      "noise": 0.9,
      "antiAlias": true
    }
  }
  ]
};
