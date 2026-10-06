// [CONFIG] Seluruh setelan monitor ada di berkas ini (+ VITE_FIREBASE_URL di .env).
// Cari tanda [CONFIG] untuk bagian yang memang dimaksudkan untuk diubah.
//
// PENAMAAN: data UPPER_SNAKE, fungsi camelCase.

export type SensorId = "sensor1" | "sensor2" | "sensor3";

// Status dihitung di ESP32 (tentukanStatus), web hanya menampilkannya apa adanya.
export type SensorStatus = "NORMAL" | "SIAGA" | "BAHAYA";

export interface SensorConfig {
  id: SensorId; // nama node di Firebase = argumen sensorId di kirimFirebase()
  name: string;
  location: string; // [CHANGED] posisi di controller (kiri/tengah/kanan), bukan titik peta
  // [CHANGED] emptyDistanceCm dihapus — jarak sensor ke dasar kini per sensor
  // di Firebase (pengaturan/tinggi_sensor), lihat DEFAULT_SENSOR_HEIGHT_CM
  color: string; // warna seri di mode terang
  colorDark: string; // warna seri yang sama, disetel untuk latar gelap
  // [CHANGED] lat & lng dihapus — lokasi kini satu, di DEVICE_LOCATION
}

// [NEW] Satu aturan prediksi objek. Semua batas opsional; aturan cocok kalau
// SEMUA batas yang diisi terpenuhi. min = inklusif, max = eksklusif.
export interface ObjectPredictionRule {
  label: string;
  description: string;
  minPeakCm?: number;
  maxPeakCm?: number;
  minSpreadCm?: number;
  maxSpreadCm?: number;
  // [NEW] Kemiringan = |kiri − kanan|; penyimpangan tengah = seberapa jauh
  // sensor tengah dari garis lurus kiri–kanan. Keduanya mengenali permukaan
  // miring (garis lurus), yang beda dari benda (ada yang menonjol).
  minTiltCm?: number;
  maxMidDeviationCm?: number;
}

// ===== [CONFIG] Firebase =====
// URL database ada di .env (VITE_FIREBASE_URL), dibaca di SensorService.tsx.
// SENGAJA tidak diekspor dari sini: nilai `import.meta.env` membuat
// eslint-plugin-react-refresh menganggap berkas ini berisi komponen, lalu
// menandai merah setiap konstanta array/objek di bawahnya.

// ===== [CONFIG] Realtime & buffer =====
// [CHANGED] Tidak ada polling. Titik baru hanya masuk saat Firebase mengirim
// perubahan; kalau ESP32 diam atau nilainya sama, tidak ada titik baru.
// Riwayat hanya ada di browser: 100 perubahan terakhir.
export const BUFFER_SIZE = 100;
// [NEW] ESP32 menulis jarak_cm dan status tiap sensor dalam request terpisah,
// jadi satu putaran loop() = beberapa event beruntun. Event yang datang
// berdekatan dalam jendela ini digabung jadi SATU titik.
export const SNAPSHOT_SETTLE_MS = 1000;
// [NEW] Firebase SDK tidak memberi error kalau server tak terjangkau sejak
// awal — ia diam sambil terus mencoba. Lewat batas ini tanpa tersambung,
// status dianggap offline (SDK tetap mencoba; begitu tersambung → live).
export const CONNECTION_TIMEOUT_MS = 10000;

// ===== [CONFIG] Riwayat (grafik historis) =====
// [NEW] Jumlah titik per sensor yang ditarik dari /history dalam satu halaman.
// Pada interval 30 detik, 1000 titik ≈ 8,3 jam. Makin besar makin sedikit
// klik "Muat data lebih lama", tapi makin berat tiap unduhan.
export const HISTORY_PAGE_SIZE = 250;
// Jumlah titik MENTAH per sensor yang ditarik tiap kali, untuk tab rata-rata.
// Satu bucket butuh banyak titik (jam ≈ 120, hari ≈ 2.880, bulan ≈ 86.000 pada
// interval 30 detik); bucket di tepi data yang belum lengkap disembunyikan,
// jadi tarikan harus cukup besar supaya ada bucket penuh yang tampil.
export const AGGREGATE_FETCH_SIZE: Record<"day" | "month" | "year", number> = {
  day: 1000,
  month: 5000,
  year: 20000,
};
// [NEW] Jumlah baris (satu baris = satu waktu pembacaan, memuat ketiga sensor)
// per halaman di tabel riwayat.
export const HISTORY_TABLE_PAGE_SIZE = 20;
// Batas titik per sensor di PDF tabel Data (yang terbaru dalam rentang filter).
// PDF dengan puluhan ribu baris berat dan lambat; data lengkap lewat CSV. Tabel
// rata-rata tidak dibatasi (jumlah barisnya kecil).
export const HISTORY_PDF_MAX_POINTS = 1500;
// [NEW] Jumlah titik per sensor yang ditarik dari /history tiap kali tabel
// kehabisan baris. Ditampilkan tetap HISTORY_TABLE_PAGE_SIZE baris per halaman;
// angka ini hanya menentukan seberapa sering tabel harus mengunduh lagi.
export const HISTORY_TABLE_FETCH_SIZE = 250;

