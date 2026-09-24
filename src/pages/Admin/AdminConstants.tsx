// [CONFIG] Sub-tab halaman Admin. `end` hanya untuk tab indeks, supaya
// "Pengguna" tidak ikut aktif saat sub-tab lain terbuka.
//
// PENAMAAN: data UPPER_SNAKE, fungsi camelCase.

export interface AdminTab {
  label: string;
  path: string;
  end?: boolean;
}

export const ADMIN_TABS: AdminTab[] = [
  { label: "Pengguna", path: "/admin", end: true },
  { label: "Pengaturan sensor", path: "/admin/pengaturan" },
];
