import {
  Timestamp,
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { JoinedTournament, JoinStatus } from '@/types';
import { db } from './firebase';

const COL = { registrations: 'registrations', tournaments: 'tournaments' } as const;

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
): () => void {
  const q = query(collection(db, COL.registrations), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => docToJoin(d.id, d.data() as Record<string, unknown>)));
  });
}

export function subscribeTournamentRegistrations(
  tournamentId: string,
  cb: (regs: JoinedTournament[]) => void,
): () => void {
  const q = query(collection(db, COL.registrations), where('tournamentId', '==', tournamentId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => docToJoin(d.id, d.data() as Record<string, unknown>)));
  });
}

export async function createRegistration(
  data: Omit<JoinedTournament, 'id' | 'status' | 'joinedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, COL.registrations), {
    ...data,
    status: 'pending',
    joinedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, COL.tournaments, data.tournamentId), {
    slotsUsed: increment(1),
  });
  return ref.id;
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: JoinStatus,
): Promise<void> {
  await updateDoc(doc(db, COL.registrations, registrationId), { status });
}
