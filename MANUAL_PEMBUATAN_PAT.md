# Uraian Teknis Modul Pembentukan Berkas GUS Patch (.PAT)

| Metadata | Nilai |
| --- | --- |
| Versi dokumen | 1.1 |
| Tanggal | 19 November 2026 |

## 1. Pendahuluan, Tujuan, dan Ruang Lingkup

Dokumen ini disusun sebagai uraian teknis pendukung permohonan pencatatan Hak
Cipta atas perangkat lunak yang diajukan kepada Direktorat Jenderal Kekayaan
Intelektual (DJKI).
Uraian berfokus pada modul yang membentuk berkas instrumen Gravis Ultrasound
Patch (`.pat`) berdasarkan data preset melodi dan drum yang disediakan aplikasi.
Penjelasan mencakup struktur komponen, parameter yang diproses, tahapan render,
serta pengodean keluaran.

Ruang lingkup teknis dokumen ini meliputi komponen berikut:

- `JSGUS/ProjectPatchGenerator.js`, sebagai modul pemrosesan dan pengodean;
- `JSGUS/melodic-presets.js`, sebagai sumber data preset instrumen melodi; dan
- `JSGUS/drum-presets.js`, sebagai sumber data preset instrumen drum.

Dokumen ini menguraikan implementasi teknis sebagaimana terdapat pada sumber
perangkat lunak yang dirujuk. Dokumen ini bukan spesifikasi resmi format GUS
dan tidak dimaksudkan sebagai penetapan status hukum atau kepemilikan atas
format maupun pustaka pihak ketiga. Nama format dan pustaka digunakan sebagai
rujukan teknis untuk menjelaskan interoperabilitas.

Modul menghasilkan satu berkas PAT untuk satu instrumen atau satu identitas
drum. Contoh HTML pada bagian 6 mengemas berkas PAT yang dihasilkan ke dalam
ZIP tanpa kompresi; pengemasan ZIP merupakan langkah distribusi contoh dan
bukan bagian dari sintesis atau pengodean sampel.

### Format GUS Patch dan Pertimbangan Pemilihan

GUS Patch (`.pat`) merupakan format patch instrumen yang digunakan oleh
perangkat lunak dan perangkat yang kompatibel dengan Gravis Ultrasound.
Berkas keluaran generator menggunakan header `GF1PATCH110` dan memuat metadata
instrumen beserta sampel PCM bertanda 16-bit little-endian. Metadata sampel
dapat mencakup rentang nada, frekuensi dasar, titik loop, envelope, dan
parameter pemutaran lainnya.

Satu berkas PAT mewakili satu instrumen dan dapat memuat satu atau beberapa
sampel/zona nada dari instrumen tersebut. Struktur ini memungkinkan penggantian
atau pembaruan satu instrumen secara parsial tanpa membangun ulang bank yang
memuat instrumen lain. Contoh HTML pada dokumen ini menghasilkan satu sampel
per PAT; proses ekspor instrumen multi-zona dapat menempatkan beberapa sampel
dari instrumen yang sama ke dalam satu PAT.

### Konversi ke Format Lain

Sampel dan pemetaan instrumen dalam PAT dapat diekstrak atau dikonversi dengan
perangkat lunak yang sesuai ke format sampler lain, seperti SF2, SF3, atau
SFZ. Sampel PCM juga dapat disimpan sebagai berkas audio, misalnya WAV;
berkas audio sampel tidak mencakup keseluruhan metadata dan pemetaan instrumen.

- **SF2 (SoundFont 2):** format bank SoundFont yang dapat mengemas banyak
  instrumen/preset beserta sampel dan pemetaannya dalam satu berkas bank.
- **SF3:** varian SoundFont yang menyimpan sampel menggunakan kompresi Ogg
  Vorbis untuk mengurangi ukuran; pemutaran memerlukan aplikasi yang
  mendukung SF3.
- **SFZ:** format definisi instrumen berbasis teks. Berkas `.sfz` memetakan
  sampel ke rentang nada dan zona, biasanya dengan merujuk berkas audio
  terpisah seperti WAV. Untuk distribusi instrumen, berkas SFZ perlu disertai
  seluruh sampel yang dirujuknya.

Konversi antarformat dapat mengubah karakter suara atau tidak mempertahankan
seluruh metadata. Dukungan terhadap loop, rentang/zona nada, envelope, dan
parameter khusus bergantung pada format tujuan dan perangkat lunak konverter.
Karena itu, hasil konversi perlu diperiksa secara teknis dan dievaluasi kembali
dengan pemutaran audio.

## 2. Komponen Perangkat Lunak

