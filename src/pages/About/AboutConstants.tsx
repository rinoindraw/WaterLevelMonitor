// Isi halaman Tentang — ringkasan sistem, diturunkan dari sketch
// water_level_monitor_dengan_oled.ino dan kode web ini.
// SENGAJA tanpa kredensial: SSID/password WiFi, token bot Telegram, chat id,
// dan nomor tujuan SMS tidak boleh muncul di web.

export interface SummaryItem {
  label: string;
  value: string;
}

export interface SystemFeature {
  title: string;
  description: string;
  path: string; // tab tujuan saat kartu diklik
}

// Baris "Ambang status" tidak di sini — dirender di About.tsx dari
// ALERT_THRESHOLD_CM / DANGER_THRESHOLD_CM supaya selalu sama dengan grafik.
export const SYSTEM_SUMMARY: SummaryItem[] = [
  { label: "Controller", value: "ESP32 dengan layar OLED di lokasi" },
  { label: "Sensor", value: "3 sensor ultrasonik HC-SR04: kiri, tengah, kanan" },
  { label: "Pengiriman data", value: "Tiap 3 detik lewat WiFi ke Firebase Realtime Database" },
  { label: "Tampilan web", value: "Realtime, grafik diperbarui begitu data berubah" },
  {
    label: "Peringatan",
    value: "Telegram saat BAHAYA, dengan SMS sebagai cadangan; paling sering tiap 60 detik",
  },
];

export const SYSTEM_FEATURES: SystemFeature[] = [
  {
    title: "Grafik ketinggian air",
    description: "Satu grafik per sensor dengan pita SIAGA dan BAHAYA.",
    path: "/",
  },
  {
    title: "Prediksi objek",
    description:
      "Bentuk permukaan dari ketiga sensor, beserta tebakan apa yang ada di bawahnya.",
    path: "/",
  },
  {
    title: "Peta stasiun",
    description: "Lokasi controller, berwarna sesuai kondisi terburuk sensor.",
    path: "/map",
  },
];
