import { useEffect, useRef, type ReactNode } from "react";
import styles from "./ConfirmDialog.module.scss";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

// Dialog konfirmasi memakai elemen <dialog> bawaan browser: fokus terkunci di
// dalamnya, Esc menutup, dan latar belakang tidak bisa diklik — tanpa library
// tambahan dan tanpa menjebak pembaca layar.
const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Batal",
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // showModal() hanya boleh dipanggil kalau dialognya belum terbuka —
    // memanggil dua kali melempar error.
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      // Esc & tombol bawaan browser lewat sini, bukan lewat tombol kita
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      // Klik di area gelap di luar kotak = batal
      onClick={(event) => {
        if (event.target === dialogRef.current) onCancel();
      }}
    >
      <div className={styles.content}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.confirm}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmDialog;
