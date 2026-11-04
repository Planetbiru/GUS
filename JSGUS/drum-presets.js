var GUS_DRUM_PRESETS = {
  "gain": 1,
  "instruments": [
  {
    "note": 25,
    "name": "Snare Roll",
    "short_name": "Snare Roll",
    "description": "Snare Roll: rapid, evenly spaced snare-wire strokes.",
    "preset": {
      "gain": 0.5,
      "duration": 0.52,
      "noiseLayers": [
        { "amp": 0.6, "decay": 0.012, "type": "white", "bandpass": { "center": 2600, "q": 0.75 } },
        { "amp": 0.38, "decay": 0.025, "type": "pink", "bandpass": { "center": 4800, "q": 0.7 } }
      ],
      "bursts": [0, 0.055, 0.11, 0.165, 0.22, 0.275, 0.33, 0.385, 0.44],
      "highpass": 450,
      "lowpass": 9000
    }
  },
  {
    "note": 26,
    "name": "Snap",
    "short_name": "Snap",
    "description": "Snap: dry finger snap with a short broadband crack.",
    "preset": {
      "gain": 0.42,
      "duration": 0.12,
      "tones": [
        { "fStart": 1850, "fEnd": 1200, "pitchDecay": 0.012, "decay": 0.025, "amp": 0.65 },
        { "fStart": 3200, "fEnd": 2200, "pitchDecay": 0.008, "decay": 0.012, "amp": 0.24 }
      ],
      "noise": { "amp": 0.55, "decay": 0.008, "type": "white", "bandpass": { "center": 3200, "q": 0.65 } },
      "click": { "duration": 0.002, "amp": 0.28 },
      "highpass": 450,
      "lowpass": 9000
    }
  },
  {
    "note": 27,
    "name": "High Q",
    "short_name": "High Q",
    "description": "High Q: bright, articulate short percussion hit.",
    "preset": {
      "gain": 0.45,
      "duration": 0.16,
      "tones": [
        { "fStart": 720, "fEnd": 620, "pitchDecay": 0.012, "decay": 0.045, "amp": 0.65 },
        { "fStart": 1450, "fEnd": 1200, "pitchDecay": 0.01, "decay": 0.028, "amp": 0.28 }
      ],
      "noise": { "amp": 0.16, "decay": 0.009, "type": "pink" },
      "click": { "duration": 0.002, "amp": 0.18 },
      "highpass": 180
    }
  },
  {
    "note": 31,
    "name": "Sticks",
    "short_name": "Sticks",
    "description": "Sticks: dry crossed-stick click with a woody tone.",
    "preset": {
      "gain": 0.42,
      "duration": 0.12,
      "tones": [
        { "fStart": 1650, "fEnd": 1300, "pitchDecay": 0.01, "decay": 0.028, "amp": 0.55 },
        { "fStart": 2450, "fEnd": 1900, "pitchDecay": 0.008, "decay": 0.016, "amp": 0.26 }
      ],
      "noise": { "amp": 0.24, "decay": 0.006, "type": "white", "bandpass": { "center": 2300, "q": 0.7 } },
      "click": { "duration": 0.002, "amp": 0.25 },
      "highpass": 500,
      "lowpass": 8000
    }
  },
  {
    "note": 32,
    "name": "Square Click",
    "short_name": "Square Click",
    "description": "Square Click: short, electronic metronome-like pulse.",
    "preset": {
      "gain": 0.38,
      "duration": 0.1,
      "tones": [
        { "fStart": 1050, "fEnd": 950, "pitchDecay": 0.006, "decay": 0.018, "amp": 0.65 },
        { "fStart": 3150, "fEnd": 2850, "pitchDecay": 0.006, "decay": 0.012, "amp": 0.25 }
      ],
      "click": { "duration": 0.0015, "amp": 0.22 },
      "highpass": 300,
      "lowpass": 7000
    }
  },
  {
    "note": 33,
    "name": "Metronome Click",
    "short_name": "Metro. Click",
    "description": "Metronome Click: clear pitched timing tick.",
    "preset": {
      "gain": 0.4,
      "duration": 0.12,
      "tones": [
        { "fStart": 2250, "fEnd": 1850, "pitchDecay": 0.008, "decay": 0.028, "amp": 0.7 },
        { "fStart": 3400, "fEnd": 2800, "pitchDecay": 0.006, "decay": 0.012, "amp": 0.2 }
      ],
      "noise": { "amp": 0.18, "decay": 0.004, "type": "white", "bandpass": { "center": 3000, "q": 0.8 } },
      "highpass": 800,
      "lowpass": 9000
    }
  },
  {
    "note": 34,
    "name": "Metronome Bell",
    "short_name": "Metro. Bell",
    "description": "Metronome Bell: bright single timing bell.",
    "preset": {
      "gain": 0.32,
      "duration": 0.45,
      "metallic": {
        "baseFreq": 1750,
        "partials": [1, 2.4, 3.8, 5.2],
        "decay": 0.32,
        "amp": 0.48
      },
      "highpass": 500,
      "lowpass": 10000
    }
  },
  {
    "note": 35,
    "name": "Acoustic Bass Drum",
    "short_name": "Ac. Bass Drum",
    "description": "Ac. Bass Drum: deep kick thump with a short beater click.",
    "preset": {
      "gain": 1.0,
      "duration": 0.55,
      "membrane": {
        "freq": 46,
        "pitchDecay": 0.035,
        "decay": 0.24,
        "modes": [
          { "ratio": 1,     "startRatio": 2.5, "amp": 1,    "decay": 1 },
          { "ratio": 1.593, "startRatio": 1.8, "amp": 0.5,  "decay": 0.55 },
          { "ratio": 2.136, "amp": 0.24, "decay": 0.35 },
          { "ratio": 2.296, "amp": 0.14, "decay": 0.25 }
        ]
      },
      "click": { "duration": 0.003, "amp": 0.28 },
      "noise": { "amp": 0.1, "decay": 0.025, "type": "brown" },
      "noiseLayers": [
        { "amp": 0.32, "decay": 0.014, "type": "white", "bandpass": { "center": 1800, "q": 0.75 } }
      ],
      "lowpass": 4200
    }
  },
  {
    "note": 36,
    "name": "Bass Drum 1",
    "short_name": "Bass Drum 1",
    "description": "Bass Drum 1: punchy kick with a focused low end.",
    "preset": {
      "gain": 1.0,
      "duration": 0.55,
      "membrane": {
        "freq": 52,
        "pitchDecay": 0.03,
        "decay": 0.2,
        "modes": [
          { "ratio": 1,     "startRatio": 2.8, "amp": 1,    "decay": 1 },
          { "ratio": 1.593, "startRatio": 1.9, "amp": 0.5,  "decay": 0.55 },
          { "ratio": 2.136, "amp": 0.24, "decay": 0.35 },
          { "ratio": 2.296, "amp": 0.14, "decay": 0.25 }
        ]
      },
      "click": { "duration": 0.003, "amp": 0.25 },
      "noise": { "amp": 0.1, "decay": 0.02, "type": "brown" },
      "noiseLayers": [
        { "amp": 0.3, "decay": 0.012, "type": "white", "bandpass": { "center": 2300, "q": 0.8 } }
      ],
      "lowpass": 4500
    }
  },
  {
    "note": 37,
    "name": "Side Stick",
    "short_name": "Side Stick",
    "description": "Side Stick: dry rim click with a woody snap.",
    "preset": {
      "gain": 0.55,
      "duration": 0.11,
      "noiseLayers": [
        { "amp": 0.95, "decay": 0.005, "type": "white", "bandpass": { "center": 2600, "q": 0.75 } },
        { "amp": 0.7,  "decay": 0.018, "type": "white", "bandpass": { "center": 1100, "q": 0.7 } },
        { "amp": 0.35, "decay": 0.003, "type": "white", "bandpass": { "center": 6000, "q": 0.65 } }
      ],
      "click": { "duration": 0.0015, "amp": 0.25 },
      "highpass": 350,
      "lowpass": 8500
    }
  },
  {
    "note": 38,
    "name": "Acoustic Snare",
    "short_name": "Ac. Snare",
    "description": "Ac. Snare: crisp snare crack with a broad noise burst.",
    "preset": {
      "gain": 0.95,
      "duration": 0.28,
      "membrane": {
        "freq": 180,
        "pitchDecay": 0.025,
        "decay": 0.06,
        "modes": [
          { "ratio": 1,    "amp": 0.3,  "decay": 0.75 },
          { "ratio": 1.83, "amp": 0.26, "decay": 0.68 },
          { "ratio": 2.13, "amp": 0.16, "decay": 0.48 }
        ]
      },
      "click": { "duration": 0.006, "amp": 0.4 },
      "noise": {
        "amp": 0.48,
        "decay": 0.09,
        "type": "pink",
        "bandpass": { "center": 4200, "q": 0.65 }
      },
      "highpass": 240
    }
  },
  {
    "note": 39,
    "name": "Hand Clap",
    "short_name": "Hand Clap",
    "description": "Hand Clap: layered clap with a sharp, brief transient.",
    "preset": {
      "gain": 0.65,
      "duration": 0.3,
      "noise": {
        "amp": 0.85,
        "decay": 0.13,
        "type": "pink",
        "bandpass": { "center": 1400, "q": 0.6 }
      },
      "highpass": 900,
      "bursts": [0, 0.011, 0.022, 0.033]
    }
  },
  {
    "note": 40,
    "name": "Electric Snare",
    "short_name": "Elec. Snare",
    "description": "Elec. Snare: bright snare snap with a tight noisy tail.",
    "preset": {
      "gain": 0.95,
      "duration": 0.28,
      "membrane": {
        "freq": 195,
        "pitchDecay": 0.025,
        "decay": 0.055,
        "modes": [
          { "ratio": 1,    "amp": 0.28, "decay": 0.75 },
          { "ratio": 1.83, "amp": 0.25, "decay": 0.68 },
          { "ratio": 2.13, "amp": 0.16, "decay": 0.48 }
        ]
      },
      "click": { "duration": 0.006, "amp": 0.38 },
      "noise": {
        "amp": 0.5,
        "decay": 0.1,
        "type": "pink",
        "bandpass": { "center": 4800, "q": 0.7 }
      },
      "highpass": 350
    }
  },
  {
    "note": 41,
    "name": "Low Floor Tom",
    "short_name": "Low Floor Tom",
    "description": "Low Floor Tom: pitched tom strike with a rounded, resonant.",
    "preset": {
      "gain": 0.75,
      "duration": 0.65,
      "membrane": {
        "freq": 65,
        "pitchDecay": 0.06,
        "decay": 0.5,
        "modes": [
          { "ratio": 1,     "amp": 1,    "decay": 1 },
          { "ratio": 1.593, "amp": 0.5,  "decay": 0.75 },
          { "ratio": 2.136, "amp": 0.25, "decay": 0.55 },
          { "ratio": 2.296, "amp": 0.15, "decay": 0.42 }
        ]
      },
      "click": { "duration": 0.004, "amp": 0.18 },
      "noise": {
        "amp": 0.24,
        "decay": 0.024,
        "type": "pink",
        "bandpass": { "center": 1200, "q": 0.75 }
      },
      "lowpass": 3200
    }
  },
  {
    "note": 42,
    "name": "Closed Hi-Hat",
    "short_name": "Closed Hi-Hat",
    "description": "Closed Hi-Hat: short hi-hat tick with a crisp, controlled.",
    "preset": {
      "gain": 0.25,
      "duration": 0.14,
      "noiseLayers": [
        { "amp": 0.95, "decay": 0.008, "type": "white", "bandpass": { "center": 8200, "q": 0.48 } },
        { "amp": 0.68, "decay": 0.024, "type": "pink",  "bandpass": { "center": 6100, "q": 0.52 } },
        { "amp": 0.38, "decay": 0.032, "type": "white", "bandpass": { "center": 9300, "q": 0.72 } }
      ],
      "highpass": 3600,
      "lowpass": 10200
    }
  },
  {
    "note": 43,
    "name": "High Floor Tom",
    "short_name": "High Floor Tom",
    "description": "High Floor Tom: pitched tom strike with a rounded, resonant.",
    "preset": {
      "gain": 0.75,
      "duration": 0.6,
      "membrane": {
        "freq": 90,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          { "ratio": 1,     "amp": 1,    "decay": 1 },
          { "ratio": 1.593, "amp": 0.5,  "decay": 0.75 },
          { "ratio": 2.136, "amp": 0.25, "decay": 0.55 },
          { "ratio": 2.296, "amp": 0.15, "decay": 0.42 }
        ]
      },
      "click": { "duration": 0.004, "amp": 0.2 },
      "noise": {
        "amp": 0.24,
        "decay": 0.022,
        "type": "pink",
        "bandpass": { "center": 1350, "q": 0.75 }
      },
      "lowpass": 3600
    }
  },
  {
    "note": 44,
    "name": "Pedal Hi-Hat",
    "short_name": "Pedal Hi-Hat",
    "description": "Pedal Hi-Hat: short hi-hat tick with a crisp, controlled.",
    "preset": {
      "gain": 0.25,
      "duration": 0.16,
      "noiseLayers": [
        { "amp": 0.78, "decay": 0.006, "type": "white", "bandpass": { "center": 7400, "q": 0.52 } },
        { "amp": 0.7,  "decay": 0.019, "type": "pink",  "bandpass": { "center": 4800, "q": 0.55 } },
        { "amp": 0.34, "decay": 0.028, "type": "pink",  "bandpass": { "center": 2900, "q": 0.68 } }
      ],
      "highpass": 1800,
      "lowpass": 9600
    }
  },
  {
    "note": 45,
    "name": "Low Tom",
    "short_name": "Low Tom",
    "description": "Low Tom: pitched tom strike with a rounded, resonant decay.",
    "preset": {
      "gain": 0.72,
      "duration": 0.55,
      "membrane": {
        "freq": 120,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          { "ratio": 1,     "amp": 1,    "decay": 1 },
          { "ratio": 1.593, "amp": 0.5,  "decay": 0.75 },
          { "ratio": 2.136, "amp": 0.25, "decay": 0.55 },
          { "ratio": 2.296, "amp": 0.15, "decay": 0.42 }
        ]
      },
      "click": { "duration": 0.004, "amp": 0.2 },
      "noise": {
        "amp": 0.24,
        "decay": 0.020,
        "type": "pink",
        "bandpass": { "center": 1500, "q": 0.75 }
      },
      "lowpass": 3900
    }
  },
  {
    "note": 46,
    "name": "Open Hi-Hat",
    "short_name": "Open Hi-Hat",
    "description": "Open Hi-Hat: open cymbal wash with a sustained metallic.",
    "preset": {
      "gain": 0.08,
      "duration": 0.62,
      "noiseLayers": [
        { "amp": 1,    "decay": 0.14, "type": "white", "bandpass": { "center": 10200, "q": 0.6  } },
        { "amp": 0.62, "decay": 0.13, "type": "white", "bandpass": { "center": 9000,  "q": 0.65 } },
        { "amp": 0.18, "decay": 0.11, "type": "pink",  "bandpass": { "center": 4600,  "q": 0.65 } }
      ],
      "highpass": 3700,
      "lowpass": 10200
    }
  },
  {
    "note": 47,
    "name": "Low-Mid Tom",
    "short_name": "Low-Mid Tom",
    "description": "Low-Mid Tom: pitched tom strike with a rounded, resonant.",
    "preset": {
      "gain": 0.72,
      "duration": 0.55,
      "membrane": {
        "freq": 155,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          { "ratio": 1,     "amp": 1,    "decay": 1 },
          { "ratio": 1.593, "amp": 0.5,  "decay": 0.75 },
          { "ratio": 2.136, "amp": 0.25, "decay": 0.55 },
          { "ratio": 2.296, "amp": 0.15, "decay": 0.42 }
        ]
      },
      "click": { "duration": 0.004, "amp": 0.2 },
      "noise": {
        "amp": 0.24,
        "decay": 0.019,
        "type": "pink",
        "bandpass": { "center": 1700, "q": 0.75 }
      },
      "lowpass": 4250
    }
  },
  {
    "note": 48,
    "name": "Hi-Mid Tom",
    "short_name": "Hi-Mid Tom",
    "description": "Hi-Mid Tom: pitched tom strike with a rounded, resonant.",
    "preset": {
      "gain": 0.70,
      "duration": 0.55,
      "membrane": {
        "freq": 190,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          { "ratio": 1,     "amp": 1,    "decay": 1 },
          { "ratio": 1.593, "amp": 0.5,  "decay": 0.75 },
          { "ratio": 2.136, "amp": 0.25, "decay": 0.55 },
          { "ratio": 2.296, "amp": 0.15, "decay": 0.42 }
        ]
      },
      "click": { "duration": 0.004, "amp": 0.22 },
      "noise": {
        "amp": 0.24,
        "decay": 0.018,
        "type": "pink",
        "bandpass": { "center": 1850, "q": 0.75 }
      },
      "lowpass": 4500
    }
  },
  {
    "note": 49,
    "name": "Crash Cymbal 1",
    "short_name": "Crash Cymbal 1",
    "description": "Crash Cymbal 1: bright cymbal crash with a broad metallic.",
    "preset": {
      "gain": 0.15,
      "duration": 1.5,
      "noiseLayers": [
        { "amp": 0.9,  "decay": 0.65,  "type": "white", "bandpass": { "center": 8500,  "q": 0.45 } },
        { "amp": 0.7,  "decay": 0.52,  "type": "white", "bandpass": { "center": 6200,  "q": 0.5  } },
        { "amp": 0.45, "decay": 0.3575,"type": "pink",  "bandpass": { "center": 3900,  "q": 0.6  } },
        { "amp": 0.3,  "decay": 0.2275,"type": "white", "bandpass": { "center": 10200, "q": 0.7  } }
      ],
      "highpass": 3000
    }
  },
  {
    "note": 50,
    "name": "High Tom",
    "short_name": "High Tom",
    "description": "High Tom: pitched tom strike with a rounded, resonant decay.",
    "preset": {
      "gain": 0.70,
      "duration": 0.55,
      "membrane": {
        "freq": 240,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          { "ratio": 1,     "amp": 1,    "decay": 1 },
          { "ratio": 1.593, "amp": 0.5,  "decay": 0.75 },
          { "ratio": 2.136, "amp": 0.25, "decay": 0.55 },
          { "ratio": 2.296, "amp": 0.15, "decay": 0.42 }
        ]
      },
      "click": { "duration": 0.004, "amp": 0.22 },
      "noise": {
        "amp": 0.24,
        "decay": 0.017,
        "type": "pink",
        "bandpass": { "center": 2100, "q": 0.75 }
      },
      "lowpass": 4900
    }
  },
  {
    "note": 51,
    "name": "Ride Cymbal 1",
    "short_name": "Ride Cymbal 1",
    "description": "Ride Cymbal 1: bright ride strike with a clear, ringing.",
    "preset": {
      "gain": 0.15,
      "duration": 1.1,
      "noiseLayers": [
        { "amp": 0.85, "decay": 0.035, "type": "white", "bandpass": { "center": 9000, "q": 0.5  } },
        { "amp": 0.7,  "decay": 0.5,   "type": "white", "bandpass": { "center": 6500, "q": 0.48 } },
        { "amp": 0.4,  "decay": 0.325, "type": "pink",  "bandpass": { "center": 4200, "q": 0.6  } }
      ],
      "highpass": 2500
    }
  },
  {
    "note": 52,
    "name": "Chinese Cymbal",
    "short_name": "Chinese Cymbal",
    "description": "Chinese Cymbal: bright cymbal crash with a broad metallic.",
    "preset": {
      "gain": 0.15,
      "duration": 1.8,
      "noiseLayers": [
        { "amp": 0.9,  "decay": 1,    "type": "white", "bandpass": { "center": 8500,  "q": 0.45 } },
        { "amp": 0.7,  "decay": 0.8,  "type": "white", "bandpass": { "center": 6200,  "q": 0.5  } },
        { "amp": 0.45, "decay": 0.55, "type": "pink",  "bandpass": { "center": 3900,  "q": 0.6  } },
        { "amp": 0.3,  "decay": 0.35, "type": "white", "bandpass": { "center": 10200, "q": 0.7  } }
      ],
      "highpass": 3000
    }
  },
  {
    "note": 53,
    "name": "Ride Bell",
    "short_name": "Ride Bell",
    "description": "Ride Bell: bright ride strike with a clear, ringing sustain.",
    "preset": {
      "gain": 0.25,
      "duration": 0.9,
      "noiseLayers": [
        { "amp": 0.85, "decay": 0.03,  "type": "white", "bandpass": { "center": 9000, "q": 0.5  } },
        { "amp": 0.7,  "decay": 0.2,   "type": "white", "bandpass": { "center": 6500, "q": 0.48 } },
        { "amp": 0.4,  "decay": 0.13,  "type": "pink",  "bandpass": { "center": 4200, "q": 0.6  } }
      ],
      "highpass": 2500
    }
  },
    {
    "note": 54,
    "name": "Tambourine",
    "short_name": "Tambourine",
    "description": "Tambourine: bright tambourine jingle with a rattling tail.",
    "preset": {
      "gain": 0.40,
      "duration": 0.30,
      "metallic": {
        "baseFreq": 3600,
        "partials": [0.83, 1.0, 1.15, 1.31, 1.48, 1.65, 1.82, 1.99, 2.17, 2.38, 2.60, 2.83],
        "decay": 0.030,
        "amp": 0.28,
        "randomPhase": true
      },
      "noiseLayers": [
        { "amp": 0.9,  "decay": 0.045, "type": "white", "bandpass": { "center": 9500,  "q": 0.55 } },
        { "amp": 0.62, "decay": 0.10,  "type": "white", "bandpass": { "center": 7000,  "q": 0.6  } },
        { "amp": 0.42, "decay": 0.15,  "type": "pink",  "bandpass": { "center": 4800,  "q": 0.65 } },
        { "amp": 0.28, "decay": 0.065, "type": "white", "bandpass": { "center": 10800, "q": 0.72 } }
      ],
      "highpass": 3400,
      "lowpass": 10500
    }
  },
  {
    "note": 55,
    "name": "Splash Cymbal",
    "short_name": "Splash Cymbal",
    "description": "Splash Cymbal: bright cymbal crash with a broad metallic.",
    "preset": {
      "gain": 0.15,
      "duration": 0.6,
      "noiseLayers": [
        { "amp": 0.9,  "decay": 0.35,  "type": "white", "bandpass": { "center": 8500,  "q": 0.45 } },
        { "amp": 0.7,  "decay": 0.28,  "type": "white", "bandpass": { "center": 6200,  "q": 0.5  } },
        { "amp": 0.45, "decay": 0.1925,"type": "pink",  "bandpass": { "center": 3900,  "q": 0.6  } },
        { "amp": 0.3,  "decay": 0.1225,"type": "white", "bandpass": { "center": 10200, "q": 0.7  } }
      ],
      "highpass": 3000
    }
  },
  {
    "note": 56,
    "name": "Cowbell",
    "short_name": "Cowbell",
    "description": "Cowbell: pitched metal strike with a hollow bell-like ring.",
    "preset": {
      "gain": 0.55,
      "duration": 0.5,
      "tones": [
        { "fStart": 800, "fEnd": 800, "pitchDecay": 1, "decay": 0.35, "amp": 0.55 },
        { "fStart": 540, "fEnd": 540, "pitchDecay": 1, "decay": 0.35, "amp": 0.5  }
      ],
      "highpass": 400
    }
  },
  {
    "note": 57,
    "name": "Crash Cymbal 2",
    "short_name": "Crash Cymbal 2",
    "description": "Crash Cymbal 2: bright cymbal crash with a broad metallic.",
    "preset": {
      "gain": 0.08,
      "duration": 1.4,
      "noiseLayers": [
        { "amp": 0.9,  "decay": 0.65,  "type": "white", "bandpass": { "center": 8500,  "q": 0.45 } },
        { "amp": 0.7,  "decay": 0.52,  "type": "white", "bandpass": { "center": 6200,  "q": 0.5  } },
        { "amp": 0.45, "decay": 0.3575,"type": "pink",  "bandpass": { "center": 3900,  "q": 0.6  } },
        { "amp": 0.3,  "decay": 0.2275,"type": "white", "bandpass": { "center": 10200, "q": 0.7  } }
      ],
      "highpass": 3000
    }
  },
  {
    "note": 58,
    "name": "Vibraslap",
    "short_name": "Vibraslap",
    "description": "Vibraslap: springy slap with a rattling, noisy decay.",
    "preset": {
      "gain": 0.45,
      "duration": 0.55,
      "tones": [
        {
          "fStart": 400,
          "fEnd": 400,
          "pitchDecay": 1,
          "decay": 0.4,
          "amp": 0.5,
          "fm": { "ratio": 3.7, "index": 2 }
        }
      ],
      "noise": { "amp": 0.4, "decay": 0.3, "type": "pink" },
      "highpass": 800
    }
  },
  {
    "note": 59,
    "name": "Ride Cymbal 2",
    "short_name": "Ride Cymbal 2",
    "description": "Ride Cymbal 2: bright ride strike with a clear, ringing.",
    "preset": {
      "gain": 0.08,
      "duration": 0.9,
      "noiseLayers": [
        { "amp": 0.85, "decay": 0.035, "type": "white", "bandpass": { "center": 9000, "q": 0.5  } },
        { "amp": 0.7,  "decay": 0.5,   "type": "white", "bandpass": { "center": 6500, "q": 0.48 } },
        { "amp": 0.4,  "decay": 0.325, "type": "pink",  "bandpass": { "center": 4200, "q": 0.6  } }
      ],
      "highpass": 2500
    }
  },
  {
    "note": 60,
    "name": "Hi Bongo",
    "short_name": "Hi Bongo",
    "description": "Hi Bongo: skin-drum strike with a crisp, woody tone.",
    "preset": {
      "gain": 0.55,
      "duration": 0.27,
      "membrane": {
        "freq": 400,
        "pitchDecay": 0.018,
        "decay": 0.06,
        "modes": [
          { "ratio": 1,     "amp": 0.52, "decay": 0.72 },
          { "ratio": 1.593, "amp": 0.3,  "decay": 0.45 }
        ]
      },
      "click": { "duration": 0.003, "amp": 0.24 },
      "noise": {
        "amp": 0.16,
        "decay": 0.008,
        "type": "pink",
        "bandpass": { "center": 1700, "q": 0.8 }
      },
      "highpass": 260
    }
  },
  {
    "note": 61,
    "name": "Low Bongo",
    "short_name": "Low Bongo",
    "description": "Low Bongo: skin-drum strike with a crisp, woody tone.",
    "preset": {
      "gain": 0.55,
      "duration": 0.27,
      "membrane": {
        "freq": 280,
        "pitchDecay": 0.018,
        "decay": 0.07,
        "modes": [
          { "ratio": 1,     "amp": 0.56, "decay": 0.72 },
          { "ratio": 1.593, "amp": 0.32, "decay": 0.45 }
        ]
      },
      "click": { "duration": 0.003, "amp": 0.22 },
      "noise": {
        "amp": 0.16,
        "decay": 0.008,
        "type": "pink",
        "bandpass": { "center": 1400, "q": 0.8 }
      },
      "highpass": 220
    }
  },
  {
    "note": 62,
    "name": "Mute Hi Conga",
    "short_name": "Mute Hi Conga",
    "description": "Mute Hi Conga: conga strike with a rounded, resonant skin.",
    "preset": {
      "gain": 0.55,
      "duration": 0.42,
      "membrane": {
        "freq": 320,
        "pitchDecay": 0.018,
        "decay": 0.07,
        "modes": [
          { "ratio": 1,     "amp": 0.55, "decay": 0.75 },
          { "ratio": 1.593, "amp": 0.32, "decay": 0.48 },
          { "ratio": 2.136, "amp": 0.15, "decay": 0.3 }
        ]
      },
      "click": { "duration": 0.003, "amp": 0.24 },
      "noise": {
        "amp": 0.16,
        "decay": 0.008,
        "type": "pink",
        "bandpass": { "center": 1800, "q": 0.85 }
      },
      "lowpass": 2600
    }
  },
  {
    "note": 63,
    "name": "Open Hi Conga",
    "short_name": "Open Hi Conga",
    "description": "Open Hi Conga: conga strike with a rounded, resonant skin.",
    "preset": {
      "gain": 0.55,
      "duration": 0.42,
      "membrane": {
        "freq": 280,
        "pitchDecay": 0.02,
        "decay": 0.12,
        "modes": [
          { "ratio": 1,     "amp": 0.62, "decay": 0.8 },
          { "ratio": 1.593, "amp": 0.38, "decay": 0.54 },
          { "ratio": 2.136, "amp": 0.18, "decay": 0.35 }
        ]
      },
      "click": { "duration": 0.003, "amp": 0.22 },
      "noise": {
        "amp": 0.16,
        "decay": 0.01,
        "type": "pink",
        "bandpass": { "center": 1550, "q": 0.8 }
      },
      "lowpass": 2400
    }
  },
  {
    "note": 64,
    "name": "Low Conga",
    "short_name": "Low Conga",
    "description": "Low Conga: conga strike with a rounded, resonant skin tone.",
    "preset": {
      "gain": 0.55,
      "duration": 0.42,
      "membrane": {
        "freq": 200,
        "pitchDecay": 0.02,
        "decay": 0.09,
        "modes": [
          { "ratio": 1,     "amp": 0.6,  "decay": 0.78 },
          { "ratio": 1.593, "amp": 0.35, "decay": 0.52 },
          { "ratio": 2.136, "amp": 0.16, "decay": 0.34 }
        ]
      },
      "click": { "duration": 0.003, "amp": 0.2 },
      "noise": {
        "amp": 0.15,
        "decay": 0.009,
        "type": "pink",
        "bandpass": { "center": 1200, "q": 0.8 }
      },
      "lowpass": 2000
    }
  },
  {
    "note": 65,
    "name": "High Timbale",
    "short_name": "High Timbale",
    "description": "High Timbale: pitched timbale strike with a bright, firm.",
    "preset": {
      "gain": 0.55,
      "duration": 0.35,
      "membrane": {
        "freq": 280,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          { "ratio": 1,     "amp": 1,    "decay": 1 },
          { "ratio": 1.593, "amp": 0.5,  "decay": 0.75 },
          { "ratio": 2.136, "amp": 0.25, "decay": 0.55 },
          { "ratio": 2.296, "amp": 0.15, "decay": 0.42 }
        ]
      },
      "noise": { "amp": 0.15, "decay": 0.015, "type": "pink" },
      "lowpass": 2240
    }
  },
  {
    "note": 66,
    "name": "Low Timbale",
    "short_name": "Low Timbale",
    "description": "Low Timbale: pitched timbale strike with a bright, firm.",
    "preset": {
      "gain": 0.55,
      "duration": 0.4,
      "membrane": {
        "freq": 220,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          { "ratio": 1,     "amp": 1,    "decay": 1 },
          { "ratio": 1.593, "amp": 0.5,  "decay": 0.75 },
          { "ratio": 2.136, "amp": 0.25, "decay": 0.55 },
          { "ratio": 2.296, "amp": 0.15, "decay": 0.42 }
        ]
      },
      "noise": { "amp": 0.15, "decay": 0.015, "type": "pink" },
      "lowpass": 1760
    }
  },
  {
    "note": 67,
    "name": "High Agogo",
    "short_name": "High Agogo",
    "description": "High Agogo: pitched bell strike with a clear metallic ring.",
    "preset": {
      "gain": 0.50,
      "duration": 0.5,
      "tones": [
        { "fStart": 1200, "fEnd": 1200, "pitchDecay": 1, "decay": 0.3, "amp": 0.6 },
        { "fStart": 2280, "fEnd": 2280, "pitchDecay": 1, "decay": 0.2, "amp": 0.3 }
      ],
      "highpass": 500
    }
  },
  {
    "note": 68,
    "name": "Low Agogo",
    "short_name": "Low Agogo",
    "description": "Low Agogo: pitched bell strike with a clear metallic ring.",
    "preset": {
      "gain": 0.50,
      "duration": 0.5,
      "tones": [
        { "fStart": 800,  "fEnd": 800,  "pitchDecay": 1, "decay": 0.3, "amp": 0.6 },
        { "fStart": 1520, "fEnd": 1520, "pitchDecay": 1, "decay": 0.2, "amp": 0.3 }
      ],
      "highpass": 500
    }
  },
  {
    "note": 69,
    "name": "Cabasa",
    "short_name": "Cabasa",
    "description": "Cabasa: dry shaker rattle with a fine, gritty texture.",
    "preset": {
      "gain": 0.35,
      "duration": 0.16,
      "noise": {
        "amp": 1,
        "decay": 0.06,
        "type": "pink",
        "bandpass": { "center": 7500, "q": 0.6 }
      },
      "highpass": 6000
    }
  },
  {
    "note": 70,
    "name": "Maracas",
    "short_name": "Maracas",
    "description": "Maracas: crisp shaker rattle with a short, bright tail.",
    "preset": {
      "gain": 0.35,
      "duration": 0.13,
      "noise": {
        "amp": 1,
        "decay": 0.04,
        "type": "pink",
        "bandpass": { "center": 8000, "q": 0.6 }
      },
      "highpass": 7000
    }
  },
  {
    "note": 71,
    "name": "Short Whistle",
    "short_name": "Short Whistle",
    "description": "Short Whistle: breathy whistle tone with a clear sustained.",
    "preset": {
      "gain": 0.45,
      "duration": 0.15,
      "tones": [
        { "fStart": 2200, "fEnd": 2200, "pitchDecay": 1, "decay": 0.15, "amp": 1 }
      ],
      "noise": {
        "amp": 0.05,
        "decay": 0.02,
        "type": "pink",
        "bandpass": { "center": 2200, "q": 3 }
      },
      "highpass": 1500
    }
  },
  {
    "note": 72,
    "name": "Long Whistle",
    "short_name": "Long Whistle",
    "description": "Long Whistle: breathy whistle tone with a clear sustained.",
    "preset": {
      "gain": 0.45,
      "duration": 0.5,
      "tones": [
        { "fStart": 2200, "fEnd": 2200, "pitchDecay": 1, "decay": 0.5, "amp": 1 }
      ],
      "noise": {
        "amp": 0.05,
        "decay": 0.02,
        "type": "pink",
        "bandpass": { "center": 2200, "q": 3 }
      },
      "highpass": 1500
    }
  },
  {
    "note": 73,
    "name": "Short Guiro",
    "short_name": "Short Guiro",
    "description": "Short Guiro: raspy guiro scrape with a textured, rattling.",
    "preset": {
      "gain": 0.42,
      "duration": 0.15,
      "noise": {
        "amp": 1,
        "decay": 0.15,
        "type": "pink",
        "bandpass": { "center": 3500, "q": 1.5 }
      },
      "highpass": 2500
    }
  },
  {
    "note": 74,
    "name": "Long Guiro",
    "short_name": "Long Guiro",
    "description": "Long Guiro: raspy guiro scrape with a textured, rattling.",
    "preset": {
      "gain": 0.42,
      "duration": 0.5,
      "noise": {
        "amp": 1,
        "decay": 0.5,
        "type": "pink",
        "bandpass": { "center": 3500, "q": 1.5 }
      },
      "highpass": 2500
    }
  },
  {
    "note": 75,
    "name": "Claves",
    "short_name": "Claves",
    "description": "Claves: sharp clave click with a dry, woody attack.",
    "preset": {
      "gain": 0.07,
      "duration": 0.13,
      "tones": [
        { "fStart": 2400, "fEnd": 2000, "pitchDecay": 0.005, "decay": 0.05, "amp": 0.8 },
        { "fStart": 3600, "fEnd": 3200, "pitchDecay": 0.005, "decay": 0.04, "amp": 0.5 }
      ],
      "highpass": 1500
    }
  },
  {
    "note": 76,
    "name": "Hi Wood Block",
    "short_name": "Hi Wood Block",
    "description": "Hi Wood Block: woodblock knock with a firm, hollow.",
    "preset": {
      "gain": 0.07,
      "duration": 0.13,
      "tones": [
        { "fStart": 900, "fEnd": 810, "pitchDecay": 0.01, "decay": 0.05, "amp": 1 }
      ],
      "noise": { "amp": 0.18, "decay": 0.006, "type": "pink" },
      "highpass": 300
    }
  },
  {
    "note": 77,
    "name": "Low Wood Block",
    "short_name": "Low Wood Block",
    "description": "Low Wood Block: woodblock knock with a firm, hollow.",
    "preset": {
      "gain": 0.07,
      "duration": 0.13,
      "tones": [
        { "fStart": 550, "fEnd": 495, "pitchDecay": 0.01, "decay": 0.05, "amp": 1 }
      ],
      "noise": { "amp": 0.18, "decay": 0.006, "type": "pink" },
      "highpass": 300
    }
  },
  {
    "note": 78,
    "name": "Mute Cuica",
    "short_name": "Mute Cuica",
    "description": "Mute Cuica: nasal cuica squeak with a sliding pitched.",
    "preset": {
      "gain": 0.45,
      "duration": 0.18,
      "tones": [
        {
          "fStart": 400,
          "fEnd": 700,
          "pitchDecay": 0.15,
          "decay": 0.18,
          "amp": 1,
          "fm": { "ratio": 2.3, "index": 1 }
        }
      ],
      "highpass": 300
    }
  },
  {
    "note": 79,
    "name": "Open Cuica",
    "short_name": "Open Cuica",
    "description": "Open Cuica: nasal cuica squeak with a sliding pitched.",
    "preset": {
      "gain": 0.45,
      "duration": 0.4,
      "tones": [
        {
          "fStart": 400,
          "fEnd": 700,
          "pitchDecay": 0.15,
          "decay": 0.4,
          "amp": 1,
          "fm": { "ratio": 2.3, "index": 1 }
        }
      ],
      "highpass": 300
    }
  },
  {
    "note": 80,
    "name": "Mute Triangle",
    "short_name": "Mute Triangle",
    "description": "Mute Triangle: metal triangle strike with a bright ringing.",
    "preset": {
      "gain": 0.38,
      "duration": 0.2,
      "metallic": {
        "baseFreq": 5200,
        "partials": [1, 1.71, 2.94, 4.62],
        "decay": 0.2,
        "amp": 0.55
      },
      "highpass": 3000
    }
  },
  {
    "note": 81,
    "name": "Open Triangle",
    "short_name": "Open Triangle",
    "description": "Open Triangle: metal triangle strike with a bright ringing.",
    "preset": {
      "gain": 0.38,
      "duration": 1,
      "metallic": {
        "baseFreq": 5200,
        "partials": [1, 1.71, 2.94, 4.62],
        "decay": 1,
        "amp": 0.55
      },
      "highpass": 3000
    }
  },
  {
    "note": 82,
    "name": "Hat",
    "short_name": "Hat",
    "description": "Hat: soft maracas-like shaker with a gentle, airy attack.",
    "preset": {
      "gain": 0.08,
      "duration": 0.26,
      "noiseLayers": [
        { "amp": 0.62, "decay": 0.120, "type": "pink", "bandpass": { "center": 8800,  "q": 0.60 } },
        { "amp": 0.28, "decay": 0.170, "type": "pink", "bandpass": { "center": 10200, "q": 0.56 } }
      ],
      "highpass": 6200,
      "lowpass": 11500
    }
  },
  {
    "note": 83,
    "name": "Open Cuica 2",
    "short_name": "Open Cuica 2",
    "description": "Open Cuica: upward squeak with a breathy edge.",
    "preset": {
      "gain": 0.15,
      "duration": 0.42,
      "tones": [
        { "fStart": 420, "fEnd": 820, "pitchDecay": 0.09, "decay": 0.34, "amp": 0.78, "fm": { "ratio": 2.1, "index": 0.8 } }
      ],
      "noise": { "amp": 0.16, "decay": 0.22, "type": "pink", "bandpass": { "center": 1300, "q": 1.2 } },
      "highpass": 220
    }
  },
  {
    "note": 84,
    "name": "Bell Tree",
    "short_name": "Bell Tree",
    "description": "Bell Tree: cascading metallic chime with a long shimmer.",
    "preset": {
      "gain": 0.3,
      "duration": 1.1,
      "metallic": {
        "baseFreq": 1900,
        "partials": [1, 1.31, 1.71, 2.04, 2.42, 2.83, 3.27],
        "decay": 0.85,
        "amp": 0.42
      },
      "highpass": 650,
      "lowpass": 10500
    }
  }
  ]
};