| Berkas | Fungsi |
| --- | --- |
| `JSGUS/melodic-presets.js` | Menyediakan `GUS_MELODIC_PRESETS`, yang memuat master gain dan data preset melodi menurut nomor program MIDI. |
| `JSGUS/drum-presets.js` | Menyediakan `GUS_DRUM_PRESETS`, yang memuat master gain dan data preset drum menurut nomor nada MIDI. |
| `JSGUS/ProjectPatchGenerator.js` | Memvalidasi dan merender data preset menjadi sampel, menyusun metadata patch, serta menyediakan `GusPatchEncoder` untuk menghasilkan berkas PAT. |
| `jszip/jszip.min.js` | Digunakan oleh contoh HTML untuk mengemas berkas PAT ke dalam ZIP tanpa kompresi; tidak digunakan dalam proses sintesis suara. |

Ketiga berkas JavaScript inti dimuat sebagai skrip biasa, bukan sebagai modul.
Koleksi preset melodi dan drum harus dimuat sebelum `ProjectPatchGenerator.js`
agar datanya tersedia pada cakupan halaman saat generator diinisialisasi.

## 3. Identitas Instrumen

- **Instrumen melodi:** identifikasi menggunakan nomor program MIDI `0–127`
  pada properti `program`. Data preset menyediakan satu entri untuk setiap
  nomor program.
- **Instrumen drum:** identifikasi menggunakan nomor nada MIDI pada properti
  `note`. Daftar nada drum bersifat tidak berurutan dan hanya mencakup nada
  yang tersedia di `GUS_DRUM_PRESETS.instruments`.
- **Data preset:** parameter bunyi setiap instrumen disimpan pada properti
  `preset`. Master gain ditetapkan pada properti `gain` di tingkat koleksi.

Preset drum dapat terdiri atas komponen nada, membran, logam, noise, impact,
click, dan burst. Preset melodi dapat dirender sebagai sampel periodik (loop)
atau one-shot. Nilai parameter yang tidak sesuai dengan tipe data atau rentang
yang diharapkan dapat menyebabkan proses gagal atau menghasilkan keluaran yang
berbeda dari karakter suara yang dimaksud.

## 4. Struktur dan Komponen Preset

### 4.1 Struktur Umum

`GUS_MELODIC_PRESETS` dan `GUS_DRUM_PRESETS` masing-masing memuat properti
`gain` pada tingkat koleksi dan array `instruments`. Nilai master gain
dikalikan dengan `preset.gain` instrumen. Apabila gain instrumen tidak
ditentukan, generator menggunakan nilai bawaan `1`.

Preset melodi memiliki bentuk
`{ program, family, name, shortName, description, preset }`. Nomor `program`
harus unik dan mencakup program General MIDI `0–127`; nomor program ditentukan
dari nilai `program`, bukan posisi entri di array.

Setiap entri preset drum memiliki bentuk
`{ note, name, shortName, description, preset }`. Saat ini tersedia 57 entri
dengan nomor nada MIDI `25–84` yang tidak berurutan; tidak seluruh nomor pada
rentang tersebut tersedia. Nilai `note` wajib unik dan berada pada rentang
MIDI `0–127`.

Pada kedua jenis instrumen, `name` menyimpan nama lengkap untuk tampilan.
`shortName` menyimpan nama instrumen pada header patch dengan panjang maksimum
16 karakter. `description` merupakan ringkasan suara berbahasa Inggris yang
wajib diisi dan dibatasi maksimum 60 karakter karena ditulis ke header patch.
Objek preset disimpan sebagai data JavaScript dan dimuat sebelum
`ProjectPatchGenerator.js`.

### 4.2 Properti Preset Melodi

