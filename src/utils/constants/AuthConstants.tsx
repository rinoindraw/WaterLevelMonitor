// [CONFIG] Teks kesalahan halaman masuk & daftar.
//
// PENAMAAN: data UPPER_SNAKE, fungsi camelCase.

// Firebase menolak kata sandi di bawah 6 karakter. Dicek juga di sisi web
// supaya user tahu sebelum tombol ditekan.
export const MIN_PASSWORD_LENGTH = 6;

// Kunci = kode error Firebase Auth; kode yang tidak terdaftar jatuh ke
// DEFAULT_AUTH_ERROR supaya user tidak pernah melihat kode mentah.
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Format email tidak benar.",
  "auth/missing-password": "Kata sandi belum diisi.",
  // Firebase sengaja tidak membedakan email salah dan kata sandi salah.
  "auth/invalid-credential": "Email atau kata sandi salah.",
  "auth/user-disabled": "Akun ini dinonaktifkan.",
  "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.",
  "auth/network-request-failed": "Tidak bisa menghubungi server. Periksa koneksi internet.",
  "auth/email-already-in-use": "Email ini sudah terdaftar. Silakan masuk.",
  "auth/weak-password": `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`,
  // Muncul kalau metode Email/Password belum diaktifkan di Firebase Console.
  "auth/operation-not-allowed": "Pendaftaran sedang ditutup.",
  // Domain aplikasi belum terdaftar di Authentication → Settings.
  "auth/unauthorized-domain": "Domain ini belum diizinkan untuk masuk.",
};

export const DEFAULT_AUTH_ERROR = "Gagal memproses. Coba lagi.";

// Dicek di web sebelum dikirim ke Firebase.
export const PASSWORD_TOO_SHORT_ERROR = `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
export const PASSWORD_MISMATCH_ERROR = "Ulangi kata sandi belum sama.";
