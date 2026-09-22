import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import { FiWifiOff } from "react-icons/fi"; // [NEW]
import { LoadingSpinner } from "../../components/LoadingState/LoadingState"; // [NEW]
import StatusChip from "../../components/StatusChip/StatusChip";
import type { ConnectionState } from "../../hooks/Sensor/UseSensorRealtime"; // [NEW]
import { UseSensorStore } from "../../stores/Sensor/SensorStore";
import { UseThemeStore } from "../../stores/Theme/ThemeStore";
import {
  DEVICE_LOCATION,
  DEVICE_NAME,
  MAP_MAX_ZOOM,
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_DARK_URL,
  MAP_TILE_LIGHT_URL,
  MAP_TILE_MAX_NATIVE_ZOOM,
  MAP_ZOOM,
  SENSORS,
  STATUS_COLORS,
  UNKNOWN_STATUS_COLOR,
  type SensorStatus,
} from "../../utils/constants/MonitorConstants";
import styles from "./SensorMap.module.scss";

// [NEW] Urutan keparahan, ringan → berat. Dipakai memilih warna marker.
const STATUS_SEVERITY: SensorStatus[] = ["NORMAL", "SIAGA", "BAHAYA"];

interface SensorMapProps {
  connection: ConnectionState; // [NEW]
}

// Lokasi, zoom, dan tile → [CONFIG] di MonitorConstants.tsx
const SensorMap = ({ connection }: SensorMapProps) => {
  const isDarkMode = UseThemeStore((state) => state.isDarkMode);
  const latestSample = UseSensorStore((state) => state.samples.at(-1));

  // [NEW] Satu marker untuk tiga sensor → ikut status TERBURUK, supaya satu
  // sensor BAHAYA tidak tersembunyi di balik dua yang NORMAL.
  const worstStatus = SENSORS.reduce<SensorStatus | null>((worst, sensor) => {
    const status = latestSample?.readings[sensor.id]?.status;
    if (!status) return worst;
    return worst === null ||
      STATUS_SEVERITY.indexOf(status) > STATUS_SEVERITY.indexOf(worst)
      ? status
      : worst;
  }, null);

  return (
    <div className={styles.sensorMap}>
      <MapContainer
        center={DEVICE_LOCATION}
        zoom={MAP_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        className={styles.map}
      >
        {/* key memaksa TileLayer dipasang ulang saat tema berganti */}
        <TileLayer
          key={isDarkMode ? "dark" : "light"}
          url={isDarkMode ? MAP_TILE_DARK_URL : MAP_TILE_LIGHT_URL}
          attribution={MAP_TILE_ATTRIBUTION}
          maxNativeZoom={MAP_TILE_MAX_NATIVE_ZOOM}
          maxZoom={MAP_MAX_ZOOM}
        />

        {/* [CHANGED] Satu marker untuk controller, bukan satu per sensor */}
        <CircleMarker
          center={DEVICE_LOCATION}
          radius={13}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: worstStatus ? STATUS_COLORS[worstStatus] : UNKNOWN_STATUS_COLOR,
            fillOpacity: 1,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -14]}>
            {DEVICE_NAME}
          </Tooltip>
          <Popup>
            <div className={styles.popup}>
              <h3 className={styles.popupTitle}>{DEVICE_NAME}</h3>
              <p className={styles.popupCoordinates}>
                {DEVICE_LOCATION[0].toFixed(5)}, {DEVICE_LOCATION[1].toFixed(5)}
              </p>
              <ul className={styles.popupSensors}>
                {SENSORS.map((sensor) => {
                  const reading = latestSample?.readings[sensor.id];
                  return (
                    <li key={sensor.id} className={styles.popupSensor}>
                      <span className={styles.popupSensorName}>{sensor.name}</span>
                      <span className={styles.popupSensorDistance}>
                        {reading ? `${reading.distanceCm.toFixed(1)} cm` : "—"}
                      </span>
                      <StatusChip status={reading?.status ?? null} />
                    </li>
                  );
                })}
              </ul>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>

      {/* [NEW] Status muat di atas-tengah; peta tetap bisa digeser */}
      {!latestSample && (
        <div className={styles.mapStatus}>
          {connection === "offline" ? (
            <>
              <FiWifiOff aria-hidden className={styles.mapStatusIcon} />
              Firebase tidak dapat dihubungi.
            </>
          ) : (
            <>
              <LoadingSpinner size={18} />
              {connection === "connecting"
                ? "Menghubungkan ke Firebase…"
                : "Menunggu data pertama dari sensor…"}
            </>
          )}
        </div>
      )}

      <div className={styles.mapLegend}>
        <p className={styles.legendTitle}>Status stasiun</p>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <p key={status} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: color }} />
            {status}
          </p>
        ))}
        <p className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ backgroundColor: UNKNOWN_STATUS_COLOR }}
          />
          Tidak ada data
        </p>
        <p className={styles.legendNote}>
          Menampilkan kondisi terburuk dari ketiga sensor.
        </p>
      </div>
    </div>
  );
};

export default SensorMap;
