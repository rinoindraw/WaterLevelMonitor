import { create } from "zustand";
import {
  BUFFER_SIZE,
  type SensorId,
  type SensorStatus,
} from "../../utils/constants/MonitorConstants";

export interface SensorReading {
  distanceCm: number;
  status: SensorStatus;
}

export interface SensorSample {
  time: number;
  readings: Partial<Record<SensorId, SensorReading>>;
}

interface SensorState {
  samples: SensorSample[];
  appendSample: (sample: SensorSample) => void;
}

// Buffer di memori browser, SENGAJA tanpa persist: Firebase hanya menyimpan
// nilai terakhir, jadi riwayat ini cuma hidup selama tab terbuka.
export const UseSensorStore = create<SensorState>()((set) => ({
  samples: [],
  appendSample: (sample) =>
    set((state) => {
      // StrictMode menjalankan effect dua kali di dev → cegah titik kembar
      if (state.samples.at(-1)?.time === sample.time) return state;
      return { samples: [...state.samples, sample].slice(-BUFFER_SIZE) };
    }),
}));