| Properti | Penjelasan |
| --- | --- |
| `mute` | Jika `true`, gain keluaran patch diatur ke nol. |
| `gain` | Pengali level instrumen yang dikalikan dengan master gain koleksi. Level tinggi dapat mengalami saturasi saat dikonversi ke PCM 16-bit. |
| `zones` | Override opsional berupa array lebar zona dalam nada MIDI. Zona dibentuk berurutan dari nada MIDI `0` hingga `127`; generator berhenti saat total mencapai `128` dan memotong zona yang melewati batas. Jika total kurang, sisanya ditambahkan ke zona terakhir yang digunakan. Jika tidak ada, generator memakai profil zona bawaan program. |
| `defaultWaveform` | Bentuk harmonik bawaan: salah satu profil waveform di bawah atau array amplitudo harmonik. Waveform yang dipilih selain preset menggantikan nilai `harm`. |
| `freq` | Frekuensi dasar/referensi dalam hertz. Saat generator membuat zona nada, frekuensi dasar dapat ditentukan oleh zona tersebut. |
| `sampleRate` | Pada preset melodi tidak dibaca. Sample rate ditentukan oleh opsi `sampleRate` pada `ProjectPatchGenerator`. |
| `length` | Panjang sampel one-shot dalam jumlah sampel pada acuan 22.050 Hz; disesuaikan untuk sample rate lain. Diabaikan untuk loop. |
| `duration` | Durasi dalam detik untuk one-shot dengan `renderMode: "drum"`. One-shot melodi biasa menggunakan `length` atau durasi generator. |
| `harm` | Amplitudo relatif tiap harmonik; indeks `0` adalah fundamental. |
| `phases` | Fase awal opsional tiap harmonik dalam satuan siklus. Elemen yang tidak diisi menggunakan fase nol. |
| `phaseScale` | Terdapat pada sebagian data preset, tetapi belum dibaca renderer sehingga tidak berpengaruh. Pengaturan fase harmonik dilakukan melalui `phases`. |
| `antiAlias` | Jika `true`, harmonik pada atau di atas 49% sample rate render tidak disertakan. |
| `env` | Envelope one-shot: `a` (attack), `d` (decay), dan `r` (release) dalam detik; `s` adalah level sustain `0–1`. Untuk loop, envelope playback ditangani oleh envelope GUS. |
| `loop` | Jika bernilai truthy, sampel dirender sebagai suara periodik/loop. |
| `cycleSamples` | Jumlah sampel eksplisit per siklus loop. Jika tidak ada, nilainya dihitung dari frekuensi dasar dan sample rate. |
| `cycles` | Banyaknya siklus sampai akhir bagian loop; nilai bawaan `12`. |
| `loopSkip` | Banyaknya siklus sebelum titik mulai loop; nilai bawaan `3`. |
| `tailCycles` | Banyaknya siklus tambahan untuk ekor/release loop. Jika tidak diatur, panjangnya diturunkan dari frekuensi dan `env.r`, dengan minimum 4 siklus. |
| `loopAttack` | Lama fade-in dalam detik sebelum wilayah loop. |
| `loopAttackNoise` | Noise transient `{ amp, duration }` yang ditempatkan sebelum loop. Properti ini digunakan untuk preset loop, sebagai pengganti `attackNoise`. |
| `loopFadeIn` | Jika `false`, menonaktifkan fade-in awal pada loop dan penggunaan `loopAttack`. |
| `sustainLoop` | Nilai `false` menghilangkan penanda sustain-loop GUS tanpa menghapus loop sampel. |
| `patchEnvelope` | Envelope GUS opsional yang ditulis ke header, berupa enam nilai mentah `rates` dan enam nilai `offsets`. |
| `noise` | Pada melodi biasa, angka blend noise: one-shot memakai white noise dan loop memakai siklus pink-noise berulang. Dalam `renderMode: "drum"`, properti ini berupa objek noise seperti pada preset drum. |
| `fm` | Modulasi frekuensi: `ratio` adalah rasio frekuensi modulator terhadap carrier, `index` adalah kedalaman modulasi. Untuk loop, FM hanya digunakan jika `ratio` bilangan bulat. |
| `detune` | Array nilai detuning suara dalam sen. Diabaikan pada loop. |
| `tremolo` | Opsional `{ rate, sweep, depth }`: `rate` dalam hertz `0–25` (dipetakan ke byte GUS `0–255`), `sweep` byte GUS `0–255`, dan `depth` fraksi amplitudo `0–1` (dipetakan ke byte `0–255`). Nilai dikodekan ke header sampel PAT, bukan diterapkan ke PCM. Properti yang tidak ada menghasilkan nilai nol; belum ada preset melodi bawaan yang mengaktifkannya. |
| `vibrato` | Objek `{ rate, sweep, depth }`: `rate` dalam hertz, `sweep` byte GUS `0–255` untuk onset, dan `depth` sebagai fraksi pitch (hingga `0,02` saat dipetakan ke GUS). Vibrato dapat diterapkan pada PCM one-shot; nilai loop saat ini tidak ditulis oleh encoder PAT. |
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
| `renderMode` | Nilai `"drum"` merender preset melodi sebagai one-shot dengan pitch scaling menggunakan komponen renderer drum. |
| `tones` | Digunakan dalam `renderMode: "drum"`; struktur elemennya sama dengan properti `tones` pada preset drum. |
| `membrane`, `metallic`, `noiseLayers`, `impact`, `impacts`, `click`, `bursts` | Komponen renderer drum tambahan yang dapat dipakai oleh preset melodi ber-`renderMode: "drum"`; struktur dan arti nilainya sama dengan komponen drum. |
| `highpass` | Cutoff high-pass dalam hertz, diterapkan pada sampel hasil render. |
| `graphicEqualizer` | Array opsional berisi tepat 10 gain desibel dalam urutan band `[31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]` Hz. Setiap nilai harus berada pada rentang `-12` hingga `+12` dB; UI mengubahnya dengan langkah `0.1` dB dan preset bawaan menggunakan sepuluh nilai nol. Renderer menerapkan filter peaking berurutan dengan `Q=1.4` langsung pada PCM sebelum normalisasi. Efeknya menjadi bagian dari sampel PAT/SF2, bukan metadata header; band yang frekuensinya mencapai `49%` sample rate render atau lebih akan dilewati. |
| `lowpass` | Cutoff low-pass dalam hertz untuk `renderMode: "drum"`. Untuk loop melodi biasa, low-pass menggunakan `brightness.loopCutoff`. |
| `fadeOut` | Lama fade-out dalam detik untuk one-shot `renderMode: "drum"`. |
| `pitchInvariant` | Jika `true` pada preset `renderMode: "drum"`, frekuensi tone dan noise tidak diskalakan oleh nada MIDI; suara tetap pada karakter pitch yang ditentukan. |
| `noiseOnly` | Pada loop melodi biasa, `true` membuat preset memakai noise sebagai suara utama dan mengabaikan lapisan pink-noise normal. |
| `lowNoise` | Besar brown-noise pelengkap untuk loop ber-`noiseOnly`; digunakan bersama `noise` sebagai parameter lapisan utama. |
| `loopStartSeconds`, `loopEndSeconds` | Titik mulai dan akhir wilayah loop dalam detik. Pada loop melodi biasa, keduanya harus diisi sebagai pasangan valid; pada loop `renderMode: "drum"`, awal default `0` dan akhir default `duration`. |
| `loopCrossfadeSeconds` | Panjang crossfade overlap pada seam loop untuk preset `renderMode: "drum"`, dibatasi seperempat panjang wilayah loop. |
| `noiseBursts` | Burst noise acak untuk melodi `renderMode: "drum"`; mendukung `density`, `peak`, dan array band `{ center, q, amp }`. |

