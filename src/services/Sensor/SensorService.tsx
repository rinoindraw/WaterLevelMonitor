import { getDatabase, onValue, ref } from "firebase/database";
import {
  SENSORS,
  type SensorStatus,
} from "../../utils/constants/MonitorConstants";
import { firebaseApp } from "../Firebase/FirebaseApp";

// Bentuk node /sensorN yang ditulis ESP32 tiap ±3 detik (kirimFirebase()). Nama
// field berasal dari firmware, jadi dibiarkan apa adanya.
export interface SensorNodeResponse {
  jarak_cm: number;
  status: SensorStatus;
}

export type SensorSnapshotResponse = Partial<Record<string, SensorNodeResponse>>;

// initializeApp ada di FirebaseApp.tsx supaya app-nya sama dengan yang dipakai
// Auth — koneksi database ikut membawa sesi login.
const database = getDatabase(firebaseApp);

export const SensorService = {
  // Sumber data "terkini" = node /sensor1..3 yang diperbarui ESP32 tiap ±3
  // detik, jadi kepala kartu, profil objek, dan peta realtime. Riwayat (grafik
  // & tabel) dibaca terpisah dari /history. Listener ini realtime: callback
  // terpanggil begitu node berubah — tanpa polling.
  //
  // Satu listener per sensor (root tidak boleh dibaca), dan snapshot
  // gabungannya dirakit di sini. Callback dipanggil sekali untuk isi awal tiap
  // sensor, lalu setiap kali node-nya berubah. Mengembalikan fungsi unsubscribe.
  subscribeSnapshot: (
    onData: (snapshot: SensorSnapshotResponse) => void,
    onError: (error: Error) => void,
  ) => {
    const snapshot: SensorSnapshotResponse = {};

    const unsubscribes = SENSORS.map((sensor) =>
      onValue(
        ref(database, sensor.id),
        (snap) => {
          snapshot[sensor.id] = (snap.val() as SensorNodeResponse | null) ?? undefined;
          // Selalu kirim salinan: pemanggil membandingkan isinya, bukan
          // identitas objeknya.
          onData({ ...snapshot });
        },
        onError,
      ),
    );

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  },

  // Node bawaan Firebase: true saat socket ke server tersambung.
  subscribeConnection: (onChange: (isConnected: boolean) => void) =>
    onValue(ref(database, ".info/connected"), (snap) =>
      onChange(snap.val() === true),
    ),
};
