# Manual Pengguna: Pembuatan File PAT dan Paket ZIP

| Metadata | Nilai |
| --- | --- |
| Versi dokumen | 1.0 |
| Tanggal | 18 November 2026 |

## 1. Tujuan dan ruang lingkup

Manual ini menjelaskan pembuatan berkas instrumen Gravis Ultrasound Patch
(`.pat`) dari preset yang disediakan oleh aplikasi. Pembahasan dibatasi pada:

- `JSGUS/ProjectPatchGenerator.js`
- `JSGUS/melodic-presets.js`
- `JSGUS/drum-presets.js`

Manual ini tidak membahas pemutaran MIDI, pembuatan SoundFont, atau ekspor
audio. Contoh HTML membuat satu berkas PAT untuk satu program melodi atau satu
nomor nada drum, lalu memasukkan berkas PAT tersebut ke dalam satu ZIP tanpa
kompresi. ZIP berisi PAT, bukan dokumen manual ini.

### Format GUS Patch dan alasan pemilihan

GUS Patch (`.pat`) adalah format patch instrumen untuk Gravis Ultrasound.
Berkas yang dibuat generator memiliki header `GF1PATCH110` dan menyimpan
metadata instrumen serta sampel PCM signed 16-bit little-endian. Metadata dapat
mencakup rentang pitch, frekuensi dasar, loop, dan envelope playback.

Satu berkas PAT mewakili satu instrumen, tetapi instrumen tersebut dapat
memiliki satu atau beberapa sampel/zona nada. Pemisahan satu instrumen per
berkas dipilih agar instrumen dapat diganti atau diperbarui secara parsial:
pengguna cukup mengganti PAT instrumen yang diinginkan tanpa membangun ulang
atau mengganti satu bank yang berisi instrumen lain. Contoh HTML dalam manual
ini membuat satu sampel untuk satu PAT; ekspor instrumen multi-zona tetap
dapat menempatkan beberapa sampel instrumen yang sama dalam satu PAT.

### Konversi ke format lain

Sampel dan pemetaan instrumen dalam PAT dapat diekstrak atau dikonversi dengan
perangkat lunak yang sesuai ke format sampler lain, misalnya SF2, SF3, atau
SFZ. Sampel PCM juga dapat disimpan sebagai berkas audio seperti WAV, tetapi
berkas audio sampel saja tidak menyimpan seluruh pemetaan instrumen.

- **SF2 (SoundFont 2):** format bank SoundFont yang dapat mengemas banyak
  instrumen/preset beserta sampel dan pemetaannya dalam satu berkas bank.
- **SF3:** varian SoundFont yang menyimpan sampel menggunakan kompresi Ogg
  Vorbis untuk mengurangi ukuran; pemutaran memerlukan aplikasi yang
  mendukung SF3.
- **SFZ:** format definisi instrumen berbasis teks. Berkas `.sfz` memetakan
  sampel ke rentang nada dan zona, biasanya dengan merujuk berkas audio
  terpisah seperti WAV. Untuk memindahkan instrumen, sertakan berkas SFZ dan
  semua sampel yang dirujuknya.

Konversi tidak selalu mempertahankan seluruh karakter atau metadata secara
sempurna. Dukungan loop, rentang/zona nada, envelope, dan parameter khusus
bergantung pada format tujuan serta perangkat lunak konverter; periksa dan
dengarkan kembali hasil konversi.

## 2. Fungsi berkas sumber

| Berkas | Fungsi |
| --- | --- |
| `JSGUS/melodic-presets.js` | Menyediakan `GUS_MELODIC_PRESETS`: master gain dan preset instrumen melodi menurut nomor program MIDI. |
| `JSGUS/drum-presets.js` | Menyediakan `GUS_DRUM_PRESETS`: master gain dan preset instrumen drum menurut nomor nada MIDI. |
| `JSGUS/ProjectPatchGenerator.js` | Memvalidasi dan merender preset menjadi data sampel, menyusun metadata patch, serta menyediakan `GusPatchEncoder` untuk mengodekan data menjadi format PAT. |
| `jszip/jszip.min.js` | Hanya digunakan contoh HTML untuk memasukkan satu berkas PAT ke dalam ZIP tanpa kompresi; tidak terlibat dalam sintesis suara. |

