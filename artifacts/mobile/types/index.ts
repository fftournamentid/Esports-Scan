export type TournamentCategory = 'Solo' | 'Duo' | 'Squad' | '1v1';
export type TournamentStatus = 'upcoming' | 'live' | 'completed' | 'closed' | 'cancelled';
export type JoinStatus = 'pending' | 'approved' | 'rejected' | 'room_released' | 'completed';

export interface TournamentResult {
  rank: number;
  playerName: string;
  uid?: string;
  prize: string;
  booyahWinner?: boolean;
}

export interface RecentWinner {
  id: string;
  tournamentId: string;
  tournamentName: string;
  playerName: string;
  uid?: string;
  prize: string;
  rank: number;
  booyahWinner?: boolean;
  publishedAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  category: TournamentCategory;
  entryFee: number;
  perKillPrize: number;
  booyahPrize: number;
  date: string;
  time: string;
  slots: number;
  slotsUsed: number;
  status: TournamentStatus;
  repeatDaily: boolean;
  roomId?: string;
  roomPassword?: string;
  roomReleaseTime?: string;
  roomAutoReleased?: boolean;
  cancelledAt?: string;
  results?: TournamentResult[];
  published: boolean;
  gameMode?: string;
  rules?: string;
  createdAt?: string;
}

export interface JoinedTournament {
  id: string;
  tournamentId: string;
  userId: string;
  playerName: string;
  uid: string;
  transactionId: string;
  hasScreenshot: boolean;
  status: JoinStatus;
  joinedAt: string;
  tournamentName: string;
  tournamentTime: string;
  tournamentDate: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  freeFireUid: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

export interface PaymentSettings {
  upiId: string;
  instructions: string[];
  whatsappNumber: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  targetType: 'all' | 'joined' | 'specificTournament';
  tournamentId?: string;
  createdAt: string;
  sent: boolean;
}
