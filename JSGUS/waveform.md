Search for `program|name|defaultWaveform`

Read , lines 1 to 120
Completed with input: {
  "path": "D:\\MagicServer\\www\\GUSMalik\\JSGUS\\ProjectPatchGenerator.js",
  "view_range": [
    1,
    120
  ]
}

Read , lines 1 to 100
Completed with input: {
  "path": "D:\\MagicServer\\www\\GUSMalik\\JSGUS\\index.html",
  "view_range": [
    1,
    100
  ]
}

Read , lines 1 to 560
Completed with input: {
  "path": "D:\\MagicServer\\www\\GUSMalik\\JSGUS\\melodic-presets.js",
  "view_range": [
    1,
    560
  ]
}

Ran terminal command: @'
const fs=require('fs'),vm=require('vm');const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('JSGUS\\melodic-presets.js','utf8'),context);for(const x of context.GUS_MELODIC_PRESETS.instruments)console.log(`${String(x.program).padStart(3,'0')}|${x.name}|${x.family}`)
'@ | node -

## Rekomendasi waveform untuk 128 instrumen GM

Ini adalah titik awal berdasarkan karakter spektrum waveform yang tersedia, bukan simulasi fisik instrumennya. Jika ingin mempertahankan karakter preset bawaan—termasuk envelope dan transient—coba **Preset/Default** terlebih dahulu.

### Piano

| Program | Instrumen | Waveform |
|---:|---|---|
| 0 | Acoustic Grand Piano | `hammer` |
| 1 | Bright Piano | `hammer` |
| 2 | Electric Grand | `bell` |
| 3 | Honky-tonk | `hammer` |
| 4 | E.Piano 1 | `bell` |
| 5 | E.Piano 2 | `bell` |
| 6 | Harpsichord | `pluck` |
| 7 | Clavinet | `pluck` |

### Chromatic Percussion

| Program | Instrumen | Waveform |
|---:|---|---|
| 8 | Celesta | `bell` |
| 9 | Glockenspiel | `bell` |
| 10 | Music Box | `pluck` |
| 11 | Vibraphone | `bell` |
| 12 | Marimba | `hammer` |
| 13 | Xylophone | `hammer` |
| 14 | Tubular Bells | `bell` |
| 15 | Dulcimer | `pluck` |

### Organ

| Program | Instrumen | Waveform |
|---:|---|---|
| 16 | Drawbar Organ | `organ` |
| 17 | Percussive Organ | `pulse` |
| 18 | Rock Organ | `square` |
| 19 | Church Organ | `organ` |
| 20 | Reed Organ | `reed` |
| 21 | Accordion | `reed` |
| 22 | Harmonica | `reed` |
| 23 | Tango Accordion | `reed` |

### Guitar

| Program | Instrumen | Waveform |
|---:|---|---|
| 24 | Nylon Guitar | `pluck` |
| 25 | Steel Guitar | `pluck` |
| 26 | Jazz Guitar | `pluck` |
| 27 | Clean Guitar | `pluck` |
| 28 | Muted Guitar | `pluck` |
| 29 | Overdriven Gtr | `saw` |
| 30 | Distortion Gtr | `saw` |
| 31 | Gtr Harmonics | `sine` |

### Bass

| Program | Instrumen | Waveform |
|---:|---|---|
| 32 | Acoustic Bass | `pluck` |
| 33 | Finger Bass | `pluck` |
| 34 | Pick Bass | `pluck` |
| 35 | Fretless Bass | `triangle` |
| 36 | Slap Bass 1 | `pluck` |
| 37 | Slap Bass 2 | `hammer` |
| 38 | Synth Bass 1 | `saw` |
| 39 | Synth Bass 2 | `square` |

### Strings dan Ensemble

| Program | Instrumen | Waveform |
|---:|---|---|
| 40 | Violin | `bow` |
| 41 | Viola | `bow` |
| 42 | Cello | `bow` |
| 43 | Contrabass | `bow` |
| 44 | Tremolo Str | `string` |
| 45 | Pizzicato | `pluck` |
| 46 | Harp | `pluck` |
| 47 | Timpani | `hammer` |
| 48 | Strings 1 | `string` |
| 49 | Strings 2 | `bow` |
| 50 | SynthStrings 1 | `saw` |
| 51 | SynthStrings 2 | `triangle` |
| 52 | Choir Aahs | `breath` |
| 53 | Voice Oohs | `sine` |
| 54 | Synth Voice | `breath` |
| 55 | Orchestra Hit | `hammer` |