Ketiga berkas dimuat sebagai JavaScript biasa, bukan modul. Muat berkas preset
terlebih dahulu, kemudian generator. Data preset melodi dan drum harus berada
di cakupan halaman sebelum generator digunakan.

## 3. Identitas instrumen

- **Melodi:** gunakan nomor program MIDI `0–127` pada properti `program`.
  Contohnya, `0` adalah program pertama. Data preset melodi menyediakan satu
  entri untuk setiap program.
- **Drum:** gunakan nomor nada MIDI pada properti `note`. Daftar drum bersifat
  jarang; tidak semua angka `0–127` tersedia. Gunakan angka yang benar-benar
  ada di `GUS_DRUM_PRESETS.instruments`.
- **Preset:** parameter bunyi disimpan pada properti `preset` tiap instrumen.
  Master gain berada pada properti `gain` di tingkat koleksi preset.

Preset drum dapat memiliki komponen nada, membran, logam, noise, impact,
click, dan burst. Preset melodi dapat berupa suara periodik/loop maupun
one-shot. Nilai yang tidak sesuai pada properti yang digunakan renderer dapat
membuat proses gagal atau menghasilkan suara yang tidak diharapkan.

## 4. Struktur dan komponen preset

### 4.1 Struktur umum

`GUS_MELODIC_PRESETS` dan `GUS_DRUM_PRESETS` masing-masing memiliki `gain`
tingkat koleksi dan array `instruments`. Master gain dikalikan dengan
`preset.gain` instrumen; jika gain instrumen tidak dicantumkan, nilainya
dianggap `1`.

Preset melodi memiliki bentuk
`{ program, family, name, shortName, description, preset }`. Nomor `program`
harus unik dan mencakup program General MIDI `0–127`; nomor program ditentukan
dari nilai `program`, bukan posisi entri di array.

Preset drum memiliki bentuk
`{ note, name, shortName, description, preset }`. Saat ini tersedia 57 entri
dengan nomor nada `25–84` secara renggang; tidak semua nomor dalam rentang itu
tersedia. Nilai `note` harus unik dan berada pada rentang MIDI `0–127`.

Pada kedua jenis instrumen, `name` adalah nama lengkap untuk tampilan.
`shortName` adalah nama instrumen di header patch dan maksimal 16 karakter.
`description` adalah ringkasan suara berbahasa Inggris, harus terisi, dan
maksimal 60 karakter karena ditulis ke header patch. Objek preset berupa data
JavaScript biasa dan dimuat sebelum `ProjectPatchGenerator.js`.

### 4.2 Properti preset melodi

