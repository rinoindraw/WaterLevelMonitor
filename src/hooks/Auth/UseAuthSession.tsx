import { useEffect } from "react";
import { AuthService } from "../../services/Auth/AuthService";
import { UseAuthStore } from "../../stores/Auth/AuthStore";

// Dipanggil SEKALI di AppContent: menyambungkan status sesi Firebase ke store.
export const UseAuthSession = () => {
  const setUser = UseAuthStore((state) => state.setUser);

  useEffect(
    () =>
      AuthService.subscribeUser((user) =>
        // Akun tanpa email tidak mungkin ada di sini: satu-satunya metode
        // masuk adalah email/password.
        setUser(user && user.email ? { uid: user.uid, email: user.email } : null),
      ),
    [setUser],
  );
};
