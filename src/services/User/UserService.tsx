import {
  get,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  update,
} from "firebase/database";
import { firebaseApp } from "../Firebase/FirebaseApp";

const database = getDatabase(firebaseApp);

// Satu baris di node users. Ditulis oleh pemilik akun sendiri — SDK web tidak
// bisa memuat daftar pengguna Firebase (listUsers hanya ada di Admin SDK, yang
// berarti backend), jadi tiap klien mencatat dirinya sendiri.
export interface UserRecordResponse {
  email: string;
  lastLoginAt: number;
  isOnline?: boolean;
  lastSeenAt?: number;
}

export type UserDirectoryResponse = Partial<Record<string, UserRecordResponse>>;

// Kunci node admins = email dengan titik diganti koma, karena "." tidak boleh
// dipakai sebagai kunci di Realtime Database. Rules memakai rumus yang sama:
// auth.token.email.replace('.', ',')
const toEmailKey = (email: string) => email.replaceAll(".", ",");

export const UserService = {
  // Membaca SATU kunci: milik akun yang sedang masuk. Rules menolak kunci
  // lain, jadi daftar admin tidak bisa dikumpulkan dari aplikasi.
  fetchIsAdmin: async (email: string) => {
    const snapshot = await get(ref(database, `admins/${toEmailKey(email)}`));
    return snapshot.val() === true;
  },

  // Menandai sesi: online saat tab terbuka, offline saat tab ditutup.
  // onDisconnect didaftarkan DI SERVER, jadi tetap jalan kalau browser mati
  // mendadak. Mengembalikan fungsi untuk melepas pemantauan.
  trackPresence: (uid: string, email: string) => {
    const userRef = ref(database, `users/${uid}`);

    // onDisconnect harus didaftarkan ulang tiap kali socket tersambung.
    return onValue(ref(database, ".info/connected"), (snapshot) => {
      if (snapshot.val() !== true) return;

      // [CHANGED] Catat dulu, baru daftarkan onDisconnect. Urutan sebaliknya
      // gagal untuk akun baru: node users/<uid> belum ada, sehingga hasil yang
      // diantrekan onDisconnect (isOnline + lastSeenAt saja) melanggar
      // .validate yang mensyaratkan email & lastLoginAt.
      void update(userRef, {
        email,
        isOnline: true,
        lastLoginAt: serverTimestamp(),
      })
        .then(() =>
          onDisconnect(userRef).update({
            isOnline: false,
            lastSeenAt: serverTimestamp(),
          }),
        )
        // Tanpa ini kegagalan rules lewat begitu saja tanpa jejak.
        .catch((error) => console.error("Gagal mencatat sesi:", error));
    });
  },

  // [NEW] Keluar akun TIDAK memutus socket ke Firebase, jadi onDisconnect
  // tidak ikut jalan dan barisnya akan tertinggal berstatus online. Harus
  // dipanggil SEBELUM signOut: setelah sesi hilang, rules menolak tulisan ini.
  markOffline: async (uid: string) => {
    const userRef = ref(database, `users/${uid}`);

    // Batalkan antrean onDisconnect supaya tidak menimpa lastSeenAt lagi
    // dengan waktu yang lebih baru saat tab akhirnya ditutup.
    await onDisconnect(userRef).cancel();
    await update(userRef, { isOnline: false, lastSeenAt: serverTimestamp() });
  },

  // Hanya berhasil untuk admin — rules menolak yang lain.
  subscribeDirectory: (
    onData: (directory: UserDirectoryResponse) => void,
    onError: (error: Error) => void,
  ) =>
    onValue(ref(database, "users"), (snap) => onData(snap.val() ?? {}), onError),
};
