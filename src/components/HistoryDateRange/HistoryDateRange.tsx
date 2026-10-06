import { toDateInputValue } from "../../helpers/History/HistoryRange";
import styles from "./HistoryDateRange.module.scss";

// Filter dari tanggal – sampai tanggal. Kedua sisi kosong = seluruh riwayat;
// satu sisi kosong = tanpa batas di sisi itu.
interface HistoryDateRangeProps {
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
}

const HistoryDateRange = ({ from, to, onChange }: HistoryDateRangeProps) => {
  const today = toDateInputValue(new Date());

  return (
    <div className={styles.dateRange}>
      <label className={styles.field}>
        <span className={styles.label}>Dari</span>
        <input
          type="date"
          className={styles.input}
          value={from ?? ""}
          max={to ?? today}
          onChange={(event) => onChange(event.target.value || null, to)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Sampai</span>
        <input
          type="date"
          className={styles.input}
          value={to ?? ""}
          min={from ?? undefined}
          max={today}
          onChange={(event) => onChange(from, event.target.value || null)}
        />
      </label>

      {(from || to) && (
        <button
          type="button"
          className={styles.reset}
          onClick={() => onChange(null, null)}
        >
          Reset
        </button>
      )}
    </div>
  );
};

export default HistoryDateRange;
