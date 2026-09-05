import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  db,
  User,
} from '../lib/firebase';
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { UserDoc } from '../types';

interface AuthContextType {
  user: User | null;
  userDoc: UserDoc | null;
  googleAccessToken: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<string | null>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (data: Partial<UserDoc>) => Promise<void>;
  regenerateToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateTokenString(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'jp_tok_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      // Clean up previous user listener
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (firebaseUser) {
        // Construct immediate default profile so user is never stuck in a null state
        const initialDoc: UserDoc = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'JobPilot User',
          email: firebaseUser.email || '',
          resumeMasterText:
            'Experienced Software Engineer skilled in React, Node.js, TypeScript, and Cloud Architecture.',
          preferences: {
            targetRoles: ['Frontend Developer', 'Full Stack Engineer'],
            locations: ['Remote', 'Bangalore', 'San Francisco'],
            seniority: 'Mid-Senior',
          },
          candidateProfile: {
            phone: '+1 555-0199',
            noticePeriod: '30 Days',
            currentCtc: '150,000 USD',
            expectedCtc: '180,000 USD',
            portfolioUrl: 'https://github.com',
            linkedInUrl: 'https://linkedin.com/in/user',
            yearsOfExperience: '4 Years',
          },
          apiToken: generateTokenString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Optimistically set fallback immediately
        setUserDoc((prev) => prev || initialDoc);

        // Realtime Firestore synchronization with onSnapshot (resilient to offline/online events)
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeUserDoc = onSnapshot(
          userRef,
          async (snap) => {
            if (snap.exists()) {
              const data = snap.data() as UserDoc;
              if (!data.apiToken) {
                const newToken = generateTokenString();
                try {
                  await setDoc(userRef, { apiToken: newToken }, { merge: true });
                  data.apiToken = newToken;
                } catch {
                  // Non-fatal if offline
                }
              }
              setUserDoc({ ...data, uid: firebaseUser.uid });
            } else {
              // Document does not exist on Firestore yet, persist bootstrap doc
              try {
                await setDoc(userRef, initialDoc, { merge: true });
                setUserDoc(initialDoc);
              } catch {
                // Non-fatal if offline
                setUserDoc((prev) => prev || initialDoc);
              }
            }
            setLoading(false);
          },
          (err) => {
            // Log as informational notice rather than crashing
            console.warn('User doc snapshot sync notice (offline mode active):', err);
            setUserDoc((prev) => prev || initialDoc);
            setLoading(false);
          }
        );
      } else {
        setUserDoc(null);
        setGoogleAccessToken(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (token) {
        setGoogleAccessToken(token);
      }
      return token;
    } catch (err) {
      console.error('Failed to sign in with Google:', err);
      return null;
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserDoc(null);
      setGoogleAccessToken(null);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  const updateUserProfile = async (data: Partial<UserDoc>) => {
    if (!user) return;
    const updatedFields = { ...data, updatedAt: new Date().toISOString() };
    setUserDoc((prev) => (prev ? { ...prev, ...updatedFields } : null));

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updatedFields, { merge: true });
    } catch (err) {
      console.warn('Failed to update user profile in Firestore (offline mode active):', err);
    }
  };

  const regenerateToken = async (): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const newToken = generateTokenString();
    await updateUserProfile({ apiToken: newToken });
    return newToken;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        googleAccessToken,
        loading,
        signInWithGoogle,
        signOutUser,
        updateUserProfile,
        regenerateToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
