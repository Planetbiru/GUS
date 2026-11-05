
// ----------------------------------------------------------------
// 1.7  AudioPreview — Web Audio API wrapper
// ----------------------------------------------------------------
class AudioPreview {
    constructor() {
        this.ctx = null;
        this.source = null;
    }

    getCtx() {
        if (!this.ctx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new Ctx();
        }
        return this.ctx;
    }

    play(pcm, SR, rate = 1.0) {
        const ctx = this.getCtx();
        if (ctx.state === 'suspended') ctx.resume();
        this.stop();

        const buf = ctx.createBuffer(1, pcm.length, SR);
        buf.getChannelData(0).set(pcm);

        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = rate;
        src.connect(ctx.destination);
        src.start();
        this.source = src;
    }

    stop() {
        if (this.source) {
            try { this.source.stop(); } catch (e) { }
            this.source = null;
        }
    }
}

// ----------------------------------------------------------------
// 1.8  FileDownloader — unduh blob / zip
// ----------------------------------------------------------------
class FileDownloader {
    static download(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    static downloadBytes(bytes, filename) {
        FileDownloader.download(new Blob([bytes], { type: 'application/octet-stream' }), filename);
    }
}

// ----------------------------------------------------------------
// 1.9  GusPatchApp — controller utama UI
// ----------------------------------------------------------------
class GusPatchApp {
    constructor(library) {
        this.lib = library;
        this.audio = new AudioPreview();
        this.timidityPlayer = null;
        this.timidityPlayerReady = null;
        this.midiData = null;
        this.midiFileName = '';
        this.midiDuration = 0;
        this.midiPosition = 0;
        this.midiSeeking = false;
        this.midiRenderInProgress = false;
        this.midiInstrumentList = new Map();
        this.collectingMidiInstruments = false;
        this.generatorState = this.loadGeneratorState();
        this.midiPatchReloadTimer = null;
        this.currentType = null;
        this.currentMidi = null;
        this.logEl = null;
    }

    $(id) { return document.getElementById(id); }

    // ---- Utility ----
    slugify(s) { return s.replace(/[^A-Za-z0-9]/g, '_'); }

    applyOutputGain(rendered, preset, masterGain) {
        const instrumentGain = preset.gain == null ? 1 : preset.gain;
        if (!Number.isFinite(masterGain) || masterGain < 0
            || !Number.isFinite(instrumentGain) || instrumentGain < 0) {
            throw new Error('Invalid output gain.');
        }
        const outputGain = masterGain * instrumentGain;
        if (outputGain === 1) return rendered;
        return {
            ...rendered,
            pcm: rendered.pcm.map(sample => sample * outputGain),
        };
    }

    log(msg, cls = '') {
        const t = new Date().toTimeString().slice(0, 8);
        this.logEl.innerHTML +=
            `<div><span style="opacity:.5">[${t}]</span> <span class="${cls}">${msg}</span></div>`;
        this.logEl.scrollTop = this.logEl.scrollHeight;
    }

    // ---- Inisialisasi ----
    init() {
        this.logEl = this.$('log');
        this.buildSidebar();
        this.bindUI();
        this.bindKeyboard();
        this.log('Application ready. Choose an instrument from the list.', 'ok');
        this.log('Shortcuts: Up/Down = navigate, Space = preview', 'info');
        const selected = this.generatorState.selected;
        let type = selected && selected.type === 'drum' ? 'drum' : 'melodic';
        let midi = Number(selected && selected.midi);
        if (type === 'drum' && !this.lib.findDrum(midi)) {
            type = 'melodic';
            midi = 0;
        } else if (type === 'melodic' && !this.lib.melodic[midi]) {
            midi = 0;
        }
        this.selectInstrument(type, midi);
    }

    buildSidebar() {
        const listEl = this.$('instrumentList');
        const selectedType = this.generatorState.selected?.type === 'drum' ? 'drum' : 'melodic';
        const tabs = document.createElement('div');
        tabs.className = 'instrument-tabs';
        tabs.setAttribute('role', 'tablist');
        tabs.setAttribute('aria-label', 'Instrument type');

        for (const [type, label] of [['melodic', 'Melodic'], ['drum', 'Drum Kit']]) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'instrument-tab';
            button.dataset.instrumentType = type;
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-controls', `${type}InstrumentList`);
            button.addEventListener('click', () => this.setActiveInstrumentList(type));
            button.textContent = label;
            tabs.appendChild(button);
        }

        const melodicList = document.createElement('div');
        melodicList.id = 'melodicInstrumentList';
        melodicList.className = 'instrument-list-panel';
        melodicList.setAttribute('role', 'tabpanel');
        const drumList = document.createElement('div');
        drumList.id = 'drumInstrumentList';
        drumList.className = 'instrument-list-panel';
        drumList.setAttribute('role', 'tabpanel');
        listEl.replaceChildren(tabs, melodicList, drumList);

        let lastFamily = '';

        // Melodic 128
        this.lib.melodic.forEach(({family, name}, i) => {
            if (family !== lastFamily) {
                const h = document.createElement('div');
                h.className = 'family';
                h.textContent = family;
                melodicList.appendChild(h);
                lastFamily = family;
            }
            melodicList.appendChild(this._makeItem({
                type: 'melodic', midi: i, name, num: String(i).padStart(3, '0')
            }));
        });

