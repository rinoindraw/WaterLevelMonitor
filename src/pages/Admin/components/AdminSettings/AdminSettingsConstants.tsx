// [CONFIG] Teks halaman Pengaturan Sensor.
//
// PENAMAAN: data UPPER_SNAKE, fungsi camelCase.

export const SETTINGS_DENIED_MESSAGE =
  "Pengaturan hanya bisa diubah admin. Database juga menolak permintaannya, jadi perubahan dari sini tidak akan tersimpan.";

export const SETTINGS_SAVED_MESSAGE = "Pengaturan tersimpan. Perangkat akan memakainya pada pembacaan berikutnya.";
export const SETTINGS_FAILED_MESSAGE = "Gagal menyimpan. Coba lagi.";

// Pesan kesalahan isian — dicek di web sebelum dikirim, dan dicerminkan rules.
export const THRESHOLD_RANGE_ERROR = "Nilai di luar jangkauan sensor.";
export const THRESHOLD_ORDER_ERROR = "Ambang BAHAYA harus lebih besar daripada SIAGA.";
export const HEIGHT_TOO_LOW_ERROR =
  "Jarak sensor ke dasar harus lebih besar daripada ambang BAHAYA — air tidak mungkin melewati sensornya.";
export const THRESHOLD_NUMBER_ERROR = "Isi dengan angka.";

export const formatDateTime = (value?: number | null) =>
  value
    ? new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
