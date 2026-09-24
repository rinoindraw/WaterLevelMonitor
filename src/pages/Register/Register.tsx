import { FirebaseError } from "firebase/app";
import { useState, type FormEvent } from "react";
import { FiAlertCircle, FiDroplet, FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "react-router-dom";
import AuthArtwork from "../../components/AuthArtwork/AuthArtwork";
import { LoadingSpinner } from "../../components/LoadingState/LoadingState";
import { AuthService } from "../../services/Auth/AuthService";
import {
  AUTH_ERROR_MESSAGES,
  DEFAULT_AUTH_ERROR,
  MIN_PASSWORD_LENGTH,
  PASSWORD_MISMATCH_ERROR,
  PASSWORD_TOO_SHORT_ERROR,
} from "../../utils/constants/AuthConstants";
import styles from "./Register.module.scss";

// Pendaftaran akun baru. Akun langsung masuk begitu dibuat, jadi tidak ada
// layar "pendaftaran berhasil" — user langsung melihat dashboard.
const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // [NEW] Satu tombol untuk kedua isian: yang dibandingkan harus sama-sama
  // terlihat, kalau tidak justru membingungkan saat mencari selisihnya.
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Dicek lebih dulu di sini supaya tidak perlu bolak-balik ke Firebase.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(PASSWORD_TOO_SHORT_ERROR);
      return;
    }
    if (password !== passwordConfirmation) {
      setError(PASSWORD_MISMATCH_ERROR);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await AuthService.register(email.trim(), password);
      // AuthStore langsung jadi "authenticated" — App menukar tampilan sendiri.
    } catch (caught) {
      setError(
        AUTH_ERROR_MESSAGES[
          caught instanceof FirebaseError ? caught.code : ""
        ] ?? DEFAULT_AUTH_ERROR,
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.register}>
      <div className={styles.shell}>
        <AuthArtwork />

        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.brand}>
            <FiDroplet className={styles.brandIcon} aria-hidden />
            <span className={styles.brandName}>Monitor Tinggi Muka Air</span>
          </div>

          <div className={styles.heading}>
            <h1 className={styles.title}>Daftar</h1>
            <p className={styles.description}>
              Buat akun untuk memantau ketinggian air stasiun.
            </p>
          </div>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@contoh.com"
              autoComplete="username"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Kata sandi</span>
            <span className={styles.passwordWrapper}>
              <input
                className={styles.input}
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className={styles.reveal}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={
                  isPasswordVisible
                    ? "Sembunyikan kata sandi"
                    : "Lihat kata sandi"
                }
              >
                {isPasswordVisible ? <FiEyeOff /> : <FiEye />}
              </button>
            </span>
            <span className={styles.fieldHint}>
              Minimal {MIN_PASSWORD_LENGTH} karakter.
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Ulangi kata sandi</span>
            <span className={styles.passwordWrapper}>
              <input
                className={styles.input}
                type={isPasswordVisible ? "text" : "password"}
                value={passwordConfirmation}
                onChange={(event) =>
                  setPasswordConfirmation(event.target.value)
                }
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className={styles.reveal}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={
                  isPasswordVisible
                    ? "Sembunyikan kata sandi"
                    : "Lihat kata sandi"
                }
              >
                {isPasswordVisible ? <FiEyeOff /> : <FiEye />}
              </button>
            </span>
          </label>

          {error && (
            <p className={styles.error} role="alert">
              <FiAlertCircle aria-hidden />
              {error}
            </p>
          )}

          <button
            className={styles.submit}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner size={18} /> : "Daftar"}
          </button>

          <p className={styles.switch}>
            Sudah punya akun?{" "}
            <Link className={styles.switchLink} to="/login">
              Masuk
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