| Properti | Penjelasan |
| --- | --- |
| `mute` | Jika `true`, gain keluaran patch diatur ke nol. |
| `gain` | Pengali level instrumen yang dikalikan dengan master gain koleksi. Level tinggi dapat mengalami saturasi saat dikonversi ke PCM 16-bit. |
| `defaultWaveform` | Bentuk harmonik bawaan: salah satu profil waveform di bawah atau array amplitudo harmonik. Waveform yang dipilih selain preset menggantikan nilai `harm`. |
| `freq` | Frekuensi dasar/referensi dalam hertz. Saat generator membuat zona nada, frekuensi dasar dapat ditentukan oleh zona tersebut. |
| `length` | Panjang sampel one-shot dalam jumlah sampel pada acuan 22.050 Hz; disesuaikan untuk sample rate lain. Diabaikan untuk loop. |
| `duration` | Durasi dalam detik untuk one-shot dengan `renderMode: "drum"`. One-shot melodi biasa menggunakan `length` atau durasi generator. |
| `harm` | Amplitudo relatif tiap harmonik; indeks `0` adalah fundamental. |
| `phases` | Fase awal opsional tiap harmonik dalam satuan siklus. Elemen yang tidak diisi menggunakan fase nol. |
| `phaseScale` | Ada pada sebagian data preset, tetapi saat ini tidak dibaca renderer sehingga tidak berpengaruh. Gunakan `phases` untuk mengatur fase harmonik. |
| `antiAlias` | Jika `true`, harmonik pada atau di atas 49% sample rate render tidak disertakan. |
| `env` | Envelope one-shot: `a` (attack), `d` (decay), dan `r` (release) dalam detik; `s` adalah level sustain `0–1`. Untuk loop, envelope playback ditangani oleh envelope GUS. |
| `loop` | Jika bernilai truthy, sampel dirender sebagai suara periodik/loop. |
| `cycleSamples` | Jumlah sampel eksplisit per siklus loop. Jika tidak ada, nilainya dihitung dari frekuensi dasar dan sample rate. |
| `cycles` | Banyaknya siklus sampai akhir bagian loop; nilai bawaan `12`. |
| `loopSkip` | Banyaknya siklus sebelum titik mulai loop; nilai bawaan `3`. |
| `tailCycles` | Banyaknya siklus tambahan untuk ekor/release loop. Jika tidak diatur, panjangnya diturunkan dari frekuensi dan `env.r`, dengan minimum 4 siklus. |
| `loopAttack` | Lama fade-in dalam detik sebelum wilayah loop. |
| `loopAttackNoise` | Noise transient `{ amp, duration }` yang ditempatkan sebelum loop. Gunakan ini untuk loop, bukan `attackNoise`. |
| `sustainLoop` | Atur `false` untuk menghilangkan penanda sustain-loop GUS tanpa menghapus loop sampelnya. |
| `patchEnvelope` | Envelope GUS opsional yang ditulis ke header, berupa enam nilai mentah `rates` dan enam nilai `offsets`. |
| `noise` | Pada melodi biasa, angka blend noise: one-shot memakai white noise dan loop memakai siklus pink-noise berulang. Dalam `renderMode: "drum"`, properti ini berupa objek noise seperti pada preset drum. |
| `fm` | Modulasi frekuensi: `ratio` adalah rasio frekuensi modulator terhadap carrier, `index` adalah kedalaman modulasi. Untuk loop, FM hanya digunakan jika `ratio` bilangan bulat. |
| `detune` | Array nilai detuning suara dalam sen. Diabaikan pada loop. |
| `vibrato` | Objek `{ rate, depth, sweep }`: laju dalam hertz, kedalaman sebagai fraksi pitch, dan sweep untuk onset. Pada loop, vibrato disimpan di header GUS. |
| `vibratoOnset` | Waktu dalam detik yang diperlukan vibrato one-shot untuk mencapai kedalaman penuh. |
| `inharmonicity` | Koefisien peregangan frekuensi parsial agar harmonik tidak sepenuhnya harmonis. Diabaikan pada loop. |
| `attackNoise` | Transient pink-noise pada awal one-shot, dengan `amp` dan `duration` dalam detik. |
| `pluckTransient` | Transient noise band-pass one-shot: `freq` pusat filter dalam hertz, `q`, `amp`, `duration`, `decay`, dan `type` noise opsional. |
| `pluckPosition` | Posisi petikan string sebagai fraksi `0,01–0,49`; mengubah amplitudo relatif harmonik. |
| `pitchScoop` | Tekukan pitch pada awal one-shot, dengan `time` dalam detik dan `depth` berupa fraksi. |
| `partialDecay` | Array waktu decay dalam detik untuk masing-masing harmonik. Diabaikan pada loop. |
| `brightness` | Untuk one-shot, sweep low-pass dari cutoff `start` ke `end` dalam hertz. Untuk loop, `loopCutoff` menerapkan low-pass statis. |
| `formants` | Array filter puncak `{ freq, q, gain }`; `freq` dalam hertz dan `gain` dalam desibel. |
| `drive` | Besaran soft-saturation yang diterapkan setelah formant. |
| `guitarAmp` | Tahap efek gitar opsional: `preampCutoff` dan `cabinetCutoff` dalam hertz, serta `drive`, `bias`, `mix`, dan `clip` (campuran menuju hard clipping). |
| `renderMode` | Atur ke `"drum"` untuk merender program melodi sebagai one-shot pitch-scaled memakai komponen renderer drum. |
| `tones` | Digunakan dalam `renderMode: "drum"`; struktur elemennya sama dengan properti `tones` pada preset drum. |
| `highpass` | Cutoff high-pass dalam hertz, diterapkan pada sampel hasil render. |
| `lowpass` | Cutoff low-pass dalam hertz untuk `renderMode: "drum"`. Pada loop melodi biasa gunakan `brightness.loopCutoff`. |
| `fadeOut` | Lama fade-out dalam detik untuk one-shot `renderMode: "drum"`. |

Karakter profil pada `defaultWaveform`:

