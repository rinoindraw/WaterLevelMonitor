import type { HistoryPeriod } from "../../helpers/History/HistoryRange";
import { HISTORY_PERIOD_OPTIONS } from "./HistoryFilterConstants";
import styles from "./HistoryFilter.module.scss";

// Tab periode. `periods` menentukan tab mana yang tampil: grafik rata-rata
// hanya Harian/Bulanan/Tahunan, tabel memakai keempatnya.
interface HistoryFilterProps {
  period: HistoryPeriod;
  periods: HistoryPeriod[];
  onPeriodChange: (period: HistoryPeriod) => void;
}

const HistoryFilter = ({
  period,
  periods,
  onPeriodChange,
}: HistoryFilterProps) => (
  <div className={styles.historyFilter}>
    <div className={styles.periodTabs} role="group" aria-label="Periode">
      {HISTORY_PERIOD_OPTIONS.filter((item) => periods.includes(item.value)).map(
        (item) => (
          <button
            key={item.value}
            type="button"
            className={`${styles.tab} ${item.value === period ? styles.active : ""}`}
            aria-pressed={item.value === period}
            onClick={() => onPeriodChange(item.value)}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  </div>
);

export default HistoryFilter;
