import {
  Timestamp,
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import type { JoinedTournament, UserProfile } from '@/types';
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
  const q = query(
    collection(db, 'registrations'),
    orderBy('joinedAt', 'desc'),
    limit(200),
  );
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