- `sine`: nada sinus murni tanpa harmonik atas.
- `triangle`: lembut dengan harmonik ganjil yang cepat melemah.
- `square`: karakter hollow dengan harmonik ganjil kuat.
- `saw`: cerah dan kaya deret harmonik.
- `pulse`: nasal dan terfokus.
- `organ`: kaya dan stabil seperti drawbar organ.
- `flute`: halus dan airy dengan sedikit harmonik tinggi.
- `clarinet`: berkarakter kayu dengan dominasi harmonik ganjil.
- `reed`: cerah dan reedy dengan harmonik atas kuat.
- `string`: penuh dan sustain dengan harmonik yang berangsur melemah.
- `bell`: metalik dengan kekuatan parsial yang tidak merata.
- `pluck`: attack membulat dengan harmonik yang menurun seperti senar dipetik.
- `hammer`: attack tajam dan spektrum yang cepat melunak.
- `bow`: padat dan sustain seperti string yang digesek.
- `breath`: fundamental dominan dengan sedikit karakter napas.

Ketika `loop` aktif, panjang sampel berasal dari periode loop, `cycles`, dan
`tailCycles`; `length` tidak digunakan. Fitur one-shot yang berubah terhadap
waktu, seperti `pitchScoop`, `detune`, `inharmonicity`, dan `partialDecay`,
dinonaktifkan agar siklus stabil. Attack, decay, dan sustain dari `env` tidak
diterapkan ke sampel loop. Nilai `env.r` dapat menentukan panjang ekor default,
sedangkan perilaku release playback berasal dari envelope patch GUS.
`loopAttackNoise` ditempatkan sebelum wilayah loop dan vibrato loop disimpan
di header GUS.

Untuk `renderMode: "drum"`, `freq` menjadi pitch referensi. Pitch MIDI yang
diminta menskalakan frekuensi nada dan cutoff filter. Setiap elemen `tones`
mendukung `fStart` dan `fEnd` dalam hertz. `fPeak`, `riseTime`, dan `fallTime`
opsional membentuk kenaikan/penurunan pitch; tanpa `fPeak`, `pitchDecay`
mengatur pitch slide eksponensial. `decay` mengatur ekor amplitudo, `amp`
mengatur level, dan `fm: { ratio, index }` menambahkan modulasi frekuensi.

Sample rate melodi dikendalikan oleh opsi `sampleRate` pada
`ProjectPatchGenerator`; properti `sampleRate` di preset melodi tidak dibaca.

### 4.3 Properti preset drum

Setiap `preset` drum dirender sebagai gabungan satu atau lebih komponen berikut.

| Properti | Penjelasan |
| --- | --- |
| `mute` | Jika `true`, gain keluaran patch diatur ke nol. |
| `gain` | Pengali level instrumen yang dikalikan dengan master gain drum. Level tinggi dapat mengalami saturasi saat dikonversi ke PCM 16-bit. |
| `duration` | Lama render dalam detik. |
| `sampleRate` | Sample rate minimum opsional dalam hertz, berupa bilangan bulat positif. Sample rate efektif sekurang-kurangnya sebesar sample rate yang diminta generator. |
| `tones` | Array nada sinus yang meluruh. Setiap nada mendukung `fStart`/`fEnd` dalam hertz, `pitchDecay` untuk pitch slide eksponensial, `decay` dalam detik, `amp`, dan `fm: { ratio, index }` opsional. |
| `tones[].fPeak`, `riseTime`, `fallTime` | Opsional; membentuk perubahan pitch terarah dari frekuensi awal ke puncak lalu ke frekuensi akhir. |
| `membrane` | Suara membran dengan frekuensi dasar `freq`, `pitchDecay`, `decay`, serta `modes` opsional. |
| `membrane.modes[]` | Tiap mode memiliki `ratio` frekuensi, `amp` relatif, `startRatio` opsional (bawaan `1,2`), dan pengali `decay`. |
| `metallic` | Dengung inharmonis dengan `baseFreq`, pengali frekuensi parsial pada `partials`, `amp`, dan `decay`. `randomPhase: true` mengacak fase awal parsial. |
| `noise` | Satu lapisan noise dengan `amp`, `decay` dalam detik, `type` (`white`, `pink`, atau `brown`), dan `bandpass: { center, q }` opsional. Tanpa `bandpass`, noise tidak difilter. |
| `noiseLayers` | Array lapisan noise; tiap elemen mendukung properti yang sama dengan `noise`. |
| `impact` | Satu impact noise dengan `amp`, `duration`, `decay`, `delay` opsional, `type`, dan `bandpass` opsional. |
| `impacts` | Array impact dengan struktur yang sama seperti `impact`, untuk menggabungkan beberapa benturan. |
| `click` | Klik attack pendek dari noise acak, dengan `duration` dalam detik dan `amp`. |
| `bursts` | Array waktu mulai burst noise dalam detik. Setiap burst berlangsung sekitar 12 ms. |
| `highpass`, `lowpass` | Cutoff high-pass dan low-pass opsional dalam hertz. |
| `fadeOut` | Panjang fade-out dalam detik. Jika tidak diatur, fade dibatasi hingga 96 sampel atau 5% panjang sampel, mana yang lebih pendek. |

