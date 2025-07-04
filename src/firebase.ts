// src/firebase.ts - גרסה נקייה ללא Firebase Auth
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// הגדרות פיתוח מקומי - לא דורשות Firebase אמיתי
const firebaseConfig = {
  apiKey: "local-dev-key",
  authDomain: "local-dev.firebaseapp.com", 
  projectId: "local-dev-project",
  storageBucket: "local-dev-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:localdev"
};

// אתחול Firebase
const app = initializeApp(firebaseConfig);

// יצוא של Firestore בלבד
export const db = getFirestore(app);

// הערה: קובץ זה לא מכיל שום דבר הקשור ל-Firebase Auth