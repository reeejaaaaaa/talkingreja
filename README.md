# TalkingReja

Dua karakter 3D terpisah dalam satu web. Rheza mempertahankan wajah, rambut, dan proporsi yang sudah dipilih; bajunya putih polos dengan kerah hitam dan logo EXO di tengah. Dudu berbentuk beruang cokelat muda tanpa baju, dengan kepala lebar, badan pendek dan gempal, serta pipi kuning.

## Menjalankan

Tidak perlu install dependency. Buka terminal di folder proyek ini. Gunakan perintah Python di bawah.

Jalankan `python -m http.server 8766 --bind 127.0.0.1` dari folder ini, kemudian buka http://127.0.0.1:8766/. Three.js disertakan secara lokal; font online opsional dengan font cadangan.

## Cara main

- Pilih Rheza atau Dudu di atas panggung. Pergantian karakter memulai keadaan netral.
- Tekan pipi agar masuk ke dalam; tahan lalu seret untuk membuatnya melar mengikuti kursor/jari.
- Selama pipi yang sudah ditarik masih ditahan, karakter menyipit dan manyun. Lepas untuk kembali normal.
- Empat kali toel pipi berturut-turut memicu ketawa dengan mata merem dan mulut terbuka. Toel dihitung saat jari/kursor dilepas tanpa menarik pipi. Tarikan pipi (lebih dari 8 piksel, meskipun kembali ke titik awal) membatalkan seluruh hitungan; boop hidung atau input yang dibatalkan juga memutus urutan. Tidak ada batas waktu tersembunyi antartoel. Input yang dimulai selama ketawa diabaikan; setelah selesai perlu empat toel baru.
- Ketawa yang sedang berjalan tidak diputus oleh tarikan. Kalau masih ditahan setelah ketawa selesai, ekspresi sebal muncul kembali.
- Hidung/area tengah wajah bisa di-boop. Dua pointer didukung; sentuhan fisik pada HP belum diuji.
- Tombol demo memperagakan interaksi. Putar model mengganti mode menjadi rotasi. Reset mengembalikan karakter aktif ke keadaan awal.

## Model dan kode

- `model.js`: wajah Rheza yang dipertahankan dan baju EXO.
- `dudu.js`: model serta ekspresi Dudu, dengan bentuk dan ukuran sendiri.
- `deform.js`: deformasi lokal dan pegas pemulihan pipi.
- `laugh-state.js`, `pull-state.js`: klasifikasi toel/tarikan, hitungan ketawa, dan status tarikan yang ditahan.
- `laugh-face.js`, `pull-face.js`: ekspresi Rheza saat ketawa dan ditarik.
- `app.js`: pilihan karakter, cahaya, kamera, interaksi, dan ekspor.
- `mini-rheza-reference-v4.glb`, `dudu-chubby-bear.glb`: model netral yang dapat dimuat ke proyek 3D lain. Tombol Unduh mengekspor karakter yang sedang dipilih.

Animasi interaktif dijalankan oleh JavaScript dalam paket web ini. GLB netral sendiri tidak menyertakan hitungan toel, simulasi pegas, atau seluruh animasi runtime. Model dibuat secara prosedural tanpa tekstur foto wajah; Dudu merupakan interpretasi 3D kartun dari referensi pengguna.

Three.js menggunakan lisensi MIT; lihat `vendor/LICENSE-three.txt`.

## Tes

Jalankan `node tests/run.cjs` (Node.js diperlukan). Tes mencakup 15 skenario toel/tarikan pada handler aplikasi, hitungan ketawa, status tarikan, dan pemulihan ekspresi. Model GLB sudah divalidasi tanpa error maupun warning.

Referensi logo EXO: https://commons.wikimedia.org/wiki/File:Logo_de_EXO.png.
