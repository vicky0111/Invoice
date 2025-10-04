// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDDjcyYL5UnzcwsGbRCkhLf4WedfPi8jCc",
  authDomain: "sri-venkata-pandu-ranga-steels.firebaseapp.com",
  projectId: "sri-venkata-pandu-ranga-steels",
  storageBucket: "sri-venkata-pandu-ranga-steels.firebasestorage.app",
  messagingSenderId: "400399096663",
  appId: "1:400399096663:web:28cd3682be9556f26dbc12",
  measurementId: "G-MGDZJ3SRQ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
