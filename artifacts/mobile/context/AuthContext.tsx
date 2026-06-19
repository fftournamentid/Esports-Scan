import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile } from '@/types';
import { ensureUserProfile, getUserProfile } from '@/services/authService';
import { auth } from '@/services/firebase';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  authLoading: true,
  refreshProfile: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function loadProfile(user: FirebaseUser): Promise<void> {
    try {
      let profile = await getUserProfile(user.uid);
      if (!profile) {
        await ensureUserProfile(user);
        profile = await getUserProfile(user.uid);
      }
      setUserProfile(profile);
    } catch {
      setUserProfile(null);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthContext] onAuthStateChanged fired, user:', user?.uid ?? null);
      if (!user) {
        setFirebaseUser(null);
        setUserProfile(null);
        setAuthLoading(false);
        console.log('[AuthContext] state cleared — firebaseUser=null');
        return;
      }
      setAuthLoading(true);
      setFirebaseUser(user);
      await loadProfile(user);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    await loadProfile(firebaseUser);
  };

  const logout = async () => {
    console.log('[AuthContext] logout() called — clearing state now');
    setFirebaseUser(null);
    setUserProfile(null);
    try {
      await signOut(auth);
      console.log('[AuthContext] signOut(auth) resolved OK');
    } catch (e) {
      console.log('[AuthContext] signOut(auth) ERROR:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, authLoading, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
