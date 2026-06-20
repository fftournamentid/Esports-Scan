import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { Timestamp, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { auth, db } from './firebase';

export async function signUp(
  email: string,
  password: string,
  name: string,
  freeFireUid: string,
): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: name.trim() });
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    freeFireUid: freeFireUid.trim(),
    phoneNumber: '',
    upiId: '',
    whatsappNumber: '',
    role: 'user',
    createdAt: serverTimestamp(),
  });
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: data.uid ?? uid,
    name: data.name ?? '',
    email: data.email ?? '',
    freeFireUid: data.freeFireUid ?? '',
    phoneNumber: data.phoneNumber ?? '',
    upiId: data.upiId ?? '',
    whatsappNumber: data.whatsappNumber ?? '',
    role: data.role ?? 'user',
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : (data.createdAt as string | undefined),
  };
}

export async function updateUserProfile(
  uid: string,
  data: {
    name: string;
    freeFireUid: string;
    phoneNumber?: string;
    upiId?: string;
    whatsappNumber?: string;
  },
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    name: data.name.trim(),
    freeFireUid: data.freeFireUid.trim(),
    phoneNumber: data.phoneNumber?.trim() ?? '',
    upiId: data.upiId?.trim() ?? '',
    whatsappNumber: data.whatsappNumber?.trim() ?? '',
  });
}

export async function ensureUserProfile(user: FirebaseUser): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    uid: user.uid,
    name: user.displayName ?? 'Player',
    email: user.email?.toLowerCase() ?? '',
    freeFireUid: '',
    phoneNumber: '',
    upiId: '',
    whatsappNumber: '',
    role: 'user',
    createdAt: serverTimestamp(),
  });
}
