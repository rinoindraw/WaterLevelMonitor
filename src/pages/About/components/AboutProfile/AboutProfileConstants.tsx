// [CONFIG] Isi sub-tab "Profil". Ganti nama, tautan, dan foto di sini.
//
// PENAMAAN: data UPPER_SNAKE, fungsi camelCase.

// Foto diimpor dari src/assets supaya ikut diproses Vite (di-hash & dioptimasi
// saat build), bukan disalin mentah dari public/.
import profilePhoto from "../../../../assets/profile/profile.jpeg";

export const RESEARCHER_PHOTO = profilePhoto;
export const RESEARCHER_PHOTO_ALT = "Foto peneliti";

// TODO ganti dengan nama & akun asli
export const RESEARCHER_NAME = "Muhammad Farid Thirafi";
export const RESEARCHER_ROLE = "Mahasiswa Informatika";
export const RESEARCHER_INSTAGRAM_URL = "https://www.instagram.com/faridthirafi";
export const RESEARCHER_INSTAGRAM_LABEL = "@faridthirafi";

export const RESEARCHER_BIO =
  "Mahasiswa Informatika dengan minat pada pemrograman, pengembangan " +
  "perangkat lunak, dan teknologi baru. Terbiasa belajar mandiri, senang " +
  "menghubungkan titik-titik menjadi solusi yang utuh, dan nyaman bekerja " +
  "dalam tim. Sistem pemantau ketinggian air ini dirancang dan dibangun " +
  "sendiri, mulai dari perangkat di lapangan sampai dashboard yang sedang " +
  "Anda buka.";