#### Fungsi Penangan Properti Melodi

Fungsi berikut berada di `JSGUS/ProjectPatchGenerator.js`. Nama fungsi
menunjukkan titik kode yang membaca atau meneruskan properti; beberapa
properti diproses oleh lebih dari satu fungsi.

| Properti | Fungsi yang menangani |
| --- | --- |
| `GUS_MELODIC_PRESETS.gain` | `InstrumentLibrary._buildMelodic()` memvalidasi dan menyimpan master gain; `ProjectPatchGenerator.generate()` mengalikannya dengan `preset.gain`. |
| `program` | `InstrumentLibrary._buildMelodic()` memvalidasi dan menyusun indeks program; `InstrumentLibrary.findMelodic()` mencari instrumen; `ProjectPatchGenerator.generate()` memilih program yang dirender. |
| `family` | `InstrumentLibrary._buildMelodic()` memvalidasi teks kategori. Properti ini tidak mengubah sintesis audio. |
| `name`, `shortName`, `description` | `InstrumentLibrary._buildMelodic()` memvalidasi metadata; `ProjectPatchGenerator.generate()` menyalurkannya ke hasil dan objek patch. `GusPatchEncoder.encode()` menulis nama yang diberikan pemanggil, tetapi tidak menerima `description` dan menggunakan teks header tetap `Generated by Planetbiru Instrument Creator`. |
| `preset` | `InstrumentLibrary._buildMelodic()` memvalidasi objeknya; `ProjectPatchGenerator.generate()` memilih dan meneruskannya ke `MelodicRenderer.render()`. |
| `zones` | `ProjectPatchGenerator.getPitchRanges()` memproses zona sampai mencakup MIDI 0–127, memotong zona yang melewati batas, atau memperlebar zona terakhir jika jumlahnya kurang. Jika override tidak tersedia, fungsi memakai profil berdasarkan program. |
| `mute`, `gain` | `ProjectPatchGenerator.generate()` menghitung gain keluaran sebelum PCM dikonversi ke signed 16-bit. |
| `defaultWaveform` | `ProjectPatchGenerator.generate()` memilih profil waveform; `ProjectPatchGenerator.waveformHarmonics()` membentuk amplitudo harmoniknya. |
| `freq` | `ProjectPatchGenerator.generate()` memilih frekuensi root; `MelodicRenderer.render()` menggunakannya sebagai frekuensi dasar atau frekuensi referensi. |
| `sampleRate` | Properti ini tidak dipakai dari preset melodi oleh jalur `generate()`. Opsi generator ditetapkan oleh `ProjectPatchGenerator.constructor()` dan diteruskan ke `MelodicRenderer.constructor()`. |
| `length`, `duration` | `MelodicRenderer.render()` menentukan panjang one-shot melodi; `ProjectPatchGenerator.generate()` meneruskan durasi efektif. Untuk `renderMode: "drum"`, `DrumRenderer.constructor()` menghitung panjang dari `duration`. |
| `harm`, `phases`, `antiAlias`, `inharmonicity`, `partialDecay`, `pluckPosition` | `MelodicRenderer.render()` membentuk parsial, fase awal, penyaringan alias, peregangan parsial, peluruhan harmonik, dan spektrum posisi petikan. |
| `phaseScale` | Tidak dibaca oleh renderer. Fase tiap harmonik diatur melalui `phases`. |
| `env` | `MelodicRenderer.render()` memberikan envelope ke `MelodicRenderer._envelope()` untuk one-shot; pada loop, `env.r` juga dapat menentukan panjang tail default. |
| `loop`, `cycleSamples`, `cycles`, `loopSkip`, `tailCycles`, `loopStartSeconds`, `loopEndSeconds` | `MelodicRenderer.constructor()` menetapkan mode loop; `MelodicRenderer.render()` menentukan periode, panjang, dan batas loop. Waktu mulai/akhir dapat mengatur loop reguler maupun loop `renderMode: "drum"`. |
| `loopCrossfadeSeconds` | Cabang `renderMode: "drum"` pada `MelodicRenderer.render()` membatasi panjang crossfade dan menyambung ulang wilayah loop. |
| `loopAttack`, `loopAttackNoise`, `attackNoise`, `loopFadeIn` | `MelodicRenderer.render()` menentukan fade/transient awal; `loopFadeIn` dapat meniadakan fade loop. Transient noise dibangkitkan dengan `GUSPatchGenerator.pinkNoise()`. |
| `sustainLoop`, `patchEnvelope` | `ProjectPatchGenerator.generate()` membentuk flag sustain dan nilai envelope sampel; `GusPatchEncoder.encode()` menulisnya ke header sampel PAT. |
| `noise`, `noiseOnly`, `lowNoise` | `MelodicRenderer.render()` mencampur noise dengan suara; `MelodicRenderer._buildLoopNoise()` membuat siklus pink-noise atau brown-noise untuk loop. Dalam `renderMode: "drum"`, noise diteruskan ke `DrumRenderer`. |
| `fm`, `detune`, `vibrato`, `vibratoOnset`, `pitchScoop` | `MelodicRenderer.render()` menerapkan modulasi, detuning, vibrato, dan tekukan pitch pada PCM sesuai mode loop/one-shot. Vibrato loop juga dipetakan menjadi metadata oleh `ProjectPatchGenerator.generate()`. |
| `tremolo` | `MelodicRenderer.render()` menerapkan tremolo loop pada PCM; `ProjectPatchGenerator.generate()` memetakan parameternya ke rentang byte GUS; `GusPatchEncoder.encode()` menulis nilai tersebut ke header sampel. |
| `pluckTransient` | `MelodicRenderer.render()` membuat transient melalui `GUSPatchGenerator.bandpassNoise()`. |
| `brightness` | `MelodicRenderer.render()` memilih `GUSPatchGenerator.brightnessSweep()` untuk one-shot atau `GUSPatchGenerator.lowpass()` untuk loop. |
| `formants`, `drive`, `guitarAmp` | `MelodicRenderer.render()` memanggil `GUSPatchGenerator.applyFormants()`, `GUSPatchGenerator.softClip()`, dan `GUSPatchGenerator.guitarAmp()` untuk membentuk warna suara. |
| `renderMode`, `pitchInvariant`, `tones`, `membrane`, `metallic`, `noiseLayers`, `impact`, `impacts`, `noiseBursts`, `click`, `bursts` | `MelodicRenderer.render()` menangani `renderMode: "drum"`, penskalaan pitch, dan loop khusus; komponen bunyi diteruskan ke `DrumRenderer.render()` dan fungsi komponennya (`_tones()`, `_setupMembrane()`/`_membrane()`, `_setupMetallic()`/`_metallic()`, `_buildNoiseBursts()`, `_buildNoise()`/`_noise()`, `_impact()`, `_click()`, `_bursts()`). |
| `highpass`, `lowpass`, `graphicEqualizer` | `MelodicRenderer.render()` menerapkan `GUSPatchGenerator.highpass()`, `GUSPatchGenerator.lowpass()` untuk mode drum, dan `GUSPatchGenerator.applyGraphicEqualizer()`. Equalizer default ditambahkan oleh `InstrumentLibrary.withDefaultGraphicEqualizer()`. |
| `fadeOut` | Untuk `renderMode: "drum"`, `DrumRenderer.render()` menentukan jumlah sampel fade-out dan memanggil `GUSPatchGenerator.fadeOut()`. |

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
`loopAttackNoise` ditempatkan sebelum wilayah loop. `tremolo` loop diterapkan
pada PCM oleh `MelodicRenderer.render()` dan parameternya juga disimpan pada
header sampel GUS. `vibrato` one-shot diterapkan pada PCM, sedangkan vibrato
loop diteruskan sebagai metadata header GUS. Efek metadata bergantung pada
player PAT yang digunakan.