        this.lib.drums.forEach(({note, name}) => {
            drumList.appendChild(this._makeItem({
                type: 'drum', midi: note, name, num: note
            }));
        });
        this.setActiveInstrumentList(selectedType);
    }

    setActiveInstrumentList(type) {
        this.activeInstrumentList = type === 'drum' ? 'drum' : 'melodic';
        const isDrum = this.activeInstrumentList === 'drum';
        const melodicList = this.$('melodicInstrumentList');
        const drumList = this.$('drumInstrumentList');
        if (melodicList) melodicList.hidden = isDrum;
        if (drumList) drumList.hidden = !isDrum;
        this.$('instrumentList').querySelectorAll('.instrument-tab').forEach(button => {
            const selected = button.dataset.instrumentType === this.activeInstrumentList;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-selected', String(selected));
            button.tabIndex = selected ? 0 : -1;
        });
    }

    _makeItem({ type, midi, name, num }) {
        const d = document.createElement('div');
        d.className = 'inst';
        d.dataset.type = type;
        d.dataset.midi = midi;
        d.innerHTML = `<span>${name}</span><span class="num">${num}</span>`;
        d.onclick = () => this.selectInstrument(type, midi);
        return d;
    }

    bindUI() {
        this.$('btnPlayNote').onclick = () => this.playPreview();
        this.$('btnPlayScale').onclick = () => this.playScale();
        this.$('btnStop').onclick = () => this.audio.stop();
        this.$('btnDownload').onclick = () => this.downloadCurrent();
        this.$('btnZip').onclick = () => this.downloadAllZip();
        this.$('btnResetGeneratorState').onclick = () => this.resetGeneratorState();
        this.$('btnChooseMidi').onclick = () => this.$('midiFile').click();
        this.$('midiFile').addEventListener('change', event => this.loadMidiFile(event));
        this.$('btnMidiPlay').onclick = () => this.toggleMidiPlayback();
        this.$('btnMidiStop').onclick = () => this.stopMidiPlayback();
        this.$('btnMidiRender').onclick = () => this.renderMidiToWav();
        this.$('midiSeek').addEventListener('input', event => {
            if (!this.midiData || !this.midiDuration) return;
            this.midiSeeking = true;
            this.midiPosition = Number(event.target.value) / 1000 * this.midiDuration;
            this.updateMidiPlaybackUI();
        });
        this.$('midiSeek').addEventListener('change', () => {
            this.midiSeeking = false;
            if (this.timidityPlayer && this.timidityPlayer.songPtr) {
                this.timidityPlayer.seek(this.midiPosition);
            }
            this.updateMidiPlaybackUI();
        });

        ['sr', 'root', 'dur', 'wave'].forEach(id => {
            this.$(id).addEventListener('input', () => this.handleGeneratorInput());
        });
    }

    loadGeneratorState() {
            const emptyState = {selected: null, instruments: {}};
            try {
                const stored = localStorage.getItem('gus-patch-generator-state-v1');
                if (!stored) return emptyState;
                const parsed = JSON.parse(stored);
                return {
                    selected: parsed.selected || null,
                    instruments: parsed.instruments && typeof parsed.instruments === 'object'
                        ? parsed.instruments
                        : {},
                };
            } catch (error) {
                return emptyState;
            }
        }

        persistGeneratorState() {
            try {
                localStorage.setItem('gus-patch-generator-state-v1', JSON.stringify(this.generatorState));
            } catch (error) {
                this.log(`Could not save generator settings: ${error.message}`, 'err');
            }
        }

        getDefaultGeneratorState(type, midi) {
            const preset = type === 'drum'
                ? this.lib.findDrum(midi)?.preset
                : this.lib.melodic[midi]?.preset;
            const root = type === 'drum'
                ? this.lib.drumToFreq(midi)
                : (preset && preset.freq) || 441;
            return {sampleRate: 22050, root, duration: 0.25, wave: 'preset'};
        }

        normalizeGeneratorState(type, midi, value) {
            const defaults = this.getDefaultGeneratorState(type, midi);
            const sampleRate = Number(value && value.sampleRate);
            const root = Number(value && value.root);
            const duration = Number(value && value.duration);
            const wave = value && value.wave;
            return {
                sampleRate: [11025, 22050, 44100].includes(sampleRate) ? sampleRate : defaults.sampleRate,
                root: Number.isFinite(root) ? Math.min(4000, Math.max(20, root)) : defaults.root,
                duration: Number.isFinite(duration) ? Math.min(3, Math.max(0.05, duration)) : defaults.duration,
                wave: ['preset', 'sine', 'square', 'saw', 'triangle'].includes(wave) ? wave : 'preset',
            };
        }

        getInstrumentGeneratorState(type, midi) {
            const key = `${type}:${midi}`;
            const normalized = this.normalizeGeneratorState(type, midi, this.generatorState.instruments[key]);
            this.generatorState.instruments[key] = normalized;
            return normalized;
        }

        presetWithWaveform(preset, waveform) {
            const result = {...preset};
            if (waveform === 'preset') return result;
            const waves = {
                sine: [1],
                square: [1, 0, .33, 0, .2, 0, .14, 0, .11, 0, .09],
                saw: [1, .5, .33, .25, .2, .16, .14, .12, .1, .09, .08, .07],
                triangle: [1, 0, -.11, 0, .04, 0, -.02, 0, .012],
            };
            result.harm = waves[waveform];
            delete result.fm;
            return result;
        }

