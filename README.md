# Monitor Tinggi Muka Air

Pantau ketinggian air dan tumpukan sampah di sungai atau saluran secara langsung, dari mana saja.

Tiga sensor ultrasonik pada satu ESP32 mengukur jarak ke permukaan air. Datanya dikirim ke Firebase, lalu dashboard web ini menampilkannya secara realtime dan menyimpannya sebagai riwayat yang bisa dilihat, difilter, dan diunduh.

## Kenapa sistem ini?

- **Realtime, bukan refresh.** Dashboard berlangganan langsung ke Firebase. Begitu sensor mengirim nilai baru (±3 detik), angka dan grafik ikut bergerak.
- **Riwayat yang bisa ditelusuri.** Setiap 30 detik satu titik disimpan ke riwayat. Lihat sebagai data apa adanya per rentang tanggal, atau sebagai rata-rata per jam, hari, dan bulan. Tersedia dalam grafik dan tabel, dan bisa diunduh sebagai CSV atau PDF.
- **Peringatan dini yang mudah dibaca.** Garis SIAGA dan BAHAYA ada langsung di grafik, dan sumbunya menampilkan tinggi air dari dasar — garis naik berarti air naik.
- **Bukan cuma air, tapi juga sampah.** Tiga sensor yang dipasang berjajar membentuk profil permukaan. Dari bentuk itu, sistem menebak apakah yang terdeteksi air, permukaan miring, atau sampah (beserta posisinya: kiri, tengah, kanan).
- **Konteks cuaca.** Suhu dan kondisi cuaca di lokasi stasiun tampil di dashboard, lengkap dengan kelembapan dan peluang hujan di halaman Peta.
- **Tetap bekerja di lapangan.** Perangkat menampilkan status di layar (OLED atau TFT). Saat kondisi BAHAYA, perangkat mengirim peringatan ke Telegram, dan memakai SMS sebagai cadangan kalau internet bermasalah.
- **Nyaman dipakai di mana saja.** Tersedia mode terang dan gelap, dan tampilannya menyesuaikan layar desktop, tablet, maupun ponsel.

## Fitur dashboard

| Halaman | Isi |
|---|---|
| **Grafik** | Tiga kartu **Realtime Sensor** (angka terkini, status, dan grafik yang bergerak langsung), prediksi objek dari ketiga sensor, lalu dua pasang bagian riwayat: **Riwayat Data** dengan tabelnya, dan **Riwayat Rata-rata** dengan tabelnya. Ringkasan cuaca ada di kanan judul halaman. |
| **Peta** | Lokasi stasiun dengan perkiraan area terdampak. Warna penandanya mengikuti kondisi terburuk dari ketiga sensor, popup-nya merinci tinggi air dan status tiap sensor, ada tombol *Zoom ke stasiun*, dan kartu cuaca di kanan atas. |
| **Tentang** | Dua sub-tab: ringkasan sistem, dan profil peneliti. |
| **Admin** | Khusus admin: pengaturan kalibrasi dan ambang sensor, serta daftar pengguna. |

### Riwayat

- **Riwayat Data**: pembacaan apa adanya, dari yang terbaru. Filter **Dari – Sampai** tanggal; dikosongkan berarti seluruh riwayat.
- **Riwayat Rata-rata**: tab **Harian** (rata-rata per jam), **Bulanan** (per hari), dan **Tahunan** (per bulan), selalu dari yang terbaru.
- Grafik dan tabel dibagi per halaman dengan tombol panah *lebih baru* dan *lebih lama*. Tabel menampilkan 20 baris per halaman dengan nomor yang berlanjut.
- **Unduh CSV**: seluruh data sesuai filter tabel tersebut.
- **Unduh PDF**: laporan berisi grafik dan tabel, dibatasi 1.500 titik atau baris terbaru supaya tetap ringan. Data lengkap lewat CSV.

Dashboard dilindungi akun: pengunjung mendaftar atau masuk lebih dulu sebelum data sensor terlihat.

## Cara kerja

```
HC-SR04 ×3 ──► ESP32 ──► Firebase Realtime Database ──► Dashboard web
                 │         ├─ /sensor1..3        (±3 detik, nilai terakhir)
                 │         └─ /history/sensorN   (30 detik, riwayat)
                 │
                 ├──► Layar OLED / TFT (di lokasi)
                 └──► Telegram, dengan SMS (SIM900A) sebagai cadangan

Open-Meteo ──► Dashboard web (cuaca, tanpa lewat ESP32)
```

Tiap 3 detik ESP32 membaca ketiga sensor, memperbarui layar, dan menulis nilai terakhir ke `/sensor1`, `/sensor2`, `/sensor3`. Setiap 30 detik, ESP32 juga menulis satu titik riwayat ke `/history/<sensor>/<waktu>`, dengan waktu dari NTP sebagai kuncinya (epoch milidetik). Titik riwayat dilewati kalau jam belum sinkron atau sensor sedang error.

Jarak yang terbaca diubah menjadi tinggi air dengan mengurangkannya dari jarak sensor ke dasar — angka kalibrasi yang diukur sekali di lapangan:

```
tinggi air = jarak sensor ke dasar − jarak terbaca
```

Status ditentukan dari tinggi air itu, jadi angkanya bermakna langsung tanpa perlu tahu setinggi apa alatnya dipasang:

| Status | Tinggi air dari dasar |
|---|---|
| NORMAL | di bawah ambang SIAGA |
| SIAGA | mulai dari ambang SIAGA |
| BAHAYA | mulai dari ambang BAHAYA |

Kalibrasi dan kedua ambang disimpan di Firebase dan bisa diubah dari dashboard, jadi mengganti patokan tidak perlu flash ulang perangkat.

