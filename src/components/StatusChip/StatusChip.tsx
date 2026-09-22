import { FiAlertOctagon, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import type { SensorStatus } from "../../utils/constants/MonitorConstants";
import styles from "./StatusChip.module.scss";

// Ikon + teks, tidak hanya warna — status tetap terbaca oleh buta warna.
const STATUS_ICONS = {
  NORMAL: FiCheckCircle,
  SIAGA: FiAlertTriangle,
  BAHAYA: FiAlertOctagon,
};

interface StatusChipProps {
  status: SensorStatus | null;
}

const StatusChip = ({ status }: StatusChipProps) => {
  if (!status) return <span className={styles.statusChip}>Tidak ada data</span>;

  const Icon = STATUS_ICONS[status];
  return (
    <span className={`${styles.statusChip} ${styles[status.toLowerCase()]}`}>
      <Icon aria-hidden />
      {status}
    </span>
  );
};

export default StatusChip;
