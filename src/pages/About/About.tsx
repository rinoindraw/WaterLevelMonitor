import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import styles from "./About.module.scss";
import { ABOUT_TABS } from "./AboutConstants";
import AboutProfile from "./components/AboutProfile/AboutProfile";
import AboutSystem from "./components/AboutSystem/AboutSystem";

// [CHANGED] Halaman Tentang kini berisi dua sub-tab: sistem dan profil
// peneliti. Sub-tab memakai rute sendiri supaya bisa ditautkan langsung dan
// tidak hilang saat halaman dimuat ulang.
const About = () => {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.tab} ${styles.active}` : styles.tab;

  return (
    <div className={styles.about}>
      <nav className={styles.subTabs}>
        {ABOUT_TABS.map((tab) => (
          <NavLink key={tab.path} to={tab.path} end={tab.end} className={tabClass}>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route index element={<AboutSystem />} />
        <Route path="profil" element={<AboutProfile />} />
        <Route path="*" element={<Navigate to="/about" replace />} />
      </Routes>
    </div>
  );
};

export default About;
