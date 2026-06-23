import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCDEwsqRhSJXH-8rcDRuQ4v1hG9QE9OdWs",
  authDomain: "abtt-website.firebaseapp.com",
  projectId: "abtt-website",
  storageBucket: "abtt-website.firebasestorage.app",
  messagingSenderId: "223401276465",
  appId: "1:223401276465:web:9f9ace7637b6a02a651110"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, query, orderBy };