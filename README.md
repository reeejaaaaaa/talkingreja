# TalkingReja

Dua karakter 3D terpisah dalam satu web. Rheza mempertahankan wajah, rambut, dan proporsi yang sudah dipilih; bajunya putih polos dengan kerah hitam dan logo EXO di tengah. Dudu berbentuk beruang cokelat muda tanpa baju: kepala lebar menyatu dengan badan, tangan pendek di samping, dan kaki kecil menyatu di bawah. Pipi serta perutnya bisa ditekan dan ditarik.

## Menjalankan

Tidak perlu install dependency. Buka terminal di folder proyek ini. Gunakan perintah Python di bawah.

Jalankan `python -m http.server 8766 --bind 127.0.0.1` dari folder ini, kemudian buka http://127.0.0.1:8766/. Three.js disertakan secara lokal; font online opsional dengan font cadangan.

## Cara main

- Pilih Rheza atau Dudu di atas panggung. Pergantian karakter memulai keadaan netral.
- Tekan pipi atau perut Dudu agar masuk ke dalam; tahan lalu seret untuk membuatnya melar mengikuti kursor/jari. Dua jari bisa mencubit dengan dua titik tarikan. Tangan dan kaki Dudu tidak menerima interaksi dan tidak ikut melar saat perut ditarik.
- Selama pipi yang sudah ditarik masih ditahan, karakter menyipit dan manyun. Lepas untuk kembali normal.
- Empat kali toel pipi/perut berturut-turut memicu ketawa dengan mata merem dan mulut terbuka. Toel dihitung saat jari/kursor dilepas tanpa menariknya. Tarikan pipi/perut (lebih dari 8 piksel, meskipun kembali ke titik awal) membatalkan seluruh hitungan; boop hidung atau input yang dibatalkan juga memutus urutan. Tidak ada batas waktu tersembunyi antartoel. Input yang dimulai selama ketawa diabaikan; setelah selesai perlu empat toel baru.
- Ketawa yang sedang berjalan tidak diputus oleh tarikan. Kalau masih ditahan setelah ketawa selesai, ekspresi sebal muncul kembali.
- Hidung/area tengah wajah bisa di-boop. Dua pointer didukung; sentuhan fisik pada HP belum diuji.
- Tombol demo di tengah memperagakan interaksi. Reset mengembalikan karakter aktif ke keadaan awal.

## Model dan kode

- `model.js`: wajah Rheza yang dipertahankan dan baju EXO.
- `dudu.js`: model serta ekspresi Dudu, dengan bentuk dan ukuran sendiri.
- `deform.js`: deformasi lokal dan pegas pemulihan pipi/perut, dengan pembatas bobot agar tangan dan kaki tetap utuh.
- `laugh-state.js`, `pull-state.js`: klasifikasi toel/tarikan, hitungan ketawa, dan status tarikan yang ditahan.
- `laugh-face.js`, `pull-face.js`: ekspresi Rheza saat ketawa dan ditarik.
- `app.js`: pilihan karakter, cahaya, kamera, interaksi, dan ekspor.
- `mini-rheza-reference-v4.glb`, `dudu-chubby-bear.glb`: model netral yang dapat dimuat ke proyek 3D lain. File ini merupakan aset proyek; antarmuka web tidak menyediakan fitur unduh GLB.

Animasi interaktif dijalankan oleh JavaScript dalam paket web ini. GLB netral sendiri tidak menyertakan hitungan toel, simulasi pegas, atau seluruh animasi runtime. Model dibuat secara prosedural tanpa tekstur foto wajah; Dudu merupakan interpretasi 3D kartun dari referensi pengguna.

Three.js menggunakan lisensi MIT; lihat `vendor/LICENSE-three.txt`.

## Tes

Jalankan `node tests/run.cjs` (Node.js diperlukan). Tes mencakup skenario toel/tarikan dan interaksi perut pada handler aplikasi, hitungan ketawa, status tarikan, dan pemulihan ekspresi. Model GLB sudah divalidasi tanpa error maupun warning.

Referensi logo EXO: https://commons.wikimedia.org/wiki/File:Logo_de_EXO.png.

## Deploy ke Vercel

Push perubahan ke GitHub, lalu import repo `talkingreja` di Vercel. Pilih Framework Preset `Other`, Root Directory folder utama repo, Build Command kosong, dan Output Directory `.`. Website ini tidak membutuhkan backend atau environment variable. Paket Hobby ditujukan untuk proyek pribadi nonkomersial.

Panduan: https://vercel.com/docs/builds/configure-a-build
