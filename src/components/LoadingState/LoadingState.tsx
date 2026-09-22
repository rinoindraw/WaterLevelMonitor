import styles from "./LoadingState.module.scss";

// Spinner cincin berwarna aksen.
// Tebal cincin ikut ukuran supaya spinner kecil (di peta) tidak jadi bulatan.
export const LoadingSpinner = ({ size = 40 }: { size?: number }) => (
  <span
    className={styles.spinner}
    style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 10)) }}
    role="status"
    aria-label="Memuat"
  />
);

export const LoadingSpinnerWithText = ({
  size = 40,
  text,
}: {
  size?: number;
  text: string;
}) => (
  <div className={styles.loadingContainerWithText}>
    <LoadingSpinner size={size} />
    <span className={styles.loadingText}>{text}</span>
  </div>
);
