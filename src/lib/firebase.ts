import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// User authentication functions
export const updateUserPassword = async (currentPassword: string, newPassword: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No authenticated user found');
  }

  try {
    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating password:', error);
    
    if (error.code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('New password is too weak. Use at least 6 characters');
    }
    
    throw new Error(error.message || 'Failed to update password');
  }
}; 