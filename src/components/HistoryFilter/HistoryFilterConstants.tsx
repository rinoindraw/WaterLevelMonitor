import type { HistoryPeriod } from "../../helpers/History/HistoryRange";

export interface HistoryPeriodOption {
  value: HistoryPeriod;
  label: string;
  description: string; // penjelasan di grafik riwayat
  tableDescription: string; // penjelasan di tabel riwayat
  axisFormat: string; // format label sumbu waktu ECharts
}

// Urutan array ini = urutan tab dari kiri ke kanan
export const HISTORY_PERIOD_OPTIONS: HistoryPeriodOption[] = [
  {
    value: "raw",
    label: "Raw",
    description:
      "Tiap titik adalah satu pembacaan apa adanya (setiap ±30 detik), dari yang terbaru.",
    tableDescription:
      "Tiap baris adalah satu pembacaan apa adanya (setiap ±30 detik), dari yang terbaru.",
    axisFormat: "{dd}/{MM} {HH}:{mm}",
  },
  {
    value: "day",
    label: "Harian",
    description: "Tiap titik adalah rata-rata satu jam, dari yang terbaru.",
    tableDescription: "Tiap baris adalah rata-rata satu jam, dari yang terbaru.",
    axisFormat: "{dd}/{MM} {HH}:{mm}",
  },
  {
    value: "month",
    label: "Bulanan",
    description: "Tiap titik adalah rata-rata satu hari, dari yang terbaru.",
    tableDescription: "Tiap baris adalah rata-rata satu hari, dari yang terbaru.",
    axisFormat: "{dd}/{MM}/{yy}",
  },
  {
    value: "year",
    label: "Tahunan",
    description: "Tiap titik adalah rata-rata satu bulan, dari yang terbaru.",
    tableDescription: "Tiap baris adalah rata-rata satu bulan, dari yang terbaru.",
    axisFormat: "{MM}/{yyyy}",
  },
];
