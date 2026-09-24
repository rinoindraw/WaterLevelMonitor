import {
  FiActivity,
  FiDroplet,
  FiInfo,
  FiLogOut,
  FiMap,
  FiMoon,
  FiShield,
  FiSun,
} from "react-icons/fi";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import type { ConnectionState } from "../../hooks/Sensor/UseSensorRealtime";
import { AuthService } from "../../services/Auth/AuthService";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { UserService } from "../../services/User/UserService";
import { UseAuthStore } from "../../stores/Auth/AuthStore";
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
  const email = UseAuthStore((state) => state.email);
  const isAdmin = UseAuthStore((state) => state.isAdmin);
  const uid = UseAuthStore((state) => state.uid);

  // [NEW] Keluar tidak langsung dijalankan — dikonfirmasi dulu, supaya tidak
  // terpencet saat mengejar tombol tema di sebelahnya.
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  // Tandai offline dulu, baru keluar — urutan sebaliknya ditolak rules karena
  // sesinya sudah tidak ada. Gagal menandai pun tetap dikeluarkan;
  // onDisconnect yang akan membereskannya saat tab ditutup.
  const handleSignOut = async () => {
    setIsSignOutOpen(false);
    if (uid) await UserService.markOffline(uid).catch(() => undefined);
    await AuthService.signOut();
  };

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
        {/* Hanya penanda tampilan; aksesnya sendiri dijaga rules database */}
        {isAdmin && (
          <NavLink to="/admin" className={navLinkClass}>
            <FiShield aria-hidden />
            <span>Admin</span>
          </NavLink>
        )}
      </nav>

      <div className={styles.actions}>
        <span className={`${styles.connection} ${styles[connection]}`}>
          <span className={styles.connectionDot} aria-hidden />
          <span className={styles.connectionLabel}>
            {CONNECTION_LABELS[connection]}
          </span>
        </span>
        {/* [NEW] Identitas sesi + keluar */}
        <span className={styles.account}>
          <span className={styles.user} title={email ?? undefined}>
            {email}
          </span>
          {/* Penanda tampilan; aksesnya sendiri dijaga rules database */}
          {isAdmin && <span className={styles.roleBadge}>Admin</span>}
        </span>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={() => setIsSignOutOpen(true)}
          aria-label="Keluar"
        >
          <FiLogOut />
        </button>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
        >
          {isDarkMode ? <FiSun /> : <FiMoon />}
        </button>
      </div>

      <ConfirmDialog
        isOpen={isSignOutOpen}
        icon={<FiLogOut />}
        title="Keluar dari akun?"
        description={`Sesi ${email ?? "ini"} akan ditutup dan data sensor berhenti tampil sampai Anda masuk lagi.`}
        confirmLabel="Keluar"
        onConfirm={() => void handleSignOut()}
        onCancel={() => setIsSignOutOpen(false)}
      />
    </header>
  );
};

export default Navbar;