Nada, membran, komponen metalik, noise, impact, click, dan burst dapat
digabungkan pada preset yang sama. Renderer menjumlahkan komponen, menerapkan
filter dan fade pada tepi sampel, kemudian menormalisasi hasil sebelum
pengodean patch. Properti preset drum tidak mengatur panning; balance sampel
GUS ditetapkan di tengah (`7`).

## 5. Alur pembuatan

1. Muat koleksi preset melodi dan drum.
2. Buat objek `ProjectPatchGenerator`, dengan sample rate dan durasi bawaan
   bila diperlukan.
3. Pilih jenis instrumen dan identitasnya: nomor program untuk melodi atau
   nomor nada untuk drum.
4. Panggil `generate({ isDrum, program, pitchFrom, pitchTo })`.
   Untuk drum, nilai `program` adalah nomor nada drum.
5. Hasil `generate()` adalah objek JavaScript, bukan berkas PAT siap unduh.
   Hasilnya berisi sampel di
   `result.patch.instruments[0].layers[0].samples[0]`.
6. Kodekan sampel menggunakan `GusPatchEncoder.encode()` untuk memperoleh
   data berkas PAT.
7. Tambahkan hanya berkas PAT tersebut ke ZIP menggunakan metode `STORE`, lalu
   unduh berkas `.zip`.

Contoh di bawah memakai rentang nada MIDI `0–127` untuk menghasilkan satu
sampel. Aplikasi dapat menggunakan beberapa zona sampel untuk ekspor instrumen
melodi; contoh minimal ini sengaja hanya membuat satu sampel.

## 6. Contoh HTML mandiri

Simpan contoh berikut sebagai berkas HTML pada direktori yang sama dengan
folder `JSGUS` dan `jszip`. Jalankan melalui server web lokal atau server
aplikasi agar berkas JavaScript dapat dimuat melalui HTTP; jangan mengandalkan
pembukaan langsung dengan `file://`.

