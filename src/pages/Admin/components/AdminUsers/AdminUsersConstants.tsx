// [CONFIG] Isi halaman Admin.
//
// PENAMAAN: data UPPER_SNAKE, fungsi camelCase.

// Daftar admin TIDAK ada di sini dengan sengaja. Peran disimpan di node
// `admins` pada Realtime Database dan ditegakkan rules; menulisnya di berkas
// ini hanya akan membocorkan email admin ke bundel publik tanpa menambah
// perlindungan apa pun.

// Kolom tabel pengguna, urutannya sama dengan isi baris di Admin.tsx.
export const USER_TABLE_COLUMNS = [
  "Email",
  "Status",
  "Login terakhir",
  "Terakhir terlihat",
];

export const ADMIN_DENIED_MESSAGE =
  "Halaman ini hanya untuk admin. Database juga menolak permintaannya, jadi tidak ada data yang bisa ditampilkan.";

// Waktu dari serverTimestamp() Firebase = milidetik epoch.
export const formatDateTime = (value?: number) =>
  value
    ? new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
