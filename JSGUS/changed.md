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