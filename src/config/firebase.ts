import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyCocmySuYU7JP1S77Rg220OnBbwVgiqcUs",
  authDomain: "ruleta-2b63d.firebaseapp.com",
  projectId: "ruleta-2b63d",
  storageBucket: "ruleta-2b63d.firebasestorage.app",
  messagingSenderId: "284274670962",
  appId: "1:284274670962:android:172a668d377b44092431eb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;