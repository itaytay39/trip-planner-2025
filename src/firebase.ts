// src/firebase.ts - רק Firestore, בלי Auth
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// הגדרות Firebase פשוטות לפיתוח מקומי
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:demo"
};

// אתחול Firebase
const app = initializeApp(firebaseConfig);

// רק Firestore - בלי Auth
export const db = getFirestore(app);