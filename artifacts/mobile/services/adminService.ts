import {
  Timestamp,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import type { JoinedTournament, RecentWinner, UserProfile } from '@/types';
import { db } from './firebase';

function docToJoin(id: string, data: Record<string, unknown>): JoinedTournament {
  return {
    ...(data as Omit<JoinedTournament, 'id'>),
    id,
    joinedAt:
      data.joinedAt instanceof Timestamp
        ? data.joinedAt.toDate().toISOString()
        : (data.joinedAt as string) ?? new Date().toISOString(),
  } as JoinedTournament;
}

export function subscribeAllRegistrations(
  cb: (regs: JoinedTournament[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, 'registrations'), orderBy('joinedAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => docToJoin(d.id, d.data() as Record<string, unknown>))),
    (err) => { console.warn('[AdminRegistrations] error:', err.message); onError?.(err); },
  );
}

export async function getAllUsersCount(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.size;
  } catch {
    return 0;
  }
}

export async function getAllUsersProfiles(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: data.uid ?? d.id,
        name: data.name ?? '',
        email: data.email ?? '',
        freeFireUid: data.freeFireUid ?? '',
        role: data.role ?? 'user',
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : (data.createdAt as string) ?? '',
      } as UserProfile;
    });
  } catch {
    return [];
  }
}

export function subscribeAllUsers(
  cb: (users: UserProfile[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      const users: UserProfile[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: data.uid ?? d.id,
          name: data.name ?? '',
          email: data.email ?? '',
          freeFireUid: data.freeFireUid ?? '',
          role: data.role ?? 'user',
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : (data.createdAt as string) ?? '',
        } as UserProfile;
      });
      cb(users);
    },
    (err) => { console.warn('[AllUsers] error:', err.message); onError?.(err); },
  );
}

export function subscribeWinnerPayments(
  cb: (winners: RecentWinner[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, 'winners'), orderBy('publishedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const winners: RecentWinner[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          publishedAt:
            data.publishedAt instanceof Timestamp
              ? data.publishedAt.toDate().toISOString()
              : (data.publishedAt as string) ?? new Date().toISOString(),
          paid: data.paid === true,
          paidAt: data.paidAt instanceof Timestamp
            ? data.paidAt.toDate().toISOString()
            : (data.paidAt as string) ?? undefined,
          upiId: data.upiId as string | undefined,
        } as RecentWinner;
      });
      cb(winners);
    },
    (err) => { console.warn('[WinnerPayments] error:', err.message); onError?.(err); },
  );
}

export async function markWinnerPaid(winnerId: string, upiId?: string): Promise<void> {
  const payload: Record<string, unknown> = {
    paid: true,
    paidAt: new Date().toISOString(),
  };
  if (upiId) payload.upiId = upiId.toLowerCase().trim();
  await updateDoc(doc(db, 'winners', winnerId), payload);
}

export async function markWinnerUnpaid(winnerId: string): Promise<void> {
  await updateDoc(doc(db, 'winners', winnerId), { paid: false, paidAt: null });
}
