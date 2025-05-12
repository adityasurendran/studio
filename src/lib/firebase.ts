import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

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
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
  console.warn(
    "Shannon Setup: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) in your .env or .env.local file appears to be the placeholder 'YOUR_API_KEY'. " +
    "Firebase will not initialize correctly. Please replace it with your actual Firebase API key. " +
    "Refer to README.md for setup instructions."
  );
} else if (!firebaseConfig.apiKey) {
  console.error(
    "Shannon Setup: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or empty in your .env or .env.local file. " +
    "Firebase initialization will fail. Please set it with your actual Firebase API key. " +
    "Refer to README.md for setup instructions."
  );
}


let app: FirebaseApp;
if (!getApps().length) {
  // Firebase's initializeApp will throw its own specific errors if config values are missing or invalid.
  // The console messages above are to provide more user-friendly guidance beforehand.
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
// const db: Firestore = getFirestore(app); // If you need Firestore client-side

export { app, auth /*, db */ };

