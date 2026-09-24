import type { EChartsOption } from "echarts";
import { useMemo } from "react";
import EChart from "../../../../components/EChart/EChart";
import StatusChip from "../../../../components/StatusChip/StatusChip";
import { getChartTheme } from "../../../../helpers/Chart/ChartTheme";
import type { SensorSample } from "../../../../stores/Sensor/SensorStore";
import { UseThresholdStore } from "../../../../stores/Settings/ThresholdStore";
import { UseThemeStore } from "../../../../stores/Theme/ThemeStore";
import type { SensorConfig } from "../../../../utils/constants/MonitorConstants";
import styles from "./DashboardSensorChart.module.scss";

interface DashboardSensorChartProps {
  sensor: SensorConfig;
  samples: SensorSample[];
}

const DashboardSensorChart = ({ sensor, samples }: DashboardSensorChartProps) => {
  const isDarkMode = UseThemeStore((state) => state.isDarkMode);
  // [CHANGED] Ambang & tinggi pemasangan kini dari Firebase, diatur di
  // halaman Pengaturan Sensor
  const alertCm = UseThresholdStore((state) => state.alertCm);
  const dangerCm = UseThresholdStore((state) => state.dangerCm);
  const sensorHeightCm = UseThresholdStore(
    (state) => state.sensorHeights[sensor.id],
  );
  const latestReading = samples.at(-1)?.readings[sensor.id];
  const seriesColor = isDarkMode ? sensor.colorDark : sensor.color;

  // [CHANGED] Yang ditampilkan kini TINGGI AIR dari dasar, bukan jarak ke
  // sensor: tinggi air = jarak sensor ke dasar − jarak terbaca.
  const latestLevelCm = latestReading
    ? Math.max(0, sensorHeightCm - latestReading.distanceCm)
    : null;

  const { option, hasData } = useMemo(() => {
    const ct = getChartTheme(isDarkMode);
    const points = samples.flatMap((sample): [number, number][] => {
      const reading = sample.readings[sensor.id];
      return reading
        ? [[sample.time, Math.max(0, sensorHeightCm - reading.distanceCm)]]
        : [];
    });

    const chartOption: EChartsOption = {
      animation: false,
      grid: { left: 40, right: 16, top: 16, bottom: 28 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: ct.labelMuted } },
        backgroundColor: ct.tooltipBackground,
        borderColor: ct.axisLine,
        textStyle: { color: ct.labelStrong },
        valueFormatter: (value) => `${Number(value).toFixed(1)} cm`,
      },
      xAxis: {
        type: "time",
        // Titik hanya masuk saat Firebase berubah, jadi bisa cuma 1 titik.
        // Tanpa ini ECharts melebarkan sumbu jadi berhari-hari; di sini
        // minimal 1 menit ke belakang dari titik terakhir.
        min: (extent) => Math.min(extent.min, extent.max - 60_000),
        max: "dataMax",
        axisLine: { lineStyle: { color: ct.axisLine } },
        axisLabel: {
          color: ct.labelMuted,
          hideOverlap: true,
          formatter: "{HH}:{mm}:{ss}",
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        // [CHANGED] Tidak lagi dibalik. Sumbu = tinggi air dari dasar, jadi
        // garis naik memang berarti air naik tanpa perlu akal-akalan.
        min: 0,
        max: (extent) =>
          Math.ceil(Math.max(extent.max + 5, dangerCm + 20) / 10) * 10,
        axisLabel: { color: ct.labelMuted },
        splitLine: { lineStyle: { color: ct.splitLine } },
      },
      series: [
        {
          type: "line",
          name: sensor.name,
          data: points,
          // Satu titik tanpa simbol = tidak terlihat sama sekali
          showSymbol: points.length === 1,
          symbolSize: 8,
          lineStyle: { width: 2, color: seriesColor },
          itemStyle: { color: seriesColor },
          // Pita ambang seperti papan duga — angka yang sama dipakai ESP32.
          // [CHANGED] Sekarang pita ADA DI ATAS: makin tinggi air makin gawat.
          markArea: {
            silent: true,
            label: { position: "insideRight", color: ct.labelMuted, fontSize: 11 },
            data: [
              [
                { name: "SIAGA", yAxis: alertCm, itemStyle: { color: ct.alertBand } },
                { yAxis: dangerCm },
              ],
              [
                { name: "BAHAYA", yAxis: dangerCm, itemStyle: { color: ct.dangerBand } },
                // "max" = sampai puncak sumbu, berapa pun tingginya nanti
                { yAxis: "max" },
              ],
            ],
          },
        },
      ],
    };

    return { option: chartOption, hasData: points.length > 0 };
  }, [samples, sensor, isDarkMode, seriesColor, alertCm, dangerCm, sensorHeightCm]);

  return (
    <article className={styles.sensorCard}>
      <header className={styles.cardHeader}>
        <div className={styles.identity}>
          <span
            className={styles.swatch}
            style={{ backgroundColor: seriesColor }}
            aria-hidden
          />
          <div>
            <h2 className={styles.sensorName}>{sensor.name}</h2>
            <p className={styles.sensorLocation}>{sensor.location}</p>
          </div>
        </div>
        <StatusChip status={latestReading?.status ?? null} />
      </header>

      <p className={styles.reading}>
        <span className={styles.readingValue}>
          {latestLevelCm === null ? "—" : latestLevelCm.toFixed(1)}
        </span>
        <span className={styles.readingUnit}>cm tinggi air</span>
      </p>

      <div className={styles.chartArea}>
        <EChart option={option} />
        {!hasData && (
          <p className={styles.emptyState}>
            Belum ada data dari {sensor.name}.
          </p>
        )}
      </div>
    </article>
  );
};

export default DashboardSensorChart;
