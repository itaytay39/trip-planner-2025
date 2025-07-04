// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// הגדרות Firebase לפיתוח מקומי - ללא שגיאות Auth
const firebaseConfig = {
  apiKey: "demo-api-key", // מפתח דמה לצורך פיתוח מקומי
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

// אתחול האפליקציה
const app = initializeApp(firebaseConfig);

// קבלת מופע Firestore
export const db = getFirestore(app);

// הערה למפתח: כדי להשתמש ב-Firebase אמיתי, 
// החלף את הערכים למעלה בהגדרות הפרויקט שלך מ-Firebase Console