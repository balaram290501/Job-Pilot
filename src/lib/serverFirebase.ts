import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const configAny = firebaseConfig as any;

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminDb = configAny.firestoreDatabaseId
  ? getFirestore(configAny.firestoreDatabaseId)
  : getFirestore();
