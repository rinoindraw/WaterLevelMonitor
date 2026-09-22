import { FiWifiOff } from "react-icons/fi";
import { LoadingSpinnerWithText } from "../../components/LoadingState/LoadingState";
import type { ConnectionState } from "../../hooks/Sensor/UseSensorRealtime";
import { UseSensorStore } from "../../stores/Sensor/SensorStore";
import { SENSORS } from "../../utils/constants/MonitorConstants";
import DashboardObjectProfile from "./components/DashboardObjectProfile/DashboardObjectProfile";
import DashboardSensorChart from "./components/DashboardSensorChart/DashboardSensorChart";
import styles from "./Dashboard.module.scss";

interface DashboardProps {
  connection: ConnectionState; // [NEW]
}

const Dashboard = ({ connection }: DashboardProps) => {
  const samples = UseSensorStore((state) => state.samples);
  const hasData = samples.length > 0;

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Tinggi Muka Air</h1>
        <p className={styles.pageDescription}>
          Pantau ketinggian air di stasiun secara langsung dari tiga sensor.
          Semakin tinggi garisnya, semakin dekat air ke sensor. Pita kuning dan
          merah menandai kapan kondisi masuk SIAGA atau BAHAYA.
        </p>
      </header>

      {/* [NEW] Sebelum snapshot pertama: spinner, atau pesan kalau Firebase
          tidak terjangkau (menunggu terus tidak ada gunanya). */}
      {!hasData && connection === "offline" && (
        <p className={styles.offlineNotice}>
          <FiWifiOff aria-hidden />
          Firebase tidak dapat dihubungi. Periksa koneksi internet; halaman akan
          tersambung lagi secara otomatis.
        </p>
      )}
      {!hasData && connection !== "offline" && (
        <LoadingSpinnerWithText
          text={
            connection === "connecting"
              ? "Menghubungkan ke Firebase…"
              : "Menunggu data pertama dari sensor…"
          }
        />
      )}

      {hasData && (
        <>
          {/* Row 1: satu chart per sensor */}
          <section className={styles.sensorRow}>
            {SENSORS.map((sensor) => (
              <DashboardSensorChart
                key={sensor.id}
                sensor={sensor}
                samples={samples}
              />
            ))}
          </section>

          {/* Row 2: ketiga sensor jadi satu profil bentuk objek */}
          <DashboardObjectProfile samples={samples} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