        saveCurrentGeneratorState() {
            if (this.currentType == null || this.currentMidi == null) return;
            const key = `${this.currentType}:${this.currentMidi}`;
            this.generatorState.instruments[key] = this.normalizeGeneratorState(this.currentType, this.currentMidi, {
                sampleRate: this.$('sr').value,
                root: this.$('root').value,
                duration: this.$('dur').value,
                wave: this.$('wave').value,
            });
            this.generatorState.selected = {type: this.currentType, midi: this.currentMidi};
            this.persistGeneratorState();
        }

        handleGeneratorInput() {
            this.saveCurrentGeneratorState();
            this.drawPreview();
            this.scheduleMidiInstrumentReload();
        }

        scheduleMidiInstrumentReload() {
            if (this.midiPatchReloadTimer) clearTimeout(this.midiPatchReloadTimer);
            this.midiPatchReloadTimer = setTimeout(() => {
                this.midiPatchReloadTimer = null;
                this.reloadMidiInstrumentIfUsed();
            }, 250);
        }

        async reloadMidiInstrumentIfUsed() {
            const player = this.timidityPlayer;
            if (!player || !player.songPtr || (!player.isPlaying && !player.isPaused)) return;

            const {type, midi} = {type: this.currentType, midi: this.currentMidi};
            const patchFile = this.getMidiPatchFile(type, midi);
            const loadedFile = this.findLoadedMidiPatch(patchFile);
            if (!loadedFile) return;

            await this.reloadMidiPatch(type, midi, loadedFile);
        }

        getMidiPatchFile(type, midi) {
            return type === 'drum'
                ? `drums/drum_${String(midi).padStart(2, '0')}_${this.slugify(this.lib.findDrum(midi).name)}.pat`
                : `melodic/${String(midi).padStart(3, '0')}_${this.slugify(this.lib.melodic[midi].name)}.pat`;
        }

        findLoadedMidiPatch(patchFile) {
            return [...(this.timidityPlayer?.loadedPatches.keys() || [])].find(file =>
                file === patchFile || file.endsWith(`/${patchFile}`)
            );
        }

        async reloadMidiPatch(type, midi, loadedFile) {
            const player = this.timidityPlayer;
            const isDrum = type === 'drum';
            player.loadedPatches.delete(loadedFile);
            try {
                const loaded = await player.loadInstrumentForSong(isDrum ? 9 : 0, midi, 0);
                if (!loaded) throw new Error(`Could not reload ${loadedFile}.`);
                this.$('midiStatus').textContent = `Updated MIDI instrument: ${isDrum ? 'Drum ' : ''}${midi}`;
            } catch (error) {
                this.$('midiStatus').textContent = `MIDI instrument update failed: ${error.message}`;
                this.log(`MIDI instrument update failed: ${error.message}`, 'err');
            }
        }

        async reloadAllLoadedMidiPatches() {
            const player = this.timidityPlayer;
            if (!player || !player.songPtr || (!player.isPlaying && !player.isPaused)) return;

            const loadedFiles = [...player.loadedPatches.keys()];
            const patches = [];
            this.lib.melodic.forEach((_instrument, midi) => {
                const patchFile = this.getMidiPatchFile('melodic', midi);
                const loadedFile = loadedFiles.find(file => file === patchFile || file.endsWith(`/${patchFile}`));
                if (loadedFile) patches.push({type: 'melodic', midi, loadedFile});
            });
            this.lib.drums.forEach(({note}) => {
                const patchFile = this.getMidiPatchFile('drum', note);
                const loadedFile = loadedFiles.find(file => file === patchFile || file.endsWith(`/${patchFile}`));
                if (loadedFile) patches.push({type: 'drum', midi: note, loadedFile});
            });

            for (const patch of patches) {
                await this.reloadMidiPatch(patch.type, patch.midi, patch.loadedFile);
            }
        }

        resetGeneratorState() {
            if (this.midiPatchReloadTimer) clearTimeout(this.midiPatchReloadTimer);
            this.midiPatchReloadTimer = null;
            const type = this.currentType || 'melodic';
            const midi = this.currentMidi == null ? 0 : this.currentMidi;
            this.generatorState = {selected: null, instruments: {}};
            this.currentType = null;
            this.currentMidi = null;
            try {
                localStorage.removeItem('gus-patch-generator-state-v1');
            } catch (error) { }
            this.selectInstrument(type, midi);
            this.persistGeneratorState();
            this.reloadAllLoadedMidiPatches();
            this.log('Saved generator state reset to defaults.', 'ok');
        }

