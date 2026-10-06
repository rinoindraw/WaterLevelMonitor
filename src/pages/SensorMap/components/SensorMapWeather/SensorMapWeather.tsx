import { LoadingSpinnerWithText } from "../../../../components/LoadingState/LoadingState";
import { UseWeather } from "../../../../hooks/Weather/UseWeather";
import { DEVICE_LOCATION } from "../../../../utils/constants/MonitorConstants";
import { getWeatherInfo } from "../../../../utils/constants/WeatherConstants";
import styles from "./SensorMapWeather.module.scss";

const SensorMapWeather = () => {
  const { weather, isLoading, isFailed } = UseWeather(
    DEVICE_LOCATION[0],
    DEVICE_LOCATION[1],
  );

  // Kartu selalu tampil: selagi memuat, loading-nya di dalam kartu; kalau gagal
  // sejak awal, satu baris pesan.
  if (!weather) {
    return (
      <div className={styles.weatherCard}>
        <p className={styles.cardTitle}>Cuaca saat ini</p>
        {isLoading ? (
          <LoadingSpinnerWithText size={20} text="Memuat cuaca…" />
        ) : (
          <p className={styles.unavailable}>Cuaca tidak tersedia.</p>
        )}
      </div>
    );
  }

  const info = getWeatherInfo(weather.weatherCode);
  const WeatherIcon = weather.isDay ? info.dayIcon : info.nightIcon;

  return (
    <div className={styles.weatherCard}>
      <p className={styles.cardTitle}>Cuaca saat ini</p>

      <div className={styles.summary}>
        <WeatherIcon className={styles.icon} aria-hidden />
        <div>
          <p className={styles.temperature}>
            {Math.round(weather.temperatureC)}°C
          </p>
          <p className={styles.condition}>{info.label}</p>
        </div>
      </div>

      <dl className={styles.details}>
        <div className={styles.detail}>
          <dt>Kelembapan</dt>
          <dd>{weather.humidityPercent}%</dd>
        </div>
        <div className={styles.detail}>
          <dt>Hujan jam ini</dt>
          <dd>{weather.precipitationMm.toFixed(1)} mm</dd>
        </div>
        {weather.rainChancePercent !== null && (
          <div className={styles.detail}>
            <dt>Peluang hujan</dt>
            <dd>{weather.rainChancePercent}%</dd>
          </div>
        )}
      </dl>

      <p className={styles.note}>
        {isFailed
          ? "Gagal menyegarkan; menampilkan data terakhir. "
          : `Diperbarui ${weather.time.slice(11, 16)}. `}
        <a
          className={styles.attribution}
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Weather data by Open-Meteo.com
        </a>
      </p>
    </div>
  );
};

export default SensorMapWeather;