### Brass

| Program | Instrumen | Waveform |
|---:|---|---|
| 56 | Trumpet | `saw` |
| 57 | Trombone | `saw` |
| 58 | Tuba | `square` |
| 59 | Muted Trpt | `pulse` |
| 60 | French Horn | `saw` |
| 61 | Brass Section | `saw` |
| 62 | SynthBrass 1 | `saw` |
| 63 | SynthBrass 2 | `pulse` |

### Reed

| Program | Instrumen | Waveform |
|---:|---|---|
| 64 | Soprano Sax | `reed` |
| 65 | Alto Sax | `reed` |
| 66 | Tenor Sax | `reed` |
| 67 | Bari Sax | `reed` |
| 68 | Oboe | `reed` |
| 69 | English Horn | `reed` |
| 70 | Bassoon | `clarinet` |
| 71 | Clarinet | `clarinet` |

### Pipe

| Program | Instrumen | Waveform |
|---:|---|---|
| 72 | Piccolo | `sine` |
| 73 | Flute | `flute` |
| 74 | Recorder | `flute` |
| 75 | Pan Flute | `sine` |
| 76 | Blown Bottle | `breath` |
| 77 | Shakuhachi | `breath` |
| 78 | Whistle | `sine` |
| 79 | Ocarina | `flute` |

### Lead

| Program | Instrumen | Waveform |
|---:|---|---|
| 80 | Lead (square) | `square` |
| 81 | Lead (saw) | `saw` |
| 82 | Lead (calliope) | `pulse` |
| 83 | Lead (chiff) | `clarinet` |
| 84 | Lead (charang) | `saw` |
| 85 | Lead (voice) | `breath` |
| 86 | Lead (fifths) | `saw` |
| 87 | Lead (bass+ld) | `square` |

### Pad

| Program | Instrumen | Waveform |
|---:|---|---|
| 88 | Pad (new age) | `sine` |
| 89 | Pad (warm) | `triangle` |
| 90 | Pad (polysynth) | `saw` |
| 91 | Pad (choir) | `breath` |
| 92 | Pad (bowed) | `bow` |
| 93 | Pad (metallic) | `bell` |
| 94 | Pad (halo) | `sine` |
| 95 | Pad (sweep) | `saw` |

### FX

| Program | Instrumen | Waveform |
|---:|---|---|
| 96 | FX (rain) | `breath` |
| 97 | FX (soundtrack) | `string` |
| 98 | FX (crystal) | `bell` |
| 99 | FX (atmosphere) | `breath` |
| 100 | FX (brightness) | `bell` |
| 101 | FX (goblins) | `square` |
| 102 | FX (echoes) | `pluck` |
| 103 | FX (sci-fi) | `saw` |

### Ethnic

| Program | Instrumen | Waveform |
|---:|---|---|
| 104 | Sitar | `pluck` |
| 105 | Banjo | `pluck` |
| 106 | Shamisen | `pluck` |
| 107 | Koto | `pluck` |
| 108 | Kalimba | `hammer` |
| 109 | Bagpipe | `reed` |
| 110 | Fiddle | `bow` |
| 111 | Shanai | `reed` |

### Percussive

| Program | Instrumen | Waveform |
|---:|---|---|
| 112 | Tinkle Bell | `bell` |
| 113 | Agogo | `pulse` |
| 114 | Steel Drums | `bell` |
| 115 | Woodblock | `hammer` |
| 116 | Taiko Drum | `hammer` |
| 117 | Melodic Tom | `hammer` |
| 118 | Synth Drum | `sine` |
| 119 | Reverse Cymbal | `breath` |

### Sound Effects

| Program | Instrumen | Waveform |
|---:|---|---|
| 120 | Fret Noise | `breath` |
| 121 | Breath Noise | `breath` |
| 122 | Seashore | `breath` |
| 123 | Bird Tweet | `sine` |
| 124 | Telephone | `square` |
| 125 | Helicopter | `saw` |
| 126 | Applause | `breath` |
| 127 | Gunshot | `hammer` |