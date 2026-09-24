import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import styles from "./Admin.module.scss";
import { ADMIN_TABS } from "./AdminConstants";
import AdminSettings from "./components/AdminSettings/AdminSettings";
import AdminUsers from "./components/AdminUsers/AdminUsers";

// [CHANGED] Dulu dua tab terpisah di navbar (Pengguna & Pengaturan Sensor).
// Sekarang satu tab Admin dengan dua sub-tab, seperti halaman Tentang.
// Aksesnya sendiri tetap dijaga rules database, bukan oleh rute ini.
const Admin = () => {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.tab} ${styles.active}` : styles.tab;

  return (
    <div className={styles.admin}>
      <nav className={styles.subTabs}>
        {ADMIN_TABS.map((tab) => (
          <NavLink key={tab.path} to={tab.path} end={tab.end} className={tabClass}>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route index element={<AdminUsers />} />
        <Route path="pengaturan" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
};

export default Admin;