    async ensureTimidityPlayer() {
        if (this.timidityPlayerReady) return this.timidityPlayerReady;
        if (typeof TimidityPlayer !== 'function') {
            throw new Error('TimidityPlayer runtime is unavailable.');
        }

        const player = new TimidityPlayer({
            sampleRate: +this.$('sr').value || 22050,
            bufferSize: 4096,
            timidityCfgLoader: () => this.buildMidiTimidityConfig(),
            instrumentLoader: (bank, isDrum, program) => {
                if (this.collectingMidiInstruments) {
                    this.trackMidiInstrument(isDrum, program, bank);
                }
                return this.buildMidiPatch(isDrum, program);
            },
        });
        this.timidityPlayer = player;
        player.on('onInstrumentLoading', (loaded, total) => {
            this.$('midiStatus').textContent = `Loading GM instruments ${loaded}/${total}...`;
        });
        player.on('onMidiLoaded', (_midi, duration) => {
            this.midiDuration = duration || player.totalDuration || 0;
            this.updateMidiPlaybackUI();
        });
        player.on('onPlaying', (_tick, seconds) => {
            if (this.midiSeeking) return;
            this.midiPosition = seconds;
            this.updateMidiPlaybackUI();
        });
        player.on('onPause', () => {
            this.midiPosition = player.getTime() / 1000;
            this.updateMidiPlaybackUI();
        });
        player.on('onEnded', () => {
            this.midiPosition = this.midiDuration;
            this.updateMidiPlaybackUI();
        });
        player.on('onRenderProgress', progress => {
            if (this.midiRenderInProgress) {
                this.$('midiStatus').textContent = `Rendering WAV: ${Math.round(progress)}%`;
            }
        });
        player.on('onError', error => {
            const message = error && error.message ? error.message : String(error);
            this.$('midiStatus').textContent = `MIDI player error: ${message}`;
        });

        this.timidityPlayerReady = player.init().then(initialized => {
            if (!initialized) throw new Error('TimidityPlayer initialization failed.');
            return player;
        }).catch(error => {
            this.timidityPlayer = null;
            this.timidityPlayerReady = null;
            throw error;
        });
        return this.timidityPlayerReady;
    }

    clearMidiInstrumentList() {
        this.midiInstrumentList.clear();
        this.renderMidiInstrumentList();
    }

    trackMidiInstrument(isDrum, program, bank) {
        const type = isDrum ? 'drum' : 'melodic';
        const instrument = isDrum
            ? this.lib.findDrum(program)
            : this.lib.melodic[program];
        if (!instrument) return;
        const key = `${type}:${program}`;
        this.midiInstrumentList.set(key, {
            type,
            program,
            bank,
            name: instrument.name,
        });
        this.renderMidiInstrumentList();
    }

    renderMidiInstrumentList() {
        const lists = {
            melodic: this.$('midiMelodicInstrumentList'),
            drum: this.$('midiDrumInstrumentList'),
        };
        for (const [type, list] of Object.entries(lists)) {
            if (!list) continue;
            list.replaceChildren();
            const instruments = [...this.midiInstrumentList.values()]
                .filter(instrument => instrument.type === type)
                .sort((a, b) => a.program - b.program);
            if (instruments.length === 0) {
                const empty = document.createElement('li');
                empty.className = 'midi-instrument-empty';
                empty.textContent = this.midiInstrumentList.size === 0
                    ? 'No MIDI loaded.'
                    : `No ${type === 'drum' ? 'drum kit' : 'melodic'} instruments used.`;
                list.appendChild(empty);
                continue;
            }

            for (const instrument of instruments) {
                const item = document.createElement('li');
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'midi-instrument-link';
                button.textContent = type === 'drum'
                    ? `Drum ${instrument.program} - ${instrument.name}`
                    : `${String(instrument.program).padStart(3, '0')} - ${instrument.name}`;
                button.addEventListener('click', () => {
                    this.selectInstrument(type, instrument.program);
                    const selector = `.inst[data-type="${type}"][data-midi="${instrument.program}"]`;
                    document.querySelector(selector)?.scrollIntoView({block: 'nearest'});
                });
                item.appendChild(button);
                list.appendChild(item);
            }
        }
    }

    buildMidiTimidityConfig() {
        const lines = ['dir /gus-patch', '', 'bank 0'];
        this.lib.melodic.forEach(({name}, program) => {
            const file = `${String(program).padStart(3, '0')}_${this.slugify(name)}.pat`;
            lines.push(`${program} melodic/${file}`);
        });
        lines.push('', 'drumset 0');
        this.lib.drums.forEach(({note, name}) => {
            const file = `drum_${String(note).padStart(2, '0')}_${this.slugify(name)}.pat`;
            lines.push(`${note} drums/${file}`);
        });
        return lines.join('\n');
    }

    buildMidiPatch(isDrum, program) {
        const state = this.getInstrumentGeneratorState(isDrum ? 'drum' : 'melodic', program);
        const sampleRate = state.sampleRate;
        const lowFreq = Math.round(8.1757989156 * 1000);
        const highFreq = Math.round(12543.853951 * 1000);

        if (isDrum) {
            const drum = this.lib.findDrum(program);
            if (!drum) throw new Error(`Unknown drum note ${program}.`);
            const {note, name, preset: basePreset} = drum;
            const preset = {...basePreset, duration: state.duration};
            const rendered = this.applyOutputGain(
                new DrumRenderer(preset, sampleRate).render(),
                preset,
                this.lib.drumMasterGain
            );
            return GusPatchEncoder.encode({
                name: this.slugify(name).slice(0, 15) || `drum${note}`,
                pcm: rendered.pcm,
                loopStart: 0,
                loopEnd: 0,
                isLoop: false,
                rootFreq: Math.round(state.root * 1000),
                sampleRate,
                lowFreq,
                highFreq,
                sampleRateHzInHeader: true,
            });
        }

        const instrument = this.lib.melodic[program];
        if (!instrument) throw new Error(`Unknown melodic program ${program}.`);
        const {name, preset: basePreset} = instrument;
        const preset = this.presetWithWaveform(basePreset, state.wave);
        const rendered = this.applyOutputGain(
            new MelodicRenderer(preset, {
                sampleRate,
                freq: state.root,
                duration: state.duration,
            }).render(),
            preset,
            this.lib.melodicMasterGain
        );
        return GusPatchEncoder.encode({
            name: this.slugify(name).slice(0, 15) || `gm${program}`,
            pcm: rendered.pcm,
            loopStart: rendered.loopStart,
            loopEnd: rendered.loopEnd,
            isLoop: rendered.loop,
            rootFreq: Math.round(rendered.naturalFreq * 1000),
            sampleRate,
            sustainLoop: preset.sustainLoop !== false,
            envRates: preset.patchEnvelope && preset.patchEnvelope.rates,
            envOffsets: preset.patchEnvelope && preset.patchEnvelope.offsets,
            lowFreq,
            highFreq,
            sampleRateHzInHeader: true,
        });
    }

