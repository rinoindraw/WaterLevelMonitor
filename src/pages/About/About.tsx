import { FiActivity, FiLayers, FiMap } from "react-icons/fi";
import { Link } from "react-router-dom";
import StatusChip from "../../components/StatusChip/StatusChip";
import {
  ALERT_THRESHOLD_CM,
  DANGER_THRESHOLD_CM,
} from "../../utils/constants/MonitorConstants";
import styles from "./About.module.scss";
import { SYSTEM_FEATURES, SYSTEM_SUMMARY } from "./AboutConstants";

// Ikon per fitur, urutannya sama dengan SYSTEM_FEATURES
const FEATURE_ICONS = [FiActivity, FiLayers, FiMap];

const About = () => (
  <div className={styles.about}>
    <header className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>Tentang sistem</h1>
      <p className={styles.pageDescription}>
        Sistem pemantau ketinggian air dan sampah. Tiga sensor ultrasonik pada
        satu ESP32 mengukur jarak ke permukaan, mengirimkannya ke Firebase, dan
        web ini menampilkannya secara langsung.
      </p>
    </header>

    <section className={styles.summaryCard}>
      <h2 className={styles.sectionTitle}>Ringkasan</h2>
      <dl className={styles.summaryList}>
        {SYSTEM_SUMMARY.map((item) => (
          <div key={item.label} className={styles.summaryRow}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
        {/* Angka dari konstanta yang sama dengan pita di grafik */}
        <div className={styles.summaryRow}>
          <dt>Ambang status</dt>
          <dd className={styles.thresholds}>
            <span><StatusChip status="NORMAL" /> &gt; {ALERT_THRESHOLD_CM} cm</span>
            <span><StatusChip status="SIAGA" /> {DANGER_THRESHOLD_CM}–{ALERT_THRESHOLD_CM} cm</span>
            <span><StatusChip status="BAHAYA" /> ≤ {DANGER_THRESHOLD_CM} cm</span>
          </dd>
        </div>
      </dl>
    </section>

    <div className={styles.featureGrid}>
      {SYSTEM_FEATURES.map((feature, index) => {
        const Icon = FEATURE_ICONS[index];
        return (
          <Link key={feature.title} to={feature.path} className={styles.featureCard}>
            <Icon className={styles.featureIcon} aria-hidden />
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureDescription}>{feature.description}</p>
          </Link>
        );
      })}
    </div>
  </div>
);

export default About;
