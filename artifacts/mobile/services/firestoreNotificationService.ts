import {
  Timestamp,
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import type { AppNotification } from '@/types';
import { db } from './firebase';

const COL = 'notifications';

function docToNotif(id: string, data: Record<string, unknown>): AppNotification {
  return {
    ...(data as Omit<AppNotification, 'id'>),
    id,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : (data.createdAt as string) ?? new Date().toISOString(),
  } as AppNotification;
}

export function subscribeNotifications(
  cb: (notifs: AppNotification[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => docToNotif(d.id, d.data() as Record<string, unknown>)));
    },
    (err) => {
      console.warn('[Notifications] Firestore error:', err.message);
      onError?.(err);
      cb([]);
    },
  );
}

export async function sendNotification(
  data: Pick<AppNotification, 'title' | 'message' | 'targetType' | 'tournamentId'>,
): Promise<void> {
  await addDoc(collection(db, COL), {
    ...data,
    tournamentId: data.tournamentId ?? null,
    sent: true,
    createdAt: serverTimestamp(),
  });
}
