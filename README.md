# Planetbiru Instrument Editor

A browser-based editor for **Gravis Ultrasound (GUS) `.PAT` patches**, **SoundFonts (`.sf2` and `.sf3`)**, **Surge VST2 presets (`.fxp`)**, and **SFZ instruments**. It also supports importing and exporting Timidity ZIP packages and MIDI.js soundfonts — plus full waveform editing, sample management, MIDI playback, interactive timeline visualization, and instrument export.

Built with vanilla JavaScript and no build step. Runs entirely in the browser. All data is stored locally in IndexedDB.

---

## Table of Contents

- [Features](#features)
- [File Format Support](#file-format-support)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Browser Requirements](#browser-requirements)
- [Architecture](#architecture)
- [Localization](#localization)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## Features

### Instrument & Patch Editing
- **Full GUS `.PAT` support** — parse, inspect, edit, and export Gravis Ultrasound patches
- **SoundFont (`.sf2` / `.sf3`) support** — import presets into editable patches, including Ogg Vorbis-compressed SF3 samples, and export projects to standard SF2
- **Surge VST2 `.fxp` import** — converts embedded Surge wavetable/sample data into an approximate playable GUS patch
- **SFZ package support** — import `.sfz` instruments and their audio samples from `.zip` archives, and export project patches as SFZ ZIP packages
- **Patch properties** — description, voice count, channel count, master volume, data size, GM program/bank mapping
- **Instrument management** — add, rename, reorder, and export individual instruments
- **Sample bank management** — per-sample rate, root frequency, low/high frequency range, tune, balance, scale factor, envelope rates/offsets, tremolo/vibrato, and 8 sample mode flags

### Sample Editor
- **Waveform canvas** with zoom (up to 1000×), pan, and per-sample rendering
- **Selection tool** and **pencil tool** for drawing waveform data
- **DSP operations**: normalize, fade in/out, silence, reverse, amplify, remove DC offset
- **Loop editing**: set loop from selection or entire sample, fractions support
- **Undo history** (last 16 operations)
- **WAV import/export** — reads 8/16/24/32-bit mono/stereo, respects `smpl` loop chunks on both import and export
- **Sample JSON import/export** — lossless base64-encoded PCM snapshot for transferring samples between patches
- **Keyboard and MIDI testing** — play the current sample from your keyboard (A W S E D F T G Y H U J K) or a connected MIDI controller
- **Microphone recording** — record audio directly via MediaRecorder and convert to 16-bit mono PCM
- **Auto-parameter estimation** on import — root frequency via autocorrelation, envelope via RMS analysis
- **Frequency range map** — visualize sample coverage across the keyboard to detect overlaps
- **Generated sample variants and key zones** — choose A to restore the original instrument sound, or B–E for alternate waveforms; generate melodic samples for MIDI pitch ranges 0–127 and add multiple non-overlapping zones to build multi-sample instruments. Each Demo melodic patch contains seven samples covering the full MIDI range.

### File Import
| Format | Extension | Description |
|---|---|---|
| GUS Patch | `.pat` | Native Gravis Ultrasound patch format |
| SoundFont 2 | `.sf2` | Extracts all presets, including drum kits (split per MIDI note) |
| SoundFont 3 | `.sf3` | Decodes mono Ogg Vorbis samples and extracts all presets; mixed PCM/compressed files are supported |
| Surge VST2 preset | `.fxp` | Converts embedded wavetable and sample oscillator data to a playable GUS patch |
| Timidity package | `.zip` | Timidity distribution packages containing `timidity.cfg` |
| SFZ Package | `.zip` | Instruments containing `.sfz` files and their audio samples (`.wav`, `.mp3`, etc.) |
| MIDI.js soundfont | `.js` | FluidR3_GM-style OGG/MP3 soundfonts from jsDelivr and similar CDNs |
| MIDI.js from URL | — | Fetch soundfont directly from a URL |

### MIDI Playback & Visualization
- **In-browser MIDI playback** via LibTiMidityPlayer (WASM)
- **Interactive MIDI Timeline** — visualize instrument usage across all 16 channels over time (ticks)
- **Real-time Playhead** — a synchronized vertical line that smoothly tracks the current playback position across the entire timeline
- **Timeline Playback Controls** — play, pause, and seek directly from the Timeline modal, with synchronized UI updates
- **Interactive Segments** — click any instrument bar in the timeline to instantly jump to and select the corresponding patch in the library
- **Loaded MIDI libraries** — inspect patches loaded by the player after playback starts
- **Drum kit preview** — audition individual drum notes from a selected project's kit
- **GM Map** — check which General MIDI melodic programs and drum sounds are available in the active project
- **Bank selection** — switch which target bank each channel uses
- **Volume control** — safe API-based volume, no crash-prone MIDI CC injection
- **Seek / pause / resume** — precise tempo-map-aware duration calculation
- **Offline render to WAV** — full mixdown with all loaded patches
- **Per-instrument loading status** — see which patch is currently decoding

### Project Management
- Multiple projects, each with its own patch list
- **Demo project** — generate 128 melodic GM patches and 47 drum-note patches; melodic patches use seven samples covering MIDI pitches 0–127
- **Project properties** — edit project name, author, source, dates, and description
- Patches are automatically shared between projects if referenced by multiple projects
- **Recovered Library** — patches whose project assignment was lost are recovered automatically
- **Clearing library** — wipes all patches while preserving projects
- **Deleting projects** — cleans up exclusive patches; shared patches are preserved

### Bank / Drum Set Management
- **Target bank assignment** — renumber banks and drum sets independently of original order
- **Per-row reordering** via drag and drop
- **Filtered views** — filter by GM program, drum vs melodic, and target bank
- **Selective export** — checkbox each patch to control what gets included in the ZIP
- **Compact banks** — collapse sparse target banks to sequential 0, 1, 2, …
- **Bank health check** — flags broken or zero-byte patches before exporting

### Bidirectional PAT ⇄ SF2 Roundtrip
- **Export any project to SF2** — melodic presets and drum kits are consolidated into a standard SoundFont 2 file
- **Export any project to SFZ ZIP** — creates one SFZ instrument per patch with WAV samples, key/root mapping, and loop points
- **Import SF2 back** — each preset becomes a GUS patch; drum kits are split per MIDI note
- **Lossless roundtrip** — PCM data, root frequency, loop points, key ranges, and sample rates survive any number of `PAT → SF2 → PAT → SF2 → …` conversions
- **Sub-cent pitch accuracy** — root frequency is encoded as `originalPitch` (MIDI note) + `chPitchCorrection` (signed cents), verified to stay within ±0.5 cent across conversions
- **Round-trip tested** — chain conversions are bit-exact for PCM and loop points, and pitch-stable to < 1 cent for root frequency

### Export
- **Single patch** export to `.pat`
- **Single instrument** export to `.pat`
- **Whole library** export to ZIP with `manifest.json` and `timidity.cfg`
- **Selected banks** export with configurable target banks
- **Whole project** export to `.sf2` SoundFont
- **Rendered MIDI** export to `.wav`

### Localization
- Full English and Indonesian UI
- Language preference persists across sessions
- All strings live in `assets/locales/{id,en}.json`

---

## File Format Support

### `.PAT` (Gravis Ultrasound Patch)

The editor implements the full GF1PATCH110 binary format:

- Header (129 bytes): magic, Gravis ID, description, voices, channels, wave count, master volume, data size
- Instrument headers (63 bytes each)
- Layer headers (47 bytes each)
- Sample headers (96 bytes each)
- Raw PCM data (8 or 16-bit, signed or unsigned)
- Envelope tables, loop points, modes, scale factors

Both direct sample-rate values and legacy period-based values (nanoseconds) are auto-detected and normalized.

### Timidity ZIP Packages

Exported ZIPs contain:

```
manifest.json              # All patch metadata
timidity.cfg               # Bank / drumset / program mapping
<bank>/tone/<name>.pat     # Melodic patches
<bank>/drum/<name>.pat     # Drum kit patches
```

The `timidity.cfg` follows standard Timidity syntax:

```
dir .
bank 0
0 acoustic_grand_piano.pat
24 acoustic_guitar_nylon.pat

drumset 0
35 kick_1.pat
38 snare_1.pat
```

### `.sfz` (SFZ Packages)

The editor can parse and import `.sfz` instrument definitions, provided they are packaged inside a standard `.zip` file along with their audio samples (`.wav`, `.mp3`, etc.).

**How it works:**
- The parser reads `<control>`, `<global>`, `<master>`, `<group>`, and `<region>` blocks.
- Sample paths defined in `sample=` opcodes are resolved relatively to the `.sfz` file's location inside the ZIP (including `..` directory traversal).
- Basic opcodes are honored: `pitch_keycenter`, `lokey`, `hikey`, `lovel`, `hivel`, `loop_mode`, `loop_start`, `loop_end`, `tune`, and `transpose`.
- **Melodic instruments** are imported as a single GUS patch containing all mapped samples.
- **Drum kits** (detected via naming or group routing) are split into one GUS patch per MIDI note.
- Supported audio formats depend entirely on the browser's `decodeAudioData` capability (usually WAV, MP3, and OGG).

### `.sf2` and `.sf3` (SoundFonts)

**Import.** A single SoundFont may contain dozens of presets. Each one is turned into its own GUS patch. SF2 PCM samples are imported directly; SF3 Ogg Vorbis samples are decoded by the browser's Web Audio implementation. SF3 compressed samples must be mono and use Ogg Vorbis.

- Melodic presets (`bank 0`–`127`) → one patch each. `gmProgram = preset` and `gmBank = bank`.
- Drum kits (`bank 128`) → **one patch per MIDI note** covered by the kit's key ranges. Every patch in the same kit shares a `drumSet` ID.
- Generators honored on import: `keyRange` (43), `sampleModes` (54), `overridingRootKey` (58), `coarseTune` (51), `fineTune` (52), `sampleID` (53).

**Export.** Any project can be written as a SoundFont:

- Each patch becomes a preset at its **target bank** and **GM program** (falling back to `originalOrder` when unset).
- Drum patches that share a target bank are merged into a single Bank 128 preset, with one key-range zone per MIDI note.
- Loop points, sample rates, `originalPitch`, and `chPitchCorrection` are written to `shdr`; loop mode is written as the `sampleModes` generator.

**Roundtrip fidelity.**

```
PAT ──► SF2 ──► PAT ──► SF2 ──► PAT ──► …
```

Every pass through this chain preserves the following:

| Property | Precision |
|---|---|
| PCM samples | Bit-exact (8-bit inputs promote to 16-bit on the first conversion, then remain exact) |
| Root frequency | < 1 cent drift, encoded via `originalPitch` + `chPitchCorrection` |
| Loop points | Bit-exact in frame counts; fractional loop offsets are lost |
| Sample rate | Bit-exact (`shdr.dwSampleRate`) |
| Key range | Bit-exact in MIDI notes (via `lowFreq`/`highFreq` ⇄ `keyRange`) |
| Preset name, bank, program | Preserved; names capped at 20 characters |

**Not preserved** — these are SF2 format limitations, not bugs:

- Envelope rates and offsets (SF2 uses its own envelope generator that GUS patches don't carry)
- Tremolo and vibrato settings
- Loop `.fractions` byte (sub-frame loop offsets)
- `scaleFreq` and `scaleFactor` — metadata-only UI fields; `scaleFreq` is rewritten from `rootFreq` on export

> **Tip:** Because pitch is derived from `rootFreq` (via `originalPitch` + `chPitchCorrection`), two patches with identical PCM but different `scaleFreq` will roundtrip to identical pitches. If a patch's `scaleFreq` looks different after a roundtrip, only the UI label changed — the audible pitch did not.

### Surge VST2 `.fxp` presets

Surge VST2 program presets with embedded oscillator wavetable data can be imported as approximate GUS patches. The first frame of each embedded wavetable is converted to a looped sample; embedded sample oscillators retain their sample data as one-shot samples. The conversion retains the preset name and oscillator octave where available, but does not render Surge's filters, envelopes, effects, modulation, or wavetable animation. Other plugin vendors' FXP files and Surge presets without embedded wavetable/sample data are not supported.

---

## Screenshots

> Add screenshots to `docs/` and update these image paths before publishing.

| Welcome | Sample editor |
|---|---|
| ![Welcome](docs/screenshot-welcome.png) | ![Editor](docs/screenshot-editor.png) |

| Bank manager | MIDI Timeline |
|---|---|
| ![Bank manager](docs/screenshot-bank-manager.png) | ![MIDI Timeline](docs/screenshot-timeline.png) |

---

## Getting Started

### Requirements

- A modern browser (see [Browser Requirements](#browser-requirements))
- A local web server — the app uses `fetch()` for locale files, so `file://` URLs won't work

### Running Locally

```bash
# Clone the repository
git clone https://github.com/Planetbiru/GUS.git
cd GUS

# Start a simple HTTP server (any of these work)
python3 -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000
```

Then open **http://localhost:8000** in your browser.

### First Run

1. Click **Demo** or **Create Demo** to generate a demo project with 128 melodic GM patches and 47 drum-note patches. Each melodic patch has seven samples spanning MIDI pitches 0–127; the first generation can take longer than subsequent opens.
2. Or click **Add Project** → **Open a .PAT file** to import your own patch
3. Once patches exist, use the **MIDI Preview** panel to load a `.mid` file and hear your patches

---

## Usage

### Loading a Patch

**From a GUS `.PAT` file:**
```
Projects sidebar → Add Patch → Open a .PAT file
```

**From a SoundFont:**
```
Projects sidebar → Import Package → select .sf2 or .sf3
```
SF2 and SF3 SoundFonts can also be opened from the header file picker. Each preset becomes a separate GUS patch. Drum kits (`bank 128`) are split into one patch per MIDI note.

**From a Timidity ZIP:**
```
Header → Open .PAT / .SF2 / .SF3 → select a ZIP produced by this editor or a compatible Timidity package
```

**From an SFZ Package (ZIP):**
```
Header → Open .PAT / .SF2 / .SF3 → select a ZIP containing .sfz and audio files
```
The ZIP file must contain the `.sfz` file(s) and all referenced audio samples. Melodic SFZ files are combined into a single patch, while drum kits are split per MIDI note.

**From a MIDI.js soundfont:**
```
Header → Open .PAT / .SF2 / .SF3 → select an .js file
# or
Header → MIDI.js URL → paste a jsDelivr URL
```

### Editing a Sample

1. Click any sample card in the **Samples** section
2. Use the waveform canvas:
   - **Scroll** = zoom
   - **Shift + Scroll**, **Middle-Click**, or **Alt + Drag** = pan
   - **Select tool** = drag to select a range
   - **Pencil tool** = draw the waveform directly
3. Apply DSP operations from the toolbar
4. Set loop points, mode flags, envelope values, or click a key on the test keyboard

### Generating or Restoring a Sample

When adding a sample, open **Generate Automatically**, choose the instrument type and program, then select a variant:

| Variant | Result |
|---|---|
| **A — Original** | The default generated instrument sound used for Demo samples |
| **B — Sine** | Replace the instrument sound with a sine waveform |
| **C — Triangle** | Replace it with a triangle waveform |
| **D — Sawtooth** | Replace it with a sawtooth waveform |
| **E — Square** | Replace it with a square waveform |

The same A–E choices appear in the sample editor for generated samples. Select **A — Original** to restore the saved original sample after trying another waveform. This restores the original PCM rather than generating it again, so any noise in the original sound is preserved exactly.

For melodic samples, set **Pitch From** and **Pitch To** to MIDI note numbers from 0 to 127. Each generation creates one sample for the selected range; create additional samples with adjacent, non-overlapping ranges to cover more notes. Leaving the default range at 0–127 makes that sample cover the full keyboard. Drum samples use the full range automatically. If Demo generation is run again, incomplete generated melodic patches are upgraded to seven full-coverage zones.

### Playing MIDI & Using the Timeline

1. Select a project
2. Click **Load MIDI** in the **MIDI Preview** panel
3. Choose a bank with **Select Bank**
4. Click **Play** — the loaded project patches will be used
5. Click **Timeline** (the chart icon next to Select Bank) to open the **MIDI Timeline** modal:
   - View a visual representation of which instruments and banks are used on each of the 16 channels over time.
   - The red vertical line is the **Playhead**, tracking the current position in real-time.
   - Use the **Play/Pause** and **Seek** controls directly in the modal footer to navigate the song without closing the timeline.
   - Click any colored instrument segment to instantly jump to that patch in the library.
6. Start playback, then use **View Libraries** to inspect the patches loaded by the MIDI player.
7. Open **Test Drums** to select a kit and preview its individual MIDI-note sounds through the MIDI player.
8. Open **GM Map** from the library to see which General MIDI instruments and drum sounds are available in the active project. Click an available melodic instrument to open its patch.

### Exporting

| Button | Result |
|---|---|
| **Download .PAT** (header) | Current patch as a single `.pat` file |
| **Export This Instrument** | Only the selected instrument |
| **Export ZIP** (library) | All patches in the current library view |
| **Export Selected** (bank manager) | Patches checked in the bank table |
| **Export Project → SF2** (project toolbar) | Current project as a single `.sf2` SoundFont |
| **Render WAV** (MIDI preview) | Offline-rendered mixdown |
| **Download WAV** (sample editor) | Current sample as a `.wav` file |
| **Export JSON** (sample editor) | Sample with PCM as base64 JSON |

### Exporting a Project to SF2

Any project with at least one patch can be exported as a SoundFont:

```
Projects sidebar → select a project → Export SF2
```

- Melodic patches are emitted as presets at their **target bank** and **GM program**.
- Drum patches that share a target bank are merged into a single Bank 128 preset, one zone per MIDI note.
- The resulting `.sf2` loads in any SF2-compatible synth (FluidSynth, TiMidity, sF2 stubs, the built-in preview when re-imported, etc.).
- Re-importing the `.sf2` produces patches that **sound identical** to the original project — pitch, loop points, and PCM data are preserved.

### Sharing Samples Between Patches

1. Open the source patch → select the sample → **Export JSON**
2. Open the target patch → select the target instrument → **Import JSON**
3. The sample is added to the first layer of that instrument

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `A` `W` `S` `E` `D` `F` `T` `G` `Y` `H` `U` `J` `K` | Play notes C3–C4 (when a sample is selected) |
| `Scroll` | Zoom waveform in / out |
| `Shift` + `Scroll` | Pan waveform |
| `Alt` + `Drag` | Pan waveform |
| `Escape` | Close modal / cancel selection |
| `Enter` | Confirm modal |

---

## Browser Requirements

| Feature | Minimum |
|---|---|
| ES2020 (`?.`, `??`) | Chrome 80, Firefox 74, Safari 13.1 |
| IndexedDB | All modern browsers |
| Web Audio API | All modern browsers |
| Web MIDI API | Chrome / Edge / Opera (Firefox and Safari have limited support) |
| `DecompressionStream` (ZIP import) | Chrome 80, Safari 16.4, Firefox 113 |
| `MediaRecorder` (microphone) | Chrome / Firefox / Edge |
| WASM (LibTiMidityPlayer) | All modern browsers |
| WebGL / Canvas2D | All modern browsers |

Tested on:
- Chrome 120+ (desktop + Android)
- Firefox 120+ (desktop)
- Edge 120+ (desktop)

---

## Architecture

```
planetbiru-instrument-editor/
├── index.html                         # Single-page app shell
├── assets/
│   ├── css/
│   │   ├── style.css                  # Application styling
│   │   └── style.min.css
│   ├── js/
│   │   ├── script.js                  # Shared state, initialization, and compatibility delegates
│   │   ├── application-controller.js
│   │   ├── patch-data-service.js
│   │   ├── bank-controller.js
│   │   ├── editor-controller.js       # Sample editing and generated waveform variants
│   │   ├── project-controller.js
│   │   └── midi-controller.js
│   └── locales/
│       ├── id.json                    # Indonesian strings
│       └── en.json                    # English strings
├── JSGUS/
│   ├── melodic-presets.js             # Plain-object GM melodic preset data
│   ├── drum-presets.js                # Plain-object GM drum preset data
│   └── ProjectPatchGenerator.js       # Procedural instrument and demo patch generator
└── timidity-player/
    ├── timidity-player.min.js         # LibTiMidityPlayer wrapper
    └── libtimidity.min.js             # LibTiMidity WASM loader
```

## Preset Data Reference

The generator's instrument data is kept separately from its rendering code:

- `JSGUS/melodic-presets.js` defines the global `GUS_MELODIC_PRESETS` object
  with a master `gain` and an `instruments` array. Each instrument has the
  shape `{ program, family, name, shortName, description, preset }`.
- `JSGUS/drum-presets.js` defines the global `GUS_DRUM_PRESETS` object with a
  master `gain` and an `instruments` array. Each instrument has the shape
  `{ note, name, shortName, description, preset }`.

`shortName` is the GUS instrument name and must contain at most 16 characters.
`description` is an English summary of the instrument sound and is written to
the GUS patch header; keep it within the 60-character header limit. The full
`name` remains the generator/UI display name.

The root `gain` is a mixer-style master level for all generated samples in
that data set. The generator multiplies it by an instrument's optional
`preset.gain`; both default to `1` when no per-instrument gain is specified.

Both files contain editable plain JavaScript objects (no preset factory calls).
The HTML pages load the data scripts before `ProjectPatchGenerator.js`. Keep
that order if you use a custom script URL or host the data separately.

### Editing melodic presets

`GUS_MELODIC_PRESETS.instruments` must contain exactly one entry for every
General MIDI melodic program, from `0` to `127`. Each `program` must be a unique
integer in that range; array position is not used as the program number. The
loader rejects missing or duplicate programs. Set `GUS_MELODIC_PRESETS.gain`
to adjust the master level for this data set.

Each entry has `program`, `family`, `name`, `shortName`, `description`, and a
`preset` object. `shortName` is required and limited to 16 characters;
`description` must be non-empty and no longer than 60 characters. Use camelCase
`shortName`, matching the loader and current preset data.

```js
{
  program: 24,
  family: "Guitar",
  name: "Nylon Guitar",
  shortName: "Nylon Guitar",
  description: "Nylon Guitar: a plucked-string attack with natural decay.",
  preset: {
    freq: 441,
    harm: [1, 0.8, 0.6, 0.4, 0.25, 0.15, 0.08, 0.04, 0.02],
    env: { a: 0.002, d: 1.5, s: 0, r: 0.5 },
    length: 66150,
    attackNoise: { amp: 0.032, duration: 0.022 },
    pluckPosition: 0.16,
    pluckTransient: {
      freq: 1900, q: 0.8, amp: 0.026, duration: 0.02, decay: 0.009
    },
    brightness: { start: 7600, end: 1800 },
    formants: [
      { freq: 105, q: 1.2, gain: 2.5 },
      { freq: 210, q: 1.8, gain: 3.5 },
      { freq: 390, q: 2.1, gain: 3 }
    ]
  }
}
```

Supported melodic `preset` properties:

| Property | Meaning |
| --- | --- |
| `sampleRate` | Optional sample rate in hertz; generation settings can override it. |
| `freq` | Default/root frequency in hertz. |
| `harm` | Relative amplitude of each partial, starting with the fundamental. |
| `phases` | Optional starting phase for each partial, expressed in cycles. |
| `env` | One-shot envelope: attack `a`, decay `d`, and release `r` in seconds; sustain `s` is a level from 0 to 1. |
| `length` | One-shot sample length in samples at the 22,050 Hz reference rate; scaled for other sample rates. Ignored for loops. |
| `loop` | Enable periodic sample rendering when truthy. |
| `cycleSamples` | Explicit samples per loop cycle. Otherwise derived from `freq` and sample rate. |
| `cycles`, `loopSkip`, `tailCycles` | Cycle count to loop end (default 12), initial cycles skipped before the loop (default 3), and release-tail cycles (default 4). |
| `loopAttack` | Loop fade-in time in seconds, limited to the pre-loop region. |
| `sustainLoop` | Set to `false` to omit the GUS sustain-loop flag while retaining the loop. |
| `patchEnvelope` | Optional GUS envelope with six raw `rates` and six `offsets`, written to the patch header. |
| `gain` | Non-negative sample multiplier applied after waveform normalization; values above 1 may clip final 16-bit PCM. |
| `noise` | Noise blend amount in the oscillator signal. For loops, noise is generated as a repeating cycle. |
| `fm` | Frequency modulation: `ratio` is modulator/carrier ratio and `index` is modulation depth. Looped FM is used only for integer ratios. |
| `detune` | Voice detuning values in cents; ignored for loops. |
| `vibrato` | `{ rate, depth, sweep }`: rate in hertz and depth as a pitch fraction. For loops it is encoded in the GUS header. |
| `vibratoOnset` | Time in seconds for one-shot vibrato to reach full depth. |
| `inharmonicity` | Inharmonic partial-stretch coefficient; ignored for loops. |
| `attackNoise` | One-shot pink-noise attack transient with `amp` and `duration` in seconds. |
| `pluckTransient` | One-shot filtered transient with `freq`, `q`, `amp`, `duration`, `decay`, and optional noise `type`. |
| `pluckPosition` | String pluck position as a fraction from 0.01 to 0.49; changes the relative partial amplitudes. |
| `loopAttackNoise` | Noise transient placed before the loop start; use instead of `attackNoise` for looped presets. |
| `pitchScoop` | One-shot pitch onset bend with `time` in seconds and fractional `depth`. |
| `partialDecay` | Per-partial decay times in seconds; ignored for loops. |
| `brightness` | One-shot low-pass sweep using `start` and `end` cutoff frequencies in hertz. For loops, `loopCutoff` applies a static low-pass cutoff. |
| `formants` | Peaking filters `{ freq, q, gain }`; frequency in hertz, `gain` in decibels. |
| `drive` | Optional soft-saturation amount. |
| `guitarAmp` | Optional guitar stage: `preampCutoff` and `cabinetCutoff` in hertz, plus `drive`, `bias`, and `mix`. |

When `loop` is enabled, sample length comes from the loop period, `cycles`,
and `tailCycles`; `length` is ignored. The looped waveform disables
time-varying one-shot features such as pitch scoop, detune, inharmonicity, and
per-partial decay to keep the cycle stable. `env` is not used to render a loop;
release behavior comes from the GUS patch envelope. `loopAttackNoise` is added
before the loop region, and loop vibrato is stored in the GUS header.

### Editing drum presets

The `GUS_DRUM_PRESETS.instruments` array currently contains 57 drum entries
with note numbers from `25` to `84` (the set is sparse, not a continuous
range). Each `note` must be a unique integer from `0` to `127`; the loader
rejects duplicates and invalid entries. Each entry has `note`, `name`,
`shortName`, `description`, and a `preset` object. `shortName` is required and
limited to 16 characters; `description` must be non-empty and at most 60
characters. Set `GUS_DRUM_PRESETS.gain` to adjust the drum master level.

```js
{
  note: 42,
  name: "Closed Hi-Hat",
  shortName: "Closed Hi-Hat",
  description: "Closed Hi-Hat: dry, short hiss with a crisp cymbal edge.",
  preset: {
    gain: 0.15,
    duration: 0.14,
    noiseLayers: [
      { amp: 0.95, decay: 0.009, type: "white",
        bandpass: { center: 8400, q: 0.52 } },
      { amp: 0.48, decay: 0.017, type: "pink",
        bandpass: { center: 6500, q: 0.58 } }
    ],
    highpass: 3900,
    lowpass: 10500
  }
}
```

Drum `preset` properties are combined by `DrumRenderer`:

| Property | Meaning |
| --- | --- |
| `duration` | Render length in seconds. |
| `gain` | Non-negative output multiplier applied after drum rendering is normalized. Values below 1 reduce the hit level and leave headroom when percussion is layered; values above 1 can clip the final 16-bit PCM. |
| `tones` | Array of decaying sine tones. Each tone supports `fStart`/`fEnd` in hertz, `pitchDecay`/`decay` in seconds, `amp`, and optional `fm: { ratio, index }`. |
| `membrane` | Tuned membrane sound with base `freq` in hertz, `pitchDecay` and `decay` in seconds, and optional `modes`. Each mode has a frequency `ratio`, relative `amp`, optional `startRatio`, and a `decay` multiplier. |
| `metallic` | Inharmonic ringing sound with `baseFreq` in hertz, partial frequency multipliers in `partials`, `amp`, and `decay` in seconds. Set `randomPhase: true` to vary partial starting phases. |
| `noise` | One noise layer with `amp`, `decay` in seconds, `type` (`white`, `pink`, or `brown`), and optional `bandpass: { center, q }`. |
| `noiseLayers` | Array of noise layers; each supports the same fields as `noise`. |
| `click` | Short attack click with `duration` in seconds and `amp`. |
| `bursts` | Array of noise-burst start times in seconds. |
| `highpass`, `lowpass` | Optional filter cutoff frequencies in hertz. |

Tone, membrane, metallic, and noise components can be combined in one drum
preset. The renderer applies the configured filters, fades the sample edges,
and normalizes the result before patch encoding. Panning is not currently a
drum preset property; the generated GUS sample balance is fixed at center
(`7`).

### Data Flow

```
    ┌────────────┐     ┌───────────────┐     ┌──────────────┐
    │  Import    │────>│  state.patch  │────>│   Rendering  │
    │  .PAT/.SF2 │     │  (in memory)  │     │ (DOM/Canvas) │
    │  .SF3/.SFZ │     └───────────────┘     └──────────────┘
    │  .FXP/.JS  │             │                     │
    │  .ZIP      │             │                     │
    └────────────┘             │                     │
                               v                     v
                       ┌───────────────┐     ┌──────────────┐
                       │ IndexedDB     │     │  Export      │
                       │ (persistent)  │     │  .PAT/.ZIP   │
                       └───────────────┘     │  .SF2        │
                                             └──────────────┘
```

### Storage

All data lives in **IndexedDB**, database name `gus-patch-editor-2` (inherited from the previous name for backward compatibility):

| Object store | Key | Contents |
|---|---|---|
| `patches` | `id` | Patch entries with full instrument/sample tree |
| `projects` | `id` | Project metadata with ordered patch ID list |

There is no application backend, cloud sync, or telemetry. Importing a MIDI.js soundfont from a URL makes a browser request to the URL selected by the user.

### PCM Handling

Samples are stored internally as `Uint8Array` PCM plus a cached `Float32Array` (`_float`) for fast canvas rendering. Sample modes (`M16`, `MUNS`) determine bit depth and sign convention:

- `M16` set → 16-bit PCM (2 bytes per sample), otherwise 8-bit (1 byte per sample)
- `MUNS` set → unsigned PCM, otherwise signed

Conversion happens once per sample and is cached.

### Pitch Encoding

GUS patches store pitch as a millihertz `rootFreq` plus legacy `scaleFreq`/`scaleFactor` metadata. SoundFont 2 expresses the same information as:

```
rootHz = 440 · 2^((originalPitch − 69) / 12) · 2^(chPitchCorrection / 1200)
```

On **export**, the editor picks `originalPitch = round(midiNote(rootFreq))` and stores the remaining detune in `chPitchCorrection` (signed cents, range ±50 in practice). On **import**, `rootFreq` is reconstructed from the same formula, so `rootFreq_out = rootFreq_in` exactly.

`scaleFreq` is not used to determine pitch; it is a UI label only, so patches whose `scaleFreq` disagrees with `rootFreq` still roundtrip to the correct audible pitch.

---

## Localization

All strings live in `assets/locales/id.json` and `assets/locales/en.json`.

To add a new language:

1. Copy `assets/locales/en.json` to `assets/locales/xx.json` and translate the values
2. Update `initLocalization()` in `script.js` to accept the new locale code
3. Add an `<option>` to `#languageSelect` in `index.html`

Placeholders use `{name}` syntax and are substituted from the `values` argument passed to `t()`.

---

## Known Limitations

- **Browsers only** — no desktop build; a modern browser is required
- **RAM usage** — converting a large SoundFont or an SFZ package with hundreds of samples can hold hundreds of megabytes in memory during conversion; browsers may crash on low-RAM devices
- **Storage limits** — IndexedDB quotas vary by browser (usually 10% of disk); large libraries may hit the quota
- **SoundFont import** — parsed and decoded in the main thread; the UI may freeze during conversion of large files. SF3 compressed sample decoding requires browser support for Ogg Vorbis.
- **FXP import** — only Surge VST2 presets with embedded wavetable/sample data are supported; conversion to GUS is approximate and does not preserve the full synthesizer sound.
- **SF2 roundtrip** — PCM, loop points, sample rate, root frequency, key ranges, and preset metadata are preserved. Envelopes, tremolo, vibrato, and loop fractions are **not** part of the SF2 export format and are lost after a roundtrip; use a `.pat`-only export if you need those settings
- **SFZ import** — Only basic SFZ opcodes are supported (key ranges, loops, tuning). Advanced opcodes (filters, complex modulation, keyswitches) are ignored. The `.sfz` file must be bundled inside a `.zip` along with its audio samples.
- **SFZ export** — PCM samples, key/root mapping, and loop points are included. GUS envelopes, tremolo/vibrato, and layer velocity behavior are not represented in the exported SFZ package.
- **MIDI.js import** — decoding ~88 notes at 22050 Hz takes 20–60 seconds depending on the file and device
- **Web MIDI** — Firefox and Safari only partially support `navigator.requestMIDIAccess`
- **Loop points** — GUS loop points reference 16-bit sample positions; fractional loop points (`.fractions`) are only partially honored on export
- **Envelope timing** — playback approximates the GUS envelope using a Web Audio `GainNode`; it won't be bit-exact against real hardware

---

## Contributing

Contributions are welcome. To keep things maintainable:

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. **Test** in at least one Chromium-based browser and one other (Firefox or Safari)
3. **Localize** — add any new user-facing strings to both `id.json` and `en.json`; missing keys are logged as `Missing localization key: …` in the console
4. **Submit a pull request** describing what changed and why

### Reporting Bugs

When opening an issue, include:

- Browser and version
- Console output (open DevTools → Console)
- File that triggered the issue (or a minimal reproduction)
- Steps to reproduce

### Code Style

- Vanilla ES2020+ JavaScript, no bundler, no transpiler
- Prefer small, focused functions
- Keep the localization layer intact — never hard-code user-facing English
- Match the surrounding code style (no semicolon-stripping, brace placement, etc.)

---

## License

This project is released under the **MIT License**. See [LICENSE](LICENSE) for the full text.

Bundled third-party components retain their own licenses:

- **LibTiMidityPlayer** — WASM port of TiMidity++; see `timidity-player/` for details
- **GUSPatchGenerator.js** — see `JSGUS/` for details
- **MIDI.js soundfonts** (when imported) — FluidR3_GM by Frank Wen, MIT licensed

---

## Credits

- **Gravis Ultrasound** — original hardware by Advanced Gravis Computer Technology
- **TiMidity++** — the reference implementation of GUS patch playback
- **FluidR3_GM** — General MIDI soundfont by Frank Wen
- **gleitz/midi-js-soundfonts** — pre-rendered MIDI.js soundfonts used for direct import
- **LibTiMidityPlayer** — WASM-based MIDI player used for preview and offline rendering
- All contributors who have tested and reported bugs

---

## Related Projects

- [TiMidity++](https://timidity.sourceforge.net/) — the original GUS patch player
- [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) — pre-rendered soundfonts
- [FluidSynth](https://www.fluidsynth.org/) — modern SF2 synthesizer

---

*If this project helped you preserve or create instruments, consider giving it a ⭐ on GitHub.*
