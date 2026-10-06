import type { HistoryPoint } from "../../services/History/HistoryService";
import { SENSORS, type SensorId } from "../../utils/constants/MonitorConstants";
import { bucketPoints, type HistoryPeriod } from "./HistoryRange";

const pad = (value: number) => String(value).padStart(2, "0");

// "2026-10-06 14:30:00" di zona waktu browser — mudah dibaca Excel/Sheets
const formatCsvTime = (time: number) => {
  const date = new Date(time);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
};

export type PointsBySensor = Record<SensorId, HistoryPoint[]>;

// Satu baris per waktu (Raw) atau per bucket (rata-rata), urut lama → baru.
// Raw: tinggi air + status tiap sensor. Rata-rata: rata-rata, min, dan maks
// tiap sensor. Sel kosong kalau sensor itu tidak punya data pada waktu tsb.
// Dipakai bersama oleh CSV dan PDF.
export const buildExportTable = (
  pointsBySensor: PointsBySensor,
  period: HistoryPeriod,
) => {
  const rowsByTime = new Map<number, Partial<Record<SensorId, string[]>>>();
  for (const sensor of SENSORS) {
    const points = pointsBySensor[sensor.id];
    const cells: [number, string[]][] =
      period === "raw"
        ? points.map((point) => [
            point.time,
            [point.levelCm.toFixed(2), point.status],
          ])
        : bucketPoints(points, period).map(([time, average, min, max]) => [
            time,
            [average.toFixed(2), min.toFixed(2), max.toFixed(2)],
          ]);
    for (const [time, values] of cells) {
      const row = rowsByTime.get(time) ?? {};
      row[sensor.id] = values;
      rowsByTime.set(time, row);
    }
  }

  const columnsPerSensor = period === "raw" ? 2 : 3;
  const header = [
    "Waktu",
    ...SENSORS.flatMap((sensor) =>
      period === "raw"
        ? [`${sensor.name} (cm)`, `${sensor.name} Status`]
        : [
            `${sensor.name} Rata-rata (cm)`,
            `${sensor.name} Min (cm)`,
            `${sensor.name} Maks (cm)`,
          ],
    ),
  ];
  const rows = [...rowsByTime.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, row]) => [
      formatCsvTime(time),
      ...SENSORS.flatMap(
        (sensor) =>
          row[sensor.id] ?? Array<string>(columnsPerSensor).fill(""),
      ),
    ]);

  return { header, rows };
};

export const buildHistoryCsv = (
  pointsBySensor: PointsBySensor,
  period: HistoryPeriod,
) => {
  const { header, rows } = buildExportTable(pointsBySensor, period);
  return [header, ...rows].map((line) => line.join(",")).join("\r\n");
};

// BOM di depan supaya Excel membaca UTF-8 dengan benar
export const downloadCsv = (filename: string, content: string) => {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
