import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import type {
  PaymentSettings,
  RecentWinner,
  Tournament,
  TournamentResult,
} from "@/types";
import { db } from "./firebase";

const COL = {
  tournaments: "tournaments",
  settings: "settings",
  winners: "winners",
} as const;

function toISO(val: unknown): string | undefined {
  if (!val) return undefined;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === "string") return val;
  return undefined;
}

const VALID_STATUSES = new Set([
  "upcoming",
  "live",
  "completed",
  "closed",
  "cancelled",
]);

function docToTournament(
  id: string,
  data: Record<string, unknown>,
): Tournament {
  // Default every required field so a partial/malformed Firestore doc never
  // propagates undefined into the UI (which throws on .split(), destructuring, etc.)
  const rawStatus = data.status as string | undefined;
  return {
    name: (data.name as string) ?? "(Untitled)",
    category: (data.category as string) ?? "Solo",
    entryFee: typeof data.entryFee === "number" ? data.entryFee : 0,
    perKillPrize: typeof data.perKillPrize === "number" ? data.perKillPrize : 0,
    booyahPrize: typeof data.booyahPrize === "number" ? data.booyahPrize : 0,
    date: (data.date as string) ?? "",
    time: (data.time as string) ?? "00:00",
    slots: typeof data.slots === "number" ? data.slots : 0,
    slotsUsed: typeof data.slotsUsed === "number" ? data.slotsUsed : 0,
    status: (VALID_STATUSES.has(rawStatus ?? "")
      ? rawStatus
      : "upcoming") as Tournament["status"],
    repeatDaily:
      typeof data.repeatDaily === "boolean" ? data.repeatDaily : false,
    published: typeof data.published === "boolean" ? data.published : false,
    roomId: data.roomId as string | undefined,
    roomPassword: data.roomPassword as string | undefined,
    roomAutoReleased: data.roomAutoReleased as boolean | undefined,
    gameMode: data.gameMode as string | undefined,
    rules: data.rules as string | undefined,
    results: data.results as Tournament["results"],
    roomReleaseTime: toISO(data.roomReleaseTime),
    cancelledAt: toISO(data.cancelledAt),
    createdAt: toISO(data.createdAt),
    id,
  };
}

export function subscribeTournaments(
  cb: (ts: Tournament[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, COL.tournaments),
    (snap) => {
      cb(
        snap.docs.map((d) =>
          docToTournament(d.id, d.data() as Record<string, unknown>),
        ),
      );
    },
    (err) => {
      console.warn("[Tournaments] Firestore error:", err.message);
      onError?.(err);
      // Always call cb with empty array so isLoading resolves and app doesn't freeze
      cb([]);
    },
  );
}

export async function createTournament(
  data: Omit<Tournament, "id" | "slotsUsed">,
): Promise<string> {
  const ref = await addDoc(collection(db, COL.tournaments), {
    ...data,
    slotsUsed: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTournament(
  id: string,
  data: Partial<Tournament>,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    payload[k] = v === undefined ? deleteField() : v;
  }
  await updateDoc(doc(db, COL.tournaments, id), payload);
}

export async function deleteTournament(id: string): Promise<void> {
  await deleteDoc(doc(db, COL.tournaments, id));
}

export async function restoreTournament(id: string): Promise<void> {
  await updateDoc(doc(db, COL.tournaments, id), {
    status: "upcoming",
    cancelledAt: deleteField(),
  });
}

export function subscribeWinners(cb: (ws: RecentWinner[]) => void): () => void {
  const TTL = 72 * 60 * 60 * 1000;
  return onSnapshot(
    collection(db, COL.winners),
    (snap) => {
      const now = Date.now();
      const winners: RecentWinner[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            publishedAt:
              data.publishedAt instanceof Timestamp
                ? data.publishedAt.toDate().toISOString()
                : ((data.publishedAt as string) ?? new Date().toISOString()),
          } as RecentWinner;
        })
        .filter((w) => now - new Date(w.publishedAt).getTime() < TTL);
      cb(winners);
    },
    (err) => {
      console.warn("[Winners] Firestore error:", err.message);
      cb([]);
    },
  );
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
  upiId: "fftournament@nyes",
  instructions: [
    "Pay the entry fee using any UPI app",
    "Note the Transaction ID (UTR number)",
    "Send details on WhatsApp to register",
  ],
  whatsappNumber: "917488765246",
};

/**
 * Merges partial payment data from Firestore with DEFAULT_PAYMENT so that
 * missing or undefined fields always fall back to safe defaults.
 */
function mergePayment(raw: unknown): PaymentSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_PAYMENT;
  const p = raw as Partial<PaymentSettings>;
  return {
    upiId:
      typeof p.upiId === "string" && p.upiId.trim()
        ? p.upiId.trim()
        : DEFAULT_PAYMENT.upiId,
    instructions:
      Array.isArray(p.instructions) && p.instructions.length > 0
        ? p.instructions
        : DEFAULT_PAYMENT.instructions,
    whatsappNumber:
      typeof p.whatsappNumber === "string" && p.whatsappNumber.trim()
        ? p.whatsappNumber.trim()
        : DEFAULT_PAYMENT.whatsappNumber,
  };
}

export function subscribeAppSettings(
  cb: (data: { payment: PaymentSettings }) => void,
): () => void {
  return onSnapshot(
    doc(db, COL.settings, "app"),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as { payment?: unknown };
        cb({ payment: mergePayment(data.payment) });
      } else {
        // Document does not exist — use fallback silently (no crash, no collection created)
        cb({ payment: DEFAULT_PAYMENT });
      }
    },
    (err) => {
      // Firestore error (permission-denied, network, etc.) — log and fall back silently
      console.warn(
        "[AppSettings] Firestore error, using defaults:",
        err.message,
      );
      cb({ payment: DEFAULT_PAYMENT });
    },
  );
}

export async function updateAppSettings(
  data: Partial<{ payment: PaymentSettings }>,
): Promise<void> {
  await setDoc(doc(db, COL.settings, "app"), data, { merge: true });
}
