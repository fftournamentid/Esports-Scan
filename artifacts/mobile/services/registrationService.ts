import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
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
    (snap) => cb(snap.docs.map((d) => docToJoin(d.id, d.data() as Record<string, unknown>))),
    (err) => { console.warn('[Registrations] Firestore error:', err.message); onError?.(err); },
  );
}

export function subscribeTournamentRegistrations(
  tournamentId: string,
  cb: (regs: JoinedTournament[]) => void,
): () => void {
  const q = query(collection(db, COL.registrations), where('tournamentId', '==', tournamentId));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => docToJoin(d.id, d.data() as Record<string, unknown>))),
    (err) => { console.warn('[TournamentRegistrations] Firestore error:', err.message); },
  );
}

export async function createRegistration(
  data: Omit<JoinedTournament, 'id' | 'status' | 'joinedAt'>,
): Promise<string> {
  // Trim text fields
  const cleaned = {
    ...data,
    playerName: data.playerName?.trim() ?? '',
    uid: data.uid?.trim() ?? '',
    transactionId: data.transactionId?.trim() ?? '',
    phoneNumber: data.phoneNumber?.trim() ?? '',
    tournamentName: data.tournamentName?.trim() ?? '',
  };

  // Duplicate registration check (same user + same tournament + same date)
  const dupQ = query(
    collection(db, COL.registrations),
    where('userId', '==', cleaned.userId),
    where('tournamentId', '==', cleaned.tournamentId),
    where('tournamentDate', '==', cleaned.tournamentDate),
  );
  const existing = await getDocs(dupQ);
  if (!existing.empty) {
    throw new Error('You have already registered for this tournament today.');
  }

  // UTR duplicate check (global — prevent same transaction ID used twice)
  if (cleaned.transactionId) {
    try {
      const utrQ = query(
        collection(db, COL.registrations),
        where('transactionId', '==', cleaned.transactionId),
      );
      const utrExisting = await getDocs(utrQ);
      if (!utrExisting.empty) {
        throw new Error('This Transaction ID (UTR) has already been used. Please provide a valid UTR.');
      }
    } catch (err) {
      // Re-throw our own duplicate error, swallow index errors
      if (err instanceof Error && err.message.includes('Transaction ID')) throw err;
    }
  }

  const ref = await addDoc(collection(db, COL.registrations), {
    ...cleaned,
    status: 'pending',
    joinedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function approveRegistration(
  registrationId: string,
  tournamentId: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, COL.registrations, registrationId), { status: 'approved' });
  batch.update(doc(db, COL.tournaments, tournamentId), { slotsUsed: increment(1) });
  await batch.commit();
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: JoinStatus,
): Promise<void> {
  await updateDoc(doc(db, COL.registrations, registrationId), { status });
}

export function subscribeAllRegistrations(
  cb: (regs: JoinedTournament[]) => void,
): () => void {
  const q = query(collection(db, COL.registrations), orderBy('joinedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => docToJoin(d.id, d.data() as Record<string, unknown>))),
    (err) => { console.warn('[AllRegistrations] Firestore error:', err.message); cb([]); },
  );
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
      cb(snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          publishedAt: data.publishedAt instanceof Timestamp
            ? data.publishedAt.toDate().toISOString()
            : (data.publishedAt as string) ?? new Date().toISOString(),
        } as RecentWinner;
      }));
    },
    (err) => { console.warn('[UserWinners] Firestore error:', err.message); onError?.(err); },
  );
}
