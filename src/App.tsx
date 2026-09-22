import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import styles from "./App.module.scss";
import Navbar from "./components/Navbar/Navbar";
import { UseSensorRealtime } from "./hooks/Sensor/UseSensorRealtime";
import About from "./pages/About/About";
import Dashboard from "./pages/Dashboard/Dashboard";
import SensorMap from "./pages/SensorMap/SensorMap";
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
  const connection = UseSensorRealtime();

  // Kelas global .darkTheme di body — dasar semua gaya mode gelap
  useEffect(() => {
    document.body.classList.toggle("darkTheme", isDarkMode);
  }, [isDarkMode]);

  return (
    <div className={styles.app}>
      <Navbar connection={connection} />
      <main className={styles.content}>
        <Routes>
          {/* status koneksi diteruskan untuk state loading */}
          <Route path="/" element={<Dashboard connection={connection} />} />
          <Route path="/map" element={<SensorMap connection={connection} />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
