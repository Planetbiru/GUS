
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
        this.currentType = 'melodic';
        this.currentMidi = 0;
        this.logEl = null;
    }

    $(id) { return document.getElementById(id); }

    // ---- Utility ----
    slugify(s) { return s.replace(/[^A-Za-z0-9]/g, '_'); }

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
        this.log('Aplikasi siap. Pilih instrumen di kiri.', 'ok');
        this.log('Shortcut: ↑/↓ navigasi, Spasi = preview', 'info');
        this.selectInstrument('melodic', 0);
    }

    buildSidebar() {
        const listEl = this.$('instrumentList');
        let lastFamily = '';

        // Melodic 128
        this.lib.melodic.forEach(([family, name], i) => {
            if (family !== lastFamily) {
                const h = document.createElement('div');
                h.className = 'family';
                h.textContent = family;
                listEl.appendChild(h);
                lastFamily = family;
            }
            listEl.appendChild(this._makeItem({
                type: 'melodic', midi: i, name, num: String(i).padStart(3, '0')
            }));
        });

        // Section Drum
        {
            const h = document.createElement('div');
            h.className = 'family';
            h.textContent = 'Drum Kit (GM Ch.10)';
            h.style.color = 'var(--warn)';
            listEl.appendChild(h);
        }

        this.lib.drums.forEach(([note, name]) => {
            listEl.appendChild(this._makeItem({
                type: 'drum', midi: note, name, num: note
            }));
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
        this.$('btnPreview').onclick = () => this.playPreview();
        this.$('btnPlayNote').onclick = () => this.playPreview();
        this.$('btnPlayScale').onclick = () => this.playScale();
        this.$('btnStop').onclick = () => this.audio.stop();
        this.$('btnDownload').onclick = () => this.downloadCurrent();
        this.$('btnZip').onclick = () => this.downloadAllZip();

        ['sr', 'root', 'dur', 'wave'].forEach(id => {
            this.$(id).addEventListener('input', () => this.drawPreview());
        });
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
                const all = document.querySelectorAll('.inst');
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
        this.currentType = type;
        this.currentMidi = midi;

        document.querySelectorAll('.inst').forEach(el => {
            el.classList.toggle('active',
                el.dataset.type === type && +el.dataset.midi === midi);
        });

        if (type === 'melodic') {
            const [family, name, p] = this.lib.melodic[midi];
            this.$('title').textContent = `${String(midi).padStart(3, '0')} — ${name}`;
            this.$('familyLabel').textContent = `Family: ${family}`;
            this.$('root').value = p.freq || 441;
            this.$('wave').disabled = false;
        } else {
            const [note, name] = this.lib.findDrum(midi);
            this.$('title').textContent = `Drum ${note} — ${name}`;
            this.$('familyLabel').textContent = 'Family: Drum Kit (GM Channel 10)';
            this.$('root').value = this.lib.drumToFreq(note);
            this.$('wave').disabled = true;
        }
        this.drawPreview();
    }

    // ---- Render → PCM ----
    getCurrentPCM() {
        const SR = +this.$('sr').value;
        const freq = +this.$('root').value;
        const dur = +this.$('dur').value;

        if (this.currentType === 'drum') {
            const [, , p] = this.lib.findDrum(this.currentMidi);
            return new DrumRenderer(p, SR).render();
        }

        const [, , basePreset] = this.lib.melodic[this.currentMidi];
        const p2 = { ...basePreset };
        const waveOverride = this.$('wave').value;
        if (waveOverride !== 'preset') {
            const waves = {
                sine: [1],
                square: [1, 0, .33, 0, .2, 0, .14, 0, .11, 0, .09],
                saw: [1, .5, .33, .25, .2, .16, .14, .12, .1, .09, .08, .07],
                triangle: [1, 0, -.11, 0, .04, 0, -.02, 0, .012],
            };
            p2.harm = waves[waveOverride];
            delete p2.fm;
        }
        return new MelodicRenderer(p2, { sampleRate: SR, freq, duration: dur }).render();
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
            : this.lib.melodic[this.currentMidi][1];
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
        const SR = +this.$('sr').value;

        if (this.currentType === 'drum') {
            const [note, name, p] = this.lib.findDrum(this.currentMidi);
            const r = new DrumRenderer(p, SR).render();
            const rootFreq = this.lib.drumToFreq(note);
            const buf = GusPatchEncoder.encode({
                name: this.slugify(name).slice(0, 15) || `drum${note}`,
                pcm: r.pcm,
                loopStart: 0, loopEnd: 0, isLoop: false,
                rootFreq, sampleRate: SR,
            });
            return {
                buf, r,
                fname: `drum_${String(note).padStart(2, '0')}_${this.slugify(name)}.pat`,
            };
        }

        const [, name, basePreset] = this.lib.melodic[this.currentMidi];
        const freq = +this.$('root').value || basePreset.freq || 441;
        const dur = +this.$('dur').value;
        // ...render melodic...
        const r = new MelodicRenderer(basePreset, { sampleRate: SR, freq, duration: dur }).render();
        const buf = GusPatchEncoder.encode({
            name: this.slugify(name).slice(0, 15) || `gm${this.currentMidi}`,
            pcm: r.pcm,
            loopStart: r.loopStart, loopEnd: r.loopEnd, isLoop: r.loop,
            rootFreq: r.naturalFreq,    // ← BUKAN freq
            sampleRate: SR,
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
            this.log('JSZip tidak tersedia', 'err');
            return;
        }
        const btn = this.$('btnZip');
        btn.disabled = true;
        this.$('progressWrap').classList.add('show');
        const zip = new JSZip();
        const SR = +this.$('sr').value;
        const dur = +this.$('dur').value;

        // --- 128 melodic ---
        this.log('Membangun 128 patch melodic...', 'info');
        const melodicNames = [];   // ← simpan nama file untuk timidity.cfg
        for (let i = 0; i < 128; i++) {
            const [, name, p] = this.lib.melodic[i];
            const freq = p.freq || 441;
            const r = new MelodicRenderer(p, { sampleRate: SR, freq, duration: dur }).render();
            const buf = GusPatchEncoder.encode({
                name: this.slugify(name).slice(0, 15) || `gm${i}`,
                pcm: r.pcm, loopStart: r.loopStart, loopEnd: r.loopEnd,
                isLoop: r.loop, rootFreq: r.naturalFreq, sampleRate: SR,   // ← naturalFreq
            });
            const fname = `${String(i).padStart(3, '0')}_${this.slugify(name)}.pat`;
            zip.folder('melodic').file(fname, buf);
            melodicNames.push(fname);
            this.$('progressBar').style.width = ((i + 1) / 175 * 100) + '%';
            if (i % 16 === 0) await new Promise(r => setTimeout(r, 0));
        }

        // --- 47 drum ---
        this.log('Membangun 47 patch drum...', 'info');
        const drumNames = [];      // ← simpan note + nama file untuk timidity.cfg
        for (let i = 0; i < this.lib.drums.length; i++) {
            const [note, name, p] = this.lib.drums[i];
            const r = new DrumRenderer(p, SR).render();
            const rootFreq = this.lib.drumToFreq(note);
            const buf = GusPatchEncoder.encode({
                name: this.slugify(name).slice(0, 15) || `drum${note}`,
                pcm: r.pcm, loopStart: 0, loopEnd: 0, isLoop: false,
                rootFreq, sampleRate: SR,
            });
            const fname = `drum_${String(note).padStart(2, '0')}_${this.slugify(name)}.pat`;
            zip.folder('drums').file(fname, buf);
            drumNames.push({ note, fname });
            this.$('progressBar').style.width = ((128 + i + 1) / 175 * 100) + '%';
            if (i % 8 === 0) await new Promise(r => setTimeout(r, 0));
        }

        // --- timidity.cfg + README ---
        this.log('Membuat timidity.cfg & README...', 'info');
        zip.file('timidity.cfg', this._buildTimidityCfg(melodicNames, drumNames, SR));
        zip.file('README.txt',   this._buildReadme(SR));

        this.log('Membuat ZIP...', 'info');
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        FileDownloader.download(blob, `gm128_plus_drums_${SR}hz.zip`);
        this.log(`✓ Selesai: ${(blob.size / 1024).toFixed(1)} KB`, 'ok');

        this.$('progressWrap').classList.remove('show');
        btn.disabled = false;
    }

    _buildTimidityCfg(melodicNames, drumNames, SR) {
        const lines = [];
        lines.push('# ================================================');
        lines.push('# TiMidity++ Configuration File');
        lines.push('# Generated by GUS Patch Generator');
        lines.push(`# Sample rate: ${SR} Hz`);
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


    _buildReadme(SR) {
        return [
            'GUS Patch Generator — Output Package',
            '=====================================',
            '',
            `Sample rate : ${SR} Hz`,
            'Format      : Gravis Ultrasound Patch (.pat, 16-bit signed PCM, little-endian)',
            '',
            'Package contents:',
            '  timidity.cfg   TiMidity++ configuration',
            '  README.txt     This file',
            '  melodic/       128 GM program patches (000–127)',
            '  drums/         47 GM drum kit patches (note 35–81)',
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
            // SEBELUM
            '  - Melodic: loop (sustain) from loopStart → loopEnd.',

            // SESUDAH
            '  - Melodic: 16-bit signed PCM, sustain loop aktif untuk instrument',
            '    sustain (strings, brass, reed, pipe, pad, lead, organ, ensemble,',
            '    overdriven/distortion guitar, dan synth bass) dari loopStart → loopEnd.',
            '  - Sampel loop menyertakan MENV + envelope default (attack ~10ms,',
            '    release ~148ms) agar note-off melepas nada dengan benar.',
            '  - Drum   : one-shot, no loop.',
            '  - Vibrato and performance envelopes are handled by the GUS synth',
            '    during playback, not baked into the sample (avoids',
            '    "telephone ring" artifacts in loops).',
            '',
        ].join('\n');
    }

}