// ===== [CONFIG] Cuaca saat ini =====
// [NEW] Open-Meteo: gratis untuk non-komersial, tanpa API key, data CC BY 4.0
// (atribusi wajib — sudah ada di kartu cuaca).
export const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";
// Cuaca berubah pelan; 10 menit cukup dan jauh di bawah batas kuota gratis.
export const WEATHER_REFRESH_MS = 10 * 60 * 1000;

// ===== [CONFIG] Ambang status =====
// [CHANGED] Ambang kini dinyatakan sebagai TINGGI AIR dari dasar, bukan jarak
// sensor ke permukaan. Air makin tinggi = makin gawat, jadi BAHAYA > SIAGA.
//
//   tinggi air = tinggi sensor ke dasar − jarak terbaca
//
// Angka aktifnya ada di Firebase (node `pengaturan`), diubah dari halaman
// Pengaturan Sensor. Nilai di bawah hanya cadangan: dipakai sebelum node
// terbaca atau kalau node itu belum pernah diisi.
export const DEFAULT_ALERT_THRESHOLD_CM = 80; // air >= ini → SIAGA
export const DEFAULT_DANGER_THRESHOLD_CM = 120; // air >= ini → BAHAYA

// [NEW] Jarak sensor ke DASAR saat kering, per sensor. Ini angka kalibrasi:
// diukur sekali di lapangan dan disimpan di Firebase. Salah ukur = seluruh
// tinggi air ikut salah tanpa gejala.
export const DEFAULT_SENSOR_HEIGHT_CM = 200;

// Batas yang masuk akal untuk HC-SR04 (jangkauan 2–400 cm). Dipakai form dan
// dicerminkan di rules database.
export const THRESHOLD_MIN_CM = 2;
export const THRESHOLD_MAX_CM = 400;

// ===== [CONFIG] Sensor =====
// [CHANGED] Ketiga sensor terpasang di SATU controller ESP32, jadi tidak
// punya koordinat sendiri-sendiri (lihat DEVICE_LOCATION).
//
// Warna sudah lolos validator palet (pemisahan buta warna, terang & gelap).
// Urutannya tetap — jangan ditukar antar sensor. Urutan array ini juga
// urutan kiri → kanan di chart profil objek.
export const SENSORS: SensorConfig[] = [
  {
    id: "sensor1",
    name: "Sensor 1",
    location: "Kiri",
    color: "#226597",
    colorDark: "#4a89c6",
  },
  {
    id: "sensor2",
    name: "Sensor 2",
    location: "Tengah",
    color: "#eb6834",
    colorDark: "#d95926",
  },
  {
    id: "sensor3",
    name: "Sensor 3",
    location: "Kanan",
    color: "#1baf7a",
    colorDark: "#199e70",
  },
];

// ===== [CONFIG] Lokasi controller =====
// Satu titik di peta untuk ketiga sensor = titik pemasangan ESP32.
// Sekaligus jadi pusat peta.
export const DEVICE_NAME = "Stasiun ketinggian air";
export const DEVICE_LOCATION: [number, number] = [-6.271027, 106.846205];

// ===== [CONFIG] Perkiraan area terdampak =====
// Lingkaran kecil di sekitar stasiun. Ini penanda perkiraan manual, bukan
// hasil hitungan limpasan — ubah radiusnya sesuai kondisi lapangan.
export const FLOOD_RADIUS_METERS = 300;
export const FLOOD_RADIUS_COLOR = "#2563eb";