Untuk `renderMode: "drum"`, `freq` menjadi pitch referensi. Pitch MIDI yang
diminta menskalakan frekuensi nada dan cutoff filter. Setiap elemen `tones`
mendukung `fStart` dan `fEnd` dalam hertz. `fPeak`, `riseTime`, dan `fallTime`
opsional membentuk kenaikan/penurunan pitch; tanpa `fPeak`, `pitchDecay`
mengatur pitch slide eksponensial. `decay` mengatur ekor amplitudo, `amp`
mengatur level, dan `fm: { ratio, index }` menambahkan modulasi frekuensi.

Sample rate melodi dikendalikan oleh opsi `sampleRate` pada
`ProjectPatchGenerator`; properti `sampleRate` di preset melodi tidak dibaca.

### 4.3 Properti Preset Drum

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
| `noise.attack` | Lama attack noise dalam detik pada lapisan `noise` atau `noiseLayers`; jika tidak ada, attack langsung penuh. |
| `noiseBursts` | Burst noise acak berlapis; mendukung `density` untuk jumlah event per detik, `peak` normalisasi, serta `bands[]: { center, q, amp }`. |
| `impact` | Satu impact noise dengan `amp`, `duration`, `decay`, `delay` opsional, `type`, dan `bandpass` opsional. |
| `impacts` | Array impact dengan struktur yang sama seperti `impact`, untuk menggabungkan beberapa benturan. |
| `click` | Klik attack pendek dari noise acak, dengan `duration` dalam detik dan `amp`. |
| `bursts` | Array waktu mulai burst noise dalam detik. Setiap burst berlangsung sekitar 12 ms. |
| `highpass`, `lowpass` | Cutoff high-pass dan low-pass opsional dalam hertz. |
| `graphicEqualizer` | Array opsional berisi tepat 10 gain desibel dalam urutan band `[31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]` Hz. Setiap nilai harus berada pada rentang `-12` hingga `+12` dB; UI mengubahnya dengan langkah `0.1` dB dan preset bawaan menggunakan sepuluh nilai nol. Renderer menerapkan filter peaking berurutan dengan `Q=1.4` pada PCM sebelum normalisasi. Efeknya dibakar ke sampel PAT/SF2, bukan disimpan sebagai metadata header; band pada atau di atas `49%` sample rate render dilewati. |
| `fadeOut` | Panjang fade-out dalam detik. Jika tidak diatur, fade dibatasi hingga 96 sampel atau 5% panjang sampel, mana yang lebih pendek. |
| `tremolo` | Opsional `{ rate, sweep, depth }` dengan `rate` `0–25` Hz (dipetakan ke byte GUS `0–255`), `sweep` byte GUS `0–255`, dan `depth` fraksi amplitudo `0–1` (dipetakan ke byte `0–255`). Nilai ditulis ke header PAT; tidak mengubah PCM dan tidak diaktifkan pada preset drum bawaan. |

