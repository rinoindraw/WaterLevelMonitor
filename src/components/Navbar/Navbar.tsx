import { FiActivity, FiDroplet, FiInfo, FiMap, FiMoon, FiSun } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import type { ConnectionState } from "../../hooks/Sensor/UseSensorRealtime";
import { UseThemeStore } from "../../stores/Theme/ThemeStore";
import styles from "./Navbar.module.scss";

const CONNECTION_LABELS: Record<ConnectionState, string> = {
  connecting: "Menghubungkan…",
  live: "Terhubung",
  offline: "Firebase tidak terjangkau",
};

interface NavbarProps {
  connection: ConnectionState;
}

const Navbar = ({ connection }: NavbarProps) => {
  const isDarkMode = UseThemeStore((state) => state.isDarkMode);
  const toggleDarkMode = UseThemeStore((state) => state.toggleDarkMode);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>
        <FiDroplet className={styles.brandIcon} aria-hidden />
        <span className={styles.title}>Monitor Tinggi Muka Air</span>
      </div>

      <nav className={styles.navLinks}>
        <NavLink to="/" end className={navLinkClass}>
          <FiActivity aria-hidden />
          <span>Grafik</span>
        </NavLink>
        <NavLink to="/map" className={navLinkClass}>
          <FiMap aria-hidden />
          <span>Peta</span>
        </NavLink>
        <NavLink to="/about" className={navLinkClass}>
          <FiInfo aria-hidden />
          <span>Tentang</span>
        </NavLink>
      </nav>

      <div className={styles.actions}>
        <span className={`${styles.connection} ${styles[connection]}`}>
          <span className={styles.connectionDot} aria-hidden />
          <span className={styles.connectionLabel}>
            {CONNECTION_LABELS[connection]}
          </span>
        </span>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
        >
          {isDarkMode ? <FiSun /> : <FiMoon />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
