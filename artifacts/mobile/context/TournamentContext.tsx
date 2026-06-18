import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { auth } from '@/services/firebase';
import {
  createTournament,
  deleteTournament as fsDeleteTournament,
  publishWinners,
  subscribeAppSettings,
  subscribeTournaments,
  subscribeWinners,
  updateAppSettings,
  updateTournament as fsUpdateTournament,
} from '@/services/tournamentService';
import {
  createRegistration,
  subscribeUserRegistrations,
  updateRegistrationStatus,
} from '@/services/registrationService';
import type {
  JoinedTournament,
  JoinStatus,
  PaymentSettings,
  RecentWinner,
  Tournament,
  TournamentResult,
} from '@/types';

export type {
  TournamentCategory,
  TournamentStatus,
  JoinStatus,
  TournamentResult,
  RecentWinner,
  Tournament,
  JoinedTournament,
  PaymentSettings,
} from '@/types';

interface TournamentContextType {
  tournaments: Tournament[];
  joinedTournaments: JoinedTournament[];
  recentWinners: RecentWinner[];
  paymentSettings: PaymentSettings;
  isLoading: boolean;
  addTournament: (t: Omit<Tournament, 'id' | 'slotsUsed'>) => Promise<void>;
  updateTournament: (id: string, updates: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  cancelTournament: (id: string) => Promise<void>;
  restoreTournament: (id: string) => Promise<void>;
  joinTournament: (data: Omit<JoinedTournament, 'id' | 'status' | 'joinedAt' | 'userId'>) => Promise<void>;
  updateJoinStatus: (joinId: string, status: JoinStatus) => Promise<void>;
  updatePaymentSettings: (settings: PaymentSettings) => Promise<void>;
  loadData: () => Promise<void>;
  getTournamentById: (id: string) => Tournament | undefined;
  getJoinByTournamentId: (tournamentId: string) => JoinedTournament | undefined;
  getBackupData: () => string;
}

const DEFAULT_PAYMENT: PaymentSettings = {
  upiId: 'fftournament@nyes',
  instructions: [
    'Pay the entry fee using any UPI app',
    'Note the Transaction ID (UTR number)',
    'Fill the join form with your Transaction ID or screenshot',
  ],
  whatsappNumber: '917488765246',
};

const TournamentContext = createContext<TournamentContextType | null>(null);

function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [joinedTournaments, setJoinedTournaments] = useState<JoinedTournament[]>([]);
  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([]);
  const [paymentSettings, setPaymentSettingsState] = useState<PaymentSettings>(DEFAULT_PAYMENT);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const regUnsubRef = useRef<(() => void) | null>(null);
  const tournamentsRef = useRef<Tournament[]>([]);
  useEffect(() => { tournamentsRef.current = tournaments; }, [tournaments]);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const unsubT = subscribeTournaments((ts) => {
      setTournaments(ts);
      setIsLoading(false);
    });
    unsubs.push(unsubT);

    const unsubW = subscribeWinners(setRecentWinners);
    unsubs.push(unsubW);

