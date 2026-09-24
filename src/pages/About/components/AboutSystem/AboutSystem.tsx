import { FiActivity, FiLayers, FiMap } from "react-icons/fi";
import { Link } from "react-router-dom";
import StatusChip from "../../../../components/StatusChip/StatusChip";
import { UseThresholdStore } from "../../../../stores/Settings/ThresholdStore";
import { SYSTEM_FEATURES, SYSTEM_SUMMARY } from "../../AboutConstants";
import styles from "./AboutSystem.module.scss";

// Ikon per fitur, urutannya sama dengan SYSTEM_FEATURES
const FEATURE_ICONS = [FiActivity, FiLayers, FiMap];

// Sub-tab pertama halaman Tentang: ringkasan sistem.
// [CHANGED] Ambang tidak lagi dari konstanta: nilainya diatur di halaman
// Pengaturan Sensor dan disimpan di Firebase.
const AboutSystem = () => {
  const alertCm = UseThresholdStore((state) => state.alertCm);
  const dangerCm = UseThresholdStore((state) => state.dangerCm);

  return (
  <div className={styles.system}>
    <header className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>Tentang sistem</h1>
      <p className={styles.pageDescription}>
        Sistem pemantau ketinggian air dan sampah. Tiga sensor ultrasonik pada
        satu ESP32 mengukur jarak ke permukaan, lalu jarak itu diubah menjadi
        tinggi air dari dasar memakai kalibrasi yang tersimpan di Firebase.
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
          <dt>Ambang tinggi air</dt>
          <dd className={styles.thresholds}>
            <span><StatusChip status="NORMAL" /> &lt; {alertCm} cm</span>
            <span><StatusChip status="SIAGA" /> {alertCm}–{dangerCm} cm</span>
            <span><StatusChip status="BAHAYA" /> ≥ {dangerCm} cm</span>
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
};

export default AboutSystem;