```html
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pembuat File PAT</title>
</head>
<body>
  <h1>Pembuat File PAT</h1>

  <p>
    <label for="kind">Jenis instrumen</label>
    <select id="kind">
      <option value="melodic">Melodi</option>
      <option value="drum">Drum</option>
    </select>
  </p>

  <p>
    <label for="instrumentId">Nomor program / nada</label>
    <input id="instrumentId" type="number" min="0" max="127" value="0">
  </p>

  <button id="generateButton" type="button">Generate PAT</button>
  <p id="status" role="status">Pilih instrumen, lalu tekan tombol.</p>

  <script src="JSGUS/melodic-presets.js"></script>
  <script src="JSGUS/drum-presets.js"></script>
  <script src="JSGUS/ProjectPatchGenerator.js"></script>
  <script src="jszip/jszip.min.js"></script>
  <script>
    const generator = new ProjectPatchGenerator({
      sampleRate: 22050
    });

    const kindInput = document.getElementById('kind');
    const instrumentInput = document.getElementById('instrumentId');
    const status = document.getElementById('status');

    kindInput.addEventListener('change', () => {
      instrumentInput.value = kindInput.value === 'drum' ? '25' : '0';
    });

    function createPatBuffer(result) {
      const sample = result.patch.instruments[0].layers[0].samples[0];
      const pcmBytes = sample.pcm;

      if (!(pcmBytes instanceof Uint8Array) || pcmBytes.byteLength % 2 !== 0) {
        throw new Error('Data PCM dari generator tidak valid.');
      }

      // generate() menyimpan PCM sebagai byte signed 16-bit little-endian.
      const pcmView = new DataView(
        pcmBytes.buffer,
        pcmBytes.byteOffset,
        pcmBytes.byteLength
      );
      const pcm = new Float32Array(pcmBytes.byteLength / 2);
      for (let i = 0; i < pcm.length; i++) {
        pcm[i] = pcmView.getInt16(i * 2, true) / 32768;
      }

      const isLoop =
        (sample.modes & ProjectPatchGenerator.MODE_LOOP) !== 0;
      const sustainLoop =
        (sample.modes & ProjectPatchGenerator.MODE_SUSTAIN) !== 0;

      return GusPatchEncoder.encode({
        name: result.name,
        samples: [{
          name: sample.name,
          pcm,
          sampleRate: sample.sampleRate,
          rootFreq: sample.rootFreq,
          lowFreq: sample.lowFreq,
          highFreq: sample.highFreq,
          // Offset loop pada objek patch generator berupa byte;
          // encoder menerima offset dalam jumlah sampel.
          loopStart: sample.loopStart / 2,
          loopEnd: sample.loopEnd / 2,
          isLoop,
          sustainLoop,
          envRates: sample.envRates,
          envOffsets: sample.envOffsets
        }]
      });
    }

    async function downloadPatZip(patBuffer, patFilename, zipFilename) {
      const zip = new JSZip();
      zip.file(patFilename, patBuffer);
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    document.getElementById('generateButton').addEventListener('click', async () => {
      try {
        const isDrum = kindInput.value === 'drum';
        const program = Number(instrumentInput.value);
        if (!Number.isInteger(program) || program < 0 || program > 127) {
          throw new Error('Nomor program/nada harus berupa bilangan 0–127.');
        }

        const result = generator.generate({
          isDrum,
          program,
          pitchFrom: 0,
          pitchTo: 127
        });
        const patBuffer = createPatBuffer(result);
        const prefix = isDrum
          ? `drum_${String(program).padStart(2, '0')}`
          : String(program).padStart(3, '0');
        const safeName = result.name
          .replace(/[^A-Za-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        const patFilename = `${prefix}_${safeName}.pat`;
        const zipFilename = `${prefix}_${safeName}.zip`;

        await downloadPatZip(patBuffer, patFilename, zipFilename);
        status.textContent = `Berhasil membuat ${zipFilename}. ZIP berisi satu file PAT tanpa kompresi.`;
      } catch (error) {
        status.textContent = `Gagal membuat ZIP PAT: ${error.message}`;
      }
    });
  </script>
</body>
</html>
```

### Catatan penggunaan contoh

- Untuk melodi, masukkan nomor program MIDI. Untuk drum, masukkan nomor
  `note` yang tersedia di preset drum; contoh awal setelah memilih Drum adalah
  nada `25`.
- Contoh memakai sample rate `22050` Hz dan membiarkan durasi mengikuti
  perilaku bawaan generator serta preset.
- Contoh mempertahankan status loop dan envelope patch, mengubah PCM dari
  bentuk byte menjadi sampel float untuk encoder, lalu memasukkan satu PAT ke
  dalam ZIP dengan `compression: 'STORE'`.
- Jika nomor drum tidak tersedia atau preset gagal divalidasi, pesan kesalahan
  ditampilkan pada halaman dan tidak ada ZIP yang diunduh.

## 7. Pemeriksaan hasil

1. Pastikan unduhan memiliki ekstensi `.zip`.
2. Buka ZIP dan pastikan isinya tepat satu berkas `.pat`. Metode kompresinya
   harus `Store`/`Stored` (tanpa kompresi).
3. Ekstrak PAT, pastikan ukuran lebih dari nol, lalu buka dengan aplikasi yang
   dapat membaca patch GUS atau muat ke player yang mendukung format tersebut.
4. Dengarkan pada beberapa nada yang sesuai. Sampel satu-zona dapat terdengar
   berbeda pada nada yang jauh dari frekuensi dasarnya.
5. Jika hasil tidak sesuai, periksa identitas program/nada, urutan pemuatan
   script, konsol browser, serta nilai dan struktur objek `preset`.

File PAT yang dihasilkan menggunakan format patch GUS dengan header
`GF1PATCH110` dan sampel PCM signed 16-bit little-endian. Manual ini
menjelaskan alur teknis pembuatan berkas dan bukan penilaian hukum atas
kelayakan pendaftaran atau kepemilikan hak.
