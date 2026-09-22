# Monitor Ketinggian Air

Pantau ketinggian air dan tumpukan sampah di sungai atau saluran secara langsung, dari mana saja.

Tiga sensor ultrasonik pada satu ESP32 mengukur jarak ke permukaan air. Datanya dikirim ke Firebase, lalu dashboard web ini menampilkannya secara realtime. Setiap perubahan langsung terlihat di grafik tanpa perlu memuat ulang halaman.

## Kenapa sistem ini?

- **Realtime, bukan refresh.** Dashboard berlangganan langsung ke Firebase. Begitu sensor mengirim nilai baru, grafik ikut bergerak.
- **Peringatan dini yang mudah dibaca.** Pita SIAGA dan BAHAYA ada langsung di grafik. Sumbunya dibalik, jadi garis yang naik berarti air yang naik.
- **Bukan cuma air, tapi juga sampah.** Tiga sensor yang dipasang berjajar membentuk profil permukaan. Dari bentuk itu, sistem menebak apakah yang terdeteksi adalah air naik, sampah, atau sampah besar seperti batang kayu.
- **Tetap bekerja di lapangan.** Perangkat menampilkan status di layar OLED. Saat kondisi BAHAYA, perangkat mengirim peringatan ke Telegram, dan memakai SMS sebagai cadangan kalau internet bermasalah.
- **Nyaman dipakai di mana saja.** Tersedia mode terang dan gelap, dan tampilannya menyesuaikan layar desktop, tablet, maupun ponsel.

## Fitur dashboard

| Halaman | Isi |
|---|---|
| **Grafik** | Satu grafik per sensor dengan pita ambang SIAGA dan BAHAYA, ditambah profil objek dari ketiga sensor beserta prediksinya. |
| **Peta** | Lokasi stasiun. Warna penandanya mengikuti kondisi terburuk dari ketiga sensor, dan popup-nya merinci jarak serta status tiap sensor. |
| **Tentang** | Ringkasan sistem: perangkat, cara data dikirim, ambang status, dan peringatan. |

## Cara kerja

```
HC-SR04 ×3 ──► ESP32 ──► Firebase Realtime Database ──► Dashboard web
                 │
                 ├──► Layar OLED (di lokasi)
                 └──► Telegram, dengan SMS (SIM900A) sebagai cadangan
```

Tiap 3 detik ESP32 membaca ketiga sensor dan menentukan status berdasarkan jarak ke permukaan:

| Status | Jarak sensor ke permukaan |
|---|---|
| NORMAL | lebih dari 50 cm |
| SIAGA | 30–50 cm |
| BAHAYA | 30 cm atau kurang |

## Perangkat

- ESP32
- 3 × sensor ultrasonik HC-SR04, dipasang di kiri, tengah, dan kanan
- Layar OLED SSD1306 128×64
- Modul GSM SIM900A

## Teknologi web

- React 19 dan TypeScript, dibangun dengan Vite
- Firebase Realtime Database untuk data realtime
- ECharts untuk grafik, Leaflet untuk peta
- Zustand untuk state, SCSS Modules untuk gaya

## Menjalankan secara lokal

Yang dibutuhkan: Node.js 20 atau lebih baru.

```bash
npm install
```

Buat file `.env` di root proyek:

```bash
VITE_FIREBASE_URL=https://<nama-proyek>-default-rtdb.<region>.firebasedatabase.app
```

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

- **Lokasi stasiun**: koordinat dan nama yang tampil di peta
- **Ambang status**: harus sama dengan `BATAS_SIAGA` dan `BATAS_BAHAYA` di firmware
- **Jarak saat kosong** per sensor: dasar perhitungan tinggi objek
- **Aturan prediksi objek**: label, deskripsi, dan ambang tinggi/ketidakrataan

## Struktur data Firebase

Firmware menulis satu node per sensor:

```json
{
  "sensor1": { "jarak_cm": 42.5, "status": "SIAGA" },
  "sensor2": { "jarak_cm": 44.1, "status": "SIAGA" },
  "sensor3": { "jarak_cm": 61.0, "status": "NORMAL" }
}
```

## Catatan

- Firebase hanya menyimpan nilai terakhir, jadi riwayat grafik hanya ada selama halaman terbuka.
- Prediksi objek memakai aturan ambang sederhana, bukan model pembelajaran mesin.
