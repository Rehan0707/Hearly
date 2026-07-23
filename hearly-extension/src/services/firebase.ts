import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

// Default configuration for hearly-319a8
const defaultFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hearly-319a8.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hearly-319a8',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hearly-319a8.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(defaultFirebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign in Anonymously
 */
export async function signInGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Auth State changes
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Sync voice profile to Firestore under user document
 */
export async function saveCloudVoiceProfile(userId: string, profileData: {
  userName: string;
  embedding: number[];
  modelStatus: string;
}): Promise<void> {
  const userRef = doc(db, 'users', userId, 'profiles', 'voice');
  await setDoc(
    userRef,
    {
      ...profileData,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Fetch voice profile from Firestore
 */
export async function getCloudVoiceProfile(userId: string) {
  const userRef = doc(db, 'users', userId, 'profiles', 'voice');
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

/**
 * Save meeting transcript session to Firestore
 */
export async function saveCloudTranscript(
  userId: string,
  sessionData: {
    sessionId: string;
    platform: string;
    transcriptText: string;
    entries: unknown[];
  },
): Promise<void> {
  const sessionRef = doc(db, 'users', userId, 'transcripts', sessionData.sessionId);
  await setDoc(
    sessionRef,
    {
      ...sessionData,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Fetch user transcripts from Firestore
 */
export async function getCloudTranscripts(userId: string) {
  const transcriptsCol = collection(db, 'users', userId, 'transcripts');
  const q = query(transcriptsCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}
