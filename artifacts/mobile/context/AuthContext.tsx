import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile } from '@/types';
import { getUserProfile } from '@/services/authService';
import { auth } from '@/services/firebase';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  authLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
