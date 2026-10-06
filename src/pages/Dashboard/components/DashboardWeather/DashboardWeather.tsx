import { LoadingSpinner } from "../../../../components/LoadingState/LoadingState";
import { UseWeather } from "../../../../hooks/Weather/UseWeather";
import { DEVICE_LOCATION } from "../../../../utils/constants/MonitorConstants";
import { getWeatherInfo } from "../../../../utils/constants/WeatherConstants";
import styles from "./DashboardWeather.module.scss";

// Ringkasan cuaca di kanan header Dashboard: suhu sebesar judul halaman, kondisi
// sebesar subjudulnya. Datanya cache React Query yang sama dengan kartu di Peta.
const DashboardWeather = () => {
  const { weather, isLoading } = UseWeather(
    DEVICE_LOCATION[0],
    DEVICE_LOCATION[1],
  );

  if (!weather) {
    return (
      <div className={styles.weather}>
        {isLoading ? (
          <span className={styles.loading}>
            <LoadingSpinner size={18} />
            <span className={styles.condition}>Memuat cuaca…</span>
          </span>
        ) : (
          <span className={styles.condition}>Cuaca tidak tersedia</span>
        )}
      </div>
    );
  }

  const info = getWeatherInfo(weather.weatherCode);
  const WeatherIcon = weather.isDay ? info.dayIcon : info.nightIcon;

  return (
    <div className={styles.weather}>
      <p className={styles.temperature}>
        <WeatherIcon className={styles.icon} aria-hidden />
        {Math.round(weather.temperatureC)}°C
      </p>
      <p className={styles.condition}>{info.label}</p>
    </div>
  );
};

export default DashboardWeather;
