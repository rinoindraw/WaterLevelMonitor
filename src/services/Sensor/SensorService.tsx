import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref } from "firebase/database";
import type { SensorStatus } from "../../utils/constants/MonitorConstants";

// Bentuk node yang ditulis ESP32 lewat kirimFirebase(). Nama field berasal
// dari firmware, jadi dibiarkan apa adanya.
export interface SensorNodeResponse {
  jarak_cm: number;
  status: SensorStatus;
}

export type SensorSnapshotResponse = Partial<Record<string, SensorNodeResponse>>;

// [CHANGED] Dulu GET REST tiap 3 detik, sekarang listener realtime.
// Rules DB publik (ESP32 menulis tanpa auth), jadi cukup databaseURL.
// [CONFIG] URL database → VITE_FIREBASE_URL di .env
const firebaseApp = initializeApp({
  databaseURL: import.meta.env.VITE_FIREBASE_URL,
});
const database = getDatabase(firebaseApp);

export const SensorService = {
  // Callback dipanggil sekali untuk isi awal, lalu HANYA saat data berubah.
  // Mengembalikan fungsi unsubscribe.
  subscribeSnapshot: (
    onData: (snapshot: SensorSnapshotResponse) => void,
    onError: (error: Error) => void,
  ) => onValue(ref(database), (snap) => onData(snap.val() ?? {}), onError),

  // Node bawaan Firebase: true saat socket ke server tersambung.
  subscribeConnection: (onChange: (isConnected: boolean) => void) =>
    onValue(ref(database, ".info/connected"), (snap) =>
      onChange(snap.val() === true),
    ),
};
