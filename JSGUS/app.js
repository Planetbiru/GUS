
// ----------------------------------------------------------------
// 1.7  AudioPreview — Web Audio API wrapper
// ----------------------------------------------------------------
class AudioPreview {
    constructor() {
        this.ctx = null;
        this.source = null;
        this.analyser = null;
        this.onPlay = null;
        this.onStop = null;
    }

    getCtx() {
        if (!this.ctx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new Ctx();
        }
        return this.ctx;
    }

    getAnalyser() {
        if (!this.analyser) {
            this.analyser = this.getCtx().createAnalyser();
            this.analyser.fftSize = 1024;
            this.analyser.smoothingTimeConstant = 0.15;
            this.analyser.connect(this.ctx.destination);
        }
        return this.analyser;
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
        src.connect(this.getAnalyser());
        src.onended = () => {
            if (this.source === src) {
                this.source = null;
                if (this.onStop) this.onStop();
            }
        };
        src.start();
        this.source = src;
        if (this.onPlay) this.onPlay(this.analyser);
    }

    stop() {
        if (this.source) {
            const source = this.source;
            this.source = null;
            source.onended = null;
            try { source.stop(); } catch (e) { }
            if (this.onStop) this.onStop();
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
        this.midiInstrumentElements = new Map();
        this.midiChannelsUsed = [];
        this.midiChannelStates = new Map();
        this.midiChannelPrograms = new Map();
        this.activeMidiNoteOwners = new Map();
        this.activeMidiChannelNotes = new Map();
        this.activeMidiInstrumentNotes = new Map();
        this.collectingMidiInstruments = false;
        this.generatorState = {selected: null, instruments: {}, presets: {}};
        this.projects = [];
        this.currentProjectId = null;
        this.projectDb = null;
        this.midiPatchReloadTimer = null;
        this.autoApplyPreset = false;
        this.autoApplyPresetTimer = null;
        this.autoApplyPresetGeneration = 0;
        this.autoApplyPresetQueue = Promise.resolve();
        this.midiMode = 'file';
        this.midiControllerAccess = null;
        this.midiControllerInput = null;
        this.midiControllerPrograms = new Array(16).fill(0);
        this.midiControllerBanks = new Array(16).fill(0);
        this.midiControllerActiveNotes = new Set();
        this.midiControllerPendingNotes = new Set();
        this.sequencerPlaying = false;
        this.sequencerPaused = false;
        this.sequencerMidiData = null;
        this.sequencerGeneration = 0;
        this.sequencerLoadPromise = Promise.resolve();
        this.sequencerUpdateTimer = null;
        this.liveWaveformAnalyser = null;
        this.liveWaveformData = null;
        this.liveWaveformFrame = null;
        this.liveWaveformMode = 'amplitude';
        this.currentType = null;
        this.currentMidi = null;
        this.logEl = null;
        this._presetModel = null;
        this.dialogOpenOrder = [];
    }

    $(id) { return document.getElementById(id); }

    // ---- Utility ----
    slugify(s) { return s.replace(/[^A-Za-z0-9]/g, '_'); }

    getProjectZipFilename() {
        const projectName = this.projects.find(project => project.id === this.currentProjectId)?.name || 'GUS Project';
        let safeName = projectName.trim()
            .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
            .replace(/[. ]+$/g, '')
            .slice(0, 120);
        if (!safeName) safeName = 'GUS Project';
        if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(safeName)) {
            safeName = `_${safeName}`;
        }
        return `${safeName}.zip`;
    }

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
    async init() {
        this.logEl = this.$('log');
        await this.initializeProjects();
        this.buildSidebar();
        this.restoreInstrumentSearch();
        this.bindUI();
        this.enhanceNumberInputs();
        this.bindDraggableDialogs();
        this.bindKeyboard();
        this.audio.onPlay = analyser => this.setLiveWaveformSource(analyser);
        this.audio.onStop = () => this.restoreLiveWaveformSource();
        const waveCanvas = this.$('waveCanvas');
        if (typeof ResizeObserver === 'function') {
            this.waveCanvasResizeObserver = new ResizeObserver(() => this.drawPreview());
            this.waveCanvasResizeObserver.observe(waveCanvas);
        }
        window.addEventListener('resize', () => this.drawPreview());
        const liveWaveCanvas = this.$('liveWaveCanvas');
        liveWaveCanvas.addEventListener('click', () => this.toggleLiveWaveformMode());
        liveWaveCanvas.addEventListener('keydown', event => {
            if (event.code === 'Enter' || event.code === 'Space') {
                event.preventDefault();
                this.toggleLiveWaveformMode();
            }
        });
        if (typeof ResizeObserver === 'function') {
            this.liveWaveformResizeObserver = new ResizeObserver(() => this.drawLiveWaveform());
            this.liveWaveformResizeObserver.observe(liveWaveCanvas);
        }
        window.addEventListener('resize', () => this.drawLiveWaveform());
        this.drawLiveWaveform();
        this.log('Application ready. Choose an instrument from the list.', 'ok');
        this.log('Shortcuts: F2 = search instruments, Up/Down = navigate, Space = preview', 'info');
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

    bindDraggableDialogs() {
        document.querySelectorAll('dialog').forEach(dialog => {
            dialog.querySelectorAll('.dialog-header, .dialog-footer').forEach(handle => {
                handle.addEventListener('pointerdown', event => {
                    if (event.button !== 0 || event.target !== handle) return;

                    const rect = dialog.getBoundingClientRect();
                    const offsetX = event.clientX - rect.left;
                    const offsetY = event.clientY - rect.top;
                    handle.setPointerCapture(event.pointerId);
                    dialog.style.left = `${rect.left}px`;
                    dialog.style.top = `${rect.top}px`;
                    dialog.style.transform = 'none';
                    dialog.style.margin = '0';

                    const moveDialog = moveEvent => {
                        if (moveEvent.pointerId !== event.pointerId) return;
                        const left = Math.max(0, Math.min(
                            window.innerWidth - rect.width,
                            moveEvent.clientX - offsetX
                        ));
                        const top = Math.max(0, Math.min(
                            window.innerHeight - rect.height,
                            moveEvent.clientY - offsetY
                        ));
                        dialog.style.left = `${left}px`;
                        dialog.style.top = `${top}px`;
                    };
                    const stopDragging = stopEvent => {
                        if (stopEvent.pointerId !== event.pointerId) return;
                        handle.removeEventListener('pointermove', moveDialog);
                        handle.removeEventListener('pointerup', stopDragging);
                        handle.removeEventListener('pointercancel', stopDragging);
                    };

                    handle.addEventListener('pointermove', moveDialog);
                    handle.addEventListener('pointerup', stopDragging);
                    handle.addEventListener('pointercancel', stopDragging);
                });
            });
        });
    }

    showDialogCentered(dialog) {
        dialog.style.removeProperty('left');
        dialog.style.removeProperty('top');
        dialog.style.removeProperty('transform');
        dialog.style.removeProperty('margin');
        dialog.showModal();
        this.dialogOpenOrder = this.dialogOpenOrder.filter(openDialog => openDialog.open);
        this.dialogOpenOrder.push(dialog);
    }

    buildSidebar() {
        const listEl = this.$('instrumentList');
        const searchWrap = this.$('instrumentSearch').closest('.instrument-search-wrap');
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
        listEl.replaceChildren(tabs, searchWrap, melodicList, drumList);

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

    filterInstrumentList() {
        const query = this.$('instrumentSearch').value.trim().toLocaleLowerCase();
        const panels = ['melodic', 'drum'].map(type => ({
            type,
            panel: this.$(`${type}InstrumentList`),
        }));
        let totalMatches = 0;

        for (const {panel} of panels) {
            const children = [...panel.children];
            let familyHasMatch = false;
            for (let i = children.length - 1; i >= 0; i--) {
                const item = children[i];
                if (item.classList.contains('family')) {
                    item.hidden = query !== '' && !familyHasMatch;
                    familyHasMatch = false;
                    continue;
                }
                if (!item.classList.contains('inst')) continue;
                const name = item.querySelector('.instrument-name')?.textContent || '';
                const matches = !query || name.toLocaleLowerCase().includes(query);
                item.hidden = !matches;
                if (matches) {
                    familyHasMatch = true;
                    totalMatches++;
                }
            }
        }

        if (query && totalMatches > 0) {
            const activePanel = panels.find(({type}) => type === this.activeInstrumentList);
            if (activePanel.panel.querySelector('.inst:not([hidden])') === null) {
                const matchingPanel = panels.find(({panel}) => panel.querySelector('.inst:not([hidden])'));
                if (matchingPanel) this.setActiveInstrumentList(matchingPanel.type);
            }
        }
        this.$('instrumentFilterEmpty').hidden = !query || totalMatches > 0;
    }

    restoreInstrumentSearch() {
        try {
            this.$('instrumentSearch').value = localStorage.getItem('gus-patch-generator-instrument-search-v1') || '';
        } catch (error) {
            this.$('instrumentSearch').value = '';
        }
        this.filterInstrumentList();
    }

    persistInstrumentSearch() {
        try {
            localStorage.setItem('gus-patch-generator-instrument-search-v1', this.$('instrumentSearch').value);
        } catch (error) { }
    }

    _makeItem({ type, midi, name, num }) {
        const d = document.createElement('div');
        d.className = 'inst';
        d.dataset.type = type;
        d.dataset.midi = midi;
        d.innerHTML = `<span class="instrument-name">${name}</span><span class="num">${num}</span>`;
        d.onclick = () => this.selectInstrument(type, midi);
        return d;
    }

    enhanceNumberInputs() {
        document.querySelectorAll('input[type="number"]:not([data-custom-spinner])').forEach(input => {
            this.createNumberSpinner(input);
        });
    }

    createNumberSpinner(input) {
        const wrapper = document.createElement('div');
        wrapper.className = 'number-input-wrap';
        input.dataset.customSpinner = 'true';
        if (input.parentNode) {
            input.parentNode.insertBefore(wrapper, input);
        }
        wrapper.appendChild(input);

        for (const [direction, label] of [['up', 'Increase value'], ['down', 'Decrease value']]) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `number-spinner-button number-spinner-${direction}`;
            button.setAttribute('aria-label', label);
            button.addEventListener('click', () => {
                const previousValue = input.value;
                if (direction === 'up') input.stepUp();
                else input.stepDown();
                if (input.value === previousValue) return;
                input.dispatchEvent(new Event('input', {bubbles: true}));
                input.dispatchEvent(new Event('change', {bubbles: true}));
            });
            wrapper.appendChild(button);
        }

        return wrapper;
    }

    bindUI() {
        this.$('btnPlayNote').onclick = () => this.playPreview();
        this.$('btnPlayScale').onclick = () => this.playScale();
        this.$('btnStop').onclick = () => this.audio.stop();
        this.$('btnDownload').onclick = () => this.downloadCurrent();
        this.$('btnZip').onclick = () => this.downloadAllZip();
        this.$('btnSoundFont').onclick = () => this.downloadSoundFont();
        this.$('btnExportMelodicPresets').onclick = () => this.exportPresetSet('melodic');
        this.$('btnExportDrumPresets').onclick = () => this.exportPresetSet('drum');
        this.$('btnImportMelodicPresets').onclick = () => this.$('melodicPresetFile').click();
        this.$('btnImportDrumPresets').onclick = () => this.$('drumPresetFile').click();
        this.$('melodicPresetFile').addEventListener('change', event => this.importPresetSet('melodic', event));
        this.$('drumPresetFile').addEventListener('change', event => this.importPresetSet('drum', event));
        this.$('btnResetGeneratorState').onclick = () => this.requestResetGeneratorState();
        this.$('projectSelect').addEventListener('change', event => this.switchProject(event.target.value));
        this.$('btnNewProject').onclick = () => this.openNewProjectDialog();
        this.$('btnCancelNewProject').onclick = () => this.$('newProjectDialog').close();
        this.$('btnCloseNewProject').onclick = () => this.$('newProjectDialog').close();
        this.$('btnConfirmNewProject').onclick = () => this.createProjectFromDialog();
        this.$('btnDeleteProject').onclick = () => this.requestDeleteCurrentProject();
        this.$('btnCancelDeleteProject').onclick = () => this.cancelDestructiveConfirmation();
        this.$('btnCloseDeleteProject').onclick = () => this.cancelDestructiveConfirmation();
        this.$('deleteProjectChallengeAnswer').addEventListener('input', () => this.validateDeleteChallenge());
        this.$('btnConfirmDeleteProject').onclick = () => {
            if (this.pendingResetChallenge) this.confirmResetGeneratorState();
            else this.confirmDeleteProject();
        };
        this.$('instrumentSearch').addEventListener('input', () => {
            this.persistInstrumentSearch();
            this.filterInstrumentList();
        });
        this.$('btnApplyPreset').onclick = () => {
            this.cancelAutoApplyPreset();
            this.applyPresetJson();
        };
        this.$('btnAutoApplyPreset').onclick = () => this.toggleAutoApplyPreset();
        this.$('btnResetPreset').onclick = () => this.requestResetPreset();
        this.$('btnCancelResetPreset').onclick = () => this.cancelResetPreset();
        this.$('btnCloseResetPreset').onclick = () => this.cancelResetPreset();
        this.$('btnConfirmResetPreset').onclick = () => this.confirmResetPreset();
        this.$('resetPresetDialog').addEventListener('cancel', event => {
            event.preventDefault();
            this.cancelResetPreset();
        });
        this.$('presetJson').addEventListener('input', () => this.handlePresetJsonInput());
        this.$('btnChooseMidi').onclick = () => this.$('midiFile').click();
        this.$('midiFile').addEventListener('change', event => this.loadMidiFile(event));
        this.$('btnMidiPlay').onclick = () => this.toggleMidiPlayback();
        this.$('btnMidiStop').onclick = () => this.stopMidiPlayback();
        this.$('btnMidiRender').onclick = () => this.renderMidiToWav();
        this.$('midiVolume').addEventListener('input', () => this.handleMidiVolumeInput());
        this.$('midiChannelList').addEventListener('click', event => {
            const button = event.target.closest('button[data-channel][data-control]');
            if (!button) return;
            this.toggleMidiChannelControl(Number(button.dataset.channel), button.dataset.control);
        });
        this.$('btnMidiFileMode').onclick = () => this.setMidiMode('file');
        this.$('btnMidiSequencerMode').onclick = () => this.setMidiMode('sequencer');
        this.$('btnMidiControllerMode').onclick = () => this.setMidiMode('controller');
        this.$('btnMidiControllerConnect').onclick = () => this.toggleMidiControllerConnection();
        this.$('midiControllerInput').addEventListener('change', () => {
            if (this.midiControllerInput) {
                this.connectMidiControllerInput().catch(error => {
                    this.$('midiStatus').textContent = `MIDI controller connection failed: ${error.message}`;
                    this.log(`MIDI controller connection failed: ${error.message}`, 'err');
                });
            }
        });
        this.$('btnSequencerPlay').onclick = () => this.startMidiSequencer();
        this.$('btnSequencerPause').onclick = () => this.toggleSequencerPause();
        this.$('btnSequencerStop').onclick = () => this.stopMidiSequencer();
        this.$('sequencerTempo').addEventListener('input', () => this.validateSequencerTempo());
        this.$('sequencerVelocity').addEventListener('input', () => {
            this.$('sequencerVelocityValue').value = this.$('sequencerVelocity').value;
            if (this.sequencerPlaying) this.scheduleSequencerPatternUpdate();
        });
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
            this.$(id).addEventListener('input', event => this.handleGeneratorInput(event));
        });

