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
} from "../../utils/constants/AuthConstants";
import styles from "./Login.module.scss";

// Gerbang masuk dashboard. Tanpa "lupa kata sandi" — pemulihan akun dilakukan
// dari Firebase Console.
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // [NEW] Kata sandi bisa dilihat — mengetik sandi panjang tanpa umpan balik
  // adalah sumber kesalahan yang tidak perlu.
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await AuthService.signIn(email.trim(), password);
      // Tidak perlu redirect: AuthStore berubah, App menukar tampilan sendiri.
      // isSubmitting juga tidak direset — komponen ini langsung dilepas.
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
    <div className={styles.login}>
      <div className={styles.shell}>
        <AuthArtwork />

        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.brand}>
            <FiDroplet className={styles.brandIcon} aria-hidden />
            <span className={styles.brandName}>Monitor Tinggi Muka Air</span>
          </div>

          <div className={styles.heading}>
            <h1 className={styles.title}>Masuk</h1>
            <p className={styles.description}>
              Data sensor hanya bisa dilihat setelah masuk.
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
                autoComplete="current-password"
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
            {isSubmitting ? <LoadingSpinner size={18} /> : "Masuk"}
          </button>

          <p className={styles.switch}>
            Belum punya akun?{" "}
            <Link className={styles.switchLink} to="/register">
              Daftar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
