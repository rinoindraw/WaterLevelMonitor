import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { firebaseApp } from "../Firebase/FirebaseApp";

const auth = getAuth(firebaseApp);

// Sesi disimpan di penyimpanan browser, jadi refresh halaman tidak memaksa
// login ulang. Cukup dipanggil sekali saat modul dimuat.
void setPersistence(auth, browserLocalPersistence);

export const AuthService = {
  // Callback dipanggil sekali dengan sesi tersimpan (atau null), lalu setiap
  // kali sesi berubah. Mengembalikan fungsi unsubscribe.
  subscribeUser: (onChange: (user: User | null) => void) =>
    onAuthStateChanged(auth, onChange),

  signIn: (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password),

  // Akun baru langsung masuk sendiri setelah dibuat — tidak perlu menyuruh
  // user login lagi.
  register: (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password),

  signOut: () => signOut(auth),
};
