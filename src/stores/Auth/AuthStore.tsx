import { create } from "zustand";

// "checking" = sesi tersimpan belum selesai dibaca Firebase. Selama itu layar
// masuk JANGAN ditampilkan, supaya tidak berkedip tiap kali halaman dimuat.
export type AuthStatus = "checking" | "authenticated" | "guest";

export interface AuthUser {
  uid: string;
  email: string;
}

interface AuthState {
  status: AuthStatus;
  uid: string | null;
  email: string | null;
  // [NEW] Peran DITENTUKAN DI DATABASE (node admins) dan ditegakkan rules.
  // Nilai di sini hanya untuk memutuskan apa yang ditampilkan; menyalakannya
  // secara paksa dari devtools tidak memberi akses data apa pun.
  isAdmin: boolean;
  setUser: (user: AuthUser | null) => void;
  setAdmin: (isAdmin: boolean) => void;
}

// Sengaja tanpa persist: sesi sudah disimpan Firebase SDK sendiri.
export const UseAuthStore = create<AuthState>((set) => ({
  status: "checking",
  uid: null,
  email: null,
  isAdmin: false,
  setUser: (user) =>
    set({
      status: user ? "authenticated" : "guest",
      uid: user?.uid ?? null,
      email: user?.email ?? null,
      // Peran ikut hilang saat keluar, supaya tab Admin tidak menempel
      // ke akun berikutnya yang masuk di tab yang sama.
      isAdmin: false,
    }),
  setAdmin: (isAdmin) => set({ isAdmin }),
}));
