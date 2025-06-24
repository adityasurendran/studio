import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFunctions, type Functions } from 'firebase/functions'; // Added Functions
import { getFirestore, type Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Check if the API key is the placeholder or missing and log a specific message.
if (firebaseConfig.apiKey === "YOUR_API_KEY" || !firebaseConfig.apiKey) {
  const message = !firebaseConfig.apiKey 
    ? "Shannon Setup: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or empty. "
    : "Shannon Setup: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) appears to be the placeholder 'YOUR_API_KEY'. ";
  console.error(
    message +
    "Firebase will not initialize correctly. Please replace it with your actual Firebase API key. " +
    "Refer to README.md for setup instructions."
  );
}


let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const functions: Functions = getFunctions(app); // Initialize Functions
const db: Firestore = getFirestore(app);

export { app, auth, functions, db }; // Export functions