    async loadMidiFile(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        this.clearMidiInstrumentList();
        this.midiFileName = file.name;
        this.$('midiFileName').textContent = file.name;
        const status = this.$('midiStatus');
        status.textContent = 'Initializing TimidityPlayer...';
        this.midiData = null;
        this.midiDuration = 0;
        this.midiPosition = 0;
        this.updateMidiPlaybackUI();

        try {
            const player = await this.ensureTimidityPlayer();
            const midiData = new Uint8Array(await file.arrayBuffer());
            status.textContent = `Loading ${file.name}...`;
            player.loadedPatches.clear();
            this.collectingMidiInstruments = true;
            let loaded;
            try {
                loaded = await player.load(midiData);
            } finally {
                this.collectingMidiInstruments = false;
            }
            if (!loaded) throw new Error('Could not load this MIDI file.');

            this.midiData = midiData;
            this.midiDuration = player.totalDuration || this.midiDuration;
            this.midiPosition = 0;
            this.updateMidiPlaybackUI();
            status.textContent = `Ready: ${file.name}`;
        } catch (error) {
            this.clearMidiInstrumentList();
            status.textContent = `MIDI load failed: ${error.message}`;
            this.log(`MIDI load failed: ${error.message}`, 'err');
            this.updateMidiPlaybackUI();
        } finally {
            event.target.value = '';
        }
    }

    async toggleMidiPlayback() {
        if (!this.midiData) return;
        try {
            const player = await this.ensureTimidityPlayer();
            if (player.isPlaying && !player.isPaused) {
                player.pause();
                return;
            }
            if (player.isPaused) {
                await player.resume();
                this.updateMidiPlaybackUI();
                return;
            }
            if (!player.songPtr) {
                const loaded = await player.load(this.midiData);
                if (!loaded) throw new Error('Could not reload the MIDI file.');
            }
            player.play(this.midiPosition);
            this.updateMidiPlaybackUI();
        } catch (error) {
            this.$('midiStatus').textContent = `MIDI playback failed: ${error.message}`;
            this.log(`MIDI playback failed: ${error.message}`, 'err');
        }
    }

    stopMidiPlayback() {
        if (this.timidityPlayer && this.timidityPlayer.songPtr) {
            this.timidityPlayer.stop();
        }
        this.midiPosition = 0;
        this.midiSeeking = false;
        this.updateMidiPlaybackUI();
    }

    async renderMidiToWav() {
        if (!this.midiData || this.midiRenderInProgress) return;
        this.midiRenderInProgress = true;
        this.updateMidiPlaybackUI();
        const status = this.$('midiStatus');

        try {
            const player = await this.ensureTimidityPlayer();
            if (!player.lastMidiData) {
                const loaded = await player.load(this.midiData);
                if (!loaded) throw new Error('Could not reload the MIDI for rendering.');
            }

            const resumePlayback = player.isPlaying && !player.isPaused;
            status.textContent = 'Rendering WAV...';
            const wav = await player.renderOffline({sampleRate: player.sampleRate});
            if (!(wav instanceof Blob)) throw new Error('TimidityPlayer returned no WAV data.');

            const baseName = this.midiFileName.replace(/\.(mid|midi)$/i, '') || 'midi-render';
            FileDownloader.download(wav, `${baseName}.wav`);
            status.textContent = `WAV downloaded: ${baseName}.wav`;

            if (resumePlayback) await player.resume();
        } catch (error) {
            status.textContent = `WAV render failed: ${error.message}`;
            this.log(`WAV render failed: ${error.message}`, 'err');
        } finally {
            this.midiRenderInProgress = false;
            this.updateMidiPlaybackUI();
        }
    }

    updateMidiPlaybackUI() {
        const playButton = this.$('btnMidiPlay');
        const seek = this.$('midiSeek');
        const isPlaying = Boolean(this.timidityPlayer?.isPlaying && !this.timidityPlayer.isPaused);
        playButton.disabled = !this.midiData;
        playButton.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
        this.$('btnMidiStop').disabled = !this.midiData;
        this.$('btnMidiRender').disabled = !this.midiData || this.midiRenderInProgress;
        seek.disabled = !this.midiData || !this.midiDuration;

        const position = Math.max(0, Math.min(this.midiDuration, this.midiPosition || 0));
        if (!this.midiSeeking) {
            seek.value = this.midiDuration
                ? String(Math.round(position / this.midiDuration * 1000))
                : '0';
        }
        this.$('midiTimeCurrent').textContent = this.formatMidiTime(position);
        this.$('midiTimeTotal').textContent = this.formatMidiTime(this.midiDuration);
    }

