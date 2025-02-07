import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA8zUduUSjmW5uQ7hjWP7gmuqYPd56hU-c",
  authDomain: "theschoolofencounter-a50ec.firebaseapp.com",
  projectId: "theschoolofencounter-a50ec",
  storageBucket: "theschoolofencounter-a50ec.firebasestorage.app",
  messagingSenderId: "816615448956",
  appId: "1:816615448956:web:f39161468257cf1d4904f9"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  if (!/already exists/.test(error.message)) {
    console.error('Firebase initialization error', error.stack);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app); 