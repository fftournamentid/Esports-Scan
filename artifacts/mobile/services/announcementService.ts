import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export type AnnouncementType = 'info' | 'warning' | 'success' | 'promo' | 'event';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  pinned: boolean;
  active: boolean;
  createdAt: string;
  expiresAt?: string;
}

function docToAnnouncement(id: string, data: Record<string, unknown>): Announcement {
  return {
    id,
    title: (data.title as string) ?? '',
    message: (data.message as string) ?? '',
    type: (data.type as AnnouncementType) ?? 'info',
    pinned: data.pinned === true,
    active: data.active !== false,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt as string) ?? new Date().toISOString(),
    expiresAt:
      data.expiresAt instanceof Timestamp
        ? data.expiresAt.toDate().toISOString()
        : (data.expiresAt as string) ?? undefined,
  };
}

export function subscribeAnnouncements(
  cb: (announcements: Announcement[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => docToAnnouncement(d.id, d.data() as Record<string, unknown>))),
    (err) => { console.warn('[Announcements]', err.message); onError?.(err); },
  );
}

export function subscribeActiveAnnouncements(
  cb: (announcements: Announcement[]) => void,
): () => void {
  return subscribeAnnouncements((all) => {
    const now = new Date();
    const active = all
      .filter((a) => {
        if (!a.active) return false;
        if (a.expiresAt && new Date(a.expiresAt) < now) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    cb(active);
  });
}

export async function createAnnouncement(
  data: Omit<Announcement, 'id' | 'createdAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'announcements'), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateAnnouncement(
  id: string,
  data: Partial<Omit<Announcement, 'id' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'announcements', id), data as Record<string, unknown>);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, 'announcements', id));
}
