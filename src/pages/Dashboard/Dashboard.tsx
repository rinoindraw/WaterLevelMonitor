import { useMemo, useState } from "react";
import { FiWifiOff } from "react-icons/fi";
import { LoadingSpinnerWithText } from "../../components/LoadingState/LoadingState";
import HistoryDateRange from "../../components/HistoryDateRange/HistoryDateRange"; // [NEW]
import HistoryFilter from "../../components/HistoryFilter/HistoryFilter"; // [NEW]
import {
  ALL_TIME_RANGE,
  getDateRange,
  type HistoryPeriod,
} from "../../helpers/History/HistoryRange"; // [NEW]
import { UseHistoryPages } from "../../hooks/History/UseHistoryPages"; // [NEW]
import type { ConnectionState } from "../../hooks/Sensor/UseSensorRealtime";
import { UseSensorStore } from "../../stores/Sensor/SensorStore";
import { HISTORY_PAGE_SIZE, SENSORS } from "../../utils/constants/MonitorConstants";
import DashboardHistoryChart from "./components/DashboardHistoryChart/DashboardHistoryChart"; // [NEW]
import DashboardHistoryTable from "./components/DashboardHistoryTable/DashboardHistoryTable"; // [NEW]
import DashboardObjectProfile from "./components/DashboardObjectProfile/DashboardObjectProfile";
import DashboardWeather from "./components/DashboardWeather/DashboardWeather";
import DashboardSensorChart from "./components/DashboardSensorChart/DashboardSensorChart";
import styles from "./Dashboard.module.scss";

const AVERAGE_PERIODS: HistoryPeriod[] = ["day", "month", "year"];

interface DashboardProps {
  connection: ConnectionState; // [NEW]
}

const Dashboard = ({ connection }: DashboardProps) => {
  const samples = UseSensorStore((state) => state.samples);
  const hasData = samples.length > 0;

  // Section Data (Raw): filter dari–sampai tanggal (kosong = seluruh riwayat, terbaru
  // dulu). Section rata-rata: hanya tab periode, tanpa filter tanggal.
  const [rawFrom, setRawFrom] = useState<string | null>(null);
  const [rawTo, setRawTo] = useState<string | null>(null);
  const rawRange = useMemo(
    () => getDateRange(rawFrom, rawTo),
    [rawFrom, rawTo],
  );
  const rawHistory = UseHistoryPages(
    rawRange.start,
    rawRange.end,
    "raw",
    HISTORY_PAGE_SIZE,
  );

  const [averagePeriod, setAveragePeriod] = useState<HistoryPeriod>("day");
  const averageHistory = UseHistoryPages(
    ALL_TIME_RANGE.start,
    ALL_TIME_RANGE.end,
    averagePeriod,
    HISTORY_PAGE_SIZE,
  );

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1 className={styles.pageTitle}>Tinggi Muka Air</h1>
          <p className={styles.pageDescription}>
            Pantau ketinggian air di stasiun dari tiga sensor. Garisnya
            menunjukkan tinggi air diukur dari dasar, jadi garis naik berarti
            air naik. Garis putus-putus kuning dan merah menandai batas SIAGA
            dan BAHAYA.
          </p>
        </div>

        <DashboardWeather />
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
          {/* Row 1: satu chart realtime per sensor, dari /sensorN */}
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

          {/* Row 3: riwayat data (Raw), difilter dari tanggal – sampai tanggal,
              disusul tabelnya */}
          <DashboardHistoryChart
            title="Riwayat Data"
            period="raw"
            history={rawHistory}
            filter={
              <HistoryDateRange
                from={rawFrom}
                to={rawTo}
                onChange={(from, to) => {
                  setRawFrom(from);
                  setRawTo(to);
                }}
              />
            }
          />
          <DashboardHistoryTable kind="data" />

          {/* Row 4: riwayat rata-rata per jam / hari / bulan, dari yang
              terbaru, disusul tabelnya */}
          <DashboardHistoryChart
            title="Riwayat Rata-rata"
            period={averagePeriod}
            history={averageHistory}
            filter={
              <HistoryFilter
                period={averagePeriod}
                periods={AVERAGE_PERIODS}
                onPeriodChange={setAveragePeriod}
              />
            }
          />
          <DashboardHistoryTable kind="average" />
        </>
      )}
    </div>
  );
};

export default Dashboard;
