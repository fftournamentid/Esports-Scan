import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { PaymentSettings, RecentWinner, Tournament, TournamentResult } from '@/types';
import { db } from './firebase';

const COL = {
  tournaments: 'tournaments',
  settings: 'settings',
  winners: 'winners',
} as const;

function toISO(val: unknown): string | undefined {
  if (!val) return undefined;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return undefined;
}

function docToTournament(id: string, data: Record<string, unknown>): Tournament {
  return {
    ...(data as Omit<Tournament, 'id'>),
    id,
    roomReleaseTime: toISO(data.roomReleaseTime),
    cancelledAt: toISO(data.cancelledAt),
    createdAt: toISO(data.createdAt),
  } as Tournament;
}

export function subscribeTournaments(cb: (ts: Tournament[]) => void): () => void {
  return onSnapshot(collection(db, COL.tournaments), (snap) => {
    cb(snap.docs.map((d) => docToTournament(d.id, d.data() as Record<string, unknown>)));
  });
}

export async function createTournament(data: Omit<Tournament, 'id' | 'slotsUsed'>): Promise<string> {
  const ref = await addDoc(collection(db, COL.tournaments), {
    ...data,
    slotsUsed: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTournament(id: string, data: Partial<Tournament>): Promise<void> {
  await updateDoc(doc(db, COL.tournaments, id), data as Record<string, unknown>);
}

export async function deleteTournament(id: string): Promise<void> {
  await deleteDoc(doc(db, COL.tournaments, id));
}

export function subscribeWinners(cb: (ws: RecentWinner[]) => void): () => void {
  const TTL = 72 * 60 * 60 * 1000;
  return onSnapshot(collection(db, COL.winners), (snap) => {
    const now = Date.now();
    const winners: RecentWinner[] = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          publishedAt: data.publishedAt instanceof Timestamp
            ? data.publishedAt.toDate().toISOString()
            : (data.publishedAt as string) ?? new Date().toISOString(),
        } as RecentWinner;
      })
      .filter((w) => now - new Date(w.publishedAt).getTime() < TTL);
    cb(winners);
  });
}

export async function publishWinners(
  tournamentId: string,
  tournamentName: string,
  results: TournamentResult[],
): Promise<void> {
  const batch = writeBatch(db);
  for (const r of results) {
    const ref = doc(collection(db, COL.winners));
    batch.set(ref, {
      tournamentId,
      tournamentName,
      playerName: r.playerName,
      uid: r.uid ?? null,
      prize: r.prize,
      rank: r.rank,
      booyahWinner: r.booyahWinner ?? false,
      publishedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

const DEFAULT_PAYMENT: PaymentSettings = {
  upiId: 'fftournament@nyes',
  instructions: [
    'Pay the entry fee using any UPI app',
    'Note the Transaction ID (UTR number)',
    'Send details on WhatsApp to register',
  ],
  whatsappNumber: '917488765246',
};

const DEFAULT_ADMIN_PW = 'admin123';

export function subscribeAppSettings(
  cb: (data: { adminPassword: string; payment: PaymentSettings }) => void,
): () => void {
  return onSnapshot(doc(db, COL.settings, 'app'), (snap) => {
    if (snap.exists()) {
      const data = snap.data() as { adminPassword?: string; payment?: PaymentSettings };
      cb({
        adminPassword: data.adminPassword ?? DEFAULT_ADMIN_PW,
        payment: data.payment ?? DEFAULT_PAYMENT,
      });
    } else {
      cb({ adminPassword: DEFAULT_ADMIN_PW, payment: DEFAULT_PAYMENT });
    }
  });
}

export async function updateAppSettings(
  data: Partial<{ adminPassword: string; payment: PaymentSettings }>,
): Promise<void> {
  await setDoc(doc(db, COL.settings, 'app'), data, { merge: true });
}
