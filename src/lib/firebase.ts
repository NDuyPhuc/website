import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

/**
 * FIREBASE CONFIGURATION
 * 
 * To get these values:
 * 1. Create a project in the Firebase Console (https://console.firebase.google.com/)
 * 2. Add a Web App to your project.
 * 3. Copy the configuration object and paste the values into your .env file or Vercel environment variables.
 * 
 * For Vercel deployment:
 * Add these keys in the Vercel Project Settings > Environment Variables.
 * Prefix with VITE_ for Vite to expose them to the client.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA4c5vd5ex7uEAIXMTjMaJIg_DxrbuB6wk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fitness-f821f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fitness-f821f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fitness-f821f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "91492368604",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:91492368604:web:756b669ea5ddf6ba813419",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-1T4QEYWLJ9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// App Check disabled for debugging fetch polyfill issue
/*
const reCaptchaSiteKey = import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || "REPLACE_WITH_YOUR_RECAPTCHA_SITE_KEY";

if (typeof window !== 'undefined' && reCaptchaSiteKey !== "REPLACE_WITH_YOUR_RECAPTCHA_SITE_KEY") {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(reCaptchaSiteKey),
    isTokenAutoRefreshEnabled: true
  });
}
*/

export default app;
