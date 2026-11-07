class SoundFontExporter {
    static toInt16(pcm) {
        const samples = new Int16Array(pcm.length);
        for (let index = 0; index < pcm.length; index++) {
            samples[index] = Math.round(Math.max(-1, Math.min(1, pcm[index])) * 32767);
        }
        return samples;
    }

    static encode({name, samples, instruments, presets}) {
        if (samples.length === 0 || instruments.length === 0 || presets.length === 0) {
            throw new Error('Cannot create an empty SoundFont.');
        }

        const chunks = [];
        const sampleHeaders = [];
        let totalSamplePoints = 0;
        for (const sample of samples) {
            const start = totalSamplePoints;
            const end = start + sample.pcm.length;
            const validLoop = sample.loop && sample.loopEnd > sample.loopStart;
            sampleHeaders.push({
                ...sample,
                start,
                end,
                startLoop: validLoop ? start + sample.loopStart : start,
                endLoop: validLoop ? start + sample.loopEnd : start,
            });
            totalSamplePoints = end;
        }

        const sampleData = new Int16Array(totalSamplePoints + 46);
        for (const sample of sampleHeaders) sampleData.set(sample.pcm, sample.start);
        chunks.push(this.chunk('smpl', new Uint8Array(sampleData.buffer)));

        const presetHeaders = [];
        const presetBags = [];
        const presetGenerators = [];
        for (const preset of presets) {
            presetHeaders.push(this.presetHeader(preset, presetBags.length));
            for (const zone of preset.zones) {
                presetBags.push(this.bag(presetGenerators.length));
                if (zone.keyRange) {
                    presetGenerators.push(this.generator(43, zone.keyRange[0] | (zone.keyRange[1] << 8)));
                }
                presetGenerators.push(this.generator(41, zone.instrumentIndex));
            }
        }
        presetBags.push(this.bag(presetGenerators.length));
        presetHeaders.push(this.presetHeader({name: 'EOP', program: 0, bank: 0}, presetBags.length - 1));

        const instrumentHeaders = [];
        const instrumentBags = [];
        const instrumentGenerators = [];
        for (const instrument of instruments) {
            instrumentHeaders.push(this.instrumentHeader(instrument.name, instrumentBags.length));
            instrumentBags.push(this.bag(instrumentGenerators.length));
            instrumentGenerators.push(this.generator(54, instrument.loop ? 1 : 0));
            instrumentGenerators.push(this.generator(58, instrument.rootKey));
            instrumentGenerators.push(this.generator(53, instrument.sampleIndex));
        }
        instrumentBags.push(this.bag(instrumentGenerators.length));
        instrumentHeaders.push(this.instrumentHeader('EOI', instrumentBags.length - 1));

        const sampleHeaderRecords = sampleHeaders.map(sample => this.sampleHeader(sample));
        sampleHeaderRecords.push(this.sampleHeader({name: 'EOS'}));

        const info = this.list('INFO', [
            this.chunk('ifil', this.version(2, 1)),
            this.chunk('isng', this.terminated('EMU8000')),
            this.chunk('INAM', this.terminated(name || 'GUS Patch Generator SoundFont')),
            this.chunk('ISFT', this.terminated('GUS Patch Generator')),
        ]);
        const sdta = this.list('sdta', chunks);
        const pdta = this.list('pdta', [
            this.chunk('phdr', this.join(presetHeaders)),
            this.chunk('pbag', this.join(presetBags)),
            this.chunk('pmod', new Uint8Array(10)),
            this.chunk('pgen', this.join(presetGenerators)),
            this.chunk('inst', this.join(instrumentHeaders)),
            this.chunk('ibag', this.join(instrumentBags)),
            this.chunk('imod', new Uint8Array(10)),
            this.chunk('igen', this.join(instrumentGenerators)),
            this.chunk('shdr', this.join(sampleHeaderRecords)),
        ]);
        const body = this.join([this.text('sfbk'), info, sdta, pdta]);
        return this.chunk('RIFF', body);
    }

    static presetHeader({name, program, bank}, bagIndex) {
        const record = new Uint8Array(38);
        record.set(this.fixed(name, 20));
        const view = new DataView(record.buffer);
        view.setUint16(20, program || 0, true);
        view.setUint16(22, bank || 0, true);
        view.setUint16(24, bagIndex, true);
        return record;
    }

    static instrumentHeader(name, bagIndex) {
        const record = new Uint8Array(22);
        record.set(this.fixed(name, 20));
        new DataView(record.buffer).setUint16(20, bagIndex, true);
        return record;
    }

    static sampleHeader(sample) {
        const record = new Uint8Array(46);
        record.set(this.fixed(sample.name || 'EOS', 20));
        if (sample.name === 'EOS') return record;
        const view = new DataView(record.buffer);
        view.setUint32(20, sample.start || 0, true);
        view.setUint32(24, sample.end || 0, true);
        view.setUint32(28, sample.startLoop || 0, true);
        view.setUint32(32, sample.endLoop || 0, true);
        view.setUint32(36, sample.sampleRate || 22050, true);
        view.setUint8(40, sample.rootKey || 0);
        view.setInt8(41, 0);
        view.setUint16(42, 0, true);
        view.setUint16(44, 1, true);
        return record;
    }

    static bag(generatorIndex) {
        const record = new Uint8Array(4);
        new DataView(record.buffer).setUint16(0, generatorIndex, true);
        return record;
    }

    static generator(operator, amount) {
        const record = new Uint8Array(4);
        const view = new DataView(record.buffer);
        view.setUint16(0, operator, true);
        view.setUint16(2, amount, true);
        return record;
    }

    static version(major, minor) {
        const version = new Uint8Array(4);
        const view = new DataView(version.buffer);
        view.setUint16(0, major, true);
        view.setUint16(2, minor, true);
        return version;
    }

    static text(value) {
        return new TextEncoder().encode(value);
    }

    static terminated(value) {
        return this.join([this.text(value), new Uint8Array(1)]);
    }

    static fixed(value, length) {
        const result = new Uint8Array(length);
        result.set(this.text(value || '').subarray(0, length));
        return result;
    }

    static list(type, chunks) {
        return this.chunk('LIST', this.join([this.text(type), ...chunks]));
    }

    static chunk(id, data) {
        const paddedLength = data.length + (data.length & 1);
        const result = new Uint8Array(8 + paddedLength);
        result.set(this.text(id), 0);
        new DataView(result.buffer).setUint32(4, data.length, true);
        result.set(data, 8);
        return result;
    }

    static join(parts) {
        const result = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
        let offset = 0;
        for (const part of parts) {
            result.set(part, offset);
            offset += part.length;
        }
        return result;
    }
}