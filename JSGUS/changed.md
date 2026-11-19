# Catatan Perubahan Preset Melodi

## Analisis energi

- Ditinjau seluruh **128 preset melodi**. Sebanyak 36 sudah memiliki highpass dan 92 belum.
- Untuk penyaringan awal, tiap preset dirender pada nada acuan A2 (110 Hz), 8 kHz, kemudian spektrum 4096 sampel terakhir dianalisis menggunakan jendela Hann.
- Kandidat ditandai bila lebih dari 80% energi spektrumnya berada di bawah 250 Hz. Ini adalah ukuran relatif energi pada nada uji, bukan ukuran kenyaringan keseluruhan atau penilaian subjektif saat didengar.
- Dari 21 kandidat tanpa highpass yang melewati ambang, Contrabass, Timpani, dan Lead (bass+lead) tidak diubah karena karakter low-end-nya disengaja. Instrumen dari keluarga Bass, Perc, SFX, Chromatic, Pipe, Reed, dan Brass juga tidak diberi filter baru agar fundamental atau transien khasnya tidak terpotong.
- Cutoff 120 Hz dipilih untuk mengurangi sub-low secara moderat pada kandidat terpilih. Highpass sudah diterapkan oleh `MelodicRenderer`; `ProjectPatchGenerator.js` tidak perlu diubah.

## Preset yang diubah

Highpass **120 Hz** ditambahkan karena sebelumnya belum tersedia:

| Program | Instrumen |
| ---: | --- |
| 20 | Reed Organ |
| 21 | Accordion |
| 23 | Tango Accordion |
| 42 | Cello |
| 44 | Tremolo Str |
| 45 | Pizzicato |
| 46 | Harp |
| 80 | Lead (square) |
| 81 | Lead (saw) |
| 83 | Lead (chiff) |
| 84 | Lead (charang) |
| 85 | Lead (voice) |
| 88 | Pad (new age) |
| 89 | Pad (warm) |
| 95 | Pad (sweep) |
| 99 | FX (atmosphere) |
| 105 | Banjo |
| 107 | Koto |

Filter ini hanya mengurangi energi relatif di frekuensi bawah; tidak menaikkan level frekuensi tinggi secara langsung.

## Percobaan tuning Distortion Gtr (sudah di-rollback)

Program 30 (**Distortion Gtr**) disetel untuk mengurangi kekasaran saturasi dan low-end:

| Parameter | Sebelum | Sesudah |
| --- | ---: | ---: |
| Guitar amp drive | 3.5 | 2.5 |
| Wet mix | 0.95 | 0.8 |
| Hard clip | 0.2 | 0.1 |
| Continuous noise | 0.02 | 0.004 |
| Preamp highpass | 100 Hz | 160 Hz |
| Preset highpass | 800 Hz | 1000 Hz |

Drive, wet mix, hard clip, dan noise kontinu yang lebih rendah mengurangi saturasi kasar serta desis. Cutoff preamp yang lebih tinggi menekan low-end sebelum saturasi; highpass preset mengurangi low-end tersisa setelah render.
Perubahan pada tabel ini telah di-rollback dan tidak aktif pada preset saat ini.

## Percobaan tuning Overdriven Gtr (sudah di-rollback)

Program 29 (**Overdriven Gtr**) disetel untuk mengurangi low-end:

| Parameter | Sebelum | Sesudah |
| --- | ---: | ---: |
| Preamp highpass | 90 Hz | 160 Hz |
| Preset highpass | 800 Hz | 1000 Hz |

Drive tetap 1 dan wet mix tetap 0 karena konfigurasi ini sudah menonaktifkan saturasi amp tambahan; hard clipping juga tidak digunakan. Filter yang lebih tinggi mengurangi energi rendah tanpa menambahkan saturasi baru.
Perubahan pada tabel ini telah di-rollback dan tidak aktif pada preset saat ini.

## Penyesuaian noise Distortion Gtr setelah rollback

Noise kontinu program 30 diturunkan dari **0,02** menjadi **0,01**. Parameter drive, mix, clipping, dan filter dibiarkan pada nilai awal agar pengurangan noise tidak menurunkan level maupun mengubah karakter gitar secara berlebihan.