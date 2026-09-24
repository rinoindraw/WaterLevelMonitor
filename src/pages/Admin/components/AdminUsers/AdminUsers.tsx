import { useEffect, useState } from "react";
import { FiUsers } from "react-icons/fi";
import { LoadingSpinnerWithText } from "../../../../components/LoadingState/LoadingState";
import {
  UserService,
  type UserDirectoryResponse,
} from "../../../../services/User/UserService";
import { UseAuthStore } from "../../../../stores/Auth/AuthStore";
import styles from "./AdminUsers.module.scss";
import {
  ADMIN_DENIED_MESSAGE,
  USER_TABLE_COLUMNS,
  formatDateTime,
} from "./AdminUsersConstants";

// Sub-tab "Pengguna": daftar akun yang pernah masuk, beserta siapa yang sedang membuka aplikasi.
// Datanya berasal dari node users yang ditulis tiap klien untuk dirinya
// sendiri — SDK web tidak bisa memuat daftar pengguna Firebase.
const AdminUsers = () => {
  const isAdmin = UseAuthStore((state) => state.isAdmin);
  const currentUid = UseAuthStore((state) => state.uid);
  const [directory, setDirectory] = useState<UserDirectoryResponse | null>(null);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    return UserService.subscribeDirectory(setDirectory, () => setIsDenied(true));
  }, [isAdmin]);

  // Sedang masuk lebih dulu, lalu login terbaru di atas.
  const users = Object.entries(directory ?? {})
    .flatMap(([uid, record]) => (record ? [{ uid, ...record }] : []))
    .sort(
      (left, right) =>
        Number(right.isOnline ?? false) - Number(left.isOnline ?? false) ||
        (right.lastLoginAt ?? 0) - (left.lastLoginAt ?? 0),
    );

  const onlineCount = users.filter((user) => user.isOnline).length;

  return (
    <div className={styles.users}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Pengguna</h1>
        <p className={styles.pageDescription}>
          Akun yang terdaftar di sistem, beserta yang sedang membuka aplikasi
          saat ini.
        </p>
      </header>

      {!isAdmin || isDenied ? (
        <p className={styles.notice}>{ADMIN_DENIED_MESSAGE}</p>
      ) : directory === null ? (
        <LoadingSpinnerWithText text="Memuat daftar pengguna…" />
      ) : (
        <section className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <FiUsers aria-hidden />
            <span>
              {users.length} akun · {onlineCount} sedang online
            </span>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {USER_TABLE_COLUMNS.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uid}>
                    <td>
                      {user.email}
                      {user.uid === currentUid && (
                        <span className={styles.self}>Anda</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`${styles.presence} ${
                          user.isOnline ? styles.online : styles.offline
                        }`}
                      >
                        <span className={styles.presenceDot} aria-hidden />
                        {user.isOnline ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td>{formatDateTime(user.lastLoginAt)}</td>
                    <td>{formatDateTime(user.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <p className={styles.notice}>Belum ada akun yang tercatat.</p>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminUsers;
