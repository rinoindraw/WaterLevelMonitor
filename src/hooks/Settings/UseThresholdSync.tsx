import { useEffect } from "react";
import { SettingsService } from "../../services/Settings/SettingsService";
import {
  UseThresholdStore,
  type SensorHeights,
} from "../../stores/Settings/ThresholdStore";
import {
  DEFAULT_ALERT_THRESHOLD_CM,
  DEFAULT_DANGER_THRESHOLD_CM,
  DEFAULT_SENSOR_HEIGHT_CM,
  SENSORS,
} from "../../utils/constants/MonitorConstants";

// Dipanggil SEKALI di AppShell: menjaga pengaturan di store tetap sama dengan
// yang ada di Firebase — pengaturan yang sama itu juga yang dibaca ESP32.
export const UseThresholdSync = () => {
  const setThresholds = UseThresholdStore((state) => state.setThresholds);

  useEffect(
    () =>
      SettingsService.subscribeThresholds(
        (settings) => {
          const alertCm = settings?.batas_siaga;
          const dangerCm = settings?.batas_bahaya;
          // Ambang berbasis tinggi air: BAHAYA harus lebih besar daripada
          // SIAGA. Nilai lama yang masih berbasis jarak (mis. 50 & 30) jatuh
          // ke sini dan diabaikan, jadi tampilan tidak pernah terbalik.
          const isValid =
            typeof alertCm === "number" &&
            typeof dangerCm === "number" &&
            dangerCm > alertCm;

          const sensorHeights = Object.fromEntries(
            SENSORS.map((sensor) => [
              sensor.id,
              settings?.tinggi_sensor?.[sensor.id] ?? DEFAULT_SENSOR_HEIGHT_CM,
            ]),
          ) as SensorHeights;

          setThresholds({
            alertCm: isValid ? alertCm : DEFAULT_ALERT_THRESHOLD_CM,
            dangerCm: isValid ? dangerCm : DEFAULT_DANGER_THRESHOLD_CM,
            sensorHeights,
            updatedAt: settings?.diperbarui_pada ?? null,
            updatedBy: settings?.diperbarui_oleh ?? null,
            isLoaded: true,
          });
        },
        // Gagal baca bukan alasan menahan halaman: cadangan tetap dipakai.
        () => setThresholds({ isLoaded: true }),
      ),
    [setThresholds],
  );
};
