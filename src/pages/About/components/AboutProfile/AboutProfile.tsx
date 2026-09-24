import { FiInstagram } from "react-icons/fi";
import styles from "./AboutProfile.module.scss";
import {
  RESEARCHER_BIO,
  RESEARCHER_INSTAGRAM_LABEL,
  RESEARCHER_INSTAGRAM_URL,
  RESEARCHER_NAME,
  RESEARCHER_PHOTO,
  RESEARCHER_PHOTO_ALT,
  RESEARCHER_ROLE,
} from "./AboutProfileConstants";

// Sub-tab kedua halaman Tentang: profil peneliti. Dua kolom — keterangan di
// kiri, foto di kanan; di layar sempit foto naik ke atas teks.
const AboutProfile = () => (
  <div className={styles.profile}>
    <div className={styles.intro}>
      <div className={styles.heading}>
        <span className={styles.role}>{RESEARCHER_ROLE}</span>
        <h1 className={styles.name}>{RESEARCHER_NAME}</h1>
      </div>

      <p className={styles.bio}>{RESEARCHER_BIO}</p>

      <div className={styles.connect}>
        {/* Cahaya lembut di belakang tombol — tanpa ini efek kaca tidak punya
            apa pun untuk diburamkan. */}
        <span className={styles.glow} aria-hidden />
        <a
          className={styles.instagram}
          href={RESEARCHER_INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
        >
          <span className={styles.instagramIcon} aria-hidden>
            <FiInstagram />
          </span>
          <span className={styles.instagramText}>
            <span className={styles.instagramLabel}>Instagram</span>
            <span className={styles.instagramHandle}>
              {RESEARCHER_INSTAGRAM_LABEL}
            </span>
          </span>
        </a>
      </div>
    </div>

    <figure className={styles.portrait}>
      <img src={RESEARCHER_PHOTO} alt={RESEARCHER_PHOTO_ALT} />
    </figure>
  </div>
);

export default AboutProfile;
