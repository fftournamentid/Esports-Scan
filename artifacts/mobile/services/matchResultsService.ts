import {
  Timestamp,
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import type { MatchResult } from '@/types';
import { db } from './firebase';

const COL = 'match_results';

function docToMatchResult(id: string, data: Record<string, unknown>): MatchResult {
  const placement =
    typeof data.placement === 'number' ? data.placement
    : typeof data.rank === 'number' ? data.rank
    : typeof data.position === 'number' ? data.position
    : 0;

  return {
    id,
    tournamentId: (data.tournamentId as string) ?? '',
    tournamentName: (data.tournamentName as string) ?? '',
    userId: (data.userId as string) ?? '',
    uid: (data.uid as string) ?? '',
    playerName: (data.playerName as string) ?? 'Unknown',
    kills: typeof data.kills === 'number' ? data.kills : 0,
    placement,
    prize: (data.prize as string) ?? '',
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt as string) ?? new Date().toISOString(),
  };
}

export function subscribeUserMatchResults(
  userId: string,
  cb: (results: MatchResult[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, COL), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => docToMatchResult(d.id, d.data() as Record<string, unknown>))),
    (err) => { console.warn('[MatchResults] error:', err.message); onError?.(err); },
  );
}

export function subscribeAllMatchResults(
  cb: (results: MatchResult[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, COL),
    (snap) => cb(snap.docs.map((d) => docToMatchResult(d.id, d.data() as Record<string, unknown>))),
    (err) => { console.warn('[AllMatchResults] error:', err.message); onError?.(err); },
  );
}