    const unsubSettings = subscribeAppSettings(({ payment }) => {
      setPaymentSettingsState(payment);
    });
    unsubs.push(unsubSettings);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (regUnsubRef.current) {
        regUnsubRef.current();
        regUnsubRef.current = null;
      }
      if (user) {
        regUnsubRef.current = subscribeUserRegistrations(user.uid, setJoinedTournaments);
      } else {
        setJoinedTournaments([]);
      }
    });
    unsubs.push(unsubAuth);

    return () => {
      unsubs.forEach((fn) => fn());
      if (regUnsubRef.current) regUnsubRef.current();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const today = todayIST();

      tournamentsRef.current.forEach((t) => {
        if (t.status === 'cancelled' || t.status === 'completed') return;

        if (!t.repeatDaily && t.status === 'upcoming') {
          const [h, m] = t.time.split(':').map(Number);
          const [yr, mo, dy] = t.date.split('-').map(Number);
          const matchMs = new Date(yr, mo - 1, dy, h, m).getTime();
          if (now > matchMs) {
            fsUpdateTournament(t.id, { status: 'closed' }).catch(console.error);
          }
          if (t.roomId && !t.roomAutoReleased && now >= matchMs - 30 * 60 * 1000) {
            fsUpdateTournament(t.id, {
              status: 'live',
              roomAutoReleased: true,
              roomReleaseTime: new Date().toISOString(),
            }).catch(console.error);
          }
          return;
        }

        if (t.repeatDaily && t.status === 'upcoming' && t.roomId) {
          const [h, m] = t.time.split(':').map(Number);
          const todayMatchMs = (() => {
            const d = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
            d.setHours(h, m, 0, 0);
            return d.getTime();
          })();
          const releasedToday = t.roomReleaseTime &&
            new Date(t.roomReleaseTime).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === today;
          if (!releasedToday && now >= todayMatchMs - 30 * 60 * 1000 && now < todayMatchMs + 3 * 60 * 60 * 1000) {
            fsUpdateTournament(t.id, {
              status: 'live',
              roomReleaseTime: new Date().toISOString(),
            }).catch(console.error);
          }
        }
      });
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const addTournament = useCallback(async (t: Omit<Tournament, 'id' | 'slotsUsed'>) => {
    await createTournament(t);
  }, []);

  const updateTournament = useCallback(async (id: string, updates: Partial<Tournament>) => {
    await fsUpdateTournament(id, updates);
    if (updates.results && updates.results.length > 0 && updates.status === 'completed') {
      const tournament = tournamentsRef.current.find((t) => t.id === id);
      if (tournament) {
        await publishWinners(id, tournament.name, updates.results as TournamentResult[]).catch(console.error);
      }
    }
  }, []);

  const deleteTournament = useCallback(async (id: string) => {
    await fsDeleteTournament(id);
  }, []);

  const cancelTournament = useCallback(async (id: string) => {
    await fsUpdateTournament(id, { status: 'cancelled', cancelledAt: new Date().toISOString() });
  }, []);

  const restoreTournament = useCallback(async (id: string) => {
    await fsUpdateTournament(id, { status: 'upcoming', cancelledAt: undefined });
  }, []);

  const joinTournament = useCallback(async (
    data: Omit<JoinedTournament, 'id' | 'status' | 'joinedAt' | 'userId'>,
  ) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to join a tournament.');
    const tournament = tournamentsRef.current.find((x) => x.id === data.tournamentId);
    const joinDate = tournament?.repeatDaily ? todayIST() : data.tournamentDate;
    await createRegistration({
      ...data,
      tournamentDate: joinDate,
      userId: currentUser.uid,
    });
  }, []);

  const updateJoinStatus = useCallback(async (joinId: string, status: JoinStatus) => {
    await updateRegistrationStatus(joinId, status);
  }, []);

  const updatePaymentSettings = useCallback(async (settings: PaymentSettings) => {
    await updateAppSettings({ payment: settings });
    setPaymentSettingsState(settings);
  }, []);

  const loadData = useCallback(async () => {}, []);

  const getTournamentById = useCallback(
    (id: string) => tournamentsRef.current.find((t) => t.id === id),
    [],
  );

  const getJoinByTournamentId = useCallback((tournamentId: string): JoinedTournament | undefined => {
    const tournament = tournamentsRef.current.find((t) => t.id === tournamentId);
    const joins = joinedTournaments.filter((j) => j.tournamentId === tournamentId);
    if (tournament?.repeatDaily) {
      const today = todayIST();
      return joins.find((j) => j.tournamentDate === today);
    }
    return joins[0];
  }, [joinedTournaments]);

  const getBackupData = useCallback((): string =>
    JSON.stringify(
      { exportedAt: new Date().toISOString(), tournaments, joinedTournaments, paymentSettings },
      null,
      2,
    ),
  [tournaments, joinedTournaments, paymentSettings]);

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        joinedTournaments,
        recentWinners,
        paymentSettings,
        isLoading,
        addTournament,
        updateTournament,
        deleteTournament,
        cancelTournament,
        restoreTournament,
        joinTournament,
        updateJoinStatus,
        updatePaymentSettings,
        loadData,
        getTournamentById,
        getJoinByTournamentId,
        getBackupData,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be used within TournamentProvider');
  return ctx;
}
