// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: החלף את הערכים הבאים בפרטי פרויקט ה-Firebase שלך
const firebaseConfig = {
  apiKey: "AIzaSyB11HU1nmZwjY5sGQjyyWud_stNoqEwsi4",
  authDomain: "mytravelapp2025.firebaseapp.com",
  projectId: "mytravelapp2025",
  storageBucket: "mytravelapp2025.firebasestorage.app",
  messagingSenderId: "287931178675",
  appId: "1:287931178675:web:5a8ea129b9e86727f45ac6"
};

// אתחול האפליקציה
const app = initializeApp(firebaseConfig);

// ייצוא של בסיס הנתונים לשימוש ברחבי האפליקציה
export const db = getFirestore(app);