# GUS Patch Editor

A browser-based editor for **Gravis Ultrasound (GUS) `.PAT` patch files**, with support for importing and exporting SoundFonts (`.sf2`), Timidity ZIP packages, and MIDI.js soundfonts — plus full waveform editing, sample management, MIDI playback, and patch export.

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

### Patch Editing
- **Full GUS `.PAT` support** — parse, inspect, edit, and export Gravis Ultrasound patches
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

### File Import
| Format | Extension | Description |
|---|---|---|
| GUS Patch | `.pat` | Native Gravis Ultrasound patch format |
| SoundFont | `.sf2` | Extracts all presets, including drum kits (split per MIDI note) |
| Timidity package | `.zip` | Timidity distribution packages containing `timidity.cfg` |
| MIDI.js soundfont | `.js` | FluidR3_GM-style OGG/MP3 soundfonts from jsDelivr and similar CDNs |
| MIDI.js from URL | — | Fetch soundfont directly from a URL |

### MIDI Playback & Rendering
- **In-browser MIDI playback** via LibTiMidityPlayer (WASM)
- **Bank selection** — switch which target bank each channel uses
- **Volume control** — safe API-based volume, no crash-prone MIDI CC injection
- **Seek / pause / resume** — precise tempo-map-aware duration calculation
- **Offline render to WAV** — full mixdown with all loaded patches
- **Per-instrument loading status** — see which patch is currently decoding

### Project Management
- Multiple projects, each with its own patch list
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

### `.sf2` (SoundFont 2)

**Import.** A single `.sf2` may contain dozens of presets. Each one is turned into its own GUS patch:

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

---

## Screenshots

> Add screenshots to `docs/` and update these image paths before publishing.

| Welcome | Sample editor |
|---|---|
| ![Welcome](docs/screenshot-welcome.png) | ![Editor](docs/screenshot-editor.png) |

| Bank manager | Frequency map |
|---|---|
| ![Bank manager](docs/screenshot-bank-manager.png) | ![Frequency map](docs/screenshot-freq-map.png) |

---

## Getting Started

### Requirements

- A modern browser (see [Browser Requirements](#browser-requirements))
- A local web server — the app uses `fetch()` for locale files, so `file://` URLs won't work

### Running Locally

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/gus-patch-editor.git
cd gus-patch-editor

# Start a simple HTTP server (any of these work)
python3 -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000
```

Then open **http://localhost:8000** in your browser.

### First Run

1. Click **Load Demo** to generate a full 128-program GM demo bank (requires ~10–30 seconds on first run)
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
Projects sidebar → Import Package → select .sf2
```
Each preset becomes a separate GUS patch. Drum kits (`bank 128`) are split into one patch per MIDI note.

**From a Timidity ZIP:**
```
Header → Open .PAT / .SF2 → select a ZIP produced by this editor or a compatible Timidity package
```

**From a MIDI.js soundfont:**
```
Header → Open .PAT / .SF2 → select an .js file
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

### Playing MIDI

1. Select a project
2. Click **Load MIDI** in the **MIDI Preview** panel
3. Choose a bank with **Select Bank**
4. Click **Play** — the loaded project patches will be used

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
gus-patch-editor/
├── index.html                       # Single-page app shell
├── assets/
│   ├── css/
│   │   └── style.css                # All styling
│   ├── js/
│   │   ├── script.js                # Main application (single ~7000-line file)
│   │   └── project-patch-generator.js  # Generator for demo project patches
│   └── locales/
│       ├── id.json                  # Indonesian strings
│       └── en.json                  # English strings
├── JSGUS/
│   └── GUSPatchGenerator.js         # Procedural GUS patch generator
└── timidity-player/
    ├── timidity-player.js           # LibTiMidityPlayer wrapper
    └── libtimidity.js               # LibTiMidity WASM loader
```

### Data Flow

```
    ┌────────────┐     ┌───────────────┐     ┌──────────────┐
    │  Import    │────>│  state.patch  │────>│   Rendering  │
    │  .PAT/.SF2 │     │  (in memory)  │     │ (DOM/Canvas) │
    │  .ZIP/.JS  │     └───────────────┘     └──────────────┘
    └────────────┘             │                     │
                               v                     v
                       ┌───────────────┐     ┌──────────────┐
                       │ IndexedDB     │     │  Export      │
                       │ (persistent)  │     │  .PAT/.ZIP   │
                       └───────────────┘     │  .SF2        │
                                             └──────────────┘
```

### Storage

All data lives in **IndexedDB**, database name `gus-patch-editor-2`:

| Object store | Key | Contents |
|---|---|---|
| `patches` | `id` | Patch entries with full instrument/sample tree |
| `projects` | `id` | Project metadata with ordered patch ID list |

No server communication. No cloud sync. No telemetry.

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
- **RAM usage** — converting a large SoundFont can hold hundreds of megabytes in memory during conversion; browsers may crash on low-RAM devices
- **Storage limits** — IndexedDB quotas vary by browser (usually 10% of disk); large libraries may hit the quota
- **SF2 import** — parsed in the main thread; the UI may freeze during conversion of large files
- **SF2 roundtrip** — PCM, loop points, sample rate, root frequency, key ranges, and preset metadata are preserved. Envelopes, tremolo, vibrato, and loop fractions are **not** part of the SF2 export format and are lost after a roundtrip; use a `.pat`-only export if you need those settings
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

*If this project helped you preserve or create GUS patches, consider giving it a ⭐ on GitHub.*