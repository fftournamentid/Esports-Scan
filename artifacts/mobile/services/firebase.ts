import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBo8B3nkoSy5r77DvKC2_AJl4uech2ZxPk',
  authDomain: 'fftournamentid-4185d.firebaseapp.com',
  projectId: 'fftournamentid-4185d',
  storageBucket: 'fftournamentid-4185d.firebasestorage.app',
  messagingSenderId: '537350821042',
  appId: '1:537350821042:web:e6cfeda0bf7005dc2fe5ab',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use persistent auth so sessions survive app restarts / browser refreshes
function createAuth() {
  try {
    if (Platform.OS === 'web') {
      return initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      });
    }
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized (hot reload) — return existing instance
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
export default app;