// ===== [CONFIG] Peta =====
// [CHANGED] MAP_CENTER dihapus — peta berpusat di DEVICE_LOCATION.
export const MAP_ZOOM = 16;
// Esri Canvas dipilih karena tanpa API key dan punya varian gelap.
// (CARTO sekarang wajib API key — tanpa itu tile-nya ber-watermark.)
export const MAP_TILE_LIGHT_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
export const MAP_TILE_DARK_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
// Tile Esri Canvas hanya sampai zoom 16; di atas itu Leaflet memperbesar
// tile zoom 16 alih-alih meminta tile "Map data not yet available".
export const MAP_TILE_MAX_NATIVE_ZOOM = 16;
export const MAP_MAX_ZOOM = 19;
// Latar di belakang ubin, disamakan dengan warna dominan basemap supaya celah
// subpiksel antar-ubin dan ubin yang belum termuat saat zoom tidak berkedip
// abu-abu terang Leaflet. DIUKUR dari ubin Esri Canvas sungguhan (piksel
// terbanyak pada ubin daratan di sekitar stasiun), bukan ditebak. Warna
// DARATAN yang dipilih, bukan laut (#d0cfd4 / #232227): stasiun ada di darat
// dan tampilan bawaan zoom 16 didominasi daratan.
export const MAP_BACKGROUND_LIGHT = "#efefef";
export const MAP_BACKGROUND_DARK = "#474749";
export const MAP_TILE_ATTRIBUTION = "Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap contributors";

// ===== [CONFIG] Prediksi objek (row 2) =====
// peak   = bacaan tertinggi dari dasar di antara ketiga sensor (cm)
// spread = tertinggi − terendah (cm); kecil = permukaan rata, besar = tidak rata
//
// [CHANGED] Sejak tinggi diukur dari DASAR (bukan dari permukaan air normal),
// keberadaan benda tidak lagi terbaca dari peak — air dalam pun peak-nya
// besar. Yang menandai benda adalah spread: permukaan air selalu rata, benda
// tidak. Peak kini hanya dipakai untuk mengenali dasar yang kering.
//
// [NEW] Sensor dianggap "terangkat" (ada sesuatu di bawahnya) kalau bacaannya
// setinggi ini di atas sensor terendah. Sensor terendah dianggap permukaan air
// yang tidak terhalang. Sama dengan batas "Air" (spread < 5 cm) di bawah, jadi
// begitu air dianggap tidak rata, minimal satu sensor pasti terangkat.
export const OBJECT_ELEVATED_CM = 5;

// Label & deskripsi boleh memuat token yang diisi saat prediksi dibuat:
//   {posisi}     sensor yang terangkat, mis. "kiri", "tengah dan kanan"
//   {sisiTinggi} sisi yang lebih tinggi pada permukaan miring: "kiri"/"kanan"
//
// Dicek BERURUTAN dari atas, aturan pertama yang cocok dipakai. Aturan
// terakhir tanpa batas = fallback, jadi selalu ada jawaban.
export const OBJECT_PREDICTIONS: ObjectPredictionRule[] = [
  {
    label: "Tidak ada objek",
    description: "Ketiga sensor membaca mendekati dasar. Saluran praktis kering.",
    maxPeakCm: 3,
  },
  {
    label: "Air",
    description:
      "Ketiga sensor melihat permukaan rata pada tinggi yang sama. Itu air, bukan benda.",
    maxSpreadCm: 5,
  },
  {
    label: "Permukaan miring ({sisiTinggi} lebih tinggi)",
    description:
      "Tinggi ketiga sensor berubah lurus dari kiri ke kanan, tanpa bagian yang menonjol. Kemungkinan arus deras atau air yang membelok, bukan benda.",
    minTiltCm: 8,
    maxMidDeviationCm: 3,
    maxSpreadCm: 30,
  },
  {
    label: "Sampah besar di {posisi}",
    description:
      "Permukaan di bagian {posisi} jauh lebih tinggi dari yang lain, seperti batang kayu, dahan, atau tumpukan sampah besar.",
    minSpreadCm: 30,
  },
  {
    label: "Sampah di {posisi}",
    description:
      "Permukaan di bagian {posisi} lebih tinggi dari yang lain, khas sampah yang mengapung.",
    minSpreadCm: 15,
  },
  {
    label: "Objek kecil di {posisi}",
    description:
      "Ada tonjolan kecil di bagian {posisi}: bisa daun, plastik kecil, atau gelombang. Pantau apakah bertambah.",
  },
];

// ===== Warna status =====
// Sama dengan $status-* di _colors.scss. Tidak dipakai untuk seri chart.
export const STATUS_COLORS: Record<SensorStatus, string> = {
  NORMAL: "#0ca30c",
  SIAGA: "#fab219",
  BAHAYA: "#d03b3b",
};
export const UNKNOWN_STATUS_COLOR = "#94a3b8";