### Prediksi objek

Prediksi memakai tinggi ketiga sensor (kiri, tengah, kanan). Sensor terendah dianggap permukaan air yang tidak terhalang, dan sensor yang terangkat minimal 5 cm di atasnya dianggap ada sesuatu di bawahnya. Aturannya dicek berurutan:

| Prediksi | Ciri |
|---|---|
| Tidak ada objek | semua sensor mendekati dasar |
| Air | permukaan rata (selisih < 5 cm) |
| Permukaan miring | tinggi berubah lurus dari kiri ke kanan, tanpa bagian yang menonjol |
| Sampah besar di … | selisih ≥ 30 cm |
| Sampah di … | selisih ≥ 15 cm |
| Objek kecil di … | tonjolan kecil, bisa daun, plastik, atau gelombang |

Ini prediksi berbasis aturan ambang, bukan deteksi pasti.

## Perangkat

- ESP32
- 3 × sensor ultrasonik HC-SR04, dipasang sejajar di kiri, tengah, dan kanan
- Layar OLED SSD1306 128×64 atau TFT ST7789
- Modul GSM SIM900A

Sketsa firmware (Arduino) tidak ada di repositori ini.

## Teknologi web

- React 19 dan TypeScript, dibangun dengan Vite
- Firebase Realtime Database untuk data sensor dan riwayat, Firebase Auth untuk akun
- ECharts untuk grafik, Leaflet untuk peta
- TanStack Query untuk cuaca (di-cache antar halaman), Zustand untuk state
- jsPDF dan jspdf-autotable untuk PDF (dimuat hanya saat tombol Unduh PDF ditekan)
- SCSS Modules untuk gaya

## Menjalankan secara lokal

Yang dibutuhkan: Node.js 20 atau lebih baru.

```bash
npm install
```

Buat file `.env` di root proyek:

```bash
VITE_FIREBASE_URL=https://<nama-proyek>-default-rtdb.<region>.firebasedatabase.app
VITE_FIREBASE_API_KEY=<apiKey dari Project settings → Your apps>
VITE_FIREBASE_AUTH_DOMAIN=<nama-proyek>.firebaseapp.com
```

Ketiganya diambil dari Firebase Console.

Lalu jalankan:

```bash
npm run dev
```

Perintah lain:

| Perintah | Fungsi |
|---|---|
| `npm run build` | Build produksi ke folder `dist/` |
| `npm run typecheck` | Pemeriksaan tipe TypeScript |
| `npm run lint` | Pemeriksaan ESLint |

## Konfigurasi

Semua setelan ada di `src/utils/constants/MonitorConstants.tsx` dan ditandai `[CONFIG]`:

- **Lokasi stasiun**: koordinat dan nama yang tampil di peta, juga dipakai untuk cuaca
- **Kalibrasi & ambang**: diatur dari dashboard, tersimpan di Firebase
- **Ukuran halaman riwayat**: jumlah titik per halaman grafik dan tabel, ukuran tarikan data, dan batas titik PDF
- **Aturan prediksi objek**: label, deskripsi, dan ambang selisih tinggi

## Akses

Dashboard hanya bisa dibuka setelah masuk. Pendaftaran terbuka: akun baru dibuat sendiri lewat halaman Daftar, lalu langsung masuk. Akun juga bisa ditambah atau dinonaktifkan dari Firebase Console.

Domain aplikasi, termasuk domain produksi, harus terdaftar di Authentication → Settings → Authorized domains.

## Struktur data Firebase

Nilai terakhir, satu node per sensor:

```json
{
  "sensor1": { "jarak_cm": 42.5, "status": "SIAGA" },
  "sensor2": { "jarak_cm": 44.1, "status": "SIAGA" },
  "sensor3": { "jarak_cm": 61.0, "status": "NORMAL" }
}
```

Riwayat, kuncinya epoch milidetik (13 digit):

```json
{
  "history": {
    "sensor1": {
      "1760000000000": { "jarak_cm": 42.5, "tinggi_air": 157.5, "status": "SIAGA" }
    }
  }
}
```

Aturan akses ada di `database.rules.json` dan **harus dipublikasikan** di Firebase Console (Realtime Database → Rules). Perhatikan bahwa `history` bisa ditulis tanpa login (`.write: true`) karena ESP32 menulis tanpa akun; hanya pembacaannya yang mewajibkan masuk.

## Cuaca

Cuaca diambil dari [Open-Meteo](https://open-meteo.com/) tanpa API key. Layanan ini gratis untuk penggunaan non-komersial dan datanya berlisensi CC BY 4.0, jadi atribusi "Weather data by Open-Meteo.com" ditampilkan di kartu cuaca. Untuk penggunaan komersial, periksa ketentuan dan paket berbayarnya.

## Catatan

- Rata-rata Harian, Bulanan, dan Tahunan dihitung di browser dari titik riwayat mentah, dan bucket di tepi data yang belum lengkap disembunyikan. Satu bucket Tahunan butuh puluhan ribu titik, jadi untuk riwayat yang sangat panjang tab ini bisa lambat atau kosong sampai data cukup termuat. Data lengkap tetap bisa diambil lewat CSV.
- Tinggi air bergantung pada kalibrasi jarak sensor ke dasar. Dasar sungai berubah karena sedimentasi, jadi angka itu perlu diukur ulang sesekali.
- HC-SR04 punya sudut pancar yang lebar dan memantul buruk pada permukaan miring atau lunak, jadi pembacaan bisa meloncat dan prediksi objek bisa keliru. Ambang prediksi belum dikalibrasi dengan data uji lapangan.
