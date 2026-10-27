// frontend/src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signInWithPopup,signInWithRedirect,getRedirectResult, applyActionCode, sendPasswordResetEmail } from "firebase/auth";

// Your Firebase configuration object (replace with your own)
const firebaseConfig = {
    apiKey: "AIzaSyBtxi2e9cRhFZLQC1zc1LgW4_mPq9TXeDQ",
    authDomain: "astrovedham-66a0d.firebaseapp.com",                
    projectId: "astrovedham-66a0d",
    storageBucket: "astrovedham-66a0d.firebasestorage.app",
    messagingSenderId: "902846948837",
    appId: "1:902846948837:web:d59c7c875048dc3ab0bb0c"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Export authentication methods
export { auth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signInWithPopup,signInWithRedirect,getRedirectResult,sendPasswordResetEmail,applyActionCode };