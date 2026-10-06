import * as echarts from "echarts";
import { getChartTheme } from "../Chart/ChartTheme";
import { SENSORS, STATUS_COLORS } from "../../utils/constants/MonitorConstants";
import { buildExportTable, type PointsBySensor } from "./HistoryExport";
import { bucketPoints, type HistoryPeriod } from "./HistoryRange";

interface HistoryPdfOptions {
  filename: string;
  title: string;
  // Baris keterangan di bawah judul: rentang filter, jenis data, dsb.
  subtitle: string;
  period: HistoryPeriod;
  pointsBySensor: PointsBySensor;
  alertCm: number;
  dangerCm: number;
  // Diisi kalau data dipotong (mis. hanya N titik terbaru) — dicetak di PDF
  note?: string;
}

const CHART_WIDTH_PX = 1100;
const CHART_HEIGHT_PX = 420;

// Grafik digambar di elemen lepas (tidak dipasang ke halaman) berukuran tetap,
// selalu bertema terang supaya terbaca saat dicetak, lalu dijadikan gambar PNG.
const renderChartImage = (
  pointsBySensor: PointsBySensor,
  period: HistoryPeriod,
  alertCm: number,
  dangerCm: number,
) => {
  const ct = getChartTheme(false);
  const chart = echarts.init(document.createElement("div"), null, {
    width: CHART_WIDTH_PX,
    height: CHART_HEIGHT_PX,
  });

  chart.setOption({
    animation: false,
    backgroundColor: "#ffffff",
    grid: { left: 52, right: 24, top: 44, bottom: 36 },
    legend: { top: 4, right: 8, textStyle: { color: ct.labelMuted } },
    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: ct.axisLine } },
      axisLabel: { color: ct.labelMuted, hideOverlap: true },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      name: "cm",
      axisLabel: { color: ct.labelMuted },
      splitLine: { lineStyle: { color: ct.splitLine } },
    },
    series: SENSORS.map((sensor, index) => ({
      type: "line",
      name: sensor.name,
      data:
        period === "raw"
          ? pointsBySensor[sensor.id].map((point) => [
              point.time,
              point.levelCm,
            ])
          : bucketPoints(pointsBySensor[sensor.id], period).map(
              ([time, average]) => [time, average],
            ),
      // Ribuan titik: penanda dimatikan supaya garisnya tetap terbaca
      showSymbol: false,
      lineStyle: { width: 1.5, color: sensor.color },
      itemStyle: { color: sensor.color },
      markLine:
        index === 0
          ? {
              silent: true,
              symbol: "none",
              label: { formatter: "{b}", color: ct.labelMuted, fontSize: 11 },
              data: [
                {
                  name: "SIAGA",
                  yAxis: alertCm,
                  lineStyle: { color: STATUS_COLORS.SIAGA, type: "dashed" },
                },
                {
                  name: "BAHAYA",
                  yAxis: dangerCm,
                  lineStyle: { color: STATUS_COLORS.BAHAYA, type: "dashed" },
                },
              ],
            }
          : undefined,
    })),
  });

  const image = chart.getDataURL({ type: "png", pixelRatio: 2 });
  chart.dispose();
  return image;
};

// jsPDF + autotable (±300 kB) dimuat hanya saat tombol ditekan, supaya halaman
// awal tidak ikut berat.
export const downloadHistoryPdf = async ({
  filename,
  title,
  subtitle,
  period,
  pointsBySensor,
  alertCm,
  dangerCm,
  note,
}: HistoryPdfOptions) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  doc.setFontSize(16);
  doc.text(title, margin, 16);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(subtitle, margin, 22);
  doc.text(
    `Dicetak ${new Date().toLocaleString("id-ID")}`,
    pageWidth - margin,
    22,
    { align: "right" },
  );
  if (note) doc.text(note, margin, 27);

  const chartTop = note ? 31 : 27;
  const chartHeight = (contentWidth * CHART_HEIGHT_PX) / CHART_WIDTH_PX;
  doc.addImage(
    renderChartImage(pointsBySensor, period, alertCm, dangerCm),
    "PNG",
    margin,
    chartTop,
    contentWidth,
    chartHeight,
  );

  // Tabel dimulai di halaman baru; urutan terbaru di atas seperti di dashboard
  const { header, rows } = buildExportTable(pointsBySensor, period);
  doc.addPage();
  autoTable(doc, {
    head: [["No", ...header]],
    body: rows.reverse().map((row, index) => [String(index + 1), ...row]),
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, halign: "center" },
    headStyles: { fillColor: [37, 99, 235] },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(110);
      doc.text(
        `Halaman ${doc.getNumberOfPages()}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 6,
        { align: "right" },
      );
    },
  });

  doc.save(filename);
};
