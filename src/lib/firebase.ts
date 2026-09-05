import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');

// Database ID specified in config
const configAny = firebaseConfig as any;

let dbInstance;
try {
  dbInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
    },
    configAny.firestoreDatabaseId
  );
} catch {
  dbInstance = configAny.firestoreDatabaseId
    ? getFirestore(app, configAny.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = dbInstance;

export { signInWithPopup, firebaseSignOut, onAuthStateChanged, GoogleAuthProvider };
export type { User };