        this.$('btnPresetFormMode').onclick = () => this.setPresetEditorMode('form');
        this.$('btnPresetJsonMode').onclick = () => this.setPresetEditorMode('json');
    }

    loadGeneratorState() {
            const emptyState = {selected: null, instruments: {}, presets: {}};
            try {
                const stored = localStorage.getItem('gus-patch-generator-state-v1');
                if (!stored) return emptyState;
                const parsed = JSON.parse(stored);
                return {
                    selected: parsed.selected || null,
                    instruments: parsed.instruments && typeof parsed.instruments === 'object'
                        ? parsed.instruments
                        : {},
                    presets: parsed.presets && typeof parsed.presets === 'object'
                        && !Array.isArray(parsed.presets)
                        ? parsed.presets
                        : {},
                };
            } catch (error) {
                return emptyState;
            }
        }

            async initializeProjects() {
                if (!window.indexedDB) throw new Error('IndexedDB is not available in this browser.');
                this.projectDb = await new Promise((resolve, reject) => {
                    const request = indexedDB.open('gus-patch-generator-projects', 1);
                    request.onupgradeneeded = () => {
                        if (!request.result.objectStoreNames.contains('projects')) {
                            request.result.createObjectStore('projects', {keyPath: 'id'});
                        }
                    };
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                this.projects = await this.readProjects();
                if (this.projects.length === 0) {
                    const project = {
                        id: this.createProjectId(),
                        name: 'Project 1',
                        active: true,
                        state: this.loadGeneratorState(),
                    };
                    this.projects = [project];
                    await this.writeProjects(this.projects);
                }

                this.projects = this.projects.map(project => ({
                    ...project,
                    name: project.name || 'Untitled project',
                    state: this.normalizeProjectState(project.state),
                }));
                const activeProject = this.projects.find(project => project.active) || this.projects[0];
                this.projects.forEach(project => { project.active = project.id === activeProject.id; });
                this.currentProjectId = activeProject.id;
                this.generatorState = this.normalizeProjectState(activeProject.state);
                await this.writeProjects(this.projects);
                this.renderProjectControls();
            }

            createProjectId() {
                return `project-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            }

            normalizeProjectState(value) {
                const state = value && typeof value === 'object' ? value : {};
                return {
                    selected: state.selected && typeof state.selected === 'object' ? state.selected : null,
                    instruments: state.instruments && typeof state.instruments === 'object'
                        && !Array.isArray(state.instruments) ? state.instruments : {},
                    presets: state.presets && typeof state.presets === 'object'
                        && !Array.isArray(state.presets) ? state.presets : {},
                };
            }

            readProjects() {
                return new Promise((resolve, reject) => {
                    const transaction = this.projectDb.transaction('projects', 'readonly');
                    const request = transaction.objectStore('projects').getAll();
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => reject(request.error);
                });
            }

            writeProjects(projects, deletedId = null) {
                return new Promise((resolve, reject) => {
                    const transaction = this.projectDb.transaction('projects', 'readwrite');
                    const store = transaction.objectStore('projects');
                    if (deletedId) store.delete(deletedId);
                    projects.forEach(project => store.put(project));
                    transaction.oncomplete = () => resolve();
                    transaction.onerror = () => reject(transaction.error || new Error('Could not save projects.'));
                    transaction.onabort = () => reject(transaction.error || new Error('Project update was aborted.'));
                });
            }

            renderProjectControls() {
                const select = this.$('projectSelect');
                select.replaceChildren(...this.projects.map(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    option.selected = project.id === this.currentProjectId;
                    return option;
                }));
                this.$('btnDeleteProject').disabled = this.projects.length <= 1;
            }

            openNewProjectDialog() {
                this.$('newProjectName').value = '';
                this.$('newProjectError').textContent = '';
                this.showDialogCentered(this.$('newProjectDialog'));
                this.$('newProjectName').focus();
            }

            async createProjectFromDialog() {
                const name = this.$('newProjectName').value.trim();
                if (!name) {
                    this.$('newProjectError').textContent = 'Enter a project name.';
                    this.$('newProjectName').focus();
                    return;
                }
                const button = this.$('btnConfirmNewProject');
                button.disabled = true;
                try {
                    this.saveCurrentGeneratorState(false);
                    await this.persistGeneratorState();
                    const project = {
                        id: this.createProjectId(),
                        name,
                        active: true,
                        state: {selected: null, instruments: {}, presets: {}},
                    };
                    this.projects.forEach(entry => { entry.active = false; });
                    this.projects.push(project);
                    await this.writeProjects(this.projects);
                    this.currentProjectId = project.id;
                    this.generatorState = project.state;
                    this.currentType = null;
                    this.currentMidi = null;
                    this.renderProjectControls();
                    this.$('newProjectDialog').close();
                    this.selectInstrument('melodic', 0);
                    this.log(`Project created: ${name}.`, 'ok');
                } catch (error) {
                    this.$('newProjectError').textContent = error.message;
                } finally {
                    button.disabled = false;
                }
            }

            async switchProject(projectId) {
                if (projectId === this.currentProjectId) return;
                const nextProject = this.projects.find(project => project.id === projectId);
                if (!nextProject) return;
                try {
                    this.saveCurrentGeneratorState(false);
                    await this.persistGeneratorState();
                    this.projects.forEach(project => { project.active = project.id === projectId; });
                    await this.writeProjects(this.projects);
                    this.currentProjectId = projectId;
                    this.generatorState = this.normalizeProjectState(nextProject.state);
                    this.currentType = null;
                    this.currentMidi = null;
                    const selected = this.generatorState.selected;
                    const type = selected && selected.type === 'drum' ? 'drum' : 'melodic';
                    let midi = Number(selected && selected.midi);
                    if (type === 'drum' && !this.lib.findDrum(midi)) {
                        midi = this.lib.drums[0].note;
                    } else if (type === 'melodic' && !this.lib.melodic[midi]) {
                        midi = 0;
                    }
                    this.selectInstrument(type, midi);
                    this.renderProjectControls();
                    await this.reloadAllLoadedMidiPatches();
                    this.log(`Project opened: ${nextProject.name}.`, 'ok');
                } catch (error) {
                    this.log(`Could not switch project: ${error.message}`, 'err');
                    this.renderProjectControls();
                }
            }

            requestDeleteCurrentProject() {
                const project = this.projects.find(entry => entry.id === this.currentProjectId);
                if (!project || this.projects.length <= 1) return;
                this.pendingResetChallenge = null;
                const first = Math.floor(Math.random() * 10) + 1;
                const second = Math.floor(Math.random() * 10) + 1;
                this.pendingProjectDeletion = {id: project.id, result: first + second};
                this.$('deleteProjectTitle').textContent = 'Delete Project';
                this.$('deleteProjectMessage').textContent = `Delete "${project.name}" and all its saved presets? This cannot be undone.`;
                this.$('deleteProjectChallengePrompt').textContent = `Solve to continue: ${first} + ${second} = ?`;
                this.$('deleteProjectChallengeAnswer').value = '';
                this.$('deleteProjectError').textContent = '';
                this.$('btnConfirmDeleteProject').textContent = 'Delete permanently';
                this.$('btnConfirmDeleteProject').disabled = true;
                this.showDialogCentered(this.$('deleteProjectDialog'));
                this.$('deleteProjectChallengeAnswer').focus();
            }

            requestResetGeneratorState() {
                const first = Math.floor(Math.random() * 40) + 10;
                const second = Math.floor(Math.random() * 40) + 10;
                this.pendingProjectDeletion = null;
                this.pendingResetChallenge = {result: first + second};
                this.$('deleteProjectTitle').textContent = 'Reset Saved State';
                this.$('deleteProjectMessage').textContent = 'Reset all saved generator settings and custom presets in the active project? This cannot be undone.';
                this.$('deleteProjectChallengePrompt').textContent = `Solve to continue: ${first} + ${second} = ?`;
                this.$('deleteProjectChallengeAnswer').value = '';
                this.$('deleteProjectError').textContent = '';
                this.$('btnConfirmDeleteProject').textContent = 'Reset Saved State';
                this.$('btnConfirmDeleteProject').disabled = true;
                this.showDialogCentered(this.$('deleteProjectDialog'));
                this.$('deleteProjectChallengeAnswer').focus();
            }

            cancelDestructiveConfirmation() {
                this.pendingProjectDeletion = null;
                this.pendingResetChallenge = null;
                this.$('deleteProjectDialog').close();
            }

            validateDeleteChallenge() {
                const answer = Number(this.$('deleteProjectChallengeAnswer').value);
                const challenge = this.pendingResetChallenge || this.pendingProjectDeletion;
                const valid = challenge
                    && this.$('deleteProjectChallengeAnswer').value !== ''
                    && answer === challenge.result;
                this.$('btnConfirmDeleteProject').disabled = !valid;
                this.$('deleteProjectError').textContent = valid || !this.$('deleteProjectChallengeAnswer').value
                    ? '' : 'That answer is not correct.';
            }


            confirmResetGeneratorState() {
                if (this.$('btnConfirmDeleteProject').disabled || !this.pendingResetChallenge) return;
                this.pendingResetChallenge = null;
                this.$('deleteProjectDialog').close();
                this.resetGeneratorState();
            }
            async confirmDeleteProject() {
                if (this.$('btnConfirmDeleteProject').disabled || !this.pendingProjectDeletion) return;
                const deletedId = this.pendingProjectDeletion.id;
                const wasActive = deletedId === this.currentProjectId;
                try {
                    const remaining = this.projects.filter(project => project.id !== deletedId);
                    if (wasActive) remaining[0].active = true;
                    await this.writeProjects(remaining, deletedId);
                    this.projects = remaining;
                    this.pendingProjectDeletion = null;
                    this.$('deleteProjectDialog').close();
                    if (wasActive) {
                        this.audio.stop();
                        this.currentProjectId = remaining[0].id;
                        this.generatorState = this.normalizeProjectState(remaining[0].state);
                        this.currentType = null;
                        this.currentMidi = null;
                        const selected = this.generatorState.selected;
                        const type = selected && selected.type === 'drum' ? 'drum' : 'melodic';
                        const midi = type === 'drum' && this.lib.findDrum(Number(selected && selected.midi))
                            ? Number(selected.midi) : 0;
                        this.selectInstrument(type, midi);
                        await this.reloadAllLoadedMidiPatches();
                    }
                    this.renderProjectControls();
                    this.log('Project deleted.', 'ok');
                } catch (error) {
                    this.$('deleteProjectError').textContent = `Could not delete project: ${error.message}`;
                }
            }

        persistGeneratorState() {
            try {
            const project = this.projects.find(entry => entry.id === this.currentProjectId);
            if (!project) return Promise.resolve();
            project.state = this.generatorState;
            return this.writeProjects([project]).catch(error => {
                this.log(`Could not save generator settings: ${error.message}`, 'err');
                return false;
            });
            } catch (error) {
            this.log(`Could not save generator settings: ${error.message}`, 'err');
            return Promise.resolve(false);
            }
        }

        getDefaultGeneratorState(type, midi) {
            const preset = this.getInstrumentPreset(type, midi);
            const root = type === 'drum'
                ? this.lib.drumToFreq(midi)
                : (preset && preset.freq) || 441;
            const presetDuration = Number(preset && preset.duration);
            const duration = Number.isFinite(presetDuration) && presetDuration > 0
                ? Math.min(3, Math.max(0.05, presetDuration))
                : 0.25;
            return {sampleRate: 22050, root, duration, wave: 'preset'};
        }

        normalizeGeneratorState(type, midi, value) {
            const defaults = this.getDefaultGeneratorState(type, midi);
            const sampleRate = Number(value && value.sampleRate);
            const root = Number(value && value.root);
            const duration = Number(value && value.duration);
            const wave = value && value.wave;
            const hasStoredDuration = value && value.duration != null && Number.isFinite(duration);
            const durationCustomized = value && value.durationCustomized === true
                || (value && value.durationCustomized == null
                    && hasStoredDuration && Math.abs(duration - 0.25) > 1e-9);
            return {
                sampleRate: [11025, 22050, 44100].includes(sampleRate) ? sampleRate : defaults.sampleRate,
                root: Number.isFinite(root) ? Math.min(4000, Math.max(20, root)) : defaults.root,
                duration: durationCustomized && Number.isFinite(duration)
                    ? Math.min(3, Math.max(0.05, duration))
                    : defaults.duration,
                durationCustomized: Boolean(durationCustomized),
                wave: ['preset', 'sine', 'square', 'saw', 'triangle'].includes(wave) ? wave : 'preset',
            };
        }

        getInstrumentGeneratorState(type, midi) {
            const key = `${type}:${midi}`;
            const normalized = this.normalizeGeneratorState(type, midi, this.generatorState.instruments[key]);
            this.generatorState.instruments[key] = normalized;
            return normalized;
        }

        refreshGeneratorDuration(type, midi) {
            const state = this.getInstrumentGeneratorState(type, midi);
            if (type === this.currentType && Number(midi) === Number(this.currentMidi)) {
                this.$('dur').value = String(state.duration);
            }
        }

        getInstrumentPreset(type, midi) {
            const instrument = type === 'drum'
                ? this.lib.findDrum(midi)
                : this.lib.melodic[midi];
            if (!instrument) throw new Error(`Unknown ${type} instrument: ${midi}.`);
            const preset = this.generatorState.presets[`${type}:${midi}`] || instrument.preset;
            return preset;
        }

        getCurrentPresetKey() {
            if (this.currentType == null || this.currentMidi == null) {
                throw new Error('Select an instrument before editing its preset.');
            }
            return `${this.currentType}:${this.currentMidi}`;
        }

        setPresetEditorStatus(message, isError = false) {
            const status = this.$('presetJsonStatus');
            status.textContent = message;
            status.classList.toggle('error', isError);
        }

        validatePresetJson() {
            const editor = this.$('presetJson');
            try {
                const preset = JSON.parse(editor.value);
                if (!preset || typeof preset !== 'object' || Array.isArray(preset)) {
                    throw new Error('Preset JSON must be an object.');
                }
                this.$('btnApplyPreset').disabled = false;
                this.setPresetEditorStatus('Valid JSON. Apply to generate and load the patch.');
                return preset;
            } catch (error) {
                this.$('btnApplyPreset').disabled = true;
                this.setPresetEditorStatus(error.message, true);
                return null;
            }
        }

        handlePresetJsonInput() {
            const preset = this.validatePresetJson();
            if (!this.autoApplyPreset) return;
            if (!preset) {
                this.cancelAutoApplyPreset();
                return;
            }
            this.scheduleAutoApplyPreset();
        }

        cancelAutoApplyPreset() {
            clearTimeout(this.autoApplyPresetTimer);
            this.autoApplyPresetTimer = null;
            this.autoApplyPresetGeneration++;
        }

        toggleAutoApplyPreset() {
            this.autoApplyPreset = !this.autoApplyPreset;
            const button = this.$('btnAutoApplyPreset');
            button.setAttribute('aria-pressed', String(this.autoApplyPreset));
            button.textContent = `Auto Apply: ${this.autoApplyPreset ? 'On' : 'Off'}`;

            if (this.autoApplyPreset) {
                if (this.validatePresetJson()) this.scheduleAutoApplyPreset();
            } else {
                this.cancelAutoApplyPreset();
            }
        }

        scheduleAutoApplyPreset() {
            clearTimeout(this.autoApplyPresetTimer);
            const generation = ++this.autoApplyPresetGeneration;
            const jsonText = this.$('presetJson').value;
            const projectId = this.currentProjectId;
            const key = this.currentType == null || this.currentMidi == null
                ? null
                : `${this.currentType}:${this.currentMidi}`;
            this.setPresetEditorStatus('Valid JSON. Applying automatically...');

            this.autoApplyPresetTimer = setTimeout(() => {
                this.autoApplyPresetTimer = null;
                this.autoApplyPresetQueue = this.autoApplyPresetQueue.catch(() => {}).then(async () => {
                    const currentKey = this.currentType == null || this.currentMidi == null
                        ? null
                        : `${this.currentType}:${this.currentMidi}`;
                    if (!this.autoApplyPreset || generation !== this.autoApplyPresetGeneration
                        || jsonText !== this.$('presetJson').value
                        || projectId !== this.currentProjectId || key !== currentKey) return;
                    await this.applyPresetJson();
                });
            }, 400);
        }

        requestResetPreset() {
            if (this.currentType == null || this.currentMidi == null) return;
            this.cancelAutoApplyPreset();
            this.$('resetPresetMessage').textContent = `Restore the factory preset for ${this.$('title').textContent}? Custom changes to this instrument will be discarded.`;
            this.showDialogCentered(this.$('resetPresetDialog'));
            this.$('btnCancelResetPreset').focus();
        }

        cancelResetPreset() {
            this.$('resetPresetDialog').close();
            if (this.autoApplyPreset && this.validatePresetJson()) this.scheduleAutoApplyPreset();
        }

        confirmResetPreset() {
            this.$('resetPresetDialog').close();
            this.resetCurrentPreset();
        }

        updatePresetEditor() {
            const preset = this.getInstrumentPreset(this.currentType, this.currentMidi);
            this.$('presetJson').value = JSON.stringify(preset, null, 2);
            // Rebuild form hanya jika isi preset berbeda dari yang tampil di form.
            if (JSON.stringify(preset) !== JSON.stringify(this._presetModel)) {
                this.buildPresetForm(preset);
            }
            this.validatePresetJson();
        }

        async applyPresetJson() {
            const type = this.currentType;
            const midi = this.currentMidi;
            const parsedPreset = this.validatePresetJson();
            if (!parsedPreset) return;
            const key = this.getCurrentPresetKey();
            try {
                this.buildMidiPatch(type === 'drum', midi, parsedPreset);
            } catch (error) {
                this.setPresetEditorStatus(`Preset cannot generate a patch: ${error.message}`, true);
                this.log(`Preset apply failed: ${error.message}`, 'err');
                return;
            }

            this.generatorState.presets[key] = parsedPreset;
            this.refreshGeneratorDuration(type, midi);
            this.persistGeneratorState();
            this.updatePresetEditor();
            this.drawPreview();
            await this.reloadMidiInstrumentIfUsed(type, midi);
            await this.reloadRealtimeInstrumentIfUsed(type, midi);
            if (this.sequencerPlaying && this.midiMode === 'sequencer') {
                await this.restartMidiSequencer();
            }
            this.setPresetEditorStatus('Preset applied and patch regenerated.');
            this.log(`Preset applied: ${type} ${midi}.`, 'ok');
        }

        // ---- Preset form editor ----

        setPresetEditorMode(mode) {
            const isForm = mode === 'form';
            this.$('presetFormPanel').hidden = !isForm;
            this.$('presetJsonPanel').hidden = isForm;
            this.$('btnPresetFormMode').classList.toggle('active', isForm);
            this.$('btnPresetJsonMode').classList.toggle('active', !isForm);
            this.$('btnPresetFormMode').setAttribute('aria-selected', String(isForm));
            this.$('btnPresetJsonMode').setAttribute('aria-selected', String(!isForm));
            if (isForm) {
                // Sinkronkan form dari textarea jika isinya berbeda.
                try {
                    const parsed = JSON.parse(this.$('presetJson').value);
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                        && JSON.stringify(parsed) !== JSON.stringify(this._presetModel)) {
                        this.buildPresetForm(parsed);
                    }
                } catch (e) { /* biarkan form apa adanya jika JSON tidak valid */ }
            }
        }

        buildPresetForm(preset) {
            const form = this.$('presetForm');
            if (!form) return;
            form.replaceChildren();
            this._presetModel = JSON.parse(JSON.stringify(preset));
            this.renderPresetObjectInto(this._presetModel, form, []);
            form.scrollTop = 0;
        }

        renderPresetObjectInto(obj, container, path) {
            for (const key of Object.keys(obj)) {
                this.renderPresetField(obj, key, container, path);
            }
        }

        renderPresetField(parentObj, key, container, path) {
            const value = parentObj[key];
            const fieldPath = [...path, key];

            if (key === 'defaultWaveform') {
                this.renderPresetWaveformField(parentObj, key, container, fieldPath);
            } else if (Array.isArray(value)) {
                this.renderPresetArrayField(parentObj, key, container, fieldPath);
            } else if (value !== null && typeof value === 'object') {
                this.renderPresetObjectField(parentObj, key, container, fieldPath);
            } else {
                this.renderPresetScalarField(parentObj, key, container, fieldPath);
            }
        }

        labelForKey(key) {
            return key
                .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
                .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
        }

        renderPresetWaveformField(parentObj, key, container, path) {
            const row = document.createElement('div');
            row.className = 'preset-field';

            const label = document.createElement('label');
            label.textContent = this.labelForKey(key);
            const input = document.createElement('select');
            input.id = 'presetField_' + path.join('_');
            label.htmlFor = input.id;

            for (const waveform of ['null', 'sine', 'square', 'triangle', 'saw']) {
                const option = document.createElement('option');
                option.value = waveform;
                option.textContent = waveform == 'null' ? '- Not Specified -' : waveform;
                input.appendChild(option);
            }
            input.value = parentObj[key] == null ? 'null' : parentObj[key];
            input.addEventListener('change', () => {
                parentObj[key] = input.value === 'null' ? null : input.value;
                this.onPresetFormChanged();
                this.cancelAutoApplyPreset();
                this.applyPresetJson().catch(error => {
                    this.setPresetEditorStatus(`Preset apply failed: ${error.message}`, true);
                    this.log(`Preset apply failed: ${error.message}`, 'err');
                });
            });

            row.append(label, input);
            container.appendChild(row);
        }

        renderPresetScalarField(parentObj, key, container, path) {
            const value = parentObj[key];
            const row = document.createElement('div');
            row.className = 'preset-field';

            const label = document.createElement('label');
            label.textContent = this.labelForKey(key);
            const inputId = 'presetField_' + path.join('_');
            label.htmlFor = inputId;

            let input;
            if (typeof value === 'boolean') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = value;
                input.addEventListener('change', () => {
                    parentObj[key] = input.checked;
                    this.onPresetFormChanged();
                });
            } else if (typeof value === 'number') {
                input = this.createPresetNumberInput(
                    () => parentObj[key],
                    (n) => { parentObj[key] = n; }
                );
            } else if (typeof value === 'string') {
                input = document.createElement('input');
                input.type = 'text';
                input.value = value;
                input.addEventListener('input', () => {
                    parentObj[key] = input.value;
                    this.onPresetFormChanged();
                });
            } else {
                return;
            }
            input.id = inputId;
            row.append(label, input.type === 'number' ? this.createNumberSpinner(input) : input);
            container.appendChild(row);
        }

        renderPresetObjectField(parentObj, key, container, path) {
            const value = parentObj[key];
            const fieldset = document.createElement('fieldset');
            fieldset.className = 'preset-fieldset';
            const legend = document.createElement('legend');
            legend.textContent = this.labelForKey(key);
            fieldset.appendChild(legend);
            for (const subKey of Object.keys(value)) {
                this.renderPresetField(value, subKey, fieldset, [...path, subKey]);
            }
            container.appendChild(fieldset);
        }

        renderPresetArrayField(parentObj, key, container, path) {
            const fieldset = document.createElement('fieldset');
            fieldset.className = 'preset-fieldset';
            const legend = document.createElement('legend');
            legend.textContent = this.labelForKey(key);
            fieldset.appendChild(legend);

            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'preset-array-items';
            fieldset.appendChild(itemsContainer);

            this.renderPresetArrayItems(parentObj, key, itemsContainer, path);

            // Tombol Add hanya muncul jika tipe item bisa dideteksi (array tidak kosong).
            // Untuk array objek kosong kita tidak tahu shape-nya, jadi Add disembunyikan.
            const arr = parentObj[key];
            const canAdd = arr.length > 0;
            if (canAdd) {
                const addBtn = document.createElement('button');
                addBtn.type = 'button';
                addBtn.className = 'preset-array-add';
                addBtn.textContent = '+ Add';
                addBtn.addEventListener('click', () => {
                    const sample = arr[arr.length - 1];
                    arr.push(this.cloneArraySample(sample));
                    this.renderPresetArrayItems(parentObj, key, itemsContainer, path);
                    this.onPresetFormChanged();
                });
                fieldset.appendChild(addBtn);
            }
            container.appendChild(fieldset);
        }

        cloneArraySample(sample) {
            if (sample === null || sample === undefined) return 0;
            if (typeof sample === 'object') return JSON.parse(JSON.stringify(sample));
            return sample;
        }

        renderPresetArrayItems(parentObj, key, itemsContainer, path) {
            itemsContainer.replaceChildren();
            const arr = parentObj[key];
            arr.forEach((item, index) => {
                const itemWrap = document.createElement('div');
                itemWrap.className = 'preset-array-item';

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'preset-array-remove';
                removeBtn.setAttribute('aria-label', 'Remove item');
                removeBtn.title = 'Remove item';
                removeBtn.innerHTML = '<svg class="preset-array-remove-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"></path></svg>';
                removeBtn.addEventListener('click', () => {
                    arr.splice(index, 1);
                    this.renderPresetArrayItems(parentObj, key, itemsContainer, path);
                    this.onPresetFormChanged();
                });

                if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
                    const body = document.createElement('div');
                    body.className = 'preset-array-item-body';
                    for (const subKey of Object.keys(item)) {
                        this.renderPresetField(item, subKey, body, [...path, String(index), subKey]);
                    }
                    itemWrap.append(body, removeBtn);
                } else if (typeof item === 'number') {
                    const input = this.createPresetNumberInput(
                        () => arr[index],
                        (n) => { arr[index] = n; }
                    );
                    itemWrap.append(this.createNumberSpinner(input), removeBtn);
                } else if (typeof item === 'boolean') {
                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.checked = item;
                    input.addEventListener('change', () => {
                        arr[index] = input.checked;
                        this.onPresetFormChanged();
                    });
                    itemWrap.append(input, removeBtn);
                } else if (typeof item === 'string') {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = item;
                    input.addEventListener('input', () => {
                        arr[index] = input.value;
                        this.onPresetFormChanged();
                    });
                    itemWrap.append(input, removeBtn);
                } else {
                    return;
                }

                itemsContainer.appendChild(itemWrap);
            });
        }

        onPresetFormChanged() {
            // Sinkronkan ke textarea & jalankan alur validasi/auto-apply yang sudah ada.
            this.$('presetJson').value = JSON.stringify(this._presetModel, null, 2);
            this.handlePresetJsonInput();
        }

        // ---- Number input helpers untuk form preset ----

        parsePresetNumber(raw) {
            if (typeof raw !== 'string') return NaN;
            const trimmed = raw.trim();
            if (!trimmed) return NaN;
            // Normalisasi koma desimal (locale id-ID, dll.) → titik
            const normalized = trimmed.replace(',', '.');
            const n = parseFloat(normalized);
            return Number.isFinite(n) ? n : NaN;
        }

        createPresetNumberInput(get, set) {
            const input = document.createElement('input');
            input.type = 'number';
            input.setAttribute('inputmode', 'decimal');

            const initial = get();
            input.value = String(initial);
            input.step = String(this.computePresetStep(initial));

            const syncStep = value => {
                input.step = String(this.computePresetStep(value));
            };

            input.addEventListener('input', () => {
                const n = this.parsePresetNumber(input.value);
                if (!Number.isFinite(n)) return;   // transien (mis. user mengetik "0.")
                syncStep(n);
                set(n);
                this.onPresetFormChanged();
            });

            input.addEventListener('blur', () => {
                const n = this.parsePresetNumber(input.value);
                if (!Number.isFinite(n)) {
                    input.value = String(get());   // kembalikan ke nilai model terakhir
                } else {
                    syncStep(n);
                }
            });

            return input;
        }

        computePresetStep(value) {
            const abs = Math.abs(value);
            if (!Number.isFinite(abs) || abs === 0) return 0.001;

            // 1) Langkah minimum berdasarkan magnitude — supaya nilai besar
            //    tidak perlu diklik ratusan kali.
            let magnitudeStep;
            if (abs >= 100)          magnitudeStep = 1;
            else if (abs >= 10)      magnitudeStep = 0.1;
            else if (abs >= 1)       magnitudeStep = 0.01;
            else if (abs >= 0.1)     magnitudeStep = 0.001;
            else if (abs >= 0.001)   magnitudeStep = 0.001;
            else if (abs >= 0.0001)  magnitudeStep = 0.0001;
            else if (abs >= 0.00001) magnitudeStep = 0.00001;
            else                     magnitudeStep = 0.000001;

            // 2) Jika nilai punya lebih banyak desimal daripada langkah magnitude,
            //    turunkan step agar nilai tersebut tetap on-grid (tidak di-snap
            //    browser ke grid yang lebih kasar).
            const str = abs.toString();
            let decimals = 0;
            if (str.includes('e-')) {
                decimals = parseInt(str.split('e-')[1], 10) || 0;
            } else if (str.includes('.')) {
                decimals = (str.split('.')[1] || '').length;
            }
            if (decimals > 0 && decimals <= 10) {
                const valueStep = Number('1e-' + decimals);
                if (valueStep < magnitudeStep) return valueStep;
            }

            return magnitudeStep;
        }

        async resetCurrentPreset() {
            this.cancelAutoApplyPreset();
            const type = this.currentType;
            const midi = this.currentMidi;
            const key = this.getCurrentPresetKey();
            const factoryPreset = type === 'drum'
                ? this.lib.findDrum(midi).preset
                : this.lib.melodic[midi].preset;
            try {
                this.buildMidiPatch(type === 'drum', midi, factoryPreset);
            } catch (error) {
                this.setPresetEditorStatus(`Factory preset cannot generate a patch: ${error.message}`, true);
                this.log(`Preset reset failed: ${error.message}`, 'err');
                return;
            }

            delete this.generatorState.presets[key];
            this.refreshGeneratorDuration(type, midi);
            this.persistGeneratorState();
            this.updatePresetEditor();
            this.drawPreview();
            await this.reloadMidiInstrumentIfUsed(type, midi);
            await this.reloadRealtimeInstrumentIfUsed(type, midi);
            this.setPresetEditorStatus('Factory preset restored.');
            this.log(`Factory preset restored: ${type} ${midi}.`, 'ok');
        }

        exportPresetSet(type) {
            const isDrum = type === 'drum';
            const factoryPresets = isDrum ? GUS_DRUM_PRESETS : GUS_MELODIC_PRESETS;
            const instruments = isDrum ? this.lib.drums : this.lib.melodic;
            const presetSet = {
                gain: factoryPresets.gain,
                instruments: instruments.map(instrument => {
                    const midi = isDrum ? instrument.note : instrument.program;
                    return {
                        ...instrument,
                        preset: this.getInstrumentPreset(type, midi),
                    };
                }),
            };
            const filename = isDrum ? 'drum-presets.json' : 'melodic-presets.json';

            try {
                FileDownloader.download(
                    new Blob([JSON.stringify(presetSet, null, 2)], {type: 'application/json'}),
                    filename
                );
                this.log(`${isDrum ? 'Drum' : 'Melodic'} presets exported: ${filename}.`, 'ok');
            } catch (error) {
                this.log(`Preset export failed: ${error.message}`, 'err');
            }
        }

        async importPresetSet(type, event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            const isDrum = type === 'drum';
            const instrumentIdKey = isDrum ? 'note' : 'program';
            const button = this.$(isDrum ? 'btnImportDrumPresets' : 'btnImportMelodicPresets');
            button.disabled = true;

            try {
                const archive = JSON.parse(await file.text());
                if (!archive || typeof archive !== 'object' || Array.isArray(archive)
                    || !Array.isArray(archive.instruments)) {
                    throw new Error('The file must contain an instruments array.');
                }

                const imported = new Map();
                let skipped = 0;
                for (const entry of archive.instruments) {
                    const id = entry && Number(entry[instrumentIdKey]);
                    const instrument = isDrum ? this.lib.findDrum(id) : this.lib.melodic[id];
                    const preset = entry && entry.preset;
                    if (!Number.isInteger(id) || !instrument || !preset
                        || typeof preset !== 'object' || Array.isArray(preset)) {
                        skipped++;
                        continue;
                    }
                    imported.set(`${type}:${id}`, preset);
                }
                if (imported.size === 0) {
                    throw new Error(`No valid ${type} presets were found in this file.`);
                }

                const currentKey = this.currentType == null || this.currentMidi == null
                    ? null
                    : `${this.currentType}:${this.currentMidi}`;
                const activePreset = imported.get(currentKey);
                if (activePreset) this.buildMidiPatch(isDrum, Number(this.currentMidi), activePreset);

                this.generatorState.presets = {
                    ...this.generatorState.presets,
                    ...Object.fromEntries(imported),
                };
                if (activePreset) this.refreshGeneratorDuration(type, Number(this.currentMidi));
                await this.persistGeneratorState();

                if (activePreset) {
                    this.updatePresetEditor();
                    this.drawPreview();
                    await this.reloadMidiInstrumentIfUsed(type, Number(this.currentMidi));
                    await this.reloadRealtimeInstrumentIfUsed(type, Number(this.currentMidi));
                }

                const skippedMessage = skipped ? `; skipped ${skipped} invalid or unknown entries` : '';
                this.log(`Imported ${imported.size} ${type} presets into project "${this.projects.find(project => project.id === this.currentProjectId)?.name}"${skippedMessage}.`, 'ok');
            } catch (error) {
                this.log(`Preset import failed: ${error.message}`, 'err');
            } finally {
                event.target.value = '';
                button.disabled = false;
            }
        }

        presetWithWaveform(preset, waveform) {
            const result = {...preset};
            const usePresetWaveform = waveform === 'preset';
            const selectedWaveform = usePresetWaveform
                ? preset.defaultWaveform
                : waveform;
            if (selectedWaveform == null) return result;
            const waves = {
                sine: [1],
                square: [1, 0, .33, 0, .2, 0, .14, 0, .11, 0, .09],
                saw: [1, .5, .33, .25, .2, .16, .14, .12, .1, .09, .08, .07],
                triangle: [1, 0, -.11, 0, .04, 0, -.02, 0, .012],
            };
            const harmonics = usePresetWaveform
                ? ProjectPatchGenerator.waveformHarmonics(
                    selectedWaveform,
                    (preset.harm || [1]).length
                )
                : waves[selectedWaveform];
            if (!harmonics) throw new Error(`Unknown waveform: ${selectedWaveform}.`);
            result.harm = harmonics;
            delete result.fm;
            return result;
        }

        saveCurrentGeneratorState(persist = true) {
            if (this.currentType == null || this.currentMidi == null) return;
            const key = `${this.currentType}:${this.currentMidi}`;
            const currentState = this.generatorState.instruments[key];
            this.generatorState.instruments[key] = this.normalizeGeneratorState(this.currentType, this.currentMidi, {
                sampleRate: this.$('sr').value,
                root: this.$('root').value,
                duration: this.$('dur').value,
                durationCustomized: currentState && currentState.durationCustomized,
                wave: this.$('wave').value,
            });
            this.generatorState.selected = {type: this.currentType, midi: this.currentMidi};
            if (persist) this.persistGeneratorState();
        }

        handleGeneratorInput(event) {
            if (event && event.target.id === 'dur' && this.currentType != null && this.currentMidi != null) {
                const key = `${this.currentType}:${this.currentMidi}`;
                const state = this.generatorState.instruments[key] || {};
                state.durationCustomized = true;
                this.generatorState.instruments[key] = state;
            }
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

        async reloadMidiInstrumentIfUsed(type = this.currentType, midi = this.currentMidi) {
            const player = this.timidityPlayer;
            if (!player || !player.songPtr || type == null || midi == null) return;

            const patchFile = this.getMidiPatchFile(type, midi);
            const loadedFile = this.findLoadedMidiPatch(patchFile);
            if (!loadedFile) return;

            await this.reloadMidiPatch(type, midi, loadedFile);
        }

        async reloadRealtimeInstrumentIfUsed(type, midi) {
            const player = this.timidityPlayer;
            if (!player?.realtimeSongPtr || type == null || midi == null) return;
            const loadedFile = this.findLoadedMidiPatch(this.getMidiPatchFile(type, midi));
            if (!loadedFile) return;

            player.loadedPatches.delete(loadedFile);
            try {
                const loaded = await player.setRealtimeInstrument(type === 'drum' ? 9 : 0, midi, 0);
                if (!loaded) throw new Error('The instrument could not be loaded.');
            } catch (error) {
                const message = `Could not reload realtime instrument ${type} ${midi}: ${error.message}`;
                this.$('midiStatus').textContent = message;
                this.log(message, 'err');
            }
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
            this.generatorState = {selected: null, instruments: {}, presets: {}};
            this.currentType = null;
            this.currentMidi = null;
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
            bufferSizeRealtime: 1024,
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
            if (this.midiMode === 'sequencer') return;
            this.midiDuration = duration || player.totalDuration || 0;
            this.setMidiChannels(player.getTempoMap()?.channelsUsed || []);
            this.clearActiveMidiNotes();
            this.updateMidiPlaybackUI();
        });
        player.on('onMidiEvent', event => {
            if (event.eventType === player.ME_PROGRAM) {
                this.midiChannelPrograms.set(event.channel, event.a & 0x7f);
                this.renderMidiChannelList();
            }
        });
        player.on('onNoteOn', event => this.handleMidiNoteOn(event));
        player.on('onNoteOff', event => this.handleMidiNoteOff(event));
        player.on('onPlay', () => this.setLiveWaveformSource(player.waveformAnalyser));
        player.on('onResume', () => this.setLiveWaveformSource(player.waveformAnalyser));
        player.on('onPlaying', (_tick, seconds) => {
            if (this.midiMode === 'sequencer' || this.midiSeeking) return;
            this.midiPosition = seconds;
            this.updateMidiPlaybackUI();
        });
        player.on('onPause', () => {
            this.midiPosition = player.getTime() / 1000;
            this.updateMidiPlaybackUI();
            if (this.midiMode === 'sequencer' && this.sequencerPaused) {
                if (this.liveWaveformFrame) cancelAnimationFrame(this.liveWaveformFrame);
                this.liveWaveformFrame = null;
            } else {
                this.restoreLiveWaveformSource();
            }
        });
        player.on('onEnded', () => {
            if (this.sequencerPlaying && this.midiMode === 'sequencer') {
                this.clearActiveMidiNotes();
                this.restartMidiSequencer();
                return;
            }
            this.stopMidiPlayback();
            this.$('midiStatus').textContent = `Ready: ${this.midiFileName}`;
        });
        player.on('onStop', () => {
            this.clearActiveMidiNotes();
            this.restoreLiveWaveformSource();
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
            this.setupMidiWaveformMonitor(player);
            return player;
        }).catch(error => {
            this.timidityPlayer = null;
            this.timidityPlayerReady = null;
            throw error;
        });
        return this.timidityPlayerReady;
    }

    setupMidiWaveformMonitor(player) {
        if (player.waveformAnalyser) return player.waveformAnalyser;
        const analyser = player.audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.15;
        player.gainNode.disconnect();
        player.gainNode.connect(analyser);
        analyser.connect(player.audioContext.destination);
        player.waveformAnalyser = analyser;
        return analyser;
    }

    setLiveWaveformSource(analyser) {
        this.liveWaveformAnalyser = analyser || null;
        this.liveWaveformData = analyser
            ? new Uint8Array(this.liveWaveformMode === 'frequency'
                ? analyser.frequencyBinCount
                : analyser.fftSize)
            : null;
        if (this.liveWaveformFrame) cancelAnimationFrame(this.liveWaveformFrame);
        this.liveWaveformFrame = null;
        this.drawLiveWaveform();
    }

    toggleLiveWaveformMode() {
        this.liveWaveformMode = this.liveWaveformMode === 'amplitude' ? 'frequency' : 'amplitude';
        const label = this.liveWaveformMode === 'amplitude' ? 'Amplitude' : 'Frequency';
        const nextMode = this.liveWaveformMode === 'amplitude' ? 'frequency spectrum' : 'amplitude waveform';
        this.$('liveWaveModeLabel').textContent = label;
        this.$('liveWaveCanvas').setAttribute('aria-label', `Live output ${label.toLowerCase()} view. Activate to view ${nextMode}.`);
        if (this.liveWaveformAnalyser) {
            const length = this.liveWaveformMode === 'frequency'
                ? this.liveWaveformAnalyser.frequencyBinCount
                : this.liveWaveformAnalyser.fftSize;
            this.liveWaveformData = new Uint8Array(length);
        }
        this.drawLiveWaveform();
    }

    restoreLiveWaveformSource() {
        if (this.audio.source && this.audio.analyser) {
            this.setLiveWaveformSource(this.audio.analyser);
            return;
        }
        const player = this.timidityPlayer;
        if (player?.isPlaying && !player.isPaused && player.waveformAnalyser) {
            this.setLiveWaveformSource(player.waveformAnalyser);
            return;
        }
        this.setLiveWaveformSource(null);
    }

    drawLiveWaveform() {
        const canvas = this.$('liveWaveCanvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const pixelRatio = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.round(rect.width * pixelRatio));
        const height = Math.max(1, Math.round(rect.height * pixelRatio));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        const context = canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        if (this.liveWaveformMode === 'amplitude') {
            context.strokeStyle = '#30363d';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(0, rect.height / 2);
            context.lineTo(rect.width, rect.height / 2);
            context.stroke();
        }

        const analyser = this.liveWaveformAnalyser;
        if (analyser && this.liveWaveformData) {
            if (this.liveWaveformMode === 'amplitude') {
                analyser.getByteTimeDomainData(this.liveWaveformData);
                context.strokeStyle = '#58a6ff';
                context.lineWidth = 1.5;
                context.beginPath();
                for (let index = 0; index < this.liveWaveformData.length; index++) {
                    const x = index / (this.liveWaveformData.length - 1) * rect.width;
                    const y = this.liveWaveformData[index] / 255 * rect.height;
                    if (index === 0) context.moveTo(x, y);
                    else context.lineTo(x, y);
                }
                context.stroke();
            } else {
                analyser.getByteFrequencyData(this.liveWaveformData);
                context.fillStyle = '#58a6ff';
                const barWidth = rect.width / this.liveWaveformData.length;
                for (let index = 0; index < this.liveWaveformData.length; index++) {
                    const barHeight = this.liveWaveformData[index] / 255 * (rect.height - 2);
                    context.fillRect(
                        index * barWidth,
                        rect.height - barHeight,
                        Math.max(1, barWidth - 1),
                        barHeight
                    );
                }
            }
            this.liveWaveformFrame = requestAnimationFrame(() => this.drawLiveWaveform());
        } else {
            this.liveWaveformFrame = null;
        }
    }

    clearMidiInstrumentList() {
        this.midiInstrumentList.clear();
        this.midiChannelPrograms.clear();
        this.clearActiveMidiNotes();
        this.renderMidiInstrumentList();
    }

    setMidiChannels(channels) {
        this.midiChannelsUsed = [...new Set(channels)]
            .filter(channel => Number.isInteger(channel) && channel >= 0 && channel < 16)
            .sort((a, b) => a - b);
        for (const channel of this.midiChannelsUsed) {
            if (channel === 9) continue;
            const program = this.timidityPlayer?.getProgram(channel, 0);
            if (Number.isInteger(program) && program >= 0 && program < this.lib.melodic.length) {
                this.midiChannelPrograms.set(channel, program);
            }
        }
        const nextStates = new Map();
        for (const channel of this.midiChannelsUsed) {
            nextStates.set(channel, this.midiChannelStates.get(channel) || {mute: false, solo: false});
        }
        this.midiChannelStates = nextStates;
        this.renderMidiChannelList();
        this.applyMidiChannelMix();
    }

    renderMidiChannelList() {
        const mixer = this.$('midiChannelMixer');
        const list = this.$('midiChannelList');
        list.replaceChildren();
        mixer.hidden = this.midiChannelStates.size === 0;

        for (const channel of this.midiChannelsUsed) {
            const state = this.midiChannelStates.get(channel);
            const item = document.createElement('li');
            item.className = 'midi-channel-row';
            item.dataset.channel = String(channel);
            const name = document.createElement('span');
            name.className = 'midi-channel-name';
            const indicator = document.createElement('span');
            indicator.className = 'midi-channel-note-indicator';
            indicator.setAttribute('role', 'img');
            const channelLabel = document.createElement('span');
            channelLabel.className = 'midi-channel-label';
            const instrumentName = channel === 9
                ? 'Drums'
                : this.lib.melodic[this.midiChannelPrograms.get(channel) ?? 0]?.name;
            channelLabel.textContent = channel === 9
                ? 'Channel 9 (Drums)'
                : `Channel ${channel} (${instrumentName || 'Unknown instrument'})`;
            name.append(indicator, channelLabel);

            const controls = document.createElement('span');
            controls.className = 'midi-channel-controls';
            for (const [control, controlLabel] of [['mute', 'M'], ['solo', 'S']]) {
                const button = document.createElement('button');
                const pressed = state[control];
                button.type = 'button';
                button.className = 'channel-toggle';
                button.dataset.channel = String(channel);
                button.dataset.control = control;
                button.setAttribute('aria-pressed', String(pressed));
                button.setAttribute('aria-label', `${control === 'mute' ? 'Mute' : 'Solo'} ${channelLabel.textContent}`);
                button.title = `${control === 'mute' ? 'Mute' : 'Solo'} ${channelLabel.textContent}`;
                button.textContent = controlLabel;
                controls.append(button);
            }
            item.append(name, controls);
            list.appendChild(item);
            this.updateMidiChannelIndicator(channel);
        }
    }

    toggleMidiChannelControl(channel, control) {
        const state = this.midiChannelStates.get(channel);
        if (!state || !['mute', 'solo'].includes(control)) return;
        state[control] = !state[control];
        this.renderMidiChannelList();
        this.applyMidiChannelMix();
    }

    applyMidiChannelMix() {
        const player = this.timidityPlayer;
        if (!player || !player.songPtr) return;
        const hasSolo = [...this.midiChannelStates.values()].some(state => state.solo);
        for (const channel of this.midiChannelsUsed) {
            const state = this.midiChannelStates.get(channel);
            player.setChannelMute(channel, state.mute || (hasSolo && !state.solo));
        }
    }

    handleMidiNoteOn({channel, pitch}) {
        const type = channel === 9 ? 'drum' : 'melodic';
        const program = type === 'drum' ? pitch : (this.midiChannelPrograms.get(channel) ?? 0);
        const instrumentKey = `${type}:${program}`;
        const noteKey = `${channel}:${pitch}`;
        const owners = this.activeMidiNoteOwners.get(noteKey) || [];
        owners.push(instrumentKey);
        this.activeMidiNoteOwners.set(noteKey, owners);
        this.activeMidiChannelNotes.set(channel, (this.activeMidiChannelNotes.get(channel) || 0) + 1);
        this.updateMidiChannelIndicator(channel);

        let pitches = this.activeMidiInstrumentNotes.get(instrumentKey);
        if (!pitches) {
            pitches = new Map();
            this.activeMidiInstrumentNotes.set(instrumentKey, pitches);
        }
        pitches.set(pitch, (pitches.get(pitch) || 0) + 1);
        this.updateMidiInstrumentIndicator(instrumentKey);
    }

    handleMidiNoteOff({channel, pitch}) {
        const noteKey = `${channel}:${pitch}`;
        const owners = this.activeMidiNoteOwners.get(noteKey);
        if (!owners || owners.length === 0) return;

        const instrumentKey = owners.pop();
        if (owners.length === 0) this.activeMidiNoteOwners.delete(noteKey);
        const activeCount = this.activeMidiChannelNotes.get(channel) || 0;
        if (activeCount <= 1) this.activeMidiChannelNotes.delete(channel);
        else this.activeMidiChannelNotes.set(channel, activeCount - 1);
        this.updateMidiChannelIndicator(channel);

        const pitches = this.activeMidiInstrumentNotes.get(instrumentKey);
        const count = pitches && pitches.get(pitch);
        if (count === 1) pitches.delete(pitch);
        else if (count > 1) pitches.set(pitch, count - 1);
        if (pitches && pitches.size === 0) this.activeMidiInstrumentNotes.delete(instrumentKey);
        this.updateMidiInstrumentIndicator(instrumentKey);
    }

    clearActiveMidiNotes() {
        const instrumentKeys = new Set([
            ...this.activeMidiInstrumentNotes.keys(),
            ...this.midiInstrumentList.keys(),
        ]);
        this.activeMidiNoteOwners.clear();
        this.activeMidiChannelNotes.clear();
        this.activeMidiInstrumentNotes.clear();
        for (const channel of this.midiChannelsUsed) {
            this.updateMidiChannelIndicator(channel);
        }
        for (const instrumentKey of instrumentKeys) {
            this.updateMidiInstrumentIndicator(instrumentKey);
        }
    }

    updateMidiChannelIndicator(channel) {
        const item = this.$('midiChannelList').querySelector(
            `.midi-channel-row[data-channel="${channel}"]`
        );
        if (!item) return;

        const indicator = item.querySelector('.midi-channel-note-indicator');
        const isActive = (this.activeMidiChannelNotes.get(channel) || 0) > 0;
        indicator.classList.toggle('is-playing', isActive);
        indicator.setAttribute('aria-label', isActive
            ? `Active notes on channel ${channel}`
            : `No active notes on channel ${channel}`);
    }

    updateMidiInstrumentIndicator(instrumentKey) {
        const item = this.midiInstrumentElements.get(instrumentKey);
        if (!item) return;

        const pitches = this.activeMidiInstrumentNotes.get(instrumentKey);
        const activePitches = pitches ? [...pitches.keys()].sort((a, b) => a - b) : [];
        const button = item.querySelector('.midi-instrument-link');
        const indicator = item.querySelector('.midi-note-indicator');
        const isActive = activePitches.length > 0;
        button.classList.toggle('is-playing', isActive);
        button.title = isActive ? `Playing pitch: ${activePitches.join(', ')}` : '';
        indicator.setAttribute('aria-label', isActive
            ? `Active pitch ${activePitches.join(', ')}`
            : 'No active notes');
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
        this.midiInstrumentElements.clear();
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
                item.className = 'midi-instrument-item';
                item.dataset.instrumentKey = `${type}:${instrument.program}`;
                this.midiInstrumentElements.set(`${type}:${instrument.program}`, item);
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'midi-instrument-link';
                const indicator = document.createElement('span');
                indicator.className = 'midi-note-indicator';
                indicator.setAttribute('aria-label', 'No active notes');
                const name = document.createElement('span');
                name.className = 'midi-instrument-name';
                name.textContent = type === 'drum'
                    ? `Drum ${instrument.program} - ${instrument.name}`
                    : `${String(instrument.program).padStart(3, '0')} - ${instrument.name}`;
                button.append(indicator, name);
                button.addEventListener('click', () => {
                    this.selectInstrument(type, instrument.program);
                    const selector = `.inst[data-type="${type}"][data-midi="${instrument.program}"]`;
                    document.querySelector(selector)?.scrollIntoView({block: 'nearest'});
                });
                item.appendChild(button);
                list.appendChild(item);
                this.updateMidiInstrumentIndicator(`${type}:${instrument.program}`);
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

    buildMidiPatch(isDrum, program, presetOverride = this.getInstrumentPreset(isDrum ? 'drum' : 'melodic', program)) {
        const state = this.getInstrumentGeneratorState(isDrum ? 'drum' : 'melodic', program);
        const sampleRate = state.sampleRate;
        const lowFreq = Math.round(8.1757989156 * 1000);
        const highFreq = Math.round(12543.853951 * 1000);

        if (isDrum) {
            const drum = this.lib.findDrum(program);
            if (!drum) throw new Error(`Unknown drum note ${program}.`);
            const {note, name} = drum;
            const basePreset = presetOverride;
            const presetDuration = Number(basePreset && basePreset.duration);
            const duration = state.durationCustomized || !Number.isFinite(presetDuration) || presetDuration <= 0
                ? state.duration
                : Math.min(3, Math.max(0.05, presetDuration));
            const preset = {...basePreset, duration};
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
        const {name} = instrument;
        const basePreset = presetOverride;
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
        this.midiChannelsUsed = [];
        this.midiChannelStates.clear();
        this.renderMidiChannelList();
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
            player.setVolume(this.getMidiVolume());
            this.updateMidiPlaybackUI();
            status.textContent = `Ready: ${file.name}`;
        } catch (error) {
            this.clearMidiInstrumentList();
            this.midiChannelsUsed = [];
            this.midiChannelStates.clear();
            this.renderMidiChannelList();
            status.textContent = `MIDI load failed: ${error.message}`;
            this.log(`MIDI load failed: ${error.message}`, 'err');
            this.updateMidiPlaybackUI();
        } finally {
            event.target.value = '';
        }
    }

    async setMidiMode(mode) {
        if (!['file', 'sequencer', 'controller'].includes(mode) || mode === this.midiMode) return;
        if (this.midiMode === 'controller') this.disconnectMidiControllerInput();
        if (mode !== 'file'
            && this.timidityPlayer?.songPtr
            && (this.timidityPlayer.isPlaying || this.timidityPlayer.isPaused)) {
            this.stopMidiPlayback();
        }
        if (mode !== 'sequencer' && this.sequencerPlaying) this.stopMidiSequencer();

        this.midiMode = mode;
        const isFileMode = mode === 'file';
        const isSequencerMode = mode === 'sequencer';
        const modes = [
            ['file', 'btnMidiFileMode', 'midiFileMode'],
            ['sequencer', 'btnMidiSequencerMode', 'midiSequencerMode'],
            ['controller', 'btnMidiControllerMode', 'midiControllerMode'],
        ];
        for (const [modeName, buttonId, panelId] of modes) {
            const active = mode === modeName;
            this.$(panelId).hidden = !active;
            this.$(buttonId).classList.toggle('active', active);
            this.$(buttonId).setAttribute('aria-selected', String(active));
        }
        this.$('midiStatus').textContent = isFileMode
            ? (this.midiData ? `Ready: ${this.midiFileName}` : 'Select a MIDI file to play with the generated GM bank.')
            : isSequencerMode
                ? 'Select an instrument, then start the sequencer.'
                : this.midiControllerInput
                    ? `MIDI controller connected: ${this.midiControllerInput.name || 'Input'}`
                    : 'Connect a MIDI controller to play instruments in real time.';
        this.updateMidiPlaybackUI();
    }

    async toggleMidiControllerConnection() {
        if (this.midiControllerInput) {
            this.disconnectMidiControllerInput();
            return;
        }

        if (!navigator.requestMIDIAccess) {
            this.$('midiStatus').textContent = 'Web MIDI is not supported in this browser.';
            return;
        }

        try {
            this.$('midiStatus').textContent = 'Requesting MIDI access...';
            this.midiControllerAccess = this.midiControllerAccess
                || await navigator.requestMIDIAccess();
            this.midiControllerAccess.onstatechange = () => this.refreshMidiControllerInputs();
            this.refreshMidiControllerInputs();
            const inputSelect = this.$('midiControllerInput');
            if (!inputSelect.value && inputSelect.options.length > 1) {
                inputSelect.value = inputSelect.options[1].value;
            }
            if (!inputSelect.value) {
                this.$('midiStatus').textContent = 'No MIDI input devices found. Connect a controller, then try again.';
                return;
            }
            await this.connectMidiControllerInput();
        } catch (error) {
            this.$('midiStatus').textContent = `MIDI controller connection failed: ${error.message}`;
            this.log(`MIDI controller connection failed: ${error.message}`, 'err');
        }
    }

    refreshMidiControllerInputs() {
        const select = this.$('midiControllerInput');
        const selectedId = this.midiControllerInput?.id || select.value;
        const inputs = this.midiControllerAccess
            ? Array.from(this.midiControllerAccess.inputs.values())
            : [];
        select.replaceChildren();
        if (!inputs.length) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = this.midiControllerAccess
                ? 'No MIDI input devices found'
                : 'Enable MIDI access to list devices';
            select.appendChild(option);
            select.disabled = true;
            if (this.midiControllerInput) {
                this.disconnectMidiControllerInput();
                if (this.midiMode === 'controller') {
                    this.$('midiStatus').textContent = 'MIDI controller disconnected.';
                }
            }
            return;
        }

        for (const input of inputs) {
            const option = document.createElement('option');
            option.value = input.id;
            option.textContent = input.name || `MIDI Input ${input.id}`;
            option.selected = input.id === selectedId;
            select.appendChild(option);
        }
        select.disabled = false;
        if (selectedId && !inputs.some(input => input.id === selectedId)) {
            select.value = inputs[0].id;
        }
        if (this.midiControllerInput
            && !inputs.some(input => input.id === this.midiControllerInput.id)) {
            this.disconnectMidiControllerInput();
            if (this.midiMode === 'controller') {
                this.$('midiStatus').textContent = 'MIDI controller disconnected. Select an available input and connect again.';
            }
        }
    }

    async connectMidiControllerInput() {
        const input = this.midiControllerAccess?.inputs.get(this.$('midiControllerInput').value);
        if (!input) throw new Error('Select an available MIDI input device.');
        if (this.midiControllerInput?.id === input.id) return;
        this.disconnectMidiControllerInput();
        const player = await this.ensureTimidityPlayer();
        if (this.midiMode !== 'controller') return;

        const initialProgram = this.currentType === 'melodic' ? Number(this.currentMidi) : 0;
        this.midiControllerPrograms.fill(initialProgram);
        this.midiControllerBanks.fill(0);
        input.onmidimessage = event => this.handleMidiControllerMessage(event);
        this.midiControllerInput = input;
        this.$('btnMidiControllerConnect').textContent = 'Disconnect';
        this.$('midiStatus').textContent = `MIDI controller connected: ${input.name || 'Input'}.`;
        this.setLiveWaveformSource(player.waveformAnalyser);
    }

    disconnectMidiControllerInput() {
        if (this.midiControllerInput) this.midiControllerInput.onmidimessage = null;
        this.midiControllerInput = null;
        this.midiControllerActiveNotes.clear();
        this.midiControllerPendingNotes.clear();
        this.timidityPlayer?.panic();
        const button = this.$('btnMidiControllerConnect');
        if (button) button.textContent = 'Connect';
        this.restoreLiveWaveformSource();
    }

    syncMidiControllerProgramWithSelection() {
        if (this.midiMode !== 'controller' || !this.midiControllerInput
            || this.currentType !== 'melodic' || this.currentMidi == null) return;

        const program = Number(this.currentMidi);
        this.midiControllerPrograms.fill(program);
        for (let channel = 0; channel < this.midiControllerPrograms.length; channel++) {
            if (channel !== 9) this.timidityPlayer.sendEvent(this.timidityPlayer.ME_PROGRAM, channel, program);
        }
        this.log(`MIDI Controller instrument selection updated: program ${program} (${this.lib.melodic[program].name}) on melodic channels.`);
    }

    handleMidiControllerMessage(event) {
        if (this.midiMode !== 'controller' || !this.timidityPlayer) return;
        const data = event.data;
        if (!data || data.length < 2) return;
        const command = data[0] & 0xf0;
        const channel = data[0] & 0x0f;
        const a = data[1] & 0x7f;
        const b = (data[2] || 0) & 0x7f;
        const player = this.timidityPlayer;
        const eventTime = Number.isFinite(event.timeStamp) ? `${event.timeStamp.toFixed(1)}ms` : 'time unknown';

        if (command === 0x90 && b > 0) {
            const key = `${channel}:${a}`;
            if (this.midiControllerActiveNotes.has(key)) {
                this.log(`MIDI Controller ${eventTime}: repeated Note On ignored (channel ${channel + 1}, note ${a}, velocity ${b}).`);
                return;
            }
            this.midiControllerActiveNotes.add(key);
            if (this.midiControllerPendingNotes.has(key)) {
                this.log(`MIDI Controller ${eventTime}: Note On queued behind pending load (channel ${channel + 1}, note ${a}, velocity ${b}).`);
                return;
            }
            this.midiControllerPendingNotes.add(key);
            const program = this.midiControllerPrograms[channel];
            const bank = this.midiControllerBanks[channel];
            this.log(`MIDI Controller ${eventTime}: calling TimidityPlayer.noteOn(channel ${channel + 1}, program ${program}, note ${a}, velocity ${b}, bank ${bank}).`);
            Promise.resolve(player.noteOn(channel, program, a, b, {bank})).then(() => {
                this.midiControllerPendingNotes.delete(key);
                if (!this.midiControllerActiveNotes.has(key)) {
                    this.log(`MIDI Controller ${eventTime}: calling TimidityPlayer.noteOff(channel ${channel + 1}, note ${a}) after pending Note On completed.`);
                    player.noteOff(channel, a);
                } else {
                    this.log(`MIDI Controller ${eventTime}: TimidityPlayer.noteOn completed; note ${a} remains held.`);
                }
            }).catch(error => {
                this.midiControllerPendingNotes.delete(key);
                this.midiControllerActiveNotes.delete(key);
                this.$('midiStatus').textContent = `MIDI note failed: ${error.message}`;
                this.log(`MIDI Controller ${eventTime}: TimidityPlayer.noteOn failed for channel ${channel + 1}, note ${a}: ${error.message}`, 'err');
                this.log(`MIDI controller note failed: ${error.message}`, 'err');
            });
        } else if (command === 0x80 || (command === 0x90 && b === 0)) {
            const key = `${channel}:${a}`;
            if (!this.midiControllerActiveNotes.delete(key)) {
                this.log(`MIDI Controller ${eventTime}: unmatched Note Off ignored (channel ${channel + 1}, note ${a}).`);
                return;
            }
            if (!this.midiControllerPendingNotes.has(key)) {
                this.log(`MIDI Controller ${eventTime}: calling TimidityPlayer.noteOff(channel ${channel + 1}, note ${a}).`);
                player.noteOff(channel, a);
            } else {
                this.log(`MIDI Controller ${eventTime}: Note Off received while Note On is pending; release will follow load (channel ${channel + 1}, note ${a}).`);
            }
        } else if (command === 0xc0) {
            this.midiControllerPrograms[channel] = a;
            player.sendEvent(player.ME_PROGRAM, channel, a);
        } else if (command === 0xe0) {
            player.sendEvent(player.ME_PITCHWHEEL, channel, a, b);
        } else if (command === 0xb0) {
            if (a === 0) {
                this.midiControllerBanks[channel] = b;
            } else if (a === 7) {
                player.sendEvent(player.ME_MAINVOLUME, channel, b);
            } else if (a === 10) {
                player.sendEvent(player.ME_PAN, channel, b);
            } else if (a === 11) {
                player.sendEvent(player.ME_EXPRESSION, channel, b);
            } else if (a === 64) {
                player.sendEvent(player.ME_SUSTAIN, channel, b);
            } else if (a === 120 || a === 123) {
                const eventType = a === 120 ? player.ME_ALL_SOUNDS_OFF : player.ME_ALL_NOTES_OFF;
                player.sendEvent(eventType, channel, 0);
                for (const key of this.midiControllerActiveNotes) {
                    if (key.startsWith(`${channel}:`)) this.midiControllerActiveNotes.delete(key);
                }
            } else {
                player.sendEvent(player.ME_CONTROL_CHANGE, channel, a, b);
            }
        }
    }

    getMidiVolume() {
        return Math.max(0, Math.min(100, Number(this.$('midiVolume').value) || 0));
    }

    handleMidiVolumeInput() {
        const volume = this.getMidiVolume();
        this.$('midiVolumeValue').value = `${volume}%`;
        if (this.timidityPlayer?.songPtr) this.timidityPlayer.setVolume(volume);
    }

    validateSequencerTempo() {
        const tempoInput = this.$('sequencerTempo');
        const tempo = Number(tempoInput.value);
        const valid = Number.isFinite(tempo) && tempo >= 40 && tempo <= 240;
        tempoInput.setCustomValidity(valid ? '' : 'Tempo must be between 40 and 240 BPM.');
        tempoInput.disabled = this.sequencerPlaying;
        this.$('btnSequencerPlay').disabled = !valid || this.sequencerPlaying;
        return valid;
    }

    updateSequencerControls() {
        this.$('btnSequencerPause').disabled = !this.sequencerPlaying;
        this.$('btnSequencerPause').querySelector('span').textContent =
            this.sequencerPaused ? 'Resume' : 'Pause';
        this.$('btnSequencerStop').disabled = !this.sequencerPlaying;
        this.validateSequencerTempo();
    }

    async startMidiSequencer() {
        if (this.sequencerPlaying || !this.validateSequencerTempo()) return;
        if (this.currentType == null || this.currentMidi == null) {
            this.$('midiStatus').textContent = 'Select an instrument before starting the sequencer.';
            return;
        }

        try {
            const player = await this.ensureTimidityPlayer();
            if (this.midiMode !== 'sequencer') return;
            this.sequencerPlaying = true;
            this.sequencerPaused = false;
            this.sequencerMidiData = this.buildSequencerMidiData();
            const generation = ++this.sequencerGeneration;
            this.validateSequencerTempo();
            this.$('btnSequencerStop').disabled = false;
            this.$('btnSequencerPause').disabled = true;
            this.$('midiStatus').textContent = `Sequencer playing: ${this.currentType} ${this.currentMidi}.`;
            await this.queueSequencerLoad(generation);
        } catch (error) {
            this.stopMidiSequencer();
            this.$('midiStatus').textContent = `Sequencer failed: ${error.message}`;
            this.log(`Sequencer failed: ${error.message}`, 'err');
        }
    }

    async toggleSequencerPause() {
        const player = this.timidityPlayer;
        if (!this.sequencerPlaying || !player?.songPtr) return;

        const resuming = this.sequencerPaused;
        try {
            if (resuming) {
                await player.resume();
                this.sequencerPaused = false;
                this.$('midiStatus').textContent = `Sequencer playing: ${this.currentType} ${this.currentMidi}.`;
            } else {
                this.sequencerPaused = true;
                player.pause();
                this.$('midiStatus').textContent = `Sequencer paused: ${this.currentType} ${this.currentMidi}.`;
            }
            this.updateSequencerControls();
        } catch (error) {
            if (resuming) this.sequencerPaused = true;
            this.updateSequencerControls();
            this.$('midiStatus').textContent = `Sequencer ${resuming ? 'resume' : 'pause'} failed: ${error.message}`;
            this.log(`Sequencer ${resuming ? 'resume' : 'pause'} failed: ${error.message}`, 'err');
        }
    }

    buildSequencerMidiData() {
        const isDrum = this.currentType === 'drum';
        const channel = isDrum ? 9 : 0;
        const program = isDrum ? 0 : Number(this.currentMidi);
        const pitches = isDrum ? [Number(this.currentMidi)] : [60, 62, 64, 65];
        const tempo = Number(this.$('sequencerTempo').value);
        const velocity = Math.max(1, Math.min(127, Number(this.$('sequencerVelocity').value) || 100));
        const ticksPerBeat = 480;
        const microsecondsPerBeat = Math.round(60000000 / tempo);
        const track = [];
        const writeDelta = delta => {
            const bytes = [delta & 0x7f];
            for (let value = delta >> 7; value > 0; value >>= 7) {
                bytes.unshift((value & 0x7f) | 0x80);
            }
            track.push(...bytes);
        };

        writeDelta(0);
        track.push(0xff, 0x51, 0x03,
            (microsecondsPerBeat >> 16) & 0xff,
            (microsecondsPerBeat >> 8) & 0xff,
            microsecondsPerBeat & 0xff);
        writeDelta(0);
        track.push(0xc0 | channel, program & 0x7f);

        for (let index = 0; index < pitches.length * 128; index++) {
            const pitch = pitches[index % pitches.length];
            writeDelta(0);
            track.push(0x90 | channel, pitch & 0x7f, velocity);
            writeDelta(ticksPerBeat);
            track.push(0x80 | channel, pitch & 0x7f, 0x40);
        }

        writeDelta(0);
        track.push(0xff, 0x2f, 0x00);
        const trackLength = track.length;
        const header = [
            0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06,
            0x00, 0x00, 0x00, 0x01, (ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff,
            0x4d, 0x54, 0x72, 0x6b,
            (trackLength >>> 24) & 0xff, (trackLength >>> 16) & 0xff,
            (trackLength >>> 8) & 0xff, trackLength & 0xff,
        ];
        return new Uint8Array([...header, ...track]);
    }

    async restartMidiSequencer() {
        if (!this.sequencerPlaying || !this.sequencerMidiData) return;
        return this.queueSequencerLoad(this.sequencerGeneration);
    }

    scheduleSequencerPatternUpdate() {
        clearTimeout(this.sequencerUpdateTimer);
        this.sequencerUpdateTimer = setTimeout(() => {
            this.sequencerUpdateTimer = null;
            this.refreshSequencerPattern();
        }, 120);
    }

    refreshSequencerPattern(instrumentChanged = false) {
        if (!this.sequencerPlaying || this.midiMode !== 'sequencer') return;
        if (instrumentChanged) this.timidityPlayer?.panic();
        this.sequencerMidiData = this.buildSequencerMidiData();
        return this.queueSequencerLoad(++this.sequencerGeneration, true, instrumentChanged);
    }

    queueSequencerLoad(generation, preservePlayback = false, applyInstrument = false) {
        this.sequencerLoadPromise = this.sequencerLoadPromise.catch(() => {}).then(async () => {
            if (!this.sequencerPlaying || this.midiMode !== 'sequencer'
                || generation !== this.sequencerGeneration) return;

            const player = this.timidityPlayer;
            const pattern = this.sequencerMidiData;
            let updatedInPlace = false;
            if (preservePlayback && player.songPtr && player.isPlaying && !player.isPaused) {
                updatedInPlace = await player.updateMidiData(pattern);
            }
            if (!updatedInPlace) {
                if (player.songPtr) player.stop();
                const loaded = await player.load(pattern);
                if (!loaded) throw new Error('Could not load the sequencer pattern.');
            }

            if (!this.sequencerPlaying || this.midiMode !== 'sequencer'
                || generation !== this.sequencerGeneration) {
                if (!updatedInPlace && player.songPtr) player.stop();
                return;
            }
            if (applyInstrument && this.currentType === 'melodic') {
                player.sendEvent(player.ME_PROGRAM, 0, Number(this.currentMidi));
            }
            if (!updatedInPlace) player.play(0);
            this.$('midiStatus').textContent = `Sequencer playing: ${this.currentType} ${this.currentMidi}.`;
            this.updateSequencerControls();
        }).catch(error => {
            if (generation !== this.sequencerGeneration) return;
            this.stopMidiSequencer();
            this.$('midiStatus').textContent = `Sequencer failed: ${error.message}`;
            this.log(`Sequencer failed: ${error.message}`, 'err');
        });
        return this.sequencerLoadPromise;
    }

    stopMidiSequencer() {
        this.sequencerPlaying = false;
        this.sequencerPaused = false;
        this.sequencerGeneration++;
        clearTimeout(this.sequencerUpdateTimer);
        this.sequencerUpdateTimer = null;
        this.sequencerMidiData = null;
        if (this.timidityPlayer?.songPtr) this.timidityPlayer.stop();
        this.updateSequencerControls();
        if (this.midiMode === 'sequencer') this.$('midiStatus').textContent = 'Sequencer stopped.';
    }

    async toggleMidiPlayback() {
        if (this.midiMode !== 'file' || !this.midiData) return;
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
            player.play(this.midiPosition, {volume: this.getMidiVolume()});
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
        if (this.midiMode !== 'file' || !this.midiData || this.midiRenderInProgress) return;
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
        playButton.disabled = this.midiMode !== 'file' || !this.midiData;
        this.$('midiPlayIcon').hidden = isPlaying;
        this.$('midiPauseIcon').hidden = !isPlaying;
        this.$('midiPlayLabel').textContent = isPlaying ? 'Pause' : 'Play';
        this.$('btnMidiStop').disabled = this.midiMode !== 'file' || !this.midiData;
        this.$('btnMidiRender').disabled = this.midiMode !== 'file' || !this.midiData || this.midiRenderInProgress;
        seek.disabled = this.midiMode !== 'file' || !this.midiData || !this.midiDuration;

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
            if (e.key === 'Escape') {
                this.dialogOpenOrder = this.dialogOpenOrder.filter(dialog => dialog.open);
                const topDialog = this.dialogOpenOrder[this.dialogOpenOrder.length - 1];
                if (topDialog) {
                    e.preventDefault();
                    topDialog.querySelector('.dialog-close')?.click();
                    return;
                }
            }

            if (e.key === 'F2') {
                e.preventDefault();
                const search = this.$('instrumentSearch');
                search.focus();
                search.select();
                return;
            }

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
        const selectionChanged = type !== this.currentType || Number(midi) !== Number(this.currentMidi);
        this.saveCurrentGeneratorState();
        this.setActiveInstrumentList(type);
        this.currentType = type;
        this.currentMidi = midi;
        if (selectionChanged) this.syncMidiControllerProgramWithSelection();
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
        this.updatePresetEditor();
        this.drawPreview();
        if (selectionChanged && this.sequencerPlaying && this.midiMode === 'sequencer') {
            this.refreshSequencerPattern(true);
        }
    }

    // ---- Render → PCM ----
    getCurrentPCM() {
        const settings = this.getInstrumentGeneratorState(this.currentType, this.currentMidi);
        const SR = settings.sampleRate;
        const freq = settings.root;
        const dur = settings.duration;

        if (this.currentType === 'drum') {
            const basePreset = this.getInstrumentPreset('drum', this.currentMidi);
            const p = {...basePreset, duration: dur};
            return this.applyOutputGain(
                new DrumRenderer(p, SR).render(),
                p,
                this.lib.drumMasterGain
            );
        }

        const basePreset = this.getInstrumentPreset('melodic', this.currentMidi);
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
        const rect = c.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.round(rect.width * pixelRatio));
        const height = Math.max(1, Math.round(rect.height * pixelRatio));
        if (c.width !== width || c.height !== height) {
            c.width = width;
            c.height = height;
        }
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
        if (this.currentType === 'drum') {
            const drum = this.lib.findDrum(this.currentMidi);
            if (!drum) throw new Error(`Unknown drum note ${this.currentMidi}.`);
            return {
                buf: this.buildMidiPatch(true, this.currentMidi),
                fname: `drum_${String(drum.note).padStart(2, '0')}_${this.slugify(drum.name)}.pat`,
            };
        }

        const instrument = this.lib.melodic[this.currentMidi];
        if (!instrument) throw new Error(`Unknown melodic program ${this.currentMidi}.`);
        return {
            buf: this.buildMidiPatch(false, this.currentMidi),
            fname: `${String(this.currentMidi).padStart(3, '0')}_${this.slugify(instrument.name)}.pat`,
        };
    }

    downloadCurrent() {
        const { buf, fname } = this.buildPatchForCurrent();
        FileDownloader.downloadBytes(buf, fname);
        this.log(`✓ ${fname} — ${buf.byteLength.toLocaleString()} bytes`, 'ok');
    }

    async downloadSoundFont() {
        this.saveCurrentGeneratorState();
        const button = this.$('btnSoundFont');
        const progress = this.$('progressWrap');
        const progressBar = this.$('progressBar');
        const samples = [];
        const instruments = [];
        const presets = [];
        const drumZones = [];
        const total = 128 + this.lib.drums.length;
        button.disabled = true;
        progress.classList.add('show');
        progressBar.style.width = '0%';

        try {
            this.log('Rendering melodic SoundFont samples...', 'info');
            for (let program = 0; program < this.lib.melodic.length; program++) {
                const instrument = this.lib.melodic[program];
                const settings = this.getInstrumentGeneratorState('melodic', program);
                const basePreset = this.getInstrumentPreset('melodic', program);
                const preset = this.presetWithWaveform(basePreset, settings.wave);
                const rendered = new MelodicRenderer(preset, {
                    sampleRate: settings.sampleRate,
                    freq: settings.root,
                    duration: settings.duration,
                }).render();
                const gained = this.applyOutputGain(rendered, preset, this.lib.melodicMasterGain);
                const frequency = rendered.naturalFreq || settings.root;
                const rootKey = Math.max(0, Math.min(127,
                    Math.round(69 + 12 * Math.log2(frequency / 440))));
                const sampleIndex = samples.length;
                samples.push({
                    name: instrument.name,
                    pcm: SoundFontExporter.toInt16(gained.pcm),
                    sampleRate: settings.sampleRate,
                    rootKey,
                    loop: rendered.loop,
                    loopStart: rendered.loopStart,
                    loopEnd: rendered.loopEnd,
                });
                instruments.push({name: instrument.name, sampleIndex, rootKey, loop: rendered.loop});
                presets.push({
                    name: instrument.name,
                    program,
                    bank: 0,
                    zones: [{instrumentIndex: instruments.length - 1}],
                });
                progressBar.style.width = `${Math.round((program + 1) / total * 100)}%`;
                if (program % 8 === 7) await new Promise(resolve => setTimeout(resolve, 0));
            }

            this.log(`Rendering ${this.lib.drums.length} drum SoundFont samples...`, 'info');
            for (let index = 0; index < this.lib.drums.length; index++) {
                const drum = this.lib.drums[index];
                const settings = this.getInstrumentGeneratorState('drum', drum.note);
                const preset = {...this.getInstrumentPreset('drum', drum.note), duration: settings.duration};
                const rendered = new DrumRenderer(preset, settings.sampleRate).render();
                const gained = this.applyOutputGain(rendered, preset, this.lib.drumMasterGain);
                const sampleIndex = samples.length;
                samples.push({
                    name: drum.name,
                    pcm: SoundFontExporter.toInt16(gained.pcm),
                    sampleRate: settings.sampleRate,
                    rootKey: drum.note,
                    loop: false,
                    loopStart: 0,
                    loopEnd: 0,
                });
                const instrumentIndex = instruments.length;
                instruments.push({name: drum.name, sampleIndex, rootKey: drum.note, loop: false});
                drumZones.push({instrumentIndex, keyRange: [drum.note, drum.note]});
                progressBar.style.width = `${Math.round((128 + index + 1) / total * 100)}%`;
                if (index % 8 === 7) await new Promise(resolve => setTimeout(resolve, 0));
            }

            presets.push({name: 'GM Drums', program: 0, bank: 128, zones: drumZones});
            const projectName = this.projects.find(project => project.id === this.currentProjectId)?.name || 'GUS Project';
            const soundFont = SoundFontExporter.encode({name: projectName, samples, instruments, presets});
            const filename = `${this.getProjectZipFilename().replace(/\.zip$/i, '')}.sf2`;
            FileDownloader.download(new Blob([soundFont], {type: 'application/octet-stream'}), filename);
            this.log(`SoundFont exported: ${filename} (${(soundFont.byteLength / 1024 / 1024).toFixed(1)} MB).`, 'ok');
        } catch (error) {
            this.log(`SoundFont export failed: ${error.message}`, 'err');
        } finally {
            progress.classList.remove('show');
            progressBar.style.width = '0%';
            button.disabled = false;
        }
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
            const {name} = this.lib.melodic[i];
            const settings = this.getInstrumentGeneratorState('melodic', i);
            sampleRates.add(settings.sampleRate);
            const buf = this.buildMidiPatch(false, i);
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
            const {note, name} = this.lib.drums[i];
            const settings = this.getInstrumentGeneratorState('drum', note);
            sampleRates.add(settings.sampleRate);
            const buf = this.buildMidiPatch(true, note);
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
        const filename = this.getProjectZipFilename();
        FileDownloader.download(blob, filename);
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
            '  - Melodic: each preset defines whether its sample uses sustain looping.',
            '    Loops are used for sustained instruments (organs, synth bass, bowed',
            '    strings, ensembles, brass, reeds, pipes, leads, pads, bagpipe, fiddle,',
            '    shanai, guitar harmonics, and overdriven/distortion guitars).',
            '    Other struck, plucked, and one-shot presets use non-looped samples.',
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
