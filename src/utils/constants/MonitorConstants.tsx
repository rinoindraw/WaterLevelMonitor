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
  emptyDistanceCm: number;
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

// ===== [CONFIG] Ambang status =====
// HARUS sama dengan BATAS_SIAGA & BATAS_BAHAYA di .ino. Di web angka ini hanya
// dipakai untuk menggambar pita ambang di chart.
export const ALERT_THRESHOLD_CM = 50;
export const DANGER_THRESHOLD_CM = 30;

// ===== [CONFIG] Sensor =====
// [CHANGED] Ketiga sensor terpasang di SATU controller ESP32, jadi tidak
// punya koordinat sendiri-sendiri (lihat DEVICE_LOCATION).
//
// emptyDistanceCm: jarak yang terbaca sensor saat TIDAK ada apa-apa
// di bawahnya (muka air normal / dasar saluran). Tinggi objek = angka ini −
// jarak terbaca. Diisi per sensor, jadi beda tinggi pemasangan ikut tertutup.
// Nilai 60 masih CONTOH — ukur di lokasi.
//
// Warna sudah lolos validator palet (pemisahan buta warna, terang & gelap).
// Urutannya tetap — jangan ditukar antar sensor. Urutan array ini juga
// urutan kiri → kanan di chart profil objek.
export const SENSORS: SensorConfig[] = [
  {
    id: "sensor1",
    name: "Sensor 1",
    location: "Kiri",
    emptyDistanceCm: 60,
    color: "#226597",
    colorDark: "#4a89c6",
  },
  {
    id: "sensor2",
    name: "Sensor 2",
    location: "Tengah",
    emptyDistanceCm: 60,
    color: "#eb6834",
    colorDark: "#d95926",
  },
  {
    id: "sensor3",
    name: "Sensor 3",
    location: "Kanan",
    emptyDistanceCm: 60,
    color: "#1baf7a",
    colorDark: "#199e70",
  },
];

// ===== [CONFIG] Lokasi controller =====
// Satu titik di peta untuk ketiga sensor = titik pemasangan ESP32.
// Sekaligus jadi pusat peta.
export const DEVICE_NAME = "Stasiun ketinggian air";
export const DEVICE_LOCATION: [number, number] = [-6.271027, 106.846205];

// ===== [CONFIG] Peta =====
// [CHANGED] MAP_CENTER dihapus — peta berpusat di DEVICE_LOCATION.
export const MAP_ZOOM = 12;
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
export const MAP_TILE_ATTRIBUTION = "Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap contributors";

// ===== [CONFIG] Prediksi objek (row 2) =====
// [NEW] menggantikan TRASH_NOISE_CM / TRASH_FULL_SCALE_CM / TRASH_LIKELY_PERCENT.
// peak   = tinggi objek tertinggi di antara ketiga sensor (cm)
// spread = tertinggi − terendah (cm); kecil = permukaan rata, besar = tidak rata
// Dicek BERURUTAN dari atas, aturan pertama yang cocok dipakai. Aturan
// terakhir tanpa batas = fallback, jadi selalu ada jawaban.
export const OBJECT_PREDICTIONS: ObjectPredictionRule[] = [
  {
    label: "Tidak ada objek",
    description: "Semua sensor membaca mendekati jarak saat kosong.",
    maxPeakCm: 3,
  },
  {
    label: "Air naik",
    description:
      "Ketiga sensor melihat permukaan rata dengan tinggi yang sama. Itu air, bukan benda.",
    maxSpreadCm: 5,
  },
  {
    label: "Sampah besar",
    description:
      "Tinggi dan tidak rata, seperti batang kayu, dahan, atau tumpukan sampah besar.",
    minPeakCm: 30,
  },
  {
    label: "Sampah",
    description: "Permukaan tidak rata di bawah sensor, khas sampah yang mengapung.",
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
