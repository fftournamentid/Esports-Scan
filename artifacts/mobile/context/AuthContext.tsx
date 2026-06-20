import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'expo-router';
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
  const router = useRouter();

  async function loadProfile(user: FirebaseUser): Promise<void> {
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timeout')), 10000)
      );
      let profile = await Promise.race([getUserProfile(user.uid), timeout]);
      if (!profile) {
        await ensureUserProfile(user);
        profile = await Promise.race([getUserProfile(user.uid), timeout]);
      }
      setUserProfile(profile);
    } catch {
      setUserProfile(null);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setUserProfile(null);
        setAuthLoading(false);
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
    try {
      // Step 1: Clear all React state first
      setFirebaseUser(null);
      setUserProfile(null);

      // Step 2: Sign out from Firebase Auth
      await signOut(auth);

      // Step 3: Clear AsyncStorage (saved positions, cache, etc.)
      try {
        await AsyncStorage.clear();
      } catch {
        // Non-critical — continue with logout
      }

      // Step 4: Redirect to login, replacing history so back button doesn't return
      router.replace('/auth/login' as never);
    } catch {
      // Even if something fails, still try to redirect
      router.replace('/auth/login' as never);
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
