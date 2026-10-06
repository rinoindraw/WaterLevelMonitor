import {
  endAt,
  get,
  getDatabase,
  limitToLast,
  orderByKey,
  query,
  ref,
  startAt,
} from "firebase/database";
import {
  HISTORY_PAGE_SIZE,
  type SensorId,
  type SensorStatus,
} from "../../utils/constants/MonitorConstants";
import { firebaseApp } from "../Firebase/FirebaseApp";

// [NEW] Bentuk satu entri yang ditulis ESP32 lewat kirimHistory(). Nama field
// berasal dari firmware, jadi dibiarkan apa adanya.
interface HistoryNodeResponse {
  jarak_cm: number;
  tinggi_air: number;
  status: SensorStatus;
}

export interface HistoryPoint {
  time: number; // epoch ms, dari key node
  levelCm: number; // tinggi air dari dasar, sudah dihitung ESP32
  status: SensorStatus;
}

const database = getDatabase(firebaseApp);

// Key history = epoch ms 13 digit. Key yang bukan angka 32-bit diurutkan
// sebagai string, dan karena panjangnya sama, urutan string = urutan waktu.
// Itu juga alasan startAt/endAt di bawah wajib berupa STRING (beda dari
// contoh REST di PRD yang memakai angka).
const MIN_EPOCH_MS = 1_000_000_000_000;

// Jumlah titik per tarikan saat mengunduh seluruh rentang
const EXPORT_CHUNK_SIZE = 5000;

export const HistoryService = {
  // Mengambil `limit` titik TERBARU di dalam [startMs, endMs], urut lama → baru.
  // Halaman berikutnya (lebih lama) = panggil lagi dengan endMs = waktu titik
  // tertua yang sudah ada − 1.
  fetchPage: async (
    sensorId: SensorId,
    startMs: number,
    endMs: number,
    limit: number = HISTORY_PAGE_SIZE,
  ): Promise<HistoryPoint[]> => {
    const snapshot = await get(
      query(
        ref(database, `history/${sensorId}`),
        orderByKey(),
        startAt(String(Math.max(startMs, MIN_EPOCH_MS))),
        endAt(String(endMs)),
        limitToLast(limit),
      ),
    );

    const points: HistoryPoint[] = [];
    snapshot.forEach((child) => {
      const node = child.val() as HistoryNodeResponse;
      points.push({
        time: Number(child.key),
        levelCm: node.tinggi_air,
        status: node.status,
      });
    });
    return points;
  },

  // Seluruh titik di dalam [startMs, endMs] untuk satu sensor, urut lama → baru.
  // Menarik mundur per EXPORT_CHUNK_SIZE sampai habis (keyset, sama seperti
  // halaman). Dipakai fitur unduh, jadi bisa berat kalau rentangnya panjang.
  fetchAll: async (
    sensorId: SensorId,
    startMs: number,
    endMs: number,
  ): Promise<HistoryPoint[]> => {
    const chunks: HistoryPoint[][] = [];
    let cursor = endMs;
    for (;;) {
      const page = await HistoryService.fetchPage(
        sensorId,
        startMs,
        cursor,
        EXPORT_CHUNK_SIZE,
      );
      if (page.length === 0) break;
      chunks.unshift(page);
      if (page.length < EXPORT_CHUNK_SIZE) break;
      cursor = page[0].time - 1;
    }
    return chunks.flat();
  },
};
