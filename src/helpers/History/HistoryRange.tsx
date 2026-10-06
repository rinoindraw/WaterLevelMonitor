import type { HistoryPoint } from "../../services/History/HistoryService";

// "raw" = pembacaan apa adanya; day/month/year = rata-rata per jam/hari/bulan.
export type HistoryPeriod = "raw" | "day" | "month" | "year";

// [time, rata-rata, min, maks] — sumbu x = 0, sumbu y = 1
export type HistoryBucket = [number, number, number, number];

// Batas atas "tanpa batas": konstanta 13 digit (bukan Date.now()) supaya rentang
// stabil antar render dan tetap sepanjang key history saat dibandingkan sebagai
// string.
const NO_LIMIT_END_MS = 9_999_999_999_999;

// Seluruh riwayat — dipakai tab rata-rata (Harian/Bulanan/Tahunan), yang tidak
// punya filter tanggal.
export const ALL_TIME_RANGE = { start: 0, end: NO_LIMIT_END_MS };

// Rentang dari tanggal – sampai tanggal ("YYYY-MM-DD", keduanya inklusif, zona
// waktu browser). Sisi yang kosong = tanpa batas di sisi itu.
export const getDateRange = (from: string | null, to: string | null) => ({
  start: from ? parseDateInput(from).getTime() : ALL_TIME_RANGE.start,
  end: to
    ? new Date(
        parseDateInput(to).getFullYear(),
        parseDateInput(to).getMonth(),
        parseDateInput(to).getDate() + 1,
      ).getTime() - 1
    : ALL_TIME_RANGE.end,
});

// Nilai <input type="date"> berbentuk "YYYY-MM-DD" dan harus dibaca sebagai
// tanggal LOKAL. new Date("2026-10-04") menganggapnya UTC dan bisa bergeser
// sehari, jadi dipecah manual.
export const parseDateInput = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const toDateInputValue = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

// Awal bucket tempat sebuah waktu berada: jam (Harian), hari (Bulanan), atau
// bulan (Tahunan).
export const getBucketStart = (time: number, period: HistoryPeriod) => {
  const date = new Date(time);
  if (period === "day") {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
    ).getTime();
  }
  if (period === "month") {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
};

// Raw = titik mentah apa adanya. Bulanan = satu bucket per hari, Tahunan =
// satu bucket per bulan (rata-rata, min, maks).
export const bucketPoints = (
  points: HistoryPoint[],
  period: HistoryPeriod,
): HistoryBucket[] => {
  if (period === "raw") {
    return points.map((point) => [
      point.time,
      point.levelCm,
      point.levelCm,
      point.levelCm,
    ]);
  }

  const groups = new Map<
    number,
    { sum: number; count: number; min: number; max: number }
  >();
  for (const point of points) {
    const key = getBucketStart(point.time, period);

    const group = groups.get(key);
    if (group) {
      group.sum += point.levelCm;
      group.count += 1;
      group.min = Math.min(group.min, point.levelCm);
      group.max = Math.max(group.max, point.levelCm);
    } else {
      groups.set(key, {
        sum: point.levelCm,
        count: 1,
        min: point.levelCm,
        max: point.levelCm,
      });
    }
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(
      ([time, group]): HistoryBucket => [
        time,
        group.sum / group.count,
        group.min,
        group.max,
      ],
    );
};

// Awal jendela `count` bucket terakhir, yang berakhir di bucket tempat
// `anchorTime` berada. Selalu jatuh di batas bucket, jadi bucket tertua di
// jendela itu lengkap.
export const getRecentBucketsStart = (
  anchorTime: number,
  period: Exclude<HistoryPeriod, "raw">,
  count: number,
) => {
  const date = new Date(anchorTime);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  if (period === "day") {
    return new Date(year, month, day, date.getHours() - count + 1).getTime();
  }
  if (period === "month") {
    return new Date(year, month, day - count + 1).getTime();
  }
  return new Date(year, month - count + 1, 1).getTime();
};

export const formatBucketTime = (time: number, period: HistoryPeriod) =>
  new Date(time).toLocaleString(
    "id-ID",
    period === "raw"
      ? {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      : period === "day"
        ? {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        : period === "month"
          ? { day: "2-digit", month: "long", year: "numeric" }
          : { month: "long", year: "numeric" },
  );
