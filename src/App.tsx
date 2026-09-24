import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import styles from "./App.module.scss";
import { LoadingSpinnerWithText } from "./components/LoadingState/LoadingState";
import Navbar from "./components/Navbar/Navbar";
import { UseAuthSession } from "./hooks/Auth/UseAuthSession";
import { UseSensorRealtime } from "./hooks/Sensor/UseSensorRealtime";
import { UseThresholdSync } from "./hooks/Settings/UseThresholdSync";
import { UseUserSession } from "./hooks/User/UseUserSession";
import About from "./pages/About/About";
import Admin from "./pages/Admin/Admin";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import SensorMap from "./pages/SensorMap/SensorMap";
import { UseAuthStore } from "./stores/Auth/AuthStore";
import { UseThemeStore } from "./stores/Theme/ThemeStore";

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

const AppContent = () => {
  const isDarkMode = UseThemeStore((state) => state.isDarkMode);
  const status = UseAuthStore((state) => state.status);

  // [NEW] Menyambungkan sesi Firebase ke AuthStore. Harus di atas cabang di
  // bawah, karena hook tidak boleh dipanggil bersyarat.
  UseAuthSession();

  // Kelas global .darkTheme di body — dasar semua gaya mode gelap
  useEffect(() => {
    document.body.classList.toggle("darkTheme", isDarkMode);
  }, [isDarkMode]);

  // [NEW] Sesi tersimpan dibaca dulu, supaya layar masuk tidak berkedip
  // sebentar tiap kali halaman dimuat ulang.
  if (status === "checking") {
    return (
      <div className={styles.authGate}>
        <LoadingSpinnerWithText text="Memeriksa sesi…" />
      </div>
    );
  }

  if (status === "guest") {
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return <AppShell />;
};

// [NEW] Isi aplikasi dipisah ke komponen sendiri supaya UseSensorRealtime baru
// jalan SETELAH sesi ada: rules Firebase menolak baca tanpa sesi, jadi listener
// yang dipasang lebih awal hanya menghasilkan permission_denied.
const AppShell = () => {
  const connection = UseSensorRealtime();
  // [NEW] Membaca peran akun & mencatat kehadirannya. Keduanya butuh sesi,
  // jadi tempatnya di sini, bukan di AppContent.
  UseUserSession();
  // [NEW] Ambang status dari Firebase — dipakai pita grafik & halaman Tentang
  UseThresholdSync();

  return (
    <div className={styles.app}>
      <Navbar connection={connection} />
      <main className={styles.content}>
        <Routes>
          {/* status koneksi diteruskan untuk state loading */}
          <Route path="/" element={<Dashboard connection={connection} />} />
          <Route path="/map" element={<SensorMap connection={connection} />} />
          {/* /about/* karena halaman Tentang punya sub-rute sendiri */}
          <Route path="/about/*" element={<About />} />
          {/* /admin/* karena halaman Admin punya sub-rute sendiri. Rutenya
              tetap ada untuk non-admin, tapi isinya ditolak rules */}
          <Route path="/admin/*" element={<Admin />} />
          {/* /login & /register ikut ke sini setelah user masuk */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
