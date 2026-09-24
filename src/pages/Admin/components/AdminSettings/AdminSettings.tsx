import { useState, type FormEvent } from "react";
import { FiAlertCircle, FiCheckCircle, FiCpu } from "react-icons/fi";
import StatusChip from "../../../../components/StatusChip/StatusChip";
import { SettingsService } from "../../../../services/Settings/SettingsService";
import { UseAuthStore } from "../../../../stores/Auth/AuthStore";
import { UseThresholdStore } from "../../../../stores/Settings/ThresholdStore";
import {
  SENSORS,
  THRESHOLD_MAX_CM,
  THRESHOLD_MIN_CM,
} from "../../../../utils/constants/MonitorConstants";
import type { SensorHeights } from "../../../../stores/Settings/ThresholdStore";
import styles from "./AdminSettings.module.scss";
import {
  SETTINGS_DENIED_MESSAGE,
  SETTINGS_FAILED_MESSAGE,
  SETTINGS_SAVED_MESSAGE,
  THRESHOLD_NUMBER_ERROR,
  HEIGHT_TOO_LOW_ERROR,
  THRESHOLD_ORDER_ERROR,
  THRESHOLD_RANGE_ERROR,
  formatDateTime,
} from "./AdminSettingsConstants";

// Ambang SIAGA & BAHAYA plus kalibrasi tinggi sensor disimpan di Firebase,
// bukan di kode, supaya web dan ESP32 memakai angka yang sama. Status sendiri
// tetap dihitung di firmware.
const AdminSettings = () => {
  const isAdmin = UseAuthStore((state) => state.isAdmin);
  const email = UseAuthStore((state) => state.email);
  const alertCm = UseThresholdStore((state) => state.alertCm);
  const dangerCm = UseThresholdStore((state) => state.dangerCm);
  const sensorHeights = UseThresholdStore((state) => state.sensorHeights);
  const updatedAt = UseThresholdStore((state) => state.updatedAt);
  const updatedBy = UseThresholdStore((state) => state.updatedBy);
  const isLoaded = UseThresholdStore((state) => state.isLoaded);

  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaved(false);

    const form = new FormData(event.currentTarget);
    const nextAlert = Number(form.get("alertCm"));
    const nextDanger = Number(form.get("dangerCm"));
    const nextHeights = Object.fromEntries(
      SENSORS.map((sensor) => [sensor.id, Number(form.get(sensor.id))]),
    ) as SensorHeights;

    const semuaAngka = [nextAlert, nextDanger, ...Object.values(nextHeights)];

    if (semuaAngka.some((value) => !Number.isFinite(value))) {
      setError(THRESHOLD_NUMBER_ERROR);
      return;
    }
    if (
      semuaAngka.some(
        (value) => value < THRESHOLD_MIN_CM || value > THRESHOLD_MAX_CM,
      )
    ) {
      setError(THRESHOLD_RANGE_ERROR);
      return;
    }
    // [CHANGED] Ambang kini tinggi air: makin tinggi makin gawat
    if (nextDanger <= nextAlert) {
      setError(THRESHOLD_ORDER_ERROR);
      return;
    }
    // Air tidak mungkin lebih tinggi daripada sensornya sendiri
    if (Object.values(nextHeights).some((height) => height <= nextDanger)) {
      setError(HEIGHT_TOO_LOW_ERROR);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await SettingsService.saveThresholds(
        nextAlert,
        nextDanger,
        nextHeights,
        email ?? "",
      );
      setIsSaved(true);
    } catch {
      setError(SETTINGS_FAILED_MESSAGE);
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.settings}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Pengaturan sensor</h1>
        <p className={styles.pageDescription}>
          Kalibrasi tinggi pemasangan dan ambang tinggi air yang memisahkan
          NORMAL, SIAGA, dan BAHAYA. Angkanya disimpan di Firebase dan dibaca
          ESP32 maupun halaman grafik, jadi keduanya tidak pernah memakai
          patokan yang berbeda.
        </p>
      </header>

      {!isAdmin && <p className={styles.notice}>{SETTINGS_DENIED_MESSAGE}</p>}

      {/* key = nilai yang sedang berlaku: begitu Firebase mengirim angka baru
          (termasuk perubahan dari admin lain), isian ikut disetel ulang tanpa
          menyalin nilai store ke state. */}
      <form
        key={`${alertCm}-${dangerCm}-${Object.values(sensorHeights).join()}`}
        className={styles.formCard}
        onSubmit={handleSubmit}
      >
        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              <StatusChip status="SIAGA" /> mulai pada
            </span>
            <span className={styles.inputWrapper}>
              <input
                className={styles.input}
                type="number"
                inputMode="numeric"
                name="alertCm"
                min={THRESHOLD_MIN_CM}
                max={THRESHOLD_MAX_CM}
                defaultValue={alertCm}
                disabled={!isAdmin || !isLoaded}
              />
              <span className={styles.unit}>cm</span>
            </span>
            <span className={styles.fieldHint}>
              Tinggi air dari dasar mulai dari angka ini dianggap SIAGA.
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              <StatusChip status="BAHAYA" /> mulai pada
            </span>
            <span className={styles.inputWrapper}>
              <input
                className={styles.input}
                type="number"
                inputMode="numeric"
                name="dangerCm"
                min={THRESHOLD_MIN_CM}
                max={THRESHOLD_MAX_CM}
                defaultValue={dangerCm}
                disabled={!isAdmin || !isLoaded}
              />
              <span className={styles.unit}>cm</span>
            </span>
            <span className={styles.fieldHint}>
              Harus lebih besar daripada SIAGA — makin tinggi air, makin gawat.
            </span>
          </label>
        </div>

        {/* [NEW] Kalibrasi: diukur sekali di lapangan saat dasar kering.
            Semua tinggi air dihitung dari angka ini, jadi salah ukur berarti
            seluruh pembacaan ikut salah tanpa gejala. */}
        <div className={styles.calibration}>
          <p className={styles.sectionTitle}>Jarak sensor ke dasar</p>
          <p className={styles.sectionHint}>
            Ukur dari muka sensor tegak lurus ke dasar saat kering. Tinggi air =
            angka ini dikurangi jarak yang terbaca sensor.
          </p>

          <div className={styles.fieldRow}>
            {SENSORS.map((sensor) => (
              <label key={sensor.id} className={styles.field}>
                <span className={styles.fieldLabel}>
                  <span
                    className={styles.swatch}
                    style={{ backgroundColor: sensor.color }}
                    aria-hidden
                  />
                  {sensor.name}
                </span>
                <span className={styles.inputWrapper}>
                  <input
                    className={styles.input}
                    type="number"
                    inputMode="numeric"
                    name={sensor.id}
                    min={THRESHOLD_MIN_CM}
                    max={THRESHOLD_MAX_CM}
                    defaultValue={sensorHeights[sensor.id]}
                    disabled={!isAdmin || !isLoaded}
                  />
                  <span className={styles.unit}>cm</span>
                </span>
                <span className={styles.fieldHint}>{sensor.location}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Pembacaan ulang dari nilai yang sedang berlaku, bukan dari isian */}
        <p className={styles.preview}>
          Berlaku sekarang, diukur dari dasar:{" "}
          <StatusChip status="NORMAL" /> &lt; {alertCm} cm ·{" "}
          <StatusChip status="SIAGA" /> {alertCm}–{dangerCm} cm ·{" "}
          <StatusChip status="BAHAYA" /> ≥ {dangerCm} cm
        </p>

        {error && (
          <p className={`${styles.message} ${styles.error}`} role="alert">
            <FiAlertCircle aria-hidden />
            {error}
          </p>
        )}
        {isSaved && !error && (
          <p className={`${styles.message} ${styles.success}`}>
            <FiCheckCircle aria-hidden />
            {SETTINGS_SAVED_MESSAGE}
          </p>
        )}

        <div className={styles.formFooter}>
          <span className={styles.lastUpdate}>
            Terakhir diubah: {formatDateTime(updatedAt)}
            {updatedBy && ` · ${updatedBy}`}
          </span>
          <button
            className={styles.submit}
            type="submit"
            disabled={!isAdmin || !isLoaded || isSubmitting}
          >
            Simpan
          </button>
        </div>
      </form>

      <p className={styles.deviceNote}>
        <FiCpu aria-hidden />
        ESP32 membaca pengaturan ini langsung dari Firebase, jadi perubahan
        tidak perlu flash ulang. Nilai lama tetap dipakai sampai perangkat
        membaca yang baru.
      </p>
    </div>
  );
};

export default AdminSettings;
