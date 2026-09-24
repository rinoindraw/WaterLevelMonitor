import { initializeApp } from "firebase/app";

// [NEW] Satu instance app dipakai bersama Auth dan Realtime Database — kalau
// masing-masing memanggil initializeApp sendiri, sesi login tidak terbawa ke
// koneksi database.
//
// Nilai dibaca DI SINI, bukan di MonitorConstants: `import.meta.env` di berkas
// konstanta membuat eslint-plugin-react-refresh menganggapnya berisi komponen,
// lalu menandai merah setiap konstanta di bawahnya.
//
// [CONFIG] ketiganya ada di .env — lihat README.
// apiKey bukan rahasia (selalu ikut ke browser); yang menjaga data adalah
// rules database + akun di Authentication.
export const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_URL,
});
