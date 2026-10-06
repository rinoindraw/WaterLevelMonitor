import { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import HistoryDateRange from "../../../../components/HistoryDateRange/HistoryDateRange";
import HistoryFilter from "../../../../components/HistoryFilter/HistoryFilter";
import { HISTORY_PERIOD_OPTIONS } from "../../../../components/HistoryFilter/HistoryFilterConstants";
import { LoadingSpinner } from "../../../../components/LoadingState/LoadingState";
import StatusChip from "../../../../components/StatusChip/StatusChip";
import {
  buildHistoryCsv,
  downloadCsv,
} from "../../../../helpers/History/HistoryExport";
import { downloadHistoryPdf } from "../../../../helpers/History/HistoryPdf";
import {
  formatBucketTime,
  getRecentBucketsStart,
  ALL_TIME_RANGE,
  getDateRange,
  type HistoryPeriod,
} from "../../../../helpers/History/HistoryRange";
import { UseThresholdStore } from "../../../../stores/Settings/ThresholdStore";
import { HistoryService } from "../../../../services/History/HistoryService";
import { UseHistoryPages } from "../../../../hooks/History/UseHistoryPages";
import {
  HISTORY_PDF_MAX_POINTS,
  HISTORY_TABLE_FETCH_SIZE,
  HISTORY_TABLE_PAGE_SIZE,
  SENSORS,
  type SensorId,
} from "../../../../utils/constants/MonitorConstants";
import styles from "./DashboardHistoryTable.module.scss";

// Dua tabel, masing-masing dengan filter sendiri (sama seperti dua grafiknya):
// "data" = pembacaan Raw dengan filter dari–sampai tanggal; "average" = tab
// Harian/Bulanan/Tahunan, dari yang terbaru tanpa filter tanggal. Pembagian
// halaman ada di UseHistoryPages, dipakai bersama grafik.
const AVERAGE_PERIODS: HistoryPeriod[] = ["day", "month", "year"];

interface DashboardHistoryTableProps {
  kind: "data" | "average";
}

const DashboardHistoryTable = ({ kind }: DashboardHistoryTableProps) => {
  const [averagePeriod, setAveragePeriod] = useState<HistoryPeriod>("day");
  const period: HistoryPeriod = kind === "data" ? "raw" : averagePeriod;
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const { start, end } = useMemo(
    () => (kind === "data" ? getDateRange(from, to) : ALL_TIME_RANGE),
    [kind, from, to],
  );
  const table = UseHistoryPages(
    start,
    end,
    period,
    HISTORY_TABLE_PAGE_SIZE,
    HISTORY_TABLE_FETCH_SIZE,
  );
  const periodOption = HISTORY_PERIOD_OPTIONS.find(
    (item) => item.value === period,
  )!;

  const alertCm = UseThresholdStore((state) => state.alertCm);
  const dangerCm = UseThresholdStore((state) => state.dangerCm);

  // Unduh CSV/PDF: menarik data sesuai filter (bukan hanya halaman yang
  // tampil), lalu dihitung rata-ratanya kalau tab rata-rata. CSV memuat seluruh
  // rentang; PDF tabel Data dibatasi HISTORY_PDF_MAX_POINTS titik terbaru.
  const [downloading, setDownloading] = useState<"csv" | "pdf" | null>(null);
  const [isDownloadFailed, setIsDownloadFailed] = useState(false);
  const handleDownload = async (format: "csv" | "pdf") => {
    setDownloading(format);
    setIsDownloadFailed(false);
    try {
      // CSV selalu lengkap. PDF dibatasi HISTORY_PDF_MAX_POINTS: tabel Data =
      // titik terbaru per sensor; tabel rata-rata = bucket terbaru, jendelanya
      // dihitung dari data terbaru (bukan dari sekarang) supaya tetap terisi
      // walau alat sudah lama mati.
      const isPdf = format === "pdf";
      let fetchStart = start;
      if (isPdf && kind === "average" && period !== "raw") {
        const newest = await Promise.all(
          SENSORS.map((sensor) =>
            HistoryService.fetchPage(sensor.id, start, end, 1),
          ),
        );
        const newestTime = Math.max(0, ...newest.flat().map((p) => p.time));
        if (newestTime > 0) {
          fetchStart = Math.max(
            start,
            getRecentBucketsStart(newestTime, period, HISTORY_PDF_MAX_POINTS),
          );
        }
      }
      const entries = await Promise.all(
        SENSORS.map(async (sensor) => {
          const points =
            isPdf && kind === "data"
              ? await HistoryService.fetchPage(
                  sensor.id,
                  start,
                  end,
                  HISTORY_PDF_MAX_POINTS,
                )
              : await HistoryService.fetchAll(sensor.id, fetchStart, end);
          return [sensor.id, points] as const;
        }),
      );
      const pointsBySensor = Object.fromEntries(entries) as Record<
        SensorId,
        Awaited<ReturnType<typeof HistoryService.fetchAll>>
      >;
      const scope =
        kind === "data" ? `${from ?? "awal"}_${to ?? "terbaru"}` : "semua";
      const filename = `riwayat-${period}-${scope}.${format}`;

      if (format === "csv") {
        downloadCsv(filename, buildHistoryCsv(pointsBySensor, period));
      } else {
        await downloadHistoryPdf({
          filename,
          title:
            kind === "data"
              ? "Riwayat Data Tinggi Muka Air"
              : "Riwayat Rata-rata Tinggi Muka Air",
          subtitle:
            kind === "data"
              ? `Pembacaan apa adanya · ${from ?? "awal"} s/d ${to ?? "terbaru"}`
              : periodOption.tableDescription,
          period,
          pointsBySensor,
          alertCm,
          dangerCm,
          note: `Dibatasi maksimal ${HISTORY_PDF_MAX_POINTS.toLocaleString("id-ID")} ${kind === "data" ? "titik terbaru per sensor" : "baris terbaru"}; data lengkap tersedia lewat Unduh CSV.`,
        });
      }
    } catch {
      setIsDownloadFailed(true);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <section className={styles.historyTable}>
      <header className={styles.cardHeader}>
        <div className={styles.heading}>
          <h2 className={styles.title}>
            {kind === "data" ? "Tabel Riwayat Data" : "Tabel Riwayat Rata-rata"}
          </h2>
          <p className={styles.subtitle}>
            {periodOption.tableDescription} Maksimal {HISTORY_TABLE_PAGE_SIZE}{" "}
            baris per halaman.
          </p>
        </div>

        <div className={styles.filters}>
          {kind === "average" ? (
            <HistoryFilter
              period={averagePeriod}
              periods={AVERAGE_PERIODS}
              onPeriodChange={setAveragePeriod}
            />
          ) : (
            <HistoryDateRange
              from={from}
              to={to}
              onChange={(nextFrom, nextTo) => {
                setFrom(nextFrom);
                setTo(nextTo);
              }}
            />
          )}
        </div>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.numberCell}>
                No
              </th>
              <th scope="col">Waktu</th>
              {SENSORS.map((sensor) => (
                <th key={sensor.id} scope="col">
                  {sensor.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.pageRows.map((row, rowIndex) => (
              <tr key={row.time}>
                {/* Nomor berlanjut antar halaman: halaman 2 mulai dari 21 */}
                <td className={styles.numberCell}>
                  {(table.pageNumber - 1) * HISTORY_TABLE_PAGE_SIZE +
                    rowIndex +
                    1}
                </td>
                <td className={styles.timeCell}>
                  {formatBucketTime(row.time, period)}
                </td>
                {SENSORS.map((sensor) => {
                  const cell = row.cells[sensor.id];
                  return (
                    <td key={sensor.id}>
                      {cell ? (
                        <div className={styles.cell}>
                          <span className={styles.level}>
                            {cell.average.toFixed(1)} cm
                          </span>
                          {cell.status ? (
                            <StatusChip status={cell.status} />
                          ) : (
                            <span className={styles.range}>
                              min {cell.min.toFixed(1)} – maks{" "}
                              {cell.max.toFixed(1)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={styles.empty}>—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {table.isLoading && (
          <div className={styles.stateMessage}>
            <LoadingSpinner size={28} />
          </div>
        )}
        {!table.isLoading && table.pageRows.length === 0 && (
          <p className={styles.stateMessage}>
            {table.isFailed
              ? "Riwayat gagal dimuat. Coba ganti filter atau muat ulang halaman."
              : "Belum ada riwayat pada periode ini."}
          </p>
        )}
      </div>

      <footer className={styles.cardFooter}>
        <p className={styles.note}>
          {table.pageRows.length > 0 &&
            `Halaman ${table.pageNumber} · ${table.pageRows.length} baris. `}
          {period !== "raw" &&
            "Rata-rata dihitung dari data yang sudah dimuat. "}
          {table.isFailed &&
            table.pageRows.length > 0 &&
            "Sebagian data gagal dimuat. "}
          {isDownloadFailed && "Data gagal diunduh, coba lagi."}
        </p>

        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pagerButton}
            disabled={downloading !== null || table.pageRows.length === 0}
            title="Unduh seluruh data sesuai filter dalam format CSV"
            onClick={() => void handleDownload("csv")}
          >
            {downloading === "csv" ? "Mengunduh…" : "Unduh CSV"}
          </button>
          <button
            type="button"
            className={styles.pagerButton}
            disabled={downloading !== null || table.pageRows.length === 0}
            title="Unduh laporan PDF (grafik + tabel) sesuai filter"
            onClick={() => void handleDownload("pdf")}
          >
            {downloading === "pdf" ? "Membuat PDF…" : "Unduh PDF"}
          </button>
          {(table.canGoNewer || table.canGoOlder) && (
            <>
              <button
                type="button"
                className={`${styles.pagerButton} ${styles.iconButton}`}
                aria-label="Halaman lebih baru"
                title="Lebih baru"
                disabled={!table.canGoNewer || table.isLoadingMore}
                onClick={table.goNewer}
              >
                <FiChevronLeft aria-hidden />
              </button>
              <button
                type="button"
                className={`${styles.pagerButton} ${styles.iconButton}`}
                aria-label="Halaman lebih lama"
                title="Lebih lama"
                disabled={!table.canGoOlder || table.isLoadingMore}
                onClick={() => void table.goOlder()}
              >
                {table.isLoadingMore ? (
                  <LoadingSpinner size={16} />
                ) : (
                  <FiChevronRight aria-hidden />
                )}
              </button>
            </>
          )}
        </div>
      </footer>
    </section>
  );
};

export default DashboardHistoryTable;