    formatMidiTime(seconds) {
        const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
        const minutes = Math.floor(value / 60);
        const remainder = Math.floor(value % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
    }

    bindKeyboard() {
        document.addEventListener('keydown', e => {
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'SELECT') return;

            if (e.code === 'Space') {
                e.preventDefault();
                this.playPreview();
            } else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
                e.preventDefault();
                const dir = e.code === 'ArrowDown' ? 1 : -1;
                const listId = this.activeInstrumentList === 'drum'
                    ? 'drumInstrumentList'
                    : 'melodicInstrumentList';
                const all = this.$(listId).querySelectorAll('.inst');
                const cur = Array.from(all).findIndex(el =>
                    el.dataset.type === this.currentType && +el.dataset.midi === this.currentMidi);
                const next = Math.max(0, Math.min(all.length - 1, cur + dir));
                const el = all[next];
                this.selectInstrument(el.dataset.type, +el.dataset.midi);
                el.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    // ---- Seleksi instrumen ----
    selectInstrument(type, midi) {
        this.saveCurrentGeneratorState();
        this.setActiveInstrumentList(type);
        this.currentType = type;
        this.currentMidi = midi;
        const generatorState = this.getInstrumentGeneratorState(type, midi);
        this.generatorState.selected = {type, midi};
        this.persistGeneratorState();

        document.querySelectorAll('.inst').forEach(el => {
            el.classList.toggle('active',
                el.dataset.type === type && +el.dataset.midi === midi);
        });

        if (type === 'melodic') {
            const {family, name, preset: p} = this.lib.melodic[midi];
            this.$('title').textContent = `${String(midi).padStart(3, '0')} — ${name}`;
            this.$('familyLabel').textContent = `Family: ${family}`;
            this.$('wave').disabled = false;
        } else {
            const {note, name} = this.lib.findDrum(midi);
            this.$('title').textContent = `Drum ${note} — ${name}`;
            this.$('familyLabel').textContent = 'Family: Drum Kit (GM Channel 10)';
            this.$('wave').disabled = true;
        }
        this.$('sr').value = String(generatorState.sampleRate);
        this.$('root').value = String(generatorState.root);
        this.$('dur').value = String(generatorState.duration);
        this.$('wave').value = generatorState.wave;
        this.drawPreview();
    }

    // ---- Render → PCM ----
    getCurrentPCM() {
        const settings = this.getInstrumentGeneratorState(this.currentType, this.currentMidi);
        const SR = settings.sampleRate;
        const freq = settings.root;
        const dur = settings.duration;

        if (this.currentType === 'drum') {
            const {preset: basePreset} = this.lib.findDrum(this.currentMidi);
            const p = {...basePreset, duration: dur};
            return this.applyOutputGain(
                new DrumRenderer(p, SR).render(),
                p,
                this.lib.drumMasterGain
            );
        }

        const {preset: basePreset} = this.lib.melodic[this.currentMidi];
        const p2 = this.presetWithWaveform(basePreset, settings.wave);
        return this.applyOutputGain(
            new MelodicRenderer(p2, { sampleRate: SR, freq, duration: dur }).render(),
            p2,
            this.lib.melodicMasterGain
        );
    }

    // ---- Gambar waveform ----
    drawPreview() {
        const r = this.getCurrentPCM();
        if (!r) return;
        const c = this.$('waveCanvas');
        const ctx = c.getContext('2d');
        const W = c.width, H = c.height;
        ctx.clearRect(0, 0, W, H);

        ctx.strokeStyle = '#21262d';
        ctx.lineWidth = 1;
        for (let i = 1; i < 8; i++) {
            ctx.beginPath(); ctx.moveTo(i * W / 8, 0); ctx.lineTo(i * W / 8, H); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const N = Math.min(r.pcm.length, W);
        for (let i = 0; i < N; i++) {
            const idx = Math.floor(i * r.pcm.length / N);
            const y = H / 2 - r.pcm[idx] * (H / 2 - 4);
            i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
        }
        ctx.stroke();

        this.$('statLen').textContent = r.length;
        this.$('statLoop').textContent = r.loop ? `${r.loopStart} → ${r.loopEnd}` : 'no';
        this.$('statBytes').textContent = (129 + 63 + 47 + 96 + r.length * 2).toLocaleString();
    }

    // ---- Playback ----
    playPreview(freqRatio = 1) {
        const r = this.getCurrentPCM();
        if (!r) return;
        const rate = this.currentType === 'drum' ? 1.0 : freqRatio;
        this.audio.play(r.pcm, r.SR, rate);
        const label = this.currentType === 'drum'
            ? 'Drum ' + this.currentMidi
            : this.lib.melodic[this.currentMidi].name;
        this.log(`Preview: ${label} @ ${rate.toFixed(2)}x`);
    }

    playScale() {
        if (this.currentType === 'drum') {
            const notes = [36, 38, 42, 38, 36, 38, 46, 49];
            notes.forEach((n, i) => setTimeout(() => {
                this.selectInstrument('drum', n);
                this.playPreview();
            }, i * 220));
            return;
        }
        const notes = [0, 2, 4, 5, 7, 9, 11, 12];
        notes.forEach((semi, i) => {
            setTimeout(() => this.playPreview(Math.pow(2, semi / 12)), i * 180);
        });
    }

    // ---- Build patch ----
    buildPatchForCurrent() {
        this.saveCurrentGeneratorState();
        const settings = this.getInstrumentGeneratorState(this.currentType, this.currentMidi);
        const SR = settings.sampleRate;
        const lowFreq = Math.round(8.1757989156 * 1000);
        const highFreq = Math.round(12543.853951 * 1000);

        if (this.currentType === 'drum') {
            const {note, name, preset: basePreset} = this.lib.findDrum(this.currentMidi);
            const p = {...basePreset, duration: settings.duration};
            const r = this.applyOutputGain(
                new DrumRenderer(p, SR).render(),
                p,
                this.lib.drumMasterGain
            );
            const rootFreq = Math.round(settings.root * 1000);
            const buf = GusPatchEncoder.encode({
                name: this.slugify(name).slice(0, 15) || `drum${note}`,
                pcm: r.pcm,
                loopStart: 0, loopEnd: 0, isLoop: false,
                rootFreq, sampleRate: SR,
                lowFreq, highFreq,
            });
            return {
                buf, r,
                fname: `drum_${String(note).padStart(2, '0')}_${this.slugify(name)}.pat`,
            };
        }

        const {name, preset: basePreset} = this.lib.melodic[this.currentMidi];
        const preset = this.presetWithWaveform(basePreset, settings.wave);
        const r = this.applyOutputGain(
            new MelodicRenderer(preset, {
                sampleRate: SR,
                freq: settings.root,
                duration: settings.duration,
            }).render(),
            preset,
            this.lib.melodicMasterGain
        );
        const buf = GusPatchEncoder.encode({
            name: this.slugify(name).slice(0, 15) || `gm${this.currentMidi}`,
            pcm: r.pcm,
            loopStart: r.loopStart, loopEnd: r.loopEnd, isLoop: r.loop,
            rootFreq: Math.round(r.naturalFreq * 1000),
            sampleRate: SR,
            lowFreq,
            highFreq,
            sustainLoop: basePreset.sustainLoop !== false,
            envRates: basePreset.patchEnvelope && basePreset.patchEnvelope.rates,
            envOffsets: basePreset.patchEnvelope && basePreset.patchEnvelope.offsets,
        });
        return {
            buf, r,
            fname: `${String(this.currentMidi).padStart(3, '0')}_${this.slugify(name)}.pat`,
        };
    }

    downloadCurrent() {
        const { buf, fname } = this.buildPatchForCurrent();
        FileDownloader.downloadBytes(buf, fname);
        this.log(`✓ ${fname} — ${buf.byteLength.toLocaleString()} bytes`, 'ok');
    }

    async downloadAllZip() {
        if (typeof JSZip === 'undefined') {
            this.log('JSZip is unavailable.', 'err');
            return;
        }
        this.saveCurrentGeneratorState();
        const btn = this.$('btnZip');
        btn.disabled = true;
        this.$('progressWrap').classList.add('show');
        const zip = new JSZip();
        const sampleRates = new Set();
        const totalJobs = 128 + this.lib.drums.length;

        // --- 128 melodic ---
        this.log('Building 128 melodic patches...', 'info');
        const melodicNames = [];   // ← simpan nama file untuk timidity.cfg
        for (let i = 0; i < 128; i++) {
            const {name, preset: basePreset} = this.lib.melodic[i];
            const settings = this.getInstrumentGeneratorState('melodic', i);
            const preset = this.presetWithWaveform(basePreset, settings.wave);
            const SR = settings.sampleRate;
            sampleRates.add(SR);
            const r = this.applyOutputGain(
                new MelodicRenderer(preset, {
                    sampleRate: SR,
                    freq: settings.root,
                    duration: settings.duration,
                }).render(),
                preset,
                this.lib.melodicMasterGain
            );
            const buf = GusPatchEncoder.encode({
                name: this.slugify(name).slice(0, 15) || `gm${i}`,
                pcm: r.pcm, loopStart: r.loopStart, loopEnd: r.loopEnd,
                isLoop: r.loop,
                rootFreq: Math.round(r.naturalFreq * 1000),
                sampleRate: SR,
                lowFreq: Math.round(8.1757989156 * 1000),
                highFreq: Math.round(12543.853951 * 1000),
                sustainLoop: preset.sustainLoop !== false,
                envRates: preset.patchEnvelope && preset.patchEnvelope.rates,
                envOffsets: preset.patchEnvelope && preset.patchEnvelope.offsets,
            });
            const fname = `${String(i).padStart(3, '0')}_${this.slugify(name)}.pat`;
            zip.folder('melodic').file(fname, buf);
            melodicNames.push(fname);
            this.$('progressBar').style.width = ((i + 1) / totalJobs * 100) + '%';
            if (i % 16 === 0) await new Promise(r => setTimeout(r, 0));
        }

        // --- drum presets ---
        this.log(`Building ${this.lib.drums.length} drum patches...`, 'info');
        const drumNames = [];      // ← simpan note + nama file untuk timidity.cfg
        for (let i = 0; i < this.lib.drums.length; i++) {
            const {note, name, preset: basePreset} = this.lib.drums[i];
            const settings = this.getInstrumentGeneratorState('drum', note);
            const preset = {...basePreset, duration: settings.duration};
            const SR = settings.sampleRate;
            sampleRates.add(SR);
            const r = this.applyOutputGain(
                new DrumRenderer(preset, SR).render(),
                preset,
                this.lib.drumMasterGain
            );
            const rootFreq = Math.round(settings.root * 1000);
            const buf = GusPatchEncoder.encode({
                name: this.slugify(name).slice(0, 15) || `drum${note}`,
                pcm: r.pcm, loopStart: 0, loopEnd: 0, isLoop: false,
                rootFreq,
                sampleRate: SR,
                lowFreq: Math.round(8.1757989156 * 1000),
                highFreq: Math.round(12543.853951 * 1000),
            });
            const fname = `drum_${String(note).padStart(2, '0')}_${this.slugify(name)}.pat`;
            zip.folder('drums').file(fname, buf);
            drumNames.push({ note, fname });
            this.$('progressBar').style.width = ((128 + i + 1) / totalJobs * 100) + '%';
            if (i % 8 === 0) await new Promise(r => setTimeout(r, 0));
        }

        // --- timidity.cfg + README ---
        this.log('Creating timidity.cfg and README...', 'info');
        const sampleRateLabel = sampleRates.size === 1
            ? `${sampleRates.values().next().value} Hz`
            : 'Varies by instrument state';
        zip.file('timidity.cfg', this._buildTimidityCfg(melodicNames, drumNames, sampleRateLabel));
        zip.file('README.txt',   this._buildReadme(sampleRateLabel));

        this.log('Creating ZIP archive...', 'info');
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const rateSuffix = sampleRates.size === 1
            ? `${sampleRates.values().next().value}hz`
            : 'mixed-rates';
        FileDownloader.download(blob, `gm128_plus_drums_${rateSuffix}.zip`);
        this.log(`✓ Complete: ${(blob.size / 1024).toFixed(1)} KB`, 'ok');

        this.$('progressWrap').classList.remove('show');
        btn.disabled = false;
    }

    _buildTimidityCfg(melodicNames, drumNames, sampleRateLabel) {
        const lines = [];
        lines.push('# ================================================');
        lines.push('# TiMidity++ Configuration File');
        lines.push('# Generated by GUS Patch Generator');
        lines.push(`# Sample rate: ${sampleRateLabel}`);
        lines.push('#');
        lines.push('# The "dir" path below is relative to the location');
        lines.push('# of this timidity.cfg file. Make sure the melodic/');
        lines.push('# and drums/ folders are in the same directory.');
        lines.push('# ================================================');
        lines.push('');

        // ---- Melodic bank 0 (GM program 0-127) ----
        lines.push('# ---- Bank 0 : 128 GM melodic programs ----');
        lines.push('bank 0');
        for (let i = 0; i < melodicNames.length; i++) {
            // Format: <program> <filename>
            lines.push(`${i} melodic/${melodicNames[i]}`);
        }
        lines.push('');

        // ---- Drum kit (GM Channel 10) ----
        lines.push('# ---- Drumset 0 : GM Channel 10 drum kit ----');
        lines.push('drumset 0');
        for (const { note, fname } of drumNames) {
            // Format: <note> <filename>
            lines.push(`${note} drums/${fname}`);
        }
        lines.push('');

        return lines.join('\n');
    }


    _buildReadme(sampleRateLabel) {
        return [
            'GUS Patch Generator — Output Package',
            '=====================================',
            '',
            `Sample rate : ${sampleRateLabel}`,
            'Format      : Gravis Ultrasound Patch (.pat, 16-bit signed PCM, little-endian)',
            '',
            'Package contents:',
            '  timidity.cfg   TiMidity++ configuration',
            '  README.txt     This file',
            '  melodic/       128 GM program patches (000–127)',
            `  drums/         ${this.lib.drums.length} drum kit patches (notes ${this.lib.drums[0].note}–${this.lib.drums[this.lib.drums.length - 1].note})`,
            '',
            '─── Usage with TiMidity++ ─────────────────',
            '  1. Extract the entire ZIP into one folder.',
            '  2. cd into that folder.',
            '  3. Run:',
            '        timidity -c timidity.cfg song.mid',
            '',
            '  Render to WAV:',
            '        timidity -c timidity.cfg -Ow -o out.wav song.mid',
            '',
            '  Render to OGG:',
            '        timidity -c timidity.cfg -Ov -o out.ogg song.mid',
            '',
            '─── Usage with WildMIDI ───────────────────',
            '  WildMIDI automatically reads the "wildmidi/" folder:',
            '    wildmidi/         → rename melodic/, then rename each',
            '                        file to program number (000.pat …)',
            '    wildmidi/perc/    → rename drums/, file name = note number',
            '                        (35.pat … 81.pat)',
            '',
            '─── Usage with DOSBox ─────────────────────',
            '  Set the ULTRASND environment variable to the patch folder:',
            '    ULTRASND=240,1,1,3,3',
            '  Place .pat files in:',
            '    <ULTRASND>\\MELODIC\\<program>.pat   (e.g. 0.pat, 1.pat)',
            '    <ULTRASND>\\DRUMS\\STANDARD\\<note>.pat (e.g. 35.pat)',
            '',
            '─── Technical notes ───────────────────────',
            '  - All patches are generated purely from JavaScript oscillators.',
            '  - Melodic: 16-bit signed PCM with sustain looping enabled for instruments',
            '    that sustain (strings, brass, reed, pipe, pad, lead, organ, ensemble,',
            '    overdriven/distortion guitar, and synth bass), from loopStart → loopEnd.',
            '  - Looped samples include MENV and a default envelope (attack ~10ms,',
            '    release ~148ms) so note-off releases notes correctly.',
            '  - Drum   : one-shot, no loop.',
            '  - Vibrato and performance envelopes are handled by the GUS synth',
            '    during playback, not baked into the sample (avoids',
            '    "telephone ring" artifacts in loops).',
            '',
        ].join('\n');
    }

}
