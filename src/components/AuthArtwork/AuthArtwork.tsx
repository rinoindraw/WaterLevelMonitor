import { SENSORS } from "../../utils/constants/MonitorConstants";
import styles from "./AuthArtwork.module.scss";

// Panel kiri halaman masuk & daftar: papan duga sederhana yang menggambarkan
// apa yang sebenarnya dikerjakan sistem ini — tiga sensor memandang ke bawah,
// air naik turun melewati garis SIAGA dan BAHAYA.
//
// Murni hiasan, jadi ditandai aria-hidden: tidak ada informasi di sini yang
// tidak ada juga di teks sebelahnya.
const AuthArtwork = () => (
  <aside className={styles.artwork}>
    <div className={styles.copy}>
      <p className={styles.eyebrow}>Monitor tinggi muka air</p>
      <h2 className={styles.headline}>Air naik, Anda tahu lebih dulu</h2>
      <p className={styles.subline}>
        Tiga sensor ultrasonik membaca permukaan tiap tiga detik dan
        mengirimkannya langsung ke layar ini.
      </p>
    </div>

    <div className={styles.gauge} aria-hidden>
      {/* Tiga sensor di atas, lengkap dengan pancaran putus-putusnya */}
      <div className={styles.sensors}>
        {SENSORS.map((sensor) => (
          <span key={sensor.id} className={styles.sensor}>
            <span
              className={styles.sensorBody}
              style={{ backgroundColor: sensor.color }}
            />
            <span className={styles.beam} />
          </span>
        ))}
      </div>

      {/* Garis ambang: penanda yang sama dengan pita di grafik */}
      <span className={`${styles.mark} ${styles.danger}`}>
        <span className={styles.markLabel}>BAHAYA</span>
      </span>
      <span className={`${styles.mark} ${styles.alert}`}>
        <span className={styles.markLabel}>SIAGA</span>
      </span>

      {/* Air yang perlahan naik turun; dua lapis gelombang untuk kesan dalam */}
      <div className={styles.water}>
        <span className={`${styles.wave} ${styles.waveBack}`} />
        <span className={styles.wave} />
      </div>

      {/* Papan duga di sisi kanan */}
      <div className={styles.ruler}>
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} className={styles.tick} />
        ))}
      </div>
    </div>
  </aside>
);

export default AuthArtwork;
