import type { EChartsOption } from "echarts";
import { useMemo } from "react";
import EChart from "../../../../components/EChart/EChart";
import StatusChip from "../../../../components/StatusChip/StatusChip";
import { getChartTheme } from "../../../../helpers/Chart/ChartTheme";
import type { SensorSample } from "../../../../stores/Sensor/SensorStore";
import { UseThresholdStore } from "../../../../stores/Settings/ThresholdStore";
import { UseThemeStore } from "../../../../stores/Theme/ThemeStore";
import {
  STATUS_COLORS,
  type SensorConfig,
} from "../../../../utils/constants/MonitorConstants";
import styles from "./DashboardSensorChart.module.scss";

// Grafik realtime: titiknya dari buffer pembacaan /sensorN (±3 detik sekali) di
// store, jadi bergerak begitu ada data baru. Riwayat panjang ada di section
// grafik di bawah.
interface DashboardSensorChartProps {
  sensor: SensorConfig;
  samples: SensorSample[];
}

const DashboardSensorChart = ({
  sensor,
  samples,
}: DashboardSensorChartProps) => {
  const isDarkMode = UseThemeStore((state) => state.isDarkMode);
  // Ambang & tinggi pemasangan dari Firebase, diatur di halaman Pengaturan Sensor
  const alertCm = UseThresholdStore((state) => state.alertCm);
  const dangerCm = UseThresholdStore((state) => state.dangerCm);
  const sensorHeightCm = UseThresholdStore(
    (state) => state.sensorHeights[sensor.id],
  );
  const latestReading = samples.at(-1)?.readings[sensor.id];
  const seriesColor = isDarkMode ? sensor.colorDark : sensor.color;

  // Tinggi air dari dasar = jarak sensor ke dasar − jarak terbaca
  const latestLevelCm = latestReading
    ? Math.max(0, sensorHeightCm - latestReading.distanceCm)
    : null;

  // Tinggi air dari dasar tiap sampel, urut lama → baru
  const points = useMemo(
    () =>
      samples.flatMap((sample): [number, number][] => {
        const reading = sample.readings[sensor.id];
        return reading
          ? [[sample.time, Math.max(0, sensorHeightCm - reading.distanceCm)]]
          : [];
      }),
    [samples, sensor.id, sensorHeightCm],
  );

  const option = useMemo(() => {
    const ct = getChartTheme(isDarkMode);

    const chartOption: EChartsOption = {
      animation: false,
      grid: { left: 40, right: 16, top: 16, bottom: 28 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: ct.labelMuted } },
        backgroundColor: ct.tooltipBackground,
        borderColor: ct.axisLine,
        textStyle: { color: ct.labelStrong },
        formatter: (raw: unknown) => {
          const item = (Array.isArray(raw) ? raw : [raw])[0] as {
            axisValue: number;
            marker: string;
            value: number[];
          };
          const time = new Date(item.axisValue).toLocaleTimeString("id-ID");
          return `${time}<br/>${item.marker} ${sensor.name}: ${item.value[1].toFixed(1)} cm`;
        },
      },
      xAxis: {
        type: "time",
        // Bisa cuma 1 titik; tanpa ini ECharts melebarkan sumbu jadi
        // berhari-hari; di sini minimal 1 menit ke belakang dari titik terakhir.
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
        // Sumbu = tinggi air dari dasar, jadi garis naik memang berarti air naik
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
          showSymbol: true,
          symbolSize: 4,
          lineStyle: { width: 2, color: seriesColor },
          itemStyle: { color: seriesColor },
          // Garis ambang putus-putus, sama seperti grafik riwayat — angka yang
          // sama dipakai ESP32.
          markLine: {
            silent: true,
            symbol: "none",
            label: {
              formatter: "{b}",
              position: "insideEndTop",
              color: ct.labelMuted,
              fontSize: 11,
            },
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
          },
        },
      ],
    };

    return chartOption;
  }, [points, sensor, isDarkMode, seriesColor, alertCm, dangerCm]);

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
            <h2 className={styles.sensorName}>Realtime {sensor.name}</h2>
            <p className={styles.sensorLocation}>{sensor.location}</p>
          </div>
        </div>
        <StatusChip status={latestReading?.status ?? null} />
      </header>

      <p className={styles.reading}>
        <span className={styles.readingValue}>
          {latestLevelCm === null ? "—" : latestLevelCm.toFixed(1)}
        </span>
        <span className={styles.readingUnit}>cm Tinggi Muka Air</span>
      </p>

      <div className={styles.chartArea}>
        <EChart option={option} />
      </div>
    </article>
  );
};

export default DashboardSensorChart;
