import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBo8B3nkoSy5r77DvKC2_AJl4uech2ZxPk',
  authDomain: 'fftournamentid-4185d.firebaseapp.com',
  projectId: 'fftournamentid-4185d',
  storageBucket: 'fftournamentid-4185d.firebasestorage.app',
  messagingSenderId: '537350821042',
  appId: '1:537350821042:web:e6cfeda0bf7005dc2fe5ab',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
