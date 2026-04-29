// Script para criar o PIN no Firestore
// Corre com: node scripts/setup-pin.mjs

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFijQyeFuPj4L2sjrojXaMf4yBoMvApho",
  authDomain: "casa-66668.firebaseapp.com",
  projectId: "casa-66668",
  storageBucket: "casa-66668.firebasestorage.app",
  messagingSenderId: "776757654663",
  appId: "1:776757654663:web:15c0fa42ae1815d43ff422",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PIN = process.argv[2] || "1234";

async function setup() {
  await setDoc(doc(db, "config", "auth"), { pin: PIN });
  console.log(`✅ PIN "${PIN}" configurado no Firestore!`);
  process.exit(0);
}

setup().catch((e) => {
  console.error("❌ Erro:", e.message);
  process.exit(1);
});
