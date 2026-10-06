import { useCallback, useEffect, useState } from "react";
import {
  HistoryService,
  type HistoryPoint,
} from "../../services/History/HistoryService";
import {
  HISTORY_PAGE_SIZE,
  SENSORS,
  type SensorId,
} from "../../utils/constants/MonitorConstants";

type PerSensor<T> = Record<SensorId, T>;

interface HistoryState {
  // Hasil ini milik rentang mana. Kalau beda dari rentang yang sedang dipilih,
  // hasilnya basi dan dianggap belum ada (lihat `current` di bawah).
  rangeKey: string;
  points: PerSensor<HistoryPoint[]>;
  hasMore: PerSensor<boolean>;
  isLoadingMore: boolean;
  isFailed: boolean;
}

const buildPerSensor = <T,>(valueOf: (sensorId: SensorId) => T) =>
  Object.fromEntries(
    SENSORS.map((sensor) => [sensor.id, valueOf(sensor.id)]),
  ) as PerSensor<T>;

// [CHANGED] pageSize kini parameter: kartu sensor di atas dan grafik riwayat
// di bawah memakai ukuran halaman sendiri-sendiri.
export const UseHistory = (
  start: number,
  end: number,
  pageSize: number = HISTORY_PAGE_SIZE,
) => {
  const rangeKey = `${start}-${end}-${pageSize}`;
  const [state, setState] = useState<HistoryState | null>(null);

  // Tidak ada setState sinkron di effect (dilarang react-hooks/set-state-in-effect):
  // ganti rentang cukup membuat `current` jadi null, yang terbaca sebagai
  // "sedang memuat", sampai halaman pertama rentang baru tiba.
  const current = state && state.rangeKey === rangeKey ? state : null;

  useEffect(() => {
    let isCancelled = false;

    Promise.all(
      SENSORS.map((sensor) =>
        HistoryService.fetchPage(sensor.id, start, end, pageSize),
      ),
    )
      .then((pages) => {
        if (isCancelled) return;
        const pageOf = (id: SensorId) =>
          pages[SENSORS.findIndex((sensor) => sensor.id === id)];
        setState({
          rangeKey,
          points: buildPerSensor((id) => pageOf(id)),
          hasMore: buildPerSensor((id) => pageOf(id).length === pageSize),
          isLoadingMore: false,
          isFailed: false,
        });
      })
      .catch(() => {
        if (isCancelled) return;
        setState({
          rangeKey,
          points: buildPerSensor((): HistoryPoint[] => []),
          hasMore: buildPerSensor(() => false),
          isLoadingMore: false,
          isFailed: true,
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [rangeKey, start, end, pageSize]);

  // Halaman berikutnya: tiap sensor melanjutkan dari titik tertuanya sendiri,
  // karena sensor yang error sesaat tidak menulis titik pada waktu yang sama.
  const loadMore = useCallback(async () => {
    if (!current || current.isLoadingMore) return;
    setState({ ...current, isLoadingMore: true });

    try {
      const pages = await Promise.all(
        SENSORS.map((sensor) => {
          const oldest = current.points[sensor.id][0];
          if (!current.hasMore[sensor.id] || !oldest) {
            return Promise.resolve<HistoryPoint[]>([]);
          }
          return HistoryService.fetchPage(
            sensor.id,
            start,
            oldest.time - 1,
            pageSize,
          );
        }),
      );

      setState((previous) => {
        if (!previous || previous.rangeKey !== rangeKey) return previous;
        const pageOf = (id: SensorId) =>
          pages[SENSORS.findIndex((sensor) => sensor.id === id)];
        return {
          ...previous,
          points: buildPerSensor((id) => [...pageOf(id), ...previous.points[id]]),
          hasMore: buildPerSensor((id) => pageOf(id).length === pageSize),
          isLoadingMore: false,
        };
      });
    } catch {
      // Data yang sudah termuat tetap dipertahankan
      setState((previous) =>
        previous && previous.rangeKey === rangeKey
          ? { ...previous, isLoadingMore: false, isFailed: true }
          : previous,
      );
    }
  }, [current, rangeKey, start, pageSize]);

  const points =
    current?.points ?? buildPerSensor((): HistoryPoint[] => []);
  const totalPoints = SENSORS.reduce(
    (sum, sensor) => sum + points[sensor.id].length,
    0,
  );

  return {
    points,
    totalPoints,
    isLoading: current === null,
    // [NEW] Dipakai tabel untuk menyembunyikan baris di tepi data yang belum
    // lengkap untuk ketiga sensor
    hasMoreBySensor: current?.hasMore ?? buildPerSensor(() => false),
    isLoadingMore: current?.isLoadingMore ?? false,
    isFailed: current?.isFailed ?? false,
    hasMore: current
      ? SENSORS.some((sensor) => current.hasMore[sensor.id])
      : false,
    loadMore,
  };
};

// [NEW] Hasil hook dibagikan dari Dashboard ke grafik sensor & grafik riwayat
export type HistoryResult = ReturnType<typeof UseHistory>;
