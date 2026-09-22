import type { EChartsOption, MarkLineComponentOption } from "echarts";
import { useMemo } from "react";
import EChart from "../../../../components/EChart/EChart";
import { getChartTheme } from "../../../../helpers/Chart/ChartTheme";
import type { SensorSample } from "../../../../stores/Sensor/SensorStore";
import { UseThemeStore } from "../../../../stores/Theme/ThemeStore";
import {
  OBJECT_PREDICTIONS,
  SENSORS,
} from "../../../../utils/constants/MonitorConstants";
import styles from "./DashboardObjectProfile.module.scss";

interface DashboardObjectProfileProps {
  samples: SensorSample[];
}

// Profil objek dari snapshot TERAKHIR: Sensor 1 di kiri, Sensor 3 di kanan
// (urutan SENSORS). Tinggi = emptyDistanceCm − jarak terbaca, minimal 0.
const DashboardObjectProfile = ({ samples }: DashboardObjectProfileProps) => {
  const isDarkMode = UseThemeStore((state) => state.isDarkMode);
  const latestSample = samples.at(-1);

  const { heights, option } = useMemo(() => {
    const ct = getChartTheme(isDarkMode);
    const sensorHeights = SENSORS.map((sensor) => {
      const reading = latestSample?.readings[sensor.id];
      return reading
        ? Math.round(Math.max(0, sensor.emptyDistanceCm - reading.distanceCm) * 10) / 10
        : null;
    });

    // [NEW] Pancaran sensor: garis putus-putus dari posisi pemasangan
    // (y = emptyDistanceCm) turun ke permukaan yang terbaca. Panjangnya =
    // jarak terbaca. Kotak kecil di pangkal = sensornya.
    const beamLines: MarkLineComponentOption["data"] = sensorHeights.flatMap(
      (height, index) => {
        if (height === null) return [];
        const sensor = SENSORS[index];
        return [
          [
            {
              xAxis: sensor.name,
              yAxis: sensor.emptyDistanceCm,
              lineStyle: {
                color: isDarkMode ? sensor.colorDark : sensor.color,
                type: "dashed",
                width: 1.5,
              },
            },
            { xAxis: sensor.name, yAxis: height },
          ],
        ];
      },
    );

    const chartOption: EChartsOption = {
      // Bentuk berubah halus saat data baru masuk — gerak yang menunjukkan
      // apa yang berubah, bukan hiasan.
      animationDurationUpdate: 400,
      grid: { left: 48, right: 48, top: 32, bottom: 28 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: ct.labelMuted } },
        backgroundColor: ct.tooltipBackground,
        borderColor: ct.axisLine,
        textStyle: { color: ct.labelStrong },
        valueFormatter: (value) =>
          typeof value === "number" ? `${value.toFixed(1)} cm` : "—",
      },
      xAxis: {
        type: "category",
        data: SENSORS.map((sensor) => sensor.name),
        // Titik di tengah tiap sepertiga lebar (kiri/tengah/kanan). Kalau
        // ditempel ke tepi (false), label Sensor 1 menabrak angka sumbu Y.
        boundaryGap: true,
        axisLine: { lineStyle: { color: ct.axisLine } },
        axisTick: { show: false },
        axisLabel: { color: ct.labelStrong },
      },
      yAxis: {
        type: "value",
        name: "Tinggi (cm)", // [CHANGED]
        nameTextStyle: { color: ct.labelMuted, align: "left" },
        min: 0,
        // Ruang ~15% di atas tinggi maksimum supaya label nilai di puncak
        // dan kotak sensor tidak menimpa angka sumbu teratas
        max:
          Math.ceil(
            (Math.max(...SENSORS.map((sensor) => sensor.emptyDistanceCm)) * 1.15) / 10,
          ) * 10,
        axisLabel: { color: ct.labelMuted },
        splitLine: { lineStyle: { color: ct.splitLine } },
      },
      series: [
        {
          type: "line",
          name: "Tinggi objek", // [CHANGED]
          smooth: 0.4,
          symbol: "circle",
          symbolSize: 10,
          // Titik diwarnai sesuai sensornya (nyambung ke row 1), bentuknya netral
          data: sensorHeights.map((height, index) => ({
            value: height ?? "-",
            itemStyle: {
              color: isDarkMode ? SENSORS[index].colorDark : SENSORS[index].color,
              borderColor: ct.tooltipBackground,
              borderWidth: 2,
            },
          })),
          lineStyle: { width: 2, color: ct.objectLine },
          areaStyle: { color: ct.objectFill },
          label: {
            show: true,
            // [CHANGED] dulu "top" — di atas titik kini ada garis pancaran,
            // dan di kiri/kanan ada garis profil. Bawah titik = area kosong.
            position: "bottom",
            distance: 8,
            color: ct.labelStrong,
            formatter: ({ value }) =>
              typeof value === "number" ? `${value.toFixed(1)} cm` : "",
          },
          // [NEW]
          markLine: {
            silent: true,
            symbol: ["rect", "none"],
            symbolSize: [12, 6],
            label: { show: false },
            data: beamLines,
          },
        },
      ],
    };

    return { heights: sensorHeights, option: chartOption };
  }, [latestSample, isDarkMode]);

  // Prediksi hanya kalau ketiga sensor ada — bentuk dari 2 titik tidak berarti
  const hasAllReadings = heights.every((height) => height !== null);
  const values = heights.filter((height): height is number => height !== null);
  const peakCm = hasAllReadings ? Math.max(...values) : null;
  const spreadCm = hasAllReadings ? Math.max(...values) - Math.min(...values) : null;
  const prediction =
    peakCm !== null && spreadCm !== null
      ? OBJECT_PREDICTIONS.find(
          (rule) =>
            (rule.minPeakCm === undefined || peakCm >= rule.minPeakCm) &&
            (rule.maxPeakCm === undefined || peakCm < rule.maxPeakCm) &&
            (rule.minSpreadCm === undefined || spreadCm >= rule.minSpreadCm) &&
            (rule.maxSpreadCm === undefined || spreadCm < rule.maxSpreadCm),
        )
      : undefined;

  return (
    <article className={styles.profileCard}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Prediksi objek</h2>
        <p className={styles.cardDescription}>
          Lihat bentuk permukaan di bawah ketiga sensor dan prediksi apakah itu
          air naik atau tumpukan sampah. Garis putus-putus menunjukkan pancaran
          tiap sensor.
        </p>
      </header>

      <div className={styles.cardBody}>
        <div className={styles.chartArea}>
          <EChart option={option} />
          {!latestSample && <p className={styles.emptyState}>Belum ada data.</p>}
        </div>

        <aside className={styles.predictionPanel}>
          <p className={styles.predictionCaption}>Prediksi objek</p>
          <p className={styles.predictionLabel}>
            {prediction?.label ?? "Data belum cukup"}
          </p>
          <p className={styles.predictionDescription}>
            {prediction?.description ??
              "Prediksi butuh bacaan dari ketiga sensor."}
          </p>
          <dl className={styles.predictionStats}>
            <dt>Tinggi puncak</dt>
            <dd>{peakCm === null ? "—" : `${peakCm.toFixed(1)} cm`}</dd>
            <dt>Ketidakrataan</dt>
            <dd>{spreadCm === null ? "—" : `${spreadCm.toFixed(1)} cm`}</dd>
          </dl>
        </aside>
      </div>
    </article>
  );
};

export default DashboardObjectProfile;
