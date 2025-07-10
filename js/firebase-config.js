// js/firebase-config.js

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWeThpt6h1Y3zxNenpGf7eTYPsUhVlgXI",
  authDomain: "projeto-sop.firebaseapp.com",
  projectId: "projeto-sop",
  storageBucket: "projeto-sop.firebasestorage.app",
  messagingSenderId: "509243342498",
  appId: "1:509243342498:web:29e941f3e16e7eea7721fb",
  measurementId: "G-H0D0G5SD3V"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase references
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
