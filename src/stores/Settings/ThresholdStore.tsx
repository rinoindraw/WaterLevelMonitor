import { create } from "zustand";
import {
  DEFAULT_ALERT_THRESHOLD_CM,
  DEFAULT_DANGER_THRESHOLD_CM,
  DEFAULT_SENSOR_HEIGHT_CM,
  SENSORS,
  type SensorId,
} from "../../utils/constants/MonitorConstants";

export type SensorHeights = Record<SensorId, number>;

interface ThresholdState {
  // Keduanya TINGGI AIR dari dasar, bukan jarak ke sensor. dangerCm > alertCm.
  alertCm: number;
  dangerCm: number;
  // [NEW] Jarak tiap sensor ke dasar saat kering (cm)
  sensorHeights: SensorHeights;
  updatedAt: number | null;
  updatedBy: string | null;
  // false selama node `pengaturan` belum terbaca; nilai di atas masih cadangan.
  isLoaded: boolean;
  setThresholds: (thresholds: Partial<ThresholdState>) => void;
}

const DEFAULT_SENSOR_HEIGHTS = Object.fromEntries(
  SENSORS.map((sensor) => [sensor.id, DEFAULT_SENSOR_HEIGHT_CM]),
) as SensorHeights;

// Sengaja tanpa persist: sumber kebenarannya Firebase, bukan browser.
export const UseThresholdStore = create<ThresholdState>((set) => ({
  alertCm: DEFAULT_ALERT_THRESHOLD_CM,
  dangerCm: DEFAULT_DANGER_THRESHOLD_CM,
  sensorHeights: DEFAULT_SENSOR_HEIGHTS,
  updatedAt: null,
  updatedBy: null,
  isLoaded: false,
  setThresholds: (thresholds) => set(thresholds),
}));