#### Fungsi Penangan Properti Drum

Fungsi berikut juga berada di `JSGUS/ProjectPatchGenerator.js`.

| Properti | Fungsi yang menangani |
| --- | --- |
| `GUS_DRUM_PRESETS.gain` | `InstrumentLibrary._buildDrums()` memvalidasi dan menyimpan master gain; `ProjectPatchGenerator.generate()` mengalikannya dengan `preset.gain`. |
| `note` | `InstrumentLibrary._buildDrums()` memvalidasi dan memastikan keunikan; `InstrumentLibrary.findDrum()` mencari nada; `ProjectPatchGenerator.generate()` memilih drum dan menetapkan frekuensi root melalui `InstrumentLibrary.drumToFreq()`. |
| `name`, `shortName`, `description` | `InstrumentLibrary._buildDrums()` memvalidasi metadata; `ProjectPatchGenerator.generate()` menyalurkannya ke hasil dan objek patch. `GusPatchEncoder.encode()` menulis nama yang diberikan pemanggil, tetapi tidak menerima `description` dan menggunakan teks header tetap `Generated by Planetbiru Instrument Creator`. |
| `preset` | `InstrumentLibrary._buildDrums()` memvalidasi objek; `ProjectPatchGenerator.generate()` memeriksa `sampleRate` dan meneruskan preset ke `DrumRenderer`. |
| `mute`, `gain` | `ProjectPatchGenerator.generate()` menghitung gain keluaran sebelum konversi PCM. |
| `duration`, `sampleRate` | `ProjectPatchGenerator.generate()` memilih sample rate render; `DrumRenderer.constructor()` menghitung panjang sampel dari durasi dan sample rate. |
| `tones` dan properti tiap nada | `DrumRenderer.render()` menyiapkan nada; `DrumRenderer._tones()` menghitung pitch, modulasi FM, amplitudo, dan decay. |
| `membrane`, `membrane.modes` | `DrumRenderer.render()` menyiapkan lapisan; `DrumRenderer._setupMembrane()` membentuk mode parsial dan `DrumRenderer._membrane()` merendernya. |
| `metallic` | `DrumRenderer.render()` menyiapkan lapisan; `DrumRenderer._setupMetallic()` membentuk parsial dan `DrumRenderer._metallic()` merendernya. |
| `noise`, `noiseLayers` | `DrumRenderer.render()` membangun dan mencampur lapisan melalui `DrumRenderer._buildNoise()` dan `DrumRenderer._noise()`. Bentuk noise/filter band-pass didukung oleh `GUSPatchGenerator.pinkNoise()`, `GUSPatchGenerator.brownNoise()`, dan `GUSPatchGenerator.bandpassNoise()`. |
| `noise.attack` | `DrumRenderer._noise()` menerapkan kurva attack pada lapisan noise. |
| `noiseBursts` | `DrumRenderer.render()` membuat lapisan burst dengan `DrumRenderer._buildNoiseBursts()`. |
| `impact`, `impacts` | `DrumRenderer.render()` menyiapkan buffer noise; `DrumRenderer._impact()` menerapkan delay, durasi, amplitudo, dan decay. |
| `click` | `DrumRenderer._click()` menghasilkan klik pada awal sampel. |
| `bursts` | `DrumRenderer._bursts()` mengganti campuran sampel dengan burst singkat pada waktu yang ditentukan. |
| `highpass`, `lowpass`, `graphicEqualizer` | `DrumRenderer.render()` memanggil `GUSPatchGenerator.highpass()`, `GUSPatchGenerator.lowpass()`, dan `GUSPatchGenerator.applyGraphicEqualizer()`. Equalizer default ditambahkan oleh `InstrumentLibrary.withDefaultGraphicEqualizer()`. |
| `fadeOut` | `DrumRenderer.render()` memilih panjang fade dan memanggil `GUSPatchGenerator.fadeOut()`. |
| `tremolo` | `ProjectPatchGenerator.generate()` memetakan parameter ke rentang byte GUS dan `GusPatchEncoder.encode()` menyimpannya di header sampel; `DrumRenderer` tidak menerapkannya pada PCM. |

