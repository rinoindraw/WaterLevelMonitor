import { formatBucketTime, type HistoryPeriod } from "./HistoryRange";

interface TooltipItem {
  axisValue: number;
  marker: string;
  seriesName: string;
  value: number[]; // [waktu, rata-rata, min, maks]
}

// [NEW] Dipakai grafik riwayat dan ketiga grafik sensor. Harian menampilkan
// nilai apa adanya; Bulanan/Tahunan menambahkan min–maks bucket-nya.
export const createHistoryTooltipFormatter =
  (period: HistoryPeriod) => (raw: unknown) => {
    const items = (Array.isArray(raw) ? raw : [raw]) as TooltipItem[];
    if (items.length === 0) return "";

    const rows = items.map((item) => {
      const [, average, min, max] = item.value;
      const range =
        period === "raw"
          ? ""
          : ` (min ${min.toFixed(1)} – maks ${max.toFixed(1)})`;
      return `${item.marker} ${item.seriesName}: ${average.toFixed(1)} cm${range}`;
    });
    return `${formatBucketTime(items[0].axisValue, period)}<br/>${rows.join("<br/>")}`;
  };
