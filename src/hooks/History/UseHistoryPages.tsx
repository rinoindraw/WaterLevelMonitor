import { useMemo, useState } from "react";
import {
  bucketPoints,
  getBucketStart,
  type HistoryBucket,
  type HistoryPeriod,
} from "../../helpers/History/HistoryRange";
import {
  AGGREGATE_FETCH_SIZE,
  SENSORS,
  type SensorId,
  type SensorStatus,
} from "../../utils/constants/MonitorConstants";
import { UseHistory } from "./UseHistory";

// Satu sel = satu sensor pada satu baris. Pada Raw, min = maks = rata-rata dan
// status ada; pada periode rata-rata, status tidak ada (rata-rata bukan
// pembacaan, jadi tidak punya status).
export interface HistoryPageCell {
  average: number;
  min: number;
  max: number;
  status: SensorStatus | null;
}

export interface HistoryPageRow {
  time: number;
  cells: Partial<Record<SensorId, HistoryPageCell>>;
}

// Riwayat dibagi per halaman berukuran tetap: halaman 1 = `pageSize` baris
// terbaru, halaman 2 = `pageSize` berikutnya, dan seterusnya. Halaman
// MENGGANTIKAN isi sebelumnya (bukan menambah). Satu baris = satu waktu
// (Raw) atau satu bucket (jam/hari/bulan).
//
// Data ditarik dari Firebase per `fetchSize` titik per sensor, lalu dipotong per
// `pageSize` baris; tarikan baru hanya terjadi kalau baris yang sudah termuat
// habis. Dipakai grafik dan tabel. Tab rata-rata menarik titik lebih banyak per
// tarikan (AGGREGATE_FETCH_SIZE) karena satu bucket butuh banyak titik mentah.
export const UseHistoryPages = (
  start: number,
  end: number,
  period: HistoryPeriod,
  pageSize: number,
  fetchSize?: number,
) => {
  const history = UseHistory(
    start,
    end,
    fetchSize ?? (period === "raw" ? pageSize : AGGREGATE_FETCH_SIZE[period]),
  );

  // Satu baris per waktu, terbaru di atas
  const rows = useMemo(() => {
    const cellsByTime = new Map<number, HistoryPageRow["cells"]>();
    const put = (time: number, sensorId: SensorId, cell: HistoryPageCell) => {
      const cells = cellsByTime.get(time) ?? {};
      cells[sensorId] = cell;
      cellsByTime.set(time, cells);
    };

    for (const sensor of SENSORS) {
      const points = history.points[sensor.id];
      if (period === "raw") {
        for (const point of points) {
          put(point.time, sensor.id, {
            average: point.levelCm,
            min: point.levelCm,
            max: point.levelCm,
            status: point.status,
          });
        }
      } else {
        for (const [time, average, min, max] of bucketPoints(points, period)) {
          put(time, sensor.id, { average, min, max, status: null });
        }
      }
    }

    // Tiap sensor melanjutkan dari titik tertuanya sendiri, jadi di tepi data
    // ada baris yang belum utuh. Raw: waktu yang baru terisi sebagian sensor
    // (sel bolong). Rata-rata: bucket tempat titik tertua berada, yang baru
    // memuat sebagian isinya (rata-rata palsu). Keduanya disembunyikan sampai
    // halaman berikutnya dimuat.
    let lowerBound = -Infinity;
    for (const sensor of SENSORS) {
      const oldest = history.points[sensor.id][0];
      if (history.hasMoreBySensor[sensor.id] && oldest) {
        lowerBound = Math.max(
          lowerBound,
          period === "raw" ? oldest.time : getBucketStart(oldest.time, period),
        );
      }
    }

    return [...cellsByTime.entries()]
      .filter(([time]) => (period === "raw" ? time >= lowerBound : time > lowerBound))
      .sort(([a], [b]) => b - a)
      .map(([time, cells]): HistoryPageRow => ({ time, cells }));
  }, [history.points, history.hasMoreBySensor, period]);

  // Nomor halaman disimpan bersama kunci filternya: ganti periode, tanggal,
  // atau ukuran halaman otomatis kembali ke halaman 1 tanpa setState di effect.
  const pageKey = `${period}-${start}-${end}-${pageSize}`;
  const [pageState, setPageState] = useState({ key: pageKey, index: 0 });
  const requestedIndex = pageState.key === pageKey ? pageState.index : 0;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageIndex = Math.min(requestedIndex, pageCount - 1);
  const pageRows = useMemo(
    () => rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [rows, pageIndex, pageSize],
  );

  const hasLoadedOlder = pageIndex < pageCount - 1;
  const canGoNewer = pageIndex > 0;
  // Pada periode rata-rata, jumlah bucket sering di bawah pageSize; tombol
  // "lebih lama" lalu hanya menambah data ke halaman yang sama.
  const canGoOlder = hasLoadedOlder || history.hasMore;

  const goNewer = () => setPageState({ key: pageKey, index: pageIndex - 1 });
  const goOlder = async () => {
    if (!hasLoadedOlder) await history.loadMore();
    setPageState({ key: pageKey, index: pageIndex + 1 });
  };

  return {
    pageRows,
    pageNumber: pageIndex + 1,
    isLoading: history.isLoading,
    isLoadingMore: history.isLoadingMore,
    isFailed: history.isFailed,
    canGoNewer,
    canGoOlder,
    goNewer,
    goOlder,
  };
};

export type HistoryPagesResult = ReturnType<typeof UseHistoryPages>;

// Baris halaman → deret waktu satu sensor, urut lama → baru, untuk grafik.
export const rowsToBuckets = (
  rows: HistoryPageRow[],
  sensorId: SensorId,
): HistoryBucket[] =>
  rows
    .flatMap((row): HistoryBucket[] => {
      const cell = row.cells[sensorId];
      return cell ? [[row.time, cell.average, cell.min, cell.max]] : [];
    })
    .reverse();
