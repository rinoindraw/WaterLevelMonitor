import { useEffect } from "react";
import { UserService } from "../../services/User/UserService";
import { UseAuthStore } from "../../stores/Auth/AuthStore";

// Dipanggil SEKALI di AppShell — jadi setelah sesi ada, karena kedua
// operasinya butuh auth: membaca peran akun dan mencatat kehadirannya.
export const UseUserSession = () => {
  const uid = UseAuthStore((state) => state.uid);
  const email = UseAuthStore((state) => state.email);
  const setAdmin = UseAuthStore((state) => state.setAdmin);

  useEffect(() => {
    if (!uid || !email) return;

    // Gagal baca = bukan admin (rules menolak kunci milik orang lain).
    void UserService.fetchIsAdmin(email)
      .then(setAdmin)
      .catch(() => setAdmin(false));

    return UserService.trackPresence(uid, email);
  }, [uid, email, setAdmin]);
};
