import { getDatabase, onValue, ref } from "firebase/database";
import {
  SENSORS,
  type SensorStatus,
} from "../../utils/constants/MonitorConstants";
import { firebaseApp } from "../Firebase/FirebaseApp";

// Bentuk node yang ditulis ESP32 lewat kirimFirebase(). Nama field berasal
// dari firmware, jadi dibiarkan apa adanya.
export interface SensorNodeResponse {
  jarak_cm: number;
  status: SensorStatus;
}

export type SensorSnapshotResponse = Partial<Record<string, SensorNodeResponse>>;

// [CHANGED] initializeApp pindah ke FirebaseApp.tsx supaya app-nya sama dengan
// yang dipakai Auth — koneksi database ikut membawa sesi login.
// Jalur tulis sengaja tetap terbuka: ESP32 mengirim data tanpa token.
const database = getDatabase(firebaseApp);

export const SensorService = {
  // [CHANGED] Dulu satu listener di root. Root tidak lagi boleh dibaca sejak
  // node users & admins ada di sana — izin baca turun ke anaknya, jadi
  // pembaca root otomatis ikut bisa membaca daftar pengguna. Sekarang satu
  // listener per sensor, dan snapshot gabungannya dirakit di sini.
  //
  // Callback dipanggil sekali untuk isi awal tiap sensor, lalu setiap kali
  // salah satu berubah. Mengembalikan fungsi unsubscribe.
  subscribeSnapshot: (
    onData: (snapshot: SensorSnapshotResponse) => void,
    onError: (error: Error) => void,
  ) => {
    const snapshot: SensorSnapshotResponse = {};

    const unsubscribes = SENSORS.map((sensor) =>
      onValue(
        ref(database, sensor.id),
        (snap) => {
          snapshot[sensor.id] = snap.val() ?? undefined;
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