Nada, membran, komponen metalik, noise, impact, click, dan burst dapat
digabungkan pada preset yang sama. Renderer menjumlahkan komponen, menerapkan
filter dan fade pada tepi sampel, kemudian menormalisasi hasil sebelum
pengodean patch. Properti preset drum tidak mengatur panning; balance sampel
GUS ditetapkan di tengah (`7`).

## 5. Tahapan Pembentukan Berkas

1. Koleksi preset melodi dan drum dimuat ke halaman.
2. Objek `ProjectPatchGenerator` diinisialisasi dengan sample rate dan, apabila
   diperlukan, durasi yang ditentukan.
3. Jenis instrumen dan identitasnya ditentukan melalui nomor program melodi
   atau nomor nada drum.
4. Metode `generate({ isDrum, program, pitchFrom, pitchTo })` memproses preset.
   Untuk drum, parameter `program` berisi nomor nada drum.
5. Hasil `generate()` berupa objek JavaScript, bukan berkas PAT siap unduh.
   Data sampel tersedia pada
   `result.patch.instruments[0].layers[0].samples[0]`.
6. `GusPatchEncoder.encode()` mengodekan data sampel dan metadata menjadi
   berkas PAT.
7. Pada contoh distribusi, berkas PAT dimasukkan ke ZIP dengan metode `STORE`
   (tanpa kompresi).

Contoh berikut menggunakan rentang nada MIDI `0–127` dan menghasilkan satu
sampel. Implementasi ekspor instrumen melodi dapat menggunakan beberapa zona
sampel; contoh ini dibatasi pada satu sampel per PAT.

### Profil Ketelitian Zona Melodi

Ekspor instrumen melodi membagi rentang MIDI `0–127` menurut karakter
instrumen agar ukuran berkas PAT tetap efisien:

| Profil | Zona | Instrumen |
| --- | ---: | --- |
| Tinggi | 19 | Program 0–15; Piano dan Chromatic; 24–31; Guitar; 40–47; Strings; 56–79; Brass, Reed, dan Pipe |
| Khusus Bass | 16 | Program 32–39; selalu memakai `BASS_PITCH_RANGES` melalui `MELODIC_BASS_PRECISION_PROGRAMS` |
| Sedang | 10 | Program 16–23; Organ; 48–55; Ensemble; 80–87; Lead |
| Rendah | 6 | Program 88–127; Pad, FX, dan SFX |

