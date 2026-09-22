import type { EChartsOption } from "echarts";
import { useMemo } from "react";
import EChart from "../../../../components/EChart/EChart";
import StatusChip from "../../../../components/StatusChip/StatusChip";
import { getChartTheme } from "../../../../helpers/Chart/ChartTheme";
import type { SensorSample } from "../../../../stores/Sensor/SensorStore";
import { UseThemeStore } from "../../../../stores/Theme/ThemeStore";
import {
  ALERT_THRESHOLD_CM,
  DANGER_THRESHOLD_CM,
  type SensorConfig,
} from "../../../../utils/constants/MonitorConstants";
import styles from "./DashboardSensorChart.module.scss";

interface DashboardSensorChartProps {
  sensor: SensorConfig;
  samples: SensorSample[];
}

const DashboardSensorChart = ({ sensor, samples }: DashboardSensorChartProps) => {
  const isDarkMode = UseThemeStore((state) => state.isDarkMode);
  const latestReading = samples.at(-1)?.readings[sensor.id];
  const seriesColor = isDarkMode ? sensor.colorDark : sensor.color;

  const { option, hasData } = useMemo(() => {
    const ct = getChartTheme(isDarkMode);
    const points = samples.flatMap((sample): [number, number][] => {
      const reading = sample.readings[sensor.id];
      return reading ? [[sample.time, reading.distanceCm]] : [];
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
        // Dibalik: 0 cm (air menyentuh sensor) di atas → garis naik = air naik
        inverse: true,
        min: 0,
        max: (extent) =>
          Math.ceil(Math.max(extent.max + 5, ALERT_THRESHOLD_CM + 20) / 10) * 10,
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
          // Pita ambang seperti papan duga — angka dari .ino
          markArea: {
            silent: true,
            label: { position: "insideRight", color: ct.labelMuted, fontSize: 11 },
            data: [
              [
                { name: "BAHAYA", yAxis: 0, itemStyle: { color: ct.dangerBand } },
                { yAxis: DANGER_THRESHOLD_CM },
              ],
              [
                { name: "SIAGA", yAxis: DANGER_THRESHOLD_CM, itemStyle: { color: ct.alertBand } },
                { yAxis: ALERT_THRESHOLD_CM },
              ],
            ],
          },
        },
      ],
    };

    return { option: chartOption, hasData: points.length > 0 };
  }, [samples, sensor, isDarkMode, seriesColor]);

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
          {latestReading ? latestReading.distanceCm.toFixed(1) : "—"}
        </span>
        <span className={styles.readingUnit}>cm ke air</span>
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
