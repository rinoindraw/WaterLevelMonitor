import { getDatabase, onValue, ref, serverTimestamp, update } from "firebase/database";
import type { SensorId } from "../../utils/constants/MonitorConstants";
import { firebaseApp } from "../Firebase/FirebaseApp";

const database = getDatabase(firebaseApp);

// Nama field sengaja Indonesia dan sejajar dengan variabel di firmware: node
// ini dibaca ESP32 juga, bukan cuma web.
export interface ThresholdSettingsResponse {
  batas_siaga: number; // tinggi air (cm) yang dianggap SIAGA
  batas_bahaya: number; // tinggi air (cm) yang dianggap BAHAYA
  // [NEW] Jarak tiap sensor ke dasar saat kering — dasar perhitungan tinggi air
  tinggi_sensor?: Partial<Record<SensorId, number>>;
  diperbarui_pada?: number;
  diperbarui_oleh?: string;
}

// [CONFIG] Nama node di Firebase. ESP32 membacanya di <databaseURL>/pengaturan.json
const SETTINGS_PATH = "pengaturan";

export const SettingsService = {
  // Dipanggil sekali untuk nilai awal, lalu tiap kali pengaturan diubah —
  // termasuk perubahan dari perangkat lain, jadi semua tab ikut menyesuaikan.
  subscribeThresholds: (
    onData: (settings: ThresholdSettingsResponse | null) => void,
    onError: (error: Error) => void,
  ) =>
    onValue(ref(database, SETTINGS_PATH), (snap) => onData(snap.val()), onError),

  // Hanya berhasil untuk admin — rules menolak yang lain.
  saveThresholds: (
    alertCm: number,
    dangerCm: number,
    sensorHeights: Record<SensorId, number>,
    email: string,
  ) =>
    update(ref(database, SETTINGS_PATH), {
      batas_siaga: alertCm,
      batas_bahaya: dangerCm,
      tinggi_sensor: sensorHeights,
      diperbarui_pada: serverTimestamp(),
      diperbarui_oleh: email,
    }),
};