Jumlah zona berbeda menurut profil yang ditetapkan untuk tiap instrumen:
instrumen yang sensitif terhadap perubahan pitch dan karakter transien memakai
lebih banyak zona, sedangkan instrumen yang stabil secara spektral atau toleran
terhadap perubahan pitch memakai lebih sedikit zona. Rentang zona tidak selalu
berjarak sama. Pada profil tinggi, zona lebih rapat di register tengah yang
umum digunakan dan lebih lebar di ujung rentang; profil bass juga lebih rapat
di wilayah rendah hingga menengah sebelum melebar di nada tinggi. Pembagian ini
mengalokasikan lebih banyak sampel pada wilayah pitch yang lazim dimainkan.
Tujuannya adalah meningkatkan kualitas suara pada rentang nada tersebut sambil
menjaga jumlah sampel dan ukuran data agar tidak terlalu besar.
Rentang tersebut ditentukan sebelumnya dalam kode, bukan dihitung secara
adaptif dari statistik penggunaan aktual.

Daftar program disimpan secara eksplisit pada `MELODIC_PRECISION_PROGRAMS_HIGH`,
`MELODIC_PRECISION_PROGRAMS_BASS`, `MELODIC_PRECISION_PROGRAMS_MEDIUM`, dan
`MELODIC_PRECISION_PROGRAMS_LOW` dalam `JSGUS/ProjectPatchGenerator.js`.

Preset melodi dapat mengganti profil bawaan dengan properti `preset.zones`.
Nilainya adalah lebar tiap zona, bukan batas nada; misalnya delapan zona dengan
lebar `[16, 16, 16, 16, 16, 16, 16, 16]` mencakup seluruh 128 nada MIDI.
Rentang dibentuk berurutan dari nada `0`, sehingga preset dapat menggabungkan
zona lebar dan sempit sesuai karakter instrumen. Jika jumlah kumulatif mencapai atau melewati `128`, generator berhenti
memproses zona berikutnya; zona yang melewati batas dipotong agar rentang
terakhir berakhir pada nada `127`. Jika jumlahnya kurang dari `128`, sisa
rentang ditambahkan ke zona terakhir yang digunakan. Override ini hanya untuk
instrumen melodi; rentang drum tetap menggunakan pemetaan drum yang sudah ada.

## 6. Contoh Implementasi HTML Mandiri

Untuk menjalankan contoh, berkas HTML ditempatkan pada direktori yang sama
dengan folder `JSGUS` dan `jszip`, kemudian disajikan melalui server web lokal
atau server aplikasi agar skrip dapat dimuat melalui HTTP. Contoh ini tidak
mengasumsikan pemuatan berkas secara langsung melalui `file://`.

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
          envOffsets: sample.envOffsets,
          tremoloSweep: sample.tremoloSweep,
          tremoloRate: sample.tremoloRate,
          tremoloDepth: sample.tremoloDepth
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

### Catatan Penggunaan Contoh

- Pada mode melodi, nilai yang dimasukkan merupakan nomor program MIDI. Pada
  mode drum, nilai tersebut merupakan nomor `note` yang tersedia di preset
  drum; nilai awal contoh adalah `25`.
- Contoh menggunakan sample rate `22050` Hz dan mengikuti durasi bawaan
  generator serta preset.
- Status loop dan envelope patch dipertahankan. Data PCM dikonversi dari byte
  menjadi sampel float sebelum dikirim ke encoder, kemudian satu berkas PAT
  dimasukkan ke ZIP dengan `compression: 'STORE'`.
- Apabila nomor drum tidak tersedia atau preset tidak lolos validasi, halaman
  menampilkan pesan kesalahan dan tidak menghasilkan ZIP.

## 7. Pemeriksaan Hasil

1. Arsip hasil unduhan memiliki ekstensi `.zip`.
2. Isi arsip terdiri atas tepat satu berkas `.pat` dengan metode kompresi
   `Store`/`Stored` (tanpa kompresi).
3. Berkas PAT dapat diekstrak, memiliki ukuran lebih dari nol, dan dapat
   dibuka oleh aplikasi yang mendukung format GUS.
4. Pemutaran diuji pada beberapa nada yang sesuai. Sampel satu zona dapat
   menunjukkan karakter berbeda pada nada yang jauh dari frekuensi dasarnya.
5. Apabila hasil tidak sesuai, pemeriksaan mencakup identitas program/nada,
   urutan pemuatan skrip, konsol browser, serta nilai dan struktur objek
   `preset`.

Berkas PAT yang dihasilkan menggunakan format patch GUS dengan header
`GF1PATCH110` dan sampel PCM signed 16-bit little-endian. Dokumen ini
merangkum fungsi, alur pemrosesan, format keluaran, dan batasan teknis modul
berdasarkan implementasi sumber yang dirujuk.
