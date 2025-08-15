// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFl_6TVC88ikrwE2wqLFLi0Suh3AAIKr4",
  authDomain: "invoice-54f01.firebaseapp.com",
  projectId: "invoice-54f01",
  storageBucket: "invoice-54f01.firebasestorage.app",
  messagingSenderId: "126158488795",
  appId: "1:126158488795:web:5441e69ecfe1171f51f8fe",
  measurementId: "G-KMVKJ9187R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
