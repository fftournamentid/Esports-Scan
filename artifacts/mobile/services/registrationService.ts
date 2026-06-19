import {
  Timestamp,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { JoinedTournament, JoinStatus, RecentWinner } from '@/types';
import { db } from './firebase';

const COL = { registrations: 'registrations', tournaments: 'tournaments', winners: 'winners' } as const;

function docToJoin(id: string, data: Record<string, unknown>): JoinedTournament {
  return {
    ...(data as Omit<JoinedTournament, 'id'>),
    id,
    joinedAt: data.joinedAt instanceof Timestamp
      ? data.joinedAt.toDate().toISOString()
      : (data.joinedAt as string) ?? new Date().toISOString(),
  } as JoinedTournament;
}

export function subscribeUserRegistrations(
  userId: string,
  cb: (regs: JoinedTournament[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COL.registrations), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => docToJoin(d.id, d.data() as Record<string, unknown>)));
    },
    (err) => {
      console.warn('[Registrations] Firestore error:', err.message);
      onError?.(err);
    },
  );
}

export function subscribeTournamentRegistrations(
  tournamentId: string,
  cb: (regs: JoinedTournament[]) => void,
): () => void {
  const q = query(collection(db, COL.registrations), where('tournamentId', '==', tournamentId));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => docToJoin(d.id, d.data() as Record<string, unknown>)));
    },
    (err) => {
      console.warn('[TournamentRegistrations] Firestore error:', err.message);
    },
  );
}

export async function createRegistration(
  data: Omit<JoinedTournament, 'id' | 'status' | 'joinedAt'>,
): Promise<string> {
  // Duplicate check before writing
  const dupQ = query(
    collection(db, COL.registrations),
    where('userId', '==', data.userId),
    where('tournamentId', '==', data.tournamentId),
    where('tournamentDate', '==', data.tournamentDate),
  );
  const existing = await getDocs(dupQ);
  if (!existing.empty) {
    throw new Error('You have already registered for this tournament today.');
  }

  // Atomic batch: create registration + increment slotsUsed together
  const batch = writeBatch(db);
  const regRef = doc(collection(db, COL.registrations));
  batch.set(regRef, {
    ...data,
    status: 'pending',
    joinedAt: serverTimestamp(),
  });
  batch.update(doc(db, COL.tournaments, data.tournamentId), {
    slotsUsed: increment(1),
  });
  await batch.commit();
  return regRef.id;
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: JoinStatus,
): Promise<void> {
  await updateDoc(doc(db, COL.registrations, registrationId), { status });
}

export function subscribeUserWinners(
  freeFireUid: string,
  cb: (winners: RecentWinner[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COL.winners), where('uid', '==', freeFireUid));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            publishedAt:
              data.publishedAt instanceof Timestamp
                ? data.publishedAt.toDate().toISOString()
                : (data.publishedAt as string) ?? new Date().toISOString(),
          } as RecentWinner;
        }),
      );
    },
    (err) => {
      console.warn('[UserWinners] Firestore error:', err.message);
      onError?.(err);
    },
  );
}
