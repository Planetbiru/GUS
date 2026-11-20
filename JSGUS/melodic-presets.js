// Optional preset.tremolo: { rate: 0-25 Hz, sweep: GUS byte 0-255, depth: 0-1 }.
// Omitted in the built-in presets so generated patches keep tremolo disabled.
var GUS_MELODIC_PRESETS = {
  "gain": 0.24,
  "instruments": [
    {
      "program": 0,
      "family": "Piano",
      "name": "Acoustic Grand Piano",
      "shortName": "Ac. Grand Piano",
      "description": "Clear struck-key tone with a controlled decay.",
      "preset": {
        "mute": false,
        "defaultWaveform": "hammer",
        "gain": 0.55,
        "freq": 441,
        "length": 37485,
        "loop": false,
        "env": {
          "a": 0.001,
          "d": 1.4,
          "s": 0,
          "r": 0.22
        },
        "harm": [
          1,
          0.56,
          0.36,
          0.225,
          0.144,
          0.099,
          0.0675,
          0.045,
          0.0306,
          0.0207,
          0.0144,
          0.0099,
          0.0072,
          0.0054,
          0.00405,
          0.00315,
          0.00243,
          0.00189,
          0.00153,
          0.00117,
          0.0009,
          0.00072,
          0.00054,
          0.000405
        ],
        "partialDecay": [
          2.4,
          1.5,
          1,
          0.72,
          0.52,
          0.38,
          0.28,
          0.21,
          0.16,
          0.12,
          0.09,
          0.07,
          0.06,
          0.05,
          0.045,
          0.04,
          0.035,
          0.03,
          0.027,
          0.024,
          0.021,
          0.018,
          0.016,
          0.014
        ],
        "phases": [
          0,
          0.06,
          0.16,
          0.29,
          0.44,
          0.6,
          0.78,
          0.97,
          0.18,
          0.4,
          0.63,
          0.87,
          0.13,
          0.46,
          0.79,
          0.22,
          0.58,
          0.91,
          0.35,
          0.68,
          0.04,
          0.42,
          0.76,
          0.18
        ],
        "inharmonicity": 0.00018,
        "attackNoise": {
          "amp": 0.12,
          "duration": 0.006
        },
        "pluckTransient": {
          "freq": 4200,
          "q": 1.1,
          "amp": 0.1,
          "duration": 0.014,
          "decay": 0.004,
          "type": "pink"
        },
        "pitchScoop": {
          "depth": 0.003,
          "time": 0.006
        },
        "brightness": {
          "start": 15000,
          "end": 9500
        },
        "highpass": 230,
        "antiAlias": true
      }
    },
    {
      "program": 1,
      "family": "Piano",
      "name": "Bright Piano",
      "shortName": "Bright Piano",
      "description": "Struck-key tone with a resonant decay.",
      "preset": {
        "mute": false,
        "defaultWaveform": "hammer",
        "gain": 0.55,
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
        "highpass": 80,
        "antiAlias": true
      }
    },
    {
      "program": 2,
      "family": "Piano",
      "name": "Electric Grand",
      "shortName": "Elec. Grand",
      "description": "Struck-key tone with a resonant decay.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bell",
        "gain": 0.55,
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
        "highpass": 80,
        "antiAlias": true
      }
    },
    {
      "program": 3,
      "family": "Piano",
      "name": "Honky-tonk",
      "shortName": "Honky-tonk",
      "description": "Struck-key tone with a resonant decay.",
      "preset": {
        "mute": false,
        "defaultWaveform": "hammer",
        "gain": 0.55,
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
        "highpass": 80,
        "antiAlias": true
      }
    },
    {
      "program": 4,
      "family": "Piano",
      "name": "E.Piano 1",
      "shortName": "E.Piano 1",
      "description": "Struck-key tone with a resonant decay.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bell",
        "gain": 0.55,
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
          "index": 1.6
        },
        "highpass": 230,
        "antiAlias": true
      }
    },
    {
      "program": 5,
      "family": "Piano",
      "name": "E.Piano 2",
      "shortName": "E.Piano 2",
      "description": "Struck-key tone with a resonant decay.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bell",
        "gain": 0.55,
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
          "index": 2.25
        },
        "highpass": 230,
        "antiAlias": true
      }
    },
    {
      "program": 6,
      "family": "Piano",
      "name": "Harpsichord",
      "shortName": "Harpsichord",
      "description": "Struck-key tone with a resonant decay.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.55,
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
        "highpass": 80,
        "antiAlias": true
      }
    },
    {
      "program": 7,
      "family": "Piano",
      "name": "Clavinet",
      "shortName": "Clavinet",
      "description": "Struck-key tone with a resonant decay.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.55,
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
        "highpass": 80,
        "antiAlias": true
      }
    },
    {
      "program": 8,
      "family": "Chromatic",
      "name": "Celesta",
      "shortName": "Celesta",
      "description": "A bright strike with a clear ringing tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bell",
        "gain": 0.55,
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
      "description": "A bright strike with a clear ringing tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bell",
        "gain": 0.55,
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
      "description": "A bright strike with a clear ringing tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.55,
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
      "description": "A bright strike with a clear ringing tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bell",
        "gain": 0.55,
        "freq": 441,
        "length": 55125,
        "loop": false,
        "env": {
          "a": 0.004,
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
          "rate": 0.42,
          "depth": 0.02
        },
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 12,
      "family": "Chromatic",
      "name": "Marimba",
      "shortName": "Marimba",
      "description": "A bright strike with a clear ringing tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "hammer",
        "gain": 0.55,
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
      "description": "A bright strike with a clear ringing tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "hammer",
        "gain": 0.55,
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
      "description": "A bright strike with a clear ringing tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bell",
        "gain": 0.58,
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
      "description": "A bright strike with a clear ringing tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.58,
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
      "description": "A steady tone with layered harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "organ",
        "gain": 0.38,
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
      "description": "A steady tone with layered harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pulse",
        "gain": 0.38,
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
      "description": "A steady tone with layered harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "square",
        "gain": 0.38,
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
      "description": "A steady tone with layered harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "organ",
        "gain": 0.38,
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
      "description": "A steady tone with layered harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "reed",
        "gain": 0.38,
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 21,
      "family": "Organ",
      "name": "Accordion",
      "shortName": "Accordion",
      "description": "A steady tone with layered harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "reed",
        "gain": 0.38,
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
        "drive": 1.0,
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 22,
      "family": "Organ",
      "name": "Harmonica",
      "shortName": "Harmonica",
      "description": "A steady tone with layered harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "reed",
        "gain": 0.38,
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
      "description": "A steady tone with layered harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "reed",
        "gain": 0.38,
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 24,
      "family": "Guitar",
      "name": "Nylon Guitar",
      "shortName": "Nylon Guitar",
      "description": "Warm, rounded pluck with a soft decay.",
      "preset": {
        "mute": false,
        "defaultWaveform": null,
        "gain": 0.51,
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
          0.3,
          0.18,
          0.14,
          0.12,
          0.1,
          0.085,
          0.09,
          0.078,
          0.07,
          0.063,
          0.056,
          0.05,
          0.046,
          0.041,
          0.037,
          0.034,
          0.03,
          0.026,
          0.024,
          0.021,
          0.019,
          0.017,
          0.014,
          0.012,
          0.0105,
          0.009,
          0.0075,
          0.006,
          0.0045,
          0.0035,
          0.0025
        ],
        "partialDecay": [
          2.4,
          1.6,
          1.1,
          0.9,
          0.8,
          0.75,
          0.7,
          0.65,
          0.6,
          0.55,
          0.5,
          0.46,
          0.42,
          0.39,
          0.36,
          0.33,
          0.31,
          0.29,
          0.27,
          0.25,
          0.23,
          0.21,
          0.19,
          0.17,
          0.16,
          0.15,
          0.14,
          0.13,
          0.12,
          0.11,
          0.1,
          0.09
        ],
        "inharmonicity": 0.00002,
        "attackNoise": {
          "amp": 0.003,
          "duration": 0.005
        },
        "pluckPosition": 0.22,
        "pluckTransient": {
          "freq": 3000,
          "q": 1,
          "amp": 0.006,
          "duration": 0.007,
          "decay": 0.007
        },
        "pitchScoop": {
          "depth": 0.0005,
          "time": 0.012
        },
        "brightness": {
          "start": 18000,
          "end": 12000
        },
        "formants": [
          {
            "freq": 150,
            "q": 0.8,
            "gain": 0
          },
          {
            "freq": 230,
            "q": 0.8,
            "gain": 0
          },
          {
            "freq": 410,
            "q": 0.85,
            "gain": 0.25
          },
          {
            "freq": 780,
            "q": 0.95,
            "gain": 0.6
          },
          {
            "freq": 3000,
            "q": 1,
            "gain": 1.5
          },
          {
            "freq": 4600,
            "q": 1,
            "gain": 2
          },
          {
            "freq": 7000,
            "q": 1,
            "gain": 1.4
          }
        ],
        "highpass": 300,
        "antiAlias": true
      }
    },
    {
      "program": 25,
      "family": "Guitar",
      "name": "Steel Guitar",
      "shortName": "Steel Guitar",
      "description": "Bright pluck with a smooth, controlled attack.",
      "preset": {
        "mute": false,
        "defaultWaveform": null,
        "gain": 0.51,
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
          0.75,
          0.55,
          0.42,
          0.38,
          0.32,
          0.28,
          0.29,
          0.24,
          0.2,
          0.17,
          0.15,
          0.13,
          0.12,
          0.11,
          0.1,
          0.09,
          0.08,
          0.07,
          0.06,
          0.054,
          0.048,
          0.042,
          0.036,
          0.031,
          0.026,
          0.022,
          0.019,
          0.016,
          0.013,
          0.01,
          0.007
        ],
        "partialDecay": [
          2.8,
          1.9,
          1.35,
          1,
          0.9,
          0.85,
          0.8,
          0.75,
          0.7,
          0.65,
          0.6,
          0.55,
          0.5,
          0.46,
          0.42,
          0.38,
          0.35,
          0.32,
          0.29,
          0.26,
          0.24,
          0.22,
          0.2,
          0.18,
          0.16,
          0.14,
          0.12,
          0.1,
          0.09,
          0.08,
          0.07,
          0.06
        ],
        "inharmonicity": 0.00006,
        "attackNoise": {
          "amp": 0.02,
          "duration": 0.006
        },
        "pluckPosition": 0.18,
        "pluckTransient": {
          "freq": 4800,
          "q": 1,
          "amp": 0.03,
          "duration": 0.009,
          "decay": 0.007
        },
        "pitchScoop": {
          "depth": 0.001,
          "time": 0.01
        },
        "brightness": {
          "start": 19000,
          "end": 13000
        },
        "formants": [
          {
            "freq": 115,
            "q": 1.2,
            "gain": 0
          },
          {
            "freq": 230,
            "q": 1.8,
            "gain": 0.5
          },
          {
            "freq": 520,
            "q": 2.2,
            "gain": 1
          },
          {
            "freq": 1150,
            "q": 1.7,
            "gain": 0.4
          },
          {
            "freq": 2900,
            "q": 1.2,
            "gain": 2
          },
          {
            "freq": 4800,
            "q": 1,
            "gain": 2
          },
          {
            "freq": 7000,
            "q": 1,
            "gain": 1.7
          },
          {
            "freq": 9500,
            "q": 0.9,
            "gain": 1
          }
        ],
        "highpass": 300,
        "antiAlias": true
      }
    },
    {
      "program": 26,
      "family": "Guitar",
      "name": "Jazz Guitar",
      "shortName": "Jazz Guitar",
      "description": "A plucked-string attack with natural decay.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.465,
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
        "highpass": 300,
        "antiAlias": true
      }
    },
    {
      "program": 27,
      "family": "Guitar",
      "name": "Clean Guitar",
      "shortName": "Clean Guitar",
      "description": "A plucked-string attack with natural decay.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.82,
        "freq": 441,
        "length": 44100,
        "loop": false,
        "cycles": 14,
        "loopSkip": 2,
        "env": {
          "a": 0.002,
          "d": 0.65,
          "s": 0.04,
          "r": 0.25
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
          "amp": 0.08,
          "duration": 0.009
        },
        "guitarAmp": {
          "drive": 1,
          "bias": 0,
          "mix": 0.15,
          "preampCutoff": 75,
          "cabinetCutoff": 9500
        },
        "brightness": {
          "start": 10500,
          "end": 5600,
          "loopCutoff": 5200
        },
        "highpass": 1200,
        "antiAlias": true
      }
    },
    {
      "program": 28,
      "family": "Guitar",
      "name": "Muted Guitar",
      "shortName": "Muted Guitar",
      "description": "A plucked-string attack with natural decay.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.48,
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
        "highpass": 800,
        "antiAlias": true
      }
    },
    {
      "program": 29,
      "family": "Guitar",
      "name": "Overdriven Gtr",
      "shortName": "Overdriven Gtr",
      "description": "Driven guitar with a sustained loop.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
        "gain": 0.48,
        "freq": 441,
        "length": 44100,
        "loop": true,
        "cycles": 32,
        "loopSkip": 8,
        "loopAttack": 0.006,
        "loopAttackNoise": {
          "amp": 0.06,
          "duration": 0.014
        },
        "env": {
          "a": 0.004,
          "d": 0.8,
          "s": 0.1,
          "r": 0.3
        },
        "harm": [
          1.00, 0.72, 0.55, 0.42, 0.33, 0.26, 0.20, 0.155, 0.12, 0.095,
          0.075, 0.060, 0.048, 0.038, 0.031, 0.025, 0.020, 0.017, 0.014, 0.012,
          0.010, 0.0085, 0.0075, 0.0065, 0.0055
        ],
        "noise": 0.008,
        "vibrato": {
          "rate": 5.0,
          "depth": 0.0035,
          "sweep": 14
        },
        "guitarAmp": {
          "drive": 1.35,
          "bias": 0.008,
          "mix": 0.64,
          "clip": 0.0,
          "preampCutoff": 70,
          "cabinetCutoff": 5600
        },
        "formants": [
          { "freq": 500,  "q": 1.5, "gain": -1.0 },
          { "freq": 1100, "q": 1.3, "gain": 1.0 },
          { "freq": 2000, "q": 1.4, "gain": 1.0 },
          { "freq": 3200, "q": 1.6, "gain": 0.75 }
        ],
        "brightness": {
          "loopCutoff": 5800
        },
        "highpass": 80,
        "antiAlias": true
      }
    },
    {
      "program": 30,
      "family": "Guitar",
      "name": "Distortion Gtr",
      "shortName": "Distortion Gtr",
      "description": "Driven guitar with a sustained loop.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
        "gain": 0.66,
        "freq": 441,
        "length": 44100,
        "loop": true,
        "cycles": 32,
        "loopSkip": 8,
        "loopAttack": 0.006,
        "loopAttackNoise": {
          "amp": 0.08,
          "duration": 0.014
        },
        "env": {
          "a": 0.004,
          "d": 0.8,
          "s": 0.1,
          "r": 0.3
        },
        "harm": [
          1,
          0.68,
          0.52,
          0.4,
          0.31,
          0.24,
          0.185,
          0.145,
          0.112,
          0.088,
          0.07,
          0.055,
          0.044,
          0.035,
          0.028,
          0.023,
          0.019,
          0.015,
          0.013,
          0.011,
          0.009,
          0.008,
          0.007,
          0.006,
          0.005
        ],
        "noise": 0.006,
        "vibrato": {
          "rate": 5.2,
          "depth": 0.003,
          "sweep": 12
        },
        "guitarAmp": {
          "drive": 1.65,
          "bias": 0.005,
          "mix": 0.7,
          "clip": 0,
          "preampCutoff": 70,
          "cabinetCutoff": 4800
        },
        "formants": [
          {
            "freq": 500,
            "q": 1.5,
            "gain": -1.5
          },
          {
            "freq": 1200,
            "q": 1.3,
            "gain": 1
          },
          {
            "freq": 2200,
            "q": 1.4,
            "gain": 1.5
          },
          {
            "freq": 3500,
            "q": 1.6,
            "gain": 0.75
          }
        ],
        "brightness": {
          "start": 6000,
          "end": 3500,
          "loopCutoff": 6000
        },
        "highpass": 80,
        "antiAlias": true
      }
    },
    {
      "program": 31,
      "family": "Guitar",
      "name": "Gtr Harmonics",
      "shortName": "Gtr Harmonics",
      "description": "Sustained guitar overtone with loop.",
      "preset": {
        "mute": false,
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
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0.3
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
      "description": "A focused low end and firm fundamental.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.58,
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
      "description": "A focused low end and firm fundamental.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.58,
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
      "description": "A focused low end and firm fundamental.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.58,
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
      "description": "A smooth, singing tone with a rounded attack.",
      "preset": {
        "mute": false,
        "gain": 0.58,
        "freq": 220,
        "length": 33075,
        "loop": true,
        "cycles": 16,
        "loopSkip": 3,
        "loopAttack": 0.012,
        "loopAttackNoise": {
          "amp": 0.025,
          "duration": 0.008
        },
        "env": {
          "a": 0.008,
          "d": 0.55,
          "s": 0.28,
          "r": 0.25
        },
        "harm": [
          1,
          0.42,
          0.22,
          0.11,
          0.055,
          0.028,
          0.014
        ],
        "brightness": {
          "loopCutoff": 3500
        },
        "antiAlias": true
      }
    },
    {
      "program": 36,
      "family": "Bass",
      "name": "Slap Bass 1",
      "shortName": "Slap Bass 1",
      "description": "A focused low end and firm fundamental.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.58,
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
      "description": "A focused low end and firm fundamental.",
      "preset": {
        "mute": false,
        "defaultWaveform": "hammer",
        "gain": 0.58,
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
      "description": "A focused low end and firm fundamental.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
        "gain": 0.58,
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
      "description": "A focused low end and firm fundamental.",
      "preset": {
        "mute": false,
        "defaultWaveform": "square",
        "gain": 0.58,
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
      "description": "A bowed or plucked tone with rich harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bow",
        "gain": 0.82,
        "loop": true,
        "cycles": 22,
        "loopSkip": 8,
        "loopAttack": 0.08,
        "loopAttackNoise": {
          "amp": 0.06,
          "duration": 0.017
        },
        "env": {
          "a": 0.1,
          "d": 0.2,
          "s": 0.9,
          "r": 0.3
        },
        "harm": [
          1,
          0.608,
          0.464,
          0.336,
          0.232,
          0.152,
          0.096,
          0.06,
          0.0344,
          0.0176
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
        "drive": 0.05,
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
        "highpass": 400,
        "antiAlias": true
      }
    },
    {
      "program": 41,
      "family": "Strings",
      "name": "Viola",
      "shortName": "Viola",
      "description": "A bowed or plucked tone with rich harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bow",
        "gain": 0.82,
        "loop": true,
        "cycles": 22,
        "loopSkip": 8,
        "loopAttack": 0.08,
        "loopAttackNoise": {
          "amp": 0.05,
          "duration": 0.017
        },
        "env": {
          "a": 0.1,
          "d": 0.2,
          "s": 0.9,
          "r": 0.3
        },
        "harm": [
          1,
          0.56,
          0.4,
          0.28,
          0.192,
          0.128,
          0.08,
          0.048,
          0.0256
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
        "drive": 0.05,
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
        "highpass": 350,
        "antiAlias": true
      }
    },
    {
      "program": 42,
      "family": "Strings",
      "name": "Cello",
      "shortName": "Cello",
      "description": "A bowed or plucked tone with rich harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bow",
        "gain": 0.34,
        "loop": true,
        "cycles": 22,
        "loopSkip": 8,
        "env": {
          "a": 0.1,
          "d": 0.2,
          "s": 0.9,
          "r": 0.3
        },
        "harm": [
          1,
          0.464,
          0.272,
          0.16,
          0.096,
          0.056,
          0.032,
          0.0176
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 43,
      "family": "Strings",
      "name": "Contrabass",
      "shortName": "Contrabass",
      "description": "A bowed or plucked tone with rich harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bow",
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
          0.416,
          0.24,
          0.144,
          0.08,
          0.044,
          0.024
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
      "description": "A bowed or plucked tone with rich harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "string",
        "gain": 0.34,
        "loop": true,
        "cycles": 22,
        "loopSkip": 8,
        "env": {
          "a": 0.1,
          "d": 0.2,
          "s": 0.9,
          "r": 0.3
        },
        "harm": [
          1,
          0.464,
          0.288,
          0.176,
          0.104,
          0.06,
          0.032,
          0.016
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 45,
      "family": "Strings",
      "name": "Pizzicato",
      "shortName": "Pizzicato",
      "description": "A bowed or plucked tone with rich harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
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
          0.56,
          0.4,
          0.28,
          0.16,
          0.096,
          0.064,
          0.04,
          0.024
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 46,
      "family": "Strings",
      "name": "Harp",
      "shortName": "Harp",
      "description": "A bowed or plucked tone with rich harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
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
          0.56,
          0.4,
          0.28,
          0.16,
          0.096,
          0.064,
          0.04,
          0.024
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 47,
      "family": "Strings",
      "name": "Timpani",
      "shortName": "Timpani",
      "description": "A bowed or plucked tone with rich harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "hammer",
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
      "description": "A layered orchestral blend with smooth sustain.",
      "preset": {
        "mute": false,
        "defaultWaveform": "string",
        "gain": 0.27,
        "loop": true,
        "cycles": 22,
        "loopSkip": 8,
        "env": {
          "a": 0.2,
          "d": 0.2,
          "s": 0.95,
          "r": 0.4
        },
        "harm": [
          1,
          0.496,
          0.336,
          0.232,
          0.152,
          0.096,
          0.06,
          0.036,
          0.02,
          0.056632,
          0.05076,
          0.04592,
          0.041888,
          0.038464,
          0.035528,
          0.032984,
          0.030768,
          0.028808,
          0.027072,
          0.02552,
          0.024128,
          0.022872,
          0.021736,
          0.020696,
          0.019744,
          0.018872,
          0.018072,
          0.017336,
          0.016648,
          0.016008,
          0.015416,
          0.014864
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 49,
      "family": "Ensemble",
      "name": "Strings 2",
      "shortName": "Strings 2",
      "description": "A layered orchestral blend with smooth sustain.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bow",
        "gain": 0.27,
        "loop": true,
        "cycles": 22,
        "loopSkip": 8,
        "env": {
          "a": 0.2,
          "d": 0.2,
          "s": 0.95,
          "r": 0.4
        },
        "harm": [
          1,
          0.44,
          0.272,
          0.16,
          0.096,
          0.056,
          0.032,
          0.016,
          0.07964,
          0.051336,
          0.064512,
          0.042392,
          0.054128,
          0.036056,
          0.046576,
          0.031336,
          0.04084,
          0.027696,
          0.036344,
          0.024792,
          0.032712,
          0.022432,
          0.029736,
          0.020472,
          0.02724,
          0.018824,
          0.025128,
          0.017416,
          0.023312,
          0.0162,
          0.021736,
          0.015136
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 50,
      "family": "Ensemble",
      "name": "SynthStrings 1",
      "shortName": "SynthStrings 1",
      "description": "A layered orchestral blend with smooth.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
        "gain": 0.5775,
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
          0.496,
          0.336,
          0.224,
          0.144,
          0.088,
          0.052,
          0.028,
          0.0144
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
        "drive": 0.2,
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
        "highpass": 300,
        "antiAlias": true
      }
    },
    {
      "program": 51,
      "family": "Ensemble",
      "name": "SynthStrings 2",
      "shortName": "SynthStrings 2",
      "description": "A layered orchestral blend with smooth.",
      "preset": {
        "mute": false,
        "defaultWaveform": "triangle",
        "gain": 0.5775,
        "loop": true,
        "cycles": 38,
        "loopSkip": 24,
        "loopAttack": 0.04,
        "loopAttackNoise": {
          "amp": 0.012,
          "duration": 0.03
        },
        "env": {
          "a": 0.2,
          "d": 0.3,
          "s": 0.95,
          "r": 0.5
        },
        "harm": [
          1,
          0.624,
          0.464,
          0.336,
          0.24,
          0.168,
          0.112,
          0.072,
          0.044,
          0.024
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
        "drive": 0.2,
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
        "highpass": 300,
        "antiAlias": true
      }
    },
    {
      "program": 52,
      "family": "Ensemble",
      "name": "Choir Aahs",
      "shortName": "Choir Aahs",
      "description": "A layered orchestral blend with smooth sustain.",
      "preset": {
        "mute": false,
        "defaultWaveform": "breath",
        "gain": 0.5,
        "loop": true,
        "cycles": 14,
        "env": {
          "a": 0.18,
          "d": 0.3,
          "s": 0.9,
          "r": 0.4
        },
        "harm": [
          1,
          0.72,
          0.48,
          0.3,
          0.18,
          0.1,
          0.055,
          0.03,
          0.016,
          0.008,
          0.004
        ],
        "phases": [
          -0.01,
          -0.04,
          -0.09,
          -0.16,
          -0.25,
          -0.36,
          -0.49,
          -0.64,
          -0.81,
          -1,
          -1.21
        ],
        "phaseScale": 0.01,
        "noise": 0.025,
        "vibratoOnset": 0.2,
        "vibrato": {
          "rate": 4.8,
          "depth": 0.006,
          "sweep": 20
        },
        "drive": 0.15,
        "loopAttack": 0.02,
        "loopAttackNoise": {
          "amp": 0.025,
          "duration": 0.04
        },
        "formants": [
          {
            "freq": 700,
            "q": 1.1,
            "gain": 4
          },
          {
            "freq": 1200,
            "q": 1.2,
            "gain": 3
          },
          {
            "freq": 2600,
            "q": 1.5,
            "gain": 1.5
          },
          {
            "freq": 3500,
            "q": 1.8,
            "gain": 0.3
          }
        ],
        "highpass": 350,
        "antiAlias": true
      }
    },
    {
      "program": 53,
      "family": "Ensemble",
      "name": "Voice Oohs",
      "shortName": "Voice Oohs",
      "description": "Rounded vowel formants with a soft vocal onset.",
      "preset": {
        "mute": false,
        "defaultWaveform": "string",
        "gain": 0.5,
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
          0.72,
          0.48,
          0.3,
          0.18,
          0.1,
          0.055,
          0.03,
          0.016,
          0.008,
          0.006,
          0.0045,
          0.0034,
          0.0025,
          0.0019,
          0.0014
        ],
        "phases": [
          -0.01,
          -0.04,
          -0.09,
          -0.16,
          -0.25,
          -0.36,
          -0.49,
          -0.64,
          -0.81,
          -1,
          -1.21,
          -1.44,
          -1.69,
          -1.96,
          -2.25,
          -2.56
        ],
        "phaseScale": 0.01,
        "noise": 0.045,
        "vibratoOnset": 0.2,
        "vibrato": {
          "rate": 5,
          "depth": 0.007,
          "sweep": 15
        },
        "drive": 0.05,
        "loopSkip": 8,
        "loopAttack": 0.015,
        "loopAttackNoise": {
          "amp": 0.045,
          "duration": 0.025
        },
        "formants": [
          {
            "freq": 320,
            "q": 1.05,
            "gain": 3
          },
          {
            "freq": 850,
            "q": 1.15,
            "gain": 2.5
          },
          {
            "freq": 2200,
            "q": 1.5,
            "gain": 1.2
          },
          {
            "freq": 3200,
            "q": 1.8,
            "gain": 0.2
          },
          {
            "freq": 3700,
            "q": 1.6,
            "gain": 3
          },
          {
            "freq": 5200,
            "q": 1.5,
            "gain": 2
          }
        ],
        "highpass": 350,
        "antiAlias": true
      }
    },
    {
      "program": 54,
      "family": "Ensemble",
      "name": "Synth Voice",
      "shortName": "Synth Voice",
      "description": "A layered orchestral blend with smooth sustain.",
      "preset": {
        "mute": false,
        "defaultWaveform": "breath",
        "gain": 0.5,
        "loop": true,
        "cycles": 14,
        "env": {
          "a": 0.15,
          "d": 0.3,
          "s": 0.9,
          "r": 0.4
        },
        "harm": [
          1,
          0.7,
          0.46,
          0.29,
          0.18,
          0.11,
          0.065,
          0.038,
          0.022,
          0.013,
          0.008,
          0.004
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
        "noise": 0.035,
        "vibratoOnset": 0.2,
        "vibrato": {
          "rate": 5,
          "depth": 0.006,
          "sweep": 18
        },
        "drive": 0.12,
        "formants": [
          {
            "freq": 650,
            "q": 1.1,
            "gain": 3.5
          },
          {
            "freq": 1150,
            "q": 1.2,
            "gain": 2.5
          },
          {
            "freq": 2500,
            "q": 1.5,
            "gain": 1.2
          },
          {
            "freq": 3500,
            "q": 1.8,
            "gain": 0.2
          }
        ],
        "highpass": 350,
        "antiAlias": true
      }
    },
    {
      "program": 55,
      "family": "Ensemble",
      "name": "Orchestra Hit",
      "shortName": "Orchestra Hit",
      "description": "A layered orchestral blend with smooth.",
      "preset": {
        "mute": false,
        "defaultWaveform": "hammer",
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
      "description": "A bold attack and bright, focused tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
        "gain": 0.42,
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
        "highpass": 400,
        "antiAlias": true
      }
    },
    {
      "program": 57,
      "family": "Brass",
      "name": "Trombone",
      "shortName": "Trombone",
      "description": "A bold attack and bright, focused tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
        "gain": 0.21,
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
        "highpass": 230,
        "antiAlias": true
      }
    },
    {
      "program": 58,
      "family": "Brass",
      "name": "Tuba",
      "shortName": "Tuba",
      "description": "A bold attack and bright, focused tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "square",
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
      "description": "A bold attack and bright, focused tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pulse",
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
      "description": "A bold attack and bright, focused tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
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
      "description": "A bold attack and bright, focused tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
        "gain": 0.34,
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
          0.05,
          0.04,
          0.032,
          0.026,
          0.021,
          0.017,
          0.013
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
          0.4,
          0.65,
          0.9,
          0.15,
          0.4,
          0.65
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
          },
          {
            "freq": 4300,
            "q": 1.7,
            "gain": 3.5
          },
          {
            "freq": 5900,
            "q": 1.5,
            "gain": 2
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
      "description": "A bold attack and bright, focused tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
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
      "description": "A bold attack and bright, focused tone.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pulse",
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
      "description": "A reedy wind tone with expressive harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "reed",
        "gain": 0.5425,
        "freq": 620,
        "loop": true,
        "cycles": 18,
        "loopSkip": 12,
        "loopAttack": 0.02,
        "env": {
          "a": 0.05,
          "d": 0.1,
          "s": 0.9,
          "r": 0.2
        },
        "harm": [
          1,
          0.68,
          0.55,
          0.42,
          0.3,
          0.21,
          0.14,
          0.09,
          0.06,
          0.04
        ],
        "phases": [
          0,
          0.1,
          0.22,
          0.4,
          0.6,
          0.8,
          0.05,
          0.28,
          0.5,
          0.7
        ],
        "vibratoOnset": 0.2,
        "vibrato": {
          "rate": 6,
          "depth": 0.006,
          "sweep": 12
        },
        "formants": [
          {
            "freq": 1400,
            "q": 1.5,
            "gain": 4
          },
          {
            "freq": 2600,
            "q": 2,
            "gain": 4
          },
          {
            "freq": 4300,
            "q": 2.5,
            "gain": 5
          }
        ],
        "highpass": 500,
        "antiAlias": true
      }
    },
    {
      "program": 65,
      "family": "Reed",
      "name": "Alto Sax",
      "shortName": "Alto Sax",
      "description": "A reedy wind tone with expressive harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "reed",
        "gain": 0.5425,
        "freq": 460,
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
          0.62,
          0.7,
          0.42,
          0.36,
          0.2,
          0.15,
          0.08,
          0.05
        ],
        "vibratoOnset": 0.2,
        "vibrato": {
          "rate": 5.5,
          "depth": 0.007,
          "sweep": 15
        },
        "drive": 1.9,
        "brightness": {
          "start": 10000,
          "end": 5500
        },
        "formants": [
          {
            "freq": 1050,
            "q": 1.5,
            "gain": 5
          },
          {
            "freq": 1950,
            "q": 2,
            "gain": 4
          },
          {
            "freq": 3650,
            "q": 2.5,
            "gain": 5
          }
        ],
        "highpass": 300,
        "antiAlias": true
      }
    },
    {
      "program": 66,
      "family": "Reed",
      "name": "Tenor Sax",
      "shortName": "Tenor Sax",
      "description": "A reedy wind tone with expressive harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "reed",
        "gain": 0.875,
        "freq": 320,
        "loop": true,
        "cycles": 18,
        "loopSkip": 12,
        "loopAttack": 0.035,
        "env": {
          "a": 0.05,
          "d": 0.1,
          "s": 0.9,
          "r": 0.2
        },
        "harm": [
          1,
          0.88,
          0.45,
          0.28,
          0.16,
          0.09,
          0.05,
          0.03,
          0.02,
          0.012,
          0.009,
          0.007,
          0.005,
          0.003
        ],
        "phases": [
          0,
          0.08,
          0.18,
          0.3,
          0.45,
          0.6,
          0.75,
          0.9
        ],
        "noise": 0.12,
        "vibratoOnset": 0.2,
        "vibrato": {
          "rate": 4,
          "depth": 0.011,
          "sweep": 18
        },
        "formants": [
          {
            "freq": 680,
            "q": 1.4,
            "gain": 6
          },
          {
            "freq": 1300,
            "q": 1.8,
            "gain": 4
          },
          {
            "freq": 2400,
            "q": 2.2,
            "gain": 4
          },
          {
            "freq": 3600,
            "q": 2.5,
            "gain": 3
          },
          {
            "freq": 4800,
            "q": 2.5,
            "gain": 2.5
          }
        ],
        "highpass": 300,
        "antiAlias": true
      }
    },
    {
      "program": 67,
      "family": "Reed",
      "name": "Bari Sax",
      "shortName": "Bari Sax",
      "description": "A reedy wind tone with expressive harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "reed",
        "gain": 0.5425,
        "freq": 460,
        "loop": true,
        "cycles": 14,
        "loopSkip": 8,
        "loopAttack": 0.01,
        "env": {
          "a": 0.05,
          "d": 0.1,
          "s": 0.9,
          "r": 0.2
        },
        "harm": [
          1,
          0.6,
          0.72,
          0.42,
          0.34,
          0.2,
          0.13,
          0.08,
          0.05
        ],
        "phases": [
          0,
          0.2,
          0.4,
          0.6,
          0.8,
          0.1,
          0.35,
          0.6,
          0.85
        ],
        "vibratoOnset": 0.2,
        "vibrato": {
          "rate": 5.5,
          "depth": 0.007,
          "sweep": 15
        },
        "drive": 1.9,
        "formants": [
          {
            "freq": 1100,
            "q": 1.5,
            "gain": 5
          },
          {
            "freq": 2000,
            "q": 2,
            "gain": 5
          },
          {
            "freq": 3400,
            "q": 2.5,
            "gain": 6
          }
        ],
        "highpass": 150,
        "antiAlias": true
      }
    },
    {
      "program": 68,
      "family": "Reed",
      "name": "Oboe",
      "shortName": "Oboe",
      "description": "A reedy wind tone with expressive harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "reed",
        "gain": 0.335,
        "loop": true,
        "cycles": 18,
        "loopSkip": 12,
        "loopAttack": 0.025,
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
        "brightness": {
          "start": 9000,
          "end": 4800
        },
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
      "description": "A reedy wind tone with expressive harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "reed",
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
        "brightness": {
          "start": 9000,
          "end": 4800
        },
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
      "description": "A reedy wind tone with expressive harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "clarinet",
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
        "brightness": {
          "start": 9000,
          "end": 4800
        },
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
          {
            "freq": 2600,
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
      "description": "A reedy wind tone with expressive harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "clarinet",
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
          "start": 9000,
          "end": 5200
        },
        "antiAlias": true
      }
    },
    {
      "program": 72,
      "family": "Pipe",
      "name": "Piccolo",
      "shortName": "Piccolo",
      "description": "A breath-driven tone with a rounded body.",
      "preset": {
        "mute": false,
        "defaultWaveform": "sine",
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
      "description": "A breath-driven tone with a rounded body.",
      "preset": {
        "mute": false,
        "defaultWaveform": "flute",
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
        "brightness": {
          "start": 9000,
          "end": 5200
        },
        "antiAlias": true
      }
    },
    {
      "program": 74,
      "family": "Pipe",
      "name": "Recorder",
      "shortName": "Recorder",
      "description": "A breath-driven tone with a rounded body.",
      "preset": {
        "mute": false,
        "defaultWaveform": "flute",
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
      "description": "A breath-driven tone with a rounded body.",
      "preset": {
        "mute": false,
        "defaultWaveform": "sine",
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
      "description": "A breath-driven tone with a rounded body.",
      "preset": {
        "mute": false,
        "defaultWaveform": "breath",
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
      "description": "A breath-driven tone with a rounded body.",
      "preset": {
        "mute": false,
        "defaultWaveform": "breath",
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
      "description": "A breath-driven tone with a rounded body.",
      "preset": {
        "mute": false,
        "renderMode": "drum",
        "gain": 0.42,
        "freq": 3720,
        "duration": 0.55,
        "tones": [
          {
            "fStart": 3700,
            "fEnd": 3700,
            "pitchDecay": 20,
            "decay": 10,
            "amp": 0.9
          },
          {
            "fStart": 3740,
            "fEnd": 3740,
            "pitchDecay": 20,
            "decay": 10,
            "amp": 0.85
          },
          {
            "fStart": 7400,
            "fEnd": 7400,
            "pitchDecay": 20,
            "decay": 10,
            "amp": 0.2
          }
        ],
        "noise": {
          "amp": 0.03,
          "decay": 0.3,
          "type": "pink",
          "bandpass": {
            "center": 3720,
            "q": 12
          }
        },
        "highpass": 3200
      }
    },
    {
      "program": 79,
      "family": "Pipe",
      "name": "Ocarina",
      "shortName": "Ocarina",
      "description": "A breath-driven tone with a rounded body.",
      "preset": {
        "mute": false,
        "defaultWaveform": "flute",
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
      "description": "A focused synth tone with strong harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "square",
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 81,
      "family": "Lead",
      "name": "Lead (saw)",
      "shortName": "Lead (saw)",
      "description": "A focused synth tone with strong harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 82,
      "family": "Lead",
      "name": "Lead (calliope)",
      "shortName": "Lead (calliope)",
      "description": "A focused synth tone with strong harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": null,
        "gain": 0.38,
        "loop": true,
        "cycles": 20,
        "loopSkip": 10,
        "loopAttack": 0.01,
        "loopAttackNoise": {
          "amp": 0.4,
          "duration": 0.032
        },
        "env": {
          "a": 0.006,
          "d": 0.15,
          "s": 0.92,
          "r": 0.15
        },
        "harm": [
          1,
          0.02,
          0.55,
          0.015,
          0.32,
          0.012,
          0.19,
          0.01,
          0.115,
          0.008,
          0.072,
          0.006,
          0.046,
          0.005,
          0.03,
          0.004,
          0.019,
          0.003,
          0.012,
          0.002
        ],
        "phases": [
          0,
          0.05,
          0.13,
          0.22,
          0.32,
          0.44,
          0.57,
          0.71,
          0.86,
          0.03,
          0.21,
          0.4,
          0.6,
          0.81,
          0.05,
          0.28,
          0.52,
          0.77,
          0.15,
          0.48
        ],
        "noise": 0.22,
        "brightness": {
          "loopCutoff": 11000
        },
        "formants": [
          {
            "freq": 520,
            "q": 2.5,
            "gain": 10
          },
          {
            "freq": 1400,
            "q": 3,
            "gain": 5
          },
          {
            "freq": 3200,
            "q": 2.5,
            "gain": 3.5
          },
          {
            "freq": 6500,
            "q": 1.8,
            "gain": 2.5
          }
        ],
        "drive": 0.8,
        "antiAlias": true
      }
    },
    {
      "program": 83,
      "family": "Lead",
      "name": "Lead (chiff)",
      "shortName": "Lead (chiff)",
      "description": "A focused synth tone with strong harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "clarinet",
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 84,
      "family": "Lead",
      "name": "Lead (charang)",
      "shortName": "Lead (charang)",
      "description": "A focused synth tone with strong harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 85,
      "family": "Lead",
      "name": "Lead (voice)",
      "shortName": "Lead (voice)",
      "description": "A focused synth tone with strong harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "breath",
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
        "highpass": 350,
        "antiAlias": true
      }
    },
    {
      "program": 86,
      "family": "Lead",
      "name": "Lead (fifths)",
      "shortName": "Lead (fifths)",
      "description": "A focused synth tone with strong harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
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
      "description": "A focused synth tone with strong harmonics.",
      "preset": {
        "mute": false,
        "defaultWaveform": "square",
        "gain": 0.34,
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
      "description": "A soft sustained synth texture.",
      "preset": {
        "mute": false,
        "defaultWaveform": "sine",
        "gain": 0.55,
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
          0.32,
          0.16,
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 89,
      "family": "Pad",
      "name": "Pad (warm)",
      "shortName": "Pad (warm)",
      "description": "A soft sustained synth texture.",
      "preset": {
        "mute": false,
        "defaultWaveform": "triangle",
        "gain": 0.26,
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 90,
      "family": "Pad",
      "name": "Pad (polysynth)",
      "shortName": "Pad (polysynth)",
      "description": "A soft sustained synth texture.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
        "gain": 0.975,
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
        "highpass": 230,
        "antiAlias": true
      }
    },
    {
      "program": 91,
      "family": "Pad",
      "name": "Pad (choir)",
      "shortName": "Pad (choir)",
      "description": "A soft sustained synth texture.",
      "preset": {
        "mute": false,
        "defaultWaveform": "breath",
        "gain": 0.51,
        "loop": true,
        "cycles": 44,
        "loopSkip": 36,
        "loopAttack": 0.07,
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
          0.05,
          0.035,
          0.028,
          0.023,
          0.019,
          0.016,
          0.013,
          0.011,
          0.009,
          0.007,
          0.006,
          0.005
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
            "gain": 2.5
          },
          {
            "freq": 5600,
            "q": 1.6,
            "gain": 2.5
          }
        ],
        "highpass": 250,
        "antiAlias": true
      }
    },
    {
      "program": 92,
      "family": "Pad",
      "name": "Pad (bowed)",
      "shortName": "Pad (bowed)",
      "description": "A soft sustained synth texture.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bow",
        "gain": 0.975,
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
        "highpass": 230,
        "antiAlias": true
      }
    },
    {
      "program": 93,
      "family": "Pad",
      "name": "Pad (metallic)",
      "shortName": "Pad (metallic)",
      "description": "A soft sustained synth texture.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bell",
        "gain": 0.975,
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
        "highpass": 230,
        "antiAlias": true
      }
    },
    {
      "program": 94,
      "family": "Pad",
      "name": "Pad (halo)",
      "shortName": "Pad (halo)",
      "description": "A soft sustained synth texture.",
      "preset": {
        "mute": false,
        "defaultWaveform": "sine",
        "gain": 0.35,
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
      "description": "A soft sustained synth texture.",
      "preset": {
        "mute": false,
        "defaultWaveform": "saw",
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 96,
      "family": "FX",
      "name": "FX (rain)",
      "shortName": "FX (rain)",
      "description": "An evolving synthetic texture with distinct.",
      "preset": {
        "mute": false,
        "defaultWaveform": null,
        "gain": 0.3,
        "freq": 441,
        "length": 44100,
        "loop": true,
        "cycles": 300,
        "tailCycles": 180,
        "loopSkip": 16,
        "loopAttack": 0.02,
        "env": {
          "a": 0.05,
          "d": 0.5,
          "s": 1,
          "r": 0.4
        },
        "harm": [0],
        "noise": 1,
        "noiseOnly": true,
        "antiAlias": true
      }
    },
    {
      "program": 97,
      "family": "FX",
      "name": "FX (soundtrack)",
      "shortName": "FX (soundtrack)",
      "description": "An evolving synthetic texture with.",
      "preset": {
        "mute": false,
        "defaultWaveform": "string",
        "gain": 0.3,
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
      "description": "An evolving synthetic texture with distinct.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bell",
        "gain": 0.3,
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
      "description": "Nylon pluck with a faint airy shimmer.",
      "preset": {
        "mute": false,
        "defaultWaveform": "breath",
        "gain": 0.3,
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 100,
      "family": "FX",
      "name": "FX (brightness)",
      "shortName": "FX (brightness)",
      "description": "An evolving synthetic texture with.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bell",
        "gain": 0.3,
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
      "description": "An evolving synthetic texture with distinct.",
      "preset": {
        "mute": false,
        "defaultWaveform": "square",
        "gain": 0.3,
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
        "noise": 0.04,
        "antiAlias": true
      }
    },
    {
      "program": 102,
      "family": "FX",
      "name": "FX (echoes)",
      "shortName": "FX (echoes)",
      "description": "An evolving synthetic texture with distinct.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.3,
        "length": 44100,
        "loop": true,
        "sustainLoop": false,
        "cycles": 24,
        "loopSkip": 8,
        "loopAttack": 0.08,
        "env": {
          "a": 0.12,
          "d": 0.2,
          "s": 0.9,
          "r": 0.35
        },
        "harm": [
          1,
          0.3,
          0.16,
          0.08,
          0.04
        ],
        "noise": 0.01,
        "highpass": 230,
        "antiAlias": true
      }
    },
    {
      "program": 103,
      "family": "FX",
      "name": "FX (sci-fi)",
      "shortName": "FX (sci-fi)",
      "description": "An evolving synthetic texture with distinct.",
      "preset": {
        "mute": false,
        "gain": 0.3,
        "defaultWaveform": "saw",
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
      "description": "A distinctive folk tone with a bright attack.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.3,
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
      "description": "A distinctive folk tone with a bright attack.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.3,
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 106,
      "family": "Ethnic",
      "name": "Shamisen",
      "shortName": "Shamisen",
      "description": "A distinctive folk tone with a bright attack.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.3,
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
      "description": "A distinctive folk tone with a bright attack.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pluck",
        "gain": 0.3,
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
        "highpass": 120,
        "antiAlias": true
      }
    },
    {
      "program": 108,
      "family": "Ethnic",
      "name": "Kalimba",
      "shortName": "Kalimba",
      "description": "A distinctive folk tone with a bright attack.",
      "preset": {
        "mute": false,
        "defaultWaveform": "hammer",
        "gain": 0.3,
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
      "description": "A distinctive folk tone with a bright attack.",
      "preset": {
        "mute": false,
        "defaultWaveform": "reed",
        "gain": 0.3,
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
      "description": "A distinctive folk tone with a bright attack.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bow",
        "gain": 0.3,
        "loop": true,
        "cycles": 14,
        "env": {
          "a": 0.1,
          "d": 0.2,
          "s": 0.9,
          "r": 0.3
        },
        "harm": [
          1,
          0.4,
          0.264,
          0.2,
          0.16,
          0.128,
          0.112,
          0.096
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
        "highpass": 230,
        "antiAlias": true
      }
    },
    {
      "program": 111,
      "family": "Ethnic",
      "name": "Shanai",
      "shortName": "Shanai",
      "description": "A distinctive folk tone with a bright attack.",
      "preset": {
        "mute": false,
        "defaultWaveform": "reed",
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
      "description": "A pitched strike with clear resonance.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bell",
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
      "description": "A pitched strike with clear resonance.",
      "preset": {
        "mute": false,
        "defaultWaveform": "pulse",
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
      "description": "A pitched strike with clear resonance.",
      "preset": {
        "mute": false,
        "defaultWaveform": "bell",
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
      "description": "A pitched strike with clear resonance.",
      "preset": {
        "mute": false,
        "defaultWaveform": "hammer",
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
      "description": "A pitched strike with clear resonance.",
      "preset": {
        "mute": false,
        "defaultWaveform": "hammer",
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
      "description": "A pitched strike with clear resonance.",
      "preset": {
        "mute": false,
        "defaultWaveform": "hammer",
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
        "highpass": 250,
        "antiAlias": true
      }
    },
    {
      "program": 118,
      "family": "Perc",
      "name": "Synth Drum",
      "shortName": "Synth Drum",
      "description": "A pitched strike with clear resonance.",
      "preset": {
        "mute": false,
        "defaultWaveform": "sine",
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
      "description": "A pitched strike with clear resonance.",
      "preset": {
        "mute": false,
        "defaultWaveform": "breath",
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
      "description": "A recognizable effect with a distinct texture.",
      "preset": {
        "mute": false,
        "renderMode": "drum",
        "pitchInvariant": true,
        "gain": 0.3,
        "freq": 441,
        "duration": 0.15,
        "tones": [
          {
            "fStart": 1100,
            "fPeak": 4600,
            "fEnd": 700,
            "riseTime": 0.055,
            "fallTime": 0.035,
            "decay": 0.095,
            "amp": 0.2
          },
          {
            "fStart": 1800,
            "fPeak": 7200,
            "fEnd": 1000,
            "riseTime": 0.055,
            "fallTime": 0.035,
            "decay": 0.06,
            "amp": 0.06
          }
        ],
        "noise": {
          "amp": 0.5,
          "decay": 0.055,
          "type": "pink",
          "bandpass": {
            "center": 6000,
            "q": 3
          }
        },
        "highpass": 4000,
        "lowpass": 7500,
        "fadeOut": 1
      }
    },
    {
      "program": 121,
      "family": "SFX",
      "name": "Breath Noise",
      "shortName": "Breath Noise",
      "description": "A recognizable effect with a distinct texture.",
      "preset": {
        "mute": false,
        "renderMode": "drum",
        "pitchInvariant": true,
        "loop": true,
        "sustainLoop": true,
        "loopStartSeconds": 0.12,
        "loopEndSeconds": 0.82,
        "loopCrossfadeSeconds": 0.02,
        "gain": 0.3,
        "freq": 441,
        "duration": 1,
        "noise": {
          "amp": 0.85,
          "attack": 0.1,
          "decay": 100,
          "type": "pink",
          "bandpass": {
            "center": 3200,
            "q": 0.7
          }
        },
        "highpass": 450,
        "lowpass": 9000,
        "fadeOut": 0.18
      }
    },
    {
      "program": 122,
      "family": "SFX",
      "name": "Seashore",
      "shortName": "Seashore",
      "description": "A recognizable effect with a distinct texture.",
      "preset": {
        "mute": false,
        "renderMode": "drum",
        "pitchInvariant": true,
        "gain": 0.3,
        "freq": 441,
        "duration": 1.2,
        "noise": {
          "amp": 0.9,
          "attack": 0.3,
          "decay": 1,
          "type": "pink",
          "bandpass": {
            "center": 2400,
            "q": 0.45
          }
        },
        "highpass": 180,
        "lowpass": 8000,
        "fadeOut": 0.25
      }
    },
    {
      "program": 123,
      "family": "SFX",
      "name": "Bird Tweet",
      "shortName": "Bird Tweet",
      "description": "A recognizable effect with a distinct texture.",
      "preset": {
        "mute": false,
        "renderMode": "drum",
        "pitchInvariant": true,
        "loop": true,
        "sustainLoop": true,
        "gain": 0.45,
        "freq": 441,
        "duration": 0.32,
        "tones": [
          {
            "fStart": 1750,
            "fPeak": 3150,
            "fEnd": 2250,
            "riseTime": 0.035,
            "fallTime": 0.075,
            "decay": 0.06,
            "amp": 0.7
          }
        ],
        "noise": {
          "amp": 0.12,
          "decay": 0.045,
          "type": "pink",
          "bandpass": {
            "center": 6200,
            "q": 1.2
          }
        },
        "highpass": 1000,
        "lowpass": 9000,
        "fadeOut": 0.08
      }
    },
    {
      "program": 124,
      "family": "SFX",
      "name": "Telephone",
      "shortName": "Telephone",
      "description": "A classic dual-tone bell ring.",
      "preset": {
        "mute": false,
        "renderMode": "drum",
        "pitchInvariant": true,
        "gain": 0.3,
        "freq": 441,
        "duration": 1.1,
        "tones": [
          {
            "fStart": 550,
            "fEnd": 550,
            "pitchDecay": 20,
            "decay": 1.5,
            "amp": 0.9
          },
          {
            "fStart": 600,
            "fEnd": 600,
            "pitchDecay": 20,
            "decay": 1.5,
            "amp": 0.9
          },
          {
            "fStart": 1100,
            "fEnd": 1100,
            "pitchDecay": 20,
            "decay": 1,
            "amp": 0.22
          },
          {
            "fStart": 1200,
            "fEnd": 1200,
            "pitchDecay": 20,
            "decay": 1,
            "amp": 0.18
          },
          {
            "fStart": 1650,
            "fEnd": 1650,
            "pitchDecay": 20,
            "decay": 0.8,
            "amp": 0.12
          },
          {
            "fStart": 1800,
            "fEnd": 1800,
            "pitchDecay": 20,
            "decay": 0.8,
            "amp": 0.1
          },
          {
            "fStart": 2200,
            "fEnd": 2200,
            "pitchDecay": 20,
            "decay": 0.6,
            "amp": 0.06
          },
          {
            "fStart": 2400,
            "fEnd": 2400,
            "pitchDecay": 20,
            "decay": 0.6,
            "amp": 0.05
          }
        ],
        "lowpass": 6500,
        "fadeOut": 0.18
      }
    },
    {
      "program": 125,
      "family": "SFX",
      "name": "Helicopter",
      "shortName": "Helicopter",
      "description": "Broadband rotor chop and airflow noise.",
      "preset": {
        "mute": false,
        "defaultWaveform": "breath",
        "gain": 0.36,
        "freq": 441,
        "length": 8820,
        "loop": true,
        "cycles": 36,
        "tailCycles": 180,
        "loopSkip": 16,
        "loopAttack": 0.015,
        "env": {
          "a": 0.02,
          "d": 0.5,
          "s": 1,
          "r": 0.3
        },
        "noiseOnly": true,
        "harm": [0],
        "noise": 1,
        "lowNoise": 0.08,
        "tremolo": {
          "rate": 14,
          "depth": 0.82
        },
        "highpass": 23,
        "lowpass": 7200,
        "antiAlias": true
      }
    },
    {
      "program": 126,
      "family": "SFX",
      "name": "Applause",
      "shortName": "Applause",
      "description": "Procedurally generated broadband handclap crowd.",
      "preset": {
        "mute": false,
        "renderMode": "drum",
        "gain": 0.45,
        "pitchInvariant": true,
        "loop": true,
        "sustainLoop": true,
        "loopStartSeconds": 1.63,
        "loopEndSeconds": 2.89,
        "loopCrossfadeSeconds": 0.035,
        "freq": 261.6,
        "duration": 2.91,
        "noiseBursts": {
          "density": 155,
          "peak": 0.95
        },
        "highpass": 250,
        "lowpass": 10500,
        "fadeOut": 0.025
      }
    },
    {
      "program": 127,
      "family": "SFX",
      "name": "Gunshot",
      "shortName": "Gunshot",
      "description": "A sharp crack with a low boom and short tail.",
      "preset": {
        "mute": false,
        "renderMode": "drum",
        "pitchInvariant": true,
        "gain": 0.83,
        "freq": 441,
        "duration": 0.75,
        "membrane": {
          "freq": 70,
          "pitchDecay": 0.025,
          "decay": 0.24,
          "modes": [
            {
              "ratio": 1,
              "startRatio": 3.8,
              "amp": 0.9,
              "decay": 1
            },
            {
              "ratio": 1.593,
              "startRatio": 2.4,
              "amp": 0.4,
              "decay": 0.65
            },
            {
              "ratio": 2.136,
              "startRatio": 1.8,
              "amp": 0.18,
              "decay": 0.4
            }
          ]
        },
        "impacts": [
          {
            "type": "white",
            "amp": 0.9,
            "duration": 0.035,
            "decay": 0.008,
            "bandpass": {
              "center": 3200,
              "q": 0.7
            }
          },
          {
            "type": "brown",
            "amp": 0.65,
            "delay": 0.004,
            "duration": 0.16,
            "decay": 0.055,
            "bandpass": {
              "center": 650,
              "q": 0.7
            }
          },
          {
            "type": "brown",
            "amp": 0.35,
            "delay": 0.015,
            "duration": 0.4,
            "decay": 0.14,
            "bandpass": {
              "center": 180,
              "q": 0.65
            }
          }
        ],
        "noiseLayers": [
          {
            "type": "white",
            "amp": 0.08,
            "decay": 0.08,
            "bandpass": {
              "center": 1800,
              "q": 0.75
            }
          }
        ],
        "lowpass": 9000,
        "fadeOut": 0.2
      }
    }
  ]
}