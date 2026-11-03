var GUS_DRUM_PRESETS = [
  {
    "note": 35,
    "name": "Acoustic Bass Drum",
    "preset": {
      "duration": 0.55,
      "membrane": {
        "freq": 42,
        "pitchDecay": 0.05,
        "decay": 0.35,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.45,
            "decay": 0.55
          },
          {
            "ratio": 2.136,
            "amp": 0.2,
            "decay": 0.35
          },
          {
            "ratio": 2.296,
            "amp": 0.12,
            "decay": 0.25
          }
        ]
      },
      "click": {
        "duration": 0.006,
        "amp": 0.55
      },
      "noise": {
        "amp": 0.18,
        "decay": 0.012,
        "type": "brown"
      },
      "lowpass": 2500
    }
  },
  {
    "note": 36,
    "name": "Bass Drum 1",
    "preset": {
      "duration": 0.55,
      "membrane": {
        "freq": 48,
        "pitchDecay": 0.05,
        "decay": 0.28,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.45,
            "decay": 0.55
          },
          {
            "ratio": 2.136,
            "amp": 0.2,
            "decay": 0.35
          },
          {
            "ratio": 2.296,
            "amp": 0.12,
            "decay": 0.25
          }
        ]
      },
      "click": {
        "duration": 0.006,
        "amp": 0.55
      },
      "noise": {
        "amp": 0.18,
        "decay": 0.012,
        "type": "brown"
      },
      "lowpass": 2500
    }
  },
  {
    "note": 37,
    "name": "Side Stick",
    "preset": {
      "duration": 0.11,
      "noiseLayers": [
        {
          "amp": 0.95,
          "decay": 0.005,
          "type": "white",
          "bandpass": {
            "center": 2600,
            "q": 0.75
          }
        },
        {
          "amp": 0.7,
          "decay": 0.018,
          "type": "white",
          "bandpass": {
            "center": 1100,
            "q": 0.7
          }
        },
        {
          "amp": 0.35,
          "decay": 0.003,
          "type": "white",
          "bandpass": {
            "center": 6000,
            "q": 0.65
          }
        }
      ],
      "click": {
        "duration": 0.0015,
        "amp": 0.25
      },
      "highpass": 350,
      "lowpass": 8500
    }
  },
  {
    "note": 38,
    "name": "Acoustic Snare",
    "preset": {
      "duration": 0.28,
      "membrane": {
        "freq": 180,
        "pitchDecay": 0.02,
        "decay": 0.1,
        "modes": [
          {
            "ratio": 1,
            "amp": 0.55,
            "decay": 1
          },
          {
            "ratio": 1.83,
            "amp": 0.45,
            "decay": 0.85
          },
          {
            "ratio": 2.13,
            "amp": 0.25,
            "decay": 0.55
          }
        ]
      },
      "noise": {
        "amp": 0.95,
        "decay": 0.15,
        "type": "pink",
        "bandpass": {
          "center": 4200,
          "q": 0.6
        }
      },
      "highpass": 400
    }
  },
  {
    "note": 39,
    "name": "Hand Clap",
    "preset": {
      "duration": 0.3,
      "noise": {
        "amp": 0.85,
        "decay": 0.13,
        "type": "pink",
        "bandpass": {
          "center": 1400,
          "q": 0.6
        }
      },
      "highpass": 900,
      "bursts": [
        0,
        0.011,
        0.022,
        0.033
      ]
    }
  },
  {
    "note": 40,
    "name": "Electric Snare",
    "preset": {
      "duration": 0.28,
      "membrane": {
        "freq": 180,
        "pitchDecay": 0.02,
        "decay": 0.1,
        "modes": [
          {
            "ratio": 1,
            "amp": 0.55,
            "decay": 1
          },
          {
            "ratio": 1.83,
            "amp": 0.45,
            "decay": 0.85
          },
          {
            "ratio": 2.13,
            "amp": 0.25,
            "decay": 0.55
          }
        ]
      },
      "noise": {
        "amp": 0.95,
        "decay": 0.22,
        "type": "pink",
        "bandpass": {
          "center": 4200,
          "q": 0.6
        }
      },
      "highpass": 600
    }
  },
  {
    "note": 41,
    "name": "Low Floor Tom",
    "preset": {
      "duration": 0.65,
      "membrane": {
        "freq": 75,
        "pitchDecay": 0.06,
        "decay": 0.5,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.5,
            "decay": 0.75
          },
          {
            "ratio": 2.136,
            "amp": 0.25,
            "decay": 0.55
          },
          {
            "ratio": 2.296,
            "amp": 0.15,
            "decay": 0.42
          }
        ]
      },
      "noise": null,
      "lowpass": 600
    }
  },
  {
    "note": 42,
    "name": "Closed Hi-Hat",
    "preset": {
      "gain": 0.35,
      "duration": 0.14,
      "noiseLayers": [
        {
          "amp": 0.95,
          "decay": 0.008,
          "type": "white",
          "bandpass": {
            "center": 8200,
            "q": 0.48
          }
        },
        {
          "amp": 0.68,
          "decay": 0.024,
          "type": "pink",
          "bandpass": {
            "center": 6100,
            "q": 0.52
          }
        },
        {
          "amp": 0.38,
          "decay": 0.032,
          "type": "white",
          "bandpass": {
            "center": 9300,
            "q": 0.72
          }
        }
      ],
      "highpass": 3600,
      "lowpass": 10200
    }
  },
  {
    "note": 43,
    "name": "High Floor Tom",
    "preset": {
      "duration": 0.6,
      "membrane": {
        "freq": 105,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.5,
            "decay": 0.75
          },
          {
            "ratio": 2.136,
            "amp": 0.25,
            "decay": 0.55
          },
          {
            "ratio": 2.296,
            "amp": 0.15,
            "decay": 0.42
          }
        ]
      },
      "noise": null,
      "lowpass": 840
    }
  },
  {
    "note": 44,
    "name": "Pedal Hi-Hat",
    "preset": {
      "gain": 0.35,
      "duration": 0.16,
      "noiseLayers": [
        {
          "amp": 0.78,
          "decay": 0.006,
          "type": "white",
          "bandpass": {
            "center": 7400,
            "q": 0.52
          }
        },
        {
          "amp": 0.7,
          "decay": 0.019,
          "type": "pink",
          "bandpass": {
            "center": 4800,
            "q": 0.55
          }
        },
        {
          "amp": 0.34,
          "decay": 0.028,
          "type": "pink",
          "bandpass": {
            "center": 2900,
            "q": 0.68
          }
        }
      ],
      "highpass": 1800,
      "lowpass": 9600
    }
  },
  {
    "note": 45,
    "name": "Low Tom",
    "preset": {
      "duration": 0.55,
      "membrane": {
        "freq": 140,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.5,
            "decay": 0.75
          },
          {
            "ratio": 2.136,
            "amp": 0.25,
            "decay": 0.55
          },
          {
            "ratio": 2.296,
            "amp": 0.15,
            "decay": 0.42
          }
        ]
      },
      "noise": null,
      "lowpass": 1120
    }
  },
  {
    "note": 46,
    "name": "Open Hi-Hat",
    "preset": {
      "gain": 0.35,
      "duration": 0.62,
      "noiseLayers": [
        {
          "amp": 1,
          "decay": 0.14,
          "type": "white",
          "bandpass": {
            "center": 10200,
            "q": 0.6
          }
        },
        {
          "amp": 0.62,
          "decay": 0.13,
          "type": "white",
          "bandpass": {
            "center": 9000,
            "q": 0.65
          }
        },
        {
          "amp": 0.18,
          "decay": 0.11,
          "type": "pink",
          "bandpass": {
            "center": 4600,
            "q": 0.65
          }
        }
      ],
      "highpass": 3700,
      "lowpass": 10200
    }
  },
  {
    "note": 47,
    "name": "Low-Mid Tom",
    "preset": {
      "duration": 0.55,
      "membrane": {
        "freq": 180,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.5,
            "decay": 0.75
          },
          {
            "ratio": 2.136,
            "amp": 0.25,
            "decay": 0.55
          },
          {
            "ratio": 2.296,
            "amp": 0.15,
            "decay": 0.42
          }
        ]
      },
      "noise": null,
      "lowpass": 1440
    }
  },
  {
    "note": 48,
    "name": "Hi-Mid Tom",
    "preset": {
      "duration": 0.55,
      "membrane": {
        "freq": 220,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.5,
            "decay": 0.75
          },
          {
            "ratio": 2.136,
            "amp": 0.25,
            "decay": 0.55
          },
          {
            "ratio": 2.296,
            "amp": 0.15,
            "decay": 0.42
          }
        ]
      },
      "noise": null,
      "lowpass": 1760
    }
  },
  {
    "note": 49,
    "name": "Crash Cymbal 1",
    "preset": {
      "gain": 0.35,
      "duration": 1.5,
      "noiseLayers": [
        {
          "amp": 0.9,
          "decay": 0.65,
          "type": "white",
          "bandpass": {
            "center": 8500,
            "q": 0.45
          }
        },
        {
          "amp": 0.7,
          "decay": 0.52,
          "type": "white",
          "bandpass": {
            "center": 6200,
            "q": 0.5
          }
        },
        {
          "amp": 0.45,
          "decay": 0.35750000000000004,
          "type": "pink",
          "bandpass": {
            "center": 3900,
            "q": 0.6
          }
        },
        {
          "amp": 0.3,
          "decay": 0.22749999999999998,
          "type": "white",
          "bandpass": {
            "center": 10200,
            "q": 0.7
          }
        }
      ],
      "highpass": 3000
    }
  },
  {
    "note": 50,
    "name": "High Tom",
    "preset": {
      "duration": 0.55,
      "membrane": {
        "freq": 280,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.5,
            "decay": 0.75
          },
          {
            "ratio": 2.136,
            "amp": 0.25,
            "decay": 0.55
          },
          {
            "ratio": 2.296,
            "amp": 0.15,
            "decay": 0.42
          }
        ]
      },
      "noise": null,
      "lowpass": 2240
    }
  },
  {
    "note": 51,
    "name": "Ride Cymbal 1",
    "preset": {
      "gain": 0.35,
      "duration": 1.1,
      "noiseLayers": [
        {
          "amp": 0.85,
          "decay": 0.035,
          "type": "white",
          "bandpass": {
            "center": 9000,
            "q": 0.5
          }
        },
        {
          "amp": 0.7,
          "decay": 0.5,
          "type": "white",
          "bandpass": {
            "center": 6500,
            "q": 0.48
          }
        },
        {
          "amp": 0.4,
          "decay": 0.325,
          "type": "pink",
          "bandpass": {
            "center": 4200,
            "q": 0.6
          }
        }
      ],
      "highpass": 2500
    }
  },
  {
    "note": 52,
    "name": "Chinese Cymbal",
    "preset": {
      "gain": 0.35,
      "duration": 1.8,
      "noiseLayers": [
        {
          "amp": 0.9,
          "decay": 1,
          "type": "white",
          "bandpass": {
            "center": 8500,
            "q": 0.45
          }
        },
        {
          "amp": 0.7,
          "decay": 0.8,
          "type": "white",
          "bandpass": {
            "center": 6200,
            "q": 0.5
          }
        },
        {
          "amp": 0.45,
          "decay": 0.55,
          "type": "pink",
          "bandpass": {
            "center": 3900,
            "q": 0.6
          }
        },
        {
          "amp": 0.3,
          "decay": 0.35,
          "type": "white",
          "bandpass": {
            "center": 10200,
            "q": 0.7
          }
        }
      ],
      "highpass": 3000
    }
  },
  {
    "note": 53,
    "name": "Ride Bell",
    "preset": {
      "gain": 0.35,
      "duration": 0.9,
      "noiseLayers": [
        {
          "amp": 0.85,
          "decay": 0.03,
          "type": "white",
          "bandpass": {
            "center": 9000,
            "q": 0.5
          }
        },
        {
          "amp": 0.7,
          "decay": 0.2,
          "type": "white",
          "bandpass": {
            "center": 6500,
            "q": 0.48
          }
        },
        {
          "amp": 0.4,
          "decay": 0.13,
          "type": "pink",
          "bandpass": {
            "center": 4200,
            "q": 0.6
          }
        }
      ],
      "highpass": 2500
    }
  },
  {
    "note": 54,
    "name": "Tambourine",
    "preset": {
      "duration": 0.28,
      "metallic": {
        "baseFreq": 900,
        "partials": [
          1,
          1.83,
          2.67,
          3.51,
          4.35,
          5.19
        ],
        "decay": 0.14,
        "amp": 0.35
      },
      "noise": {
        "amp": 0.9,
        "decay": 0.14,
        "type": "pink",
        "bandpass": {
          "center": 6000,
          "q": 0.5
        }
      },
      "highpass": 5500
    }
  },
  {
    "note": 55,
    "name": "Splash Cymbal",
    "preset": {
      "gain": 0.35,
      "duration": 0.6,
      "noiseLayers": [
        {
          "amp": 0.9,
          "decay": 0.35,
          "type": "white",
          "bandpass": {
            "center": 8500,
            "q": 0.45
          }
        },
        {
          "amp": 0.7,
          "decay": 0.27999999999999997,
          "type": "white",
          "bandpass": {
            "center": 6200,
            "q": 0.5
          }
        },
        {
          "amp": 0.45,
          "decay": 0.1925,
          "type": "pink",
          "bandpass": {
            "center": 3900,
            "q": 0.6
          }
        },
        {
          "amp": 0.3,
          "decay": 0.12249999999999998,
          "type": "white",
          "bandpass": {
            "center": 10200,
            "q": 0.7
          }
        }
      ],
      "highpass": 3000
    }
  },
  {
    "note": 56,
    "name": "Cowbell",
    "preset": {
      "duration": 0.5,
      "tones": [
        {
          "fStart": 800,
          "fEnd": 800,
          "pitchDecay": 1,
          "decay": 0.35,
          "amp": 0.55
        },
        {
          "fStart": 540,
          "fEnd": 540,
          "pitchDecay": 1,
          "decay": 0.35,
          "amp": 0.5
        }
      ],
      "highpass": 400
    }
  },
  {
    "note": 57,
    "name": "Crash Cymbal 2",
    "preset": {
      "gain": 0.35,
      "duration": 1.4,
      "noiseLayers": [
        {
          "amp": 0.9,
          "decay": 0.65,
          "type": "white",
          "bandpass": {
            "center": 8500,
            "q": 0.45
          }
        },
        {
          "amp": 0.7,
          "decay": 0.52,
          "type": "white",
          "bandpass": {
            "center": 6200,
            "q": 0.5
          }
        },
        {
          "amp": 0.45,
          "decay": 0.35750000000000004,
          "type": "pink",
          "bandpass": {
            "center": 3900,
            "q": 0.6
          }
        },
        {
          "amp": 0.3,
          "decay": 0.22749999999999998,
          "type": "white",
          "bandpass": {
            "center": 10200,
            "q": 0.7
          }
        }
      ],
      "highpass": 3000
    }
  },
  {
    "note": 58,
    "name": "Vibraslap",
    "preset": {
      "duration": 0.55,
      "tones": [
        {
          "fStart": 400,
          "fEnd": 400,
          "pitchDecay": 1,
          "decay": 0.4,
          "amp": 0.5,
          "fm": {
            "ratio": 3.7,
            "index": 2
          }
        }
      ],
      "noise": {
        "amp": 0.4,
        "decay": 0.3,
        "type": "pink"
      },
      "highpass": 800
    }
  },
  {
    "note": 59,
    "name": "Ride Cymbal 2",
    "preset": {
      "gain": 0.35,
      "duration": 0.9,
      "noiseLayers": [
        {
          "amp": 0.85,
          "decay": 0.035,
          "type": "white",
          "bandpass": {
            "center": 9000,
            "q": 0.5
          }
        },
        {
          "amp": 0.7,
          "decay": 0.5,
          "type": "white",
          "bandpass": {
            "center": 6500,
            "q": 0.48
          }
        },
        {
          "amp": 0.4,
          "decay": 0.325,
          "type": "pink",
          "bandpass": {
            "center": 4200,
            "q": 0.6
          }
        }
      ],
      "highpass": 2500
    }
  },
  {
    "note": 60,
    "name": "Hi Bongo",
    "preset": {
      "duration": 0.27,
      "membrane": {
        "freq": 400,
        "pitchDecay": 0.03,
        "decay": 0.18,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.4,
            "decay": 0.6
          }
        ]
      },
      "noise": {
        "amp": 0.12,
        "decay": 0.012,
        "type": "pink"
      },
      "highpass": 200
    }
  },
  {
    "note": 61,
    "name": "Low Bongo",
    "preset": {
      "duration": 0.27,
      "membrane": {
        "freq": 280,
        "pitchDecay": 0.03,
        "decay": 0.18,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.4,
            "decay": 0.6
          }
        ]
      },
      "noise": {
        "amp": 0.12,
        "decay": 0.012,
        "type": "pink"
      },
      "highpass": 200
    }
  },
  {
    "note": 62,
    "name": "Mute Hi Conga",
    "preset": {
      "duration": 0.42,
      "membrane": {
        "freq": 320,
        "pitchDecay": 0.05,
        "decay": 0.28,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.5,
            "decay": 0.7
          },
          {
            "ratio": 2.136,
            "amp": 0.25,
            "decay": 0.4
          }
        ]
      },
      "noise": {
        "amp": 0.1,
        "decay": 0.012,
        "type": "pink"
      },
      "lowpass": 1920
    }
  },
  {
    "note": 63,
    "name": "Open Hi Conga",
    "preset": {
      "duration": 0.42,
      "membrane": {
        "freq": 280,
        "pitchDecay": 0.05,
        "decay": 0.28,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.5,
            "decay": 0.7
          },
          {
            "ratio": 2.136,
            "amp": 0.25,
            "decay": 0.4
          }
        ]
      },
      "noise": {
        "amp": 0.1,
        "decay": 0.012,
        "type": "pink"
      },
      "lowpass": 1680
    }
  },
  {
    "note": 64,
    "name": "Low Conga",
    "preset": {
      "duration": 0.42,
      "membrane": {
        "freq": 200,
        "pitchDecay": 0.05,
        "decay": 0.28,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.5,
            "decay": 0.7
          },
          {
            "ratio": 2.136,
            "amp": 0.25,
            "decay": 0.4
          }
        ]
      },
      "noise": {
        "amp": 0.1,
        "decay": 0.012,
        "type": "pink"
      },
      "lowpass": 1200
    }
  },
  {
    "note": 65,
    "name": "High Timbale",
    "preset": {
      "duration": 0.35,
      "membrane": {
        "freq": 280,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.5,
            "decay": 0.75
          },
          {
            "ratio": 2.136,
            "amp": 0.25,
            "decay": 0.55
          },
          {
            "ratio": 2.296,
            "amp": 0.15,
            "decay": 0.42
          }
        ]
      },
      "noise": {
        "amp": 0.15,
        "decay": 0.015,
        "type": "pink"
      },
      "lowpass": 2240
    }
  },
  {
    "note": 66,
    "name": "Low Timbale",
    "preset": {
      "duration": 0.4,
      "membrane": {
        "freq": 220,
        "pitchDecay": 0.06,
        "decay": 0.42,
        "modes": [
          {
            "ratio": 1,
            "amp": 1,
            "decay": 1
          },
          {
            "ratio": 1.593,
            "amp": 0.5,
            "decay": 0.75
          },
          {
            "ratio": 2.136,
            "amp": 0.25,
            "decay": 0.55
          },
          {
            "ratio": 2.296,
            "amp": 0.15,
            "decay": 0.42
          }
        ]
      },
      "noise": {
        "amp": 0.15,
        "decay": 0.015,
        "type": "pink"
      },
      "lowpass": 1760
    }
  },
  {
    "note": 67,
    "name": "High Agogo",
    "preset": {
      "duration": 0.5,
      "tones": [
        {
          "fStart": 1200,
          "fEnd": 1200,
          "pitchDecay": 1,
          "decay": 0.3,
          "amp": 0.6
        },
        {
          "fStart": 2280,
          "fEnd": 2280,
          "pitchDecay": 1,
          "decay": 0.2,
          "amp": 0.3
        }
      ],
      "highpass": 500
    }
  },
  {
    "note": 68,
    "name": "Low Agogo",
    "preset": {
      "duration": 0.5,
      "tones": [
        {
          "fStart": 800,
          "fEnd": 800,
          "pitchDecay": 1,
          "decay": 0.3,
          "amp": 0.6
        },
        {
          "fStart": 1520,
          "fEnd": 1520,
          "pitchDecay": 1,
          "decay": 0.2,
          "amp": 0.3
        }
      ],
      "highpass": 500
    }
  },
  {
    "note": 69,
    "name": "Cabasa",
    "preset": {
      "duration": 0.16,
      "noise": {
        "amp": 1,
        "decay": 0.06,
        "type": "pink",
        "bandpass": {
          "center": 7500,
          "q": 0.6
        }
      },
      "highpass": 6000
    }
  },
  {
    "note": 70,
    "name": "Maracas",
    "preset": {
      "duration": 0.13,
      "noise": {
        "amp": 1,
        "decay": 0.04,
        "type": "pink",
        "bandpass": {
          "center": 8000,
          "q": 0.6
        }
      },
      "highpass": 7000
    }
  },
  {
    "note": 71,
    "name": "Short Whistle",
    "preset": {
      "duration": 0.15,
      "tones": [
        {
          "fStart": 2200,
          "fEnd": 2200,
          "pitchDecay": 1,
          "decay": 0.15,
          "amp": 1
        }
      ],
      "noise": {
        "amp": 0.05,
        "decay": 0.02,
        "type": "pink",
        "bandpass": {
          "center": 2200,
          "q": 3
        }
      },
      "highpass": 1500
    }
  },
  {
    "note": 72,
    "name": "Long Whistle",
    "preset": {
      "duration": 0.5,
      "tones": [
        {
          "fStart": 2200,
          "fEnd": 2200,
          "pitchDecay": 1,
          "decay": 0.5,
          "amp": 1
        }
      ],
      "noise": {
        "amp": 0.05,
        "decay": 0.02,
        "type": "pink",
        "bandpass": {
          "center": 2200,
          "q": 3
        }
      },
      "highpass": 1500
    }
  },
  {
    "note": 73,
    "name": "Short Guiro",
    "preset": {
      "duration": 0.15,
      "noise": {
        "amp": 1,
        "decay": 0.15,
        "type": "pink",
        "bandpass": {
          "center": 3500,
          "q": 1.5
        }
      },
      "highpass": 2500
    }
  },
  {
    "note": 74,
    "name": "Long Guiro",
    "preset": {
      "duration": 0.5,
      "noise": {
        "amp": 1,
        "decay": 0.5,
        "type": "pink",
        "bandpass": {
          "center": 3500,
          "q": 1.5
        }
      },
      "highpass": 2500
    }
  },
  {
    "note": 75,
    "name": "Claves",
    "preset": {
      "duration": 0.13,
      "tones": [
        {
          "fStart": 2400,
          "fEnd": 2000,
          "pitchDecay": 0.005,
          "decay": 0.05,
          "amp": 0.8
        },
        {
          "fStart": 3600,
          "fEnd": 3200,
          "pitchDecay": 0.005,
          "decay": 0.04,
          "amp": 0.5
        }
      ],
      "highpass": 1500
    }
  },
  {
    "note": 76,
    "name": "Hi Wood Block",
    "preset": {
      "duration": 0.13,
      "tones": [
        {
          "fStart": 900,
          "fEnd": 810,
          "pitchDecay": 0.01,
          "decay": 0.05,
          "amp": 1
        }
      ],
      "noise": {
        "amp": 0.18,
        "decay": 0.006,
        "type": "pink"
      },
      "highpass": 300
    }
  },
  {
    "note": 77,
    "name": "Low Wood Block",
    "preset": {
      "duration": 0.13,
      "tones": [
        {
          "fStart": 550,
          "fEnd": 495,
          "pitchDecay": 0.01,
          "decay": 0.05,
          "amp": 1
        }
      ],
      "noise": {
        "amp": 0.18,
        "decay": 0.006,
        "type": "pink"
      },
      "highpass": 300
    }
  },
  {
    "note": 78,
    "name": "Mute Cuica",
    "preset": {
      "duration": 0.18,
      "tones": [
        {
          "fStart": 400,
          "fEnd": 700,
          "pitchDecay": 0.15,
          "decay": 0.18,
          "amp": 1,
          "fm": {
            "ratio": 2.3,
            "index": 1
          }
        }
      ],
      "highpass": 300
    }
  },
  {
    "note": 79,
    "name": "Open Cuica",
    "preset": {
      "duration": 0.4,
      "tones": [
        {
          "fStart": 400,
          "fEnd": 700,
          "pitchDecay": 0.15,
          "decay": 0.4,
          "amp": 1,
          "fm": {
            "ratio": 2.3,
            "index": 1
          }
        }
      ],
      "highpass": 300
    }
  },
  {
    "note": 80,
    "name": "Mute Triangle",
    "preset": {
      "duration": 0.2,
      "metallic": {
        "baseFreq": 5200,
        "partials": [
          1,
          1.71,
          2.94,
          4.62
        ],
        "decay": 0.2,
        "amp": 0.55
      },
      "highpass": 3000
    }
  },
  {
    "note": 81,
    "name": "Open Triangle",
    "preset": {
      "duration": 1,
      "metallic": {
        "baseFreq": 5200,
        "partials": [
          1,
          1.71,
          2.94,
          4.62
        ],
        "decay": 1,
        "amp": 0.55
      },
      "highpass": 3000
    }
  }
];
