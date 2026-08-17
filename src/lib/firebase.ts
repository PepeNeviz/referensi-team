import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCYoC7GLwQpCcLScx4RDxotOFAcr7lukxg",
  authDomain: "referensi-team.firebaseapp.com",
  projectId: "referensi-team",
  storageBucket: "referensi-team.firebasestorage.app",
  messagingSenderId: "326247397954",
  appId: "1:326247397954:web:e56e10c19b3c3a91168bdb",
  measurementId: "G-4QZTEPFVLQ"
};

// Mencegah Firebase inisialisasi ulang saat kita edit kode
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);