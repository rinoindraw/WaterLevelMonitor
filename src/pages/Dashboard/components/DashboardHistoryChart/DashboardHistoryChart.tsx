import type { EChartsOption } from "echarts";
import { useMemo, type ReactNode } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import EChart from "../../../../components/EChart/EChart";
import { LoadingSpinner } from "../../../../components/LoadingState/LoadingState";
import { getChartTheme } from "../../../../helpers/Chart/ChartTheme";
import { HISTORY_PERIOD_OPTIONS } from "../../../../components/HistoryFilter/HistoryFilterConstants";
import { type HistoryPeriod } from "../../../../helpers/History/HistoryRange";
import { createHistoryTooltipFormatter } from "../../../../helpers/History/HistoryTooltip";
import {
  rowsToBuckets,
  type HistoryPagesResult,
} from "../../../../hooks/History/UseHistoryPages";
import { UseThresholdStore } from "../../../../stores/Settings/ThresholdStore";
import { UseThemeStore } from "../../../../stores/Theme/ThemeStore";
import {
  SENSORS,
  STATUS_COLORS,
} from "../../../../utils/constants/MonitorConstants";
import styles from "./DashboardHistoryChart.module.scss";

// Dipakai dua kali di Dashboard: grafik Raw (filter dari–sampai tanggal) dan
// grafik rata-rata (tab Harian/Bulanan/Tahunan). Periode, data, dan filternya
// dimiliki pemanggil; `filter` dirender di kanan header.
interface DashboardHistoryChartProps {
  title: string;
  period: HistoryPeriod;
  history: HistoryPagesResult;
  filter: ReactNode;
}

const DashboardHistoryChart = ({
  title,
  period,
  history,
  filter,
}: DashboardHistoryChartProps) => {
  const isDarkMode = UseThemeStore((state) => state.isDarkMode);
  const alertCm = UseThresholdStore((state) => state.alertCm);
  const dangerCm = UseThresholdStore((state) => state.dangerCm);

  const periodOption = HISTORY_PERIOD_OPTIONS.find(
    (item) => item.value === period,
  )!;

  const option = useMemo(() => {
    const ct = getChartTheme(isDarkMode);

    const chartOption: EChartsOption = {
      animation: false,
      grid: { left: 44, right: 16, top: 40, bottom: 28 },
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: ct.labelMuted },
        itemWidth: 14,
        itemHeight: 8,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: ct.labelMuted } },
        backgroundColor: ct.tooltipBackground,
        borderColor: ct.axisLine,
        textStyle: { color: ct.labelStrong },
        formatter: createHistoryTooltipFormatter(period),
      },
      xAxis: {
        type: "time",
        // Bisa cuma 1 titik; tanpa ini sumbu melebar berhari-hari
        min: (extent) => Math.min(extent.min, extent.max - 60_000),
        max: "dataMax",
        axisLine: { lineStyle: { color: ct.axisLine } },
        axisLabel: {
          color: ct.labelMuted,
          hideOverlap: true,
          formatter: periodOption.axisFormat,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: (extent) =>
          Math.ceil(Math.max(extent.max + 5, dangerCm + 20) / 10) * 10,
        axisLabel: { color: ct.labelMuted },
        splitLine: { lineStyle: { color: ct.splitLine } },
      },
      series: SENSORS.map((sensor, index) => {
        const color = isDarkMode ? sensor.colorDark : sensor.color;
        return {
          type: "line" as const,
          name: sensor.name,
          data: rowsToBuckets(history.pageRows, sensor.id),
          encode: { x: 0, y: 1 },
          // [CHANGED] Tiap data diberi penanda titik di semua periode, supaya
          // garisnya tidak terlihat flat
          showSymbol: true,
          symbolSize: 4,
          lineStyle: { width: 2, color },
          itemStyle: { color },
          // Garis ambang cukup di satu seri supaya tidak tergambar tiga kali
          markLine:
            index === 0
              ? {
                  silent: true,
                  symbol: "none",
                  label: {
                    formatter: "{b}",
                    position: "insideEndTop" as const,
                    color: ct.labelMuted,
                    fontSize: 11,
                  },
                  data: [
                    {
                      name: "SIAGA",
                      yAxis: alertCm,
                      lineStyle: {
                        color: STATUS_COLORS.SIAGA,
                        type: "dashed" as const,
                      },
                    },
                    {
                      name: "BAHAYA",
                      yAxis: dangerCm,
                      lineStyle: {
                        color: STATUS_COLORS.BAHAYA,
                        type: "dashed" as const,
                      },
                    },
                  ],
                }
              : undefined,
        };
      }),
    };
    return chartOption;
  }, [history.pageRows, period, periodOption, isDarkMode, alertCm, dangerCm]);

  return (
    <section className={styles.historyCard}>
      <header className={styles.cardHeader}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{periodOption.description}</p>
        </div>

        {filter}
      </header>

      <div className={styles.chartArea}>
        <EChart option={option} />
        {history.isLoading && (
          <div className={styles.overlay}>
            <LoadingSpinner size={28} />
          </div>
        )}
        {!history.isLoading &&
          history.isFailed &&
          history.pageRows.length === 0 && (
            <p className={styles.overlay}>
              Riwayat gagal dimuat. Coba ganti filter atau muat ulang halaman.
            </p>
          )}
        {!history.isLoading &&
          !history.isFailed &&
          history.pageRows.length === 0 && (
            <p className={styles.overlay}>
              Belum ada riwayat pada periode ini.
            </p>
          )}
      </div>

      <footer className={styles.cardFooter}>
        <p className={styles.note}>
          {history.pageRows.length > 0 &&
            `Halaman ${history.pageNumber} · ${history.pageRows.length.toLocaleString("id-ID")} titik. `}
          {period !== "raw" &&
            "Rata-rata dihitung dari data yang sudah dimuat. "}
          {history.isFailed &&
            history.pageRows.length > 0 &&
            "Sebagian data gagal dimuat."}
        </p>

        {(history.canGoNewer || history.canGoOlder) && (
          <div className={styles.pager}>
            <button
              type="button"
              className={`${styles.pagerButton} ${styles.iconButton}`}
              aria-label="Halaman lebih baru"
              title="Lebih baru"
              disabled={!history.canGoNewer || history.isLoadingMore}
              onClick={history.goNewer}
            >
              <FiChevronLeft aria-hidden />
            </button>
            <button
              type="button"
              className={`${styles.pagerButton} ${styles.iconButton}`}
              aria-label="Halaman lebih lama"
              title="Lebih lama"
              disabled={!history.canGoOlder || history.isLoadingMore}
              onClick={() => void history.goOlder()}
            >
              {history.isLoadingMore ? (
                <LoadingSpinner size={16} />
              ) : (
                <FiChevronRight aria-hidden />
              )}
            </button>
          </div>
        )}
      </footer>
    </section>
  );
};

export default DashboardHistoryChart;
