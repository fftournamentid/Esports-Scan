import type { UserProfile } from '@/types';

export interface ProfileCompletionResult {
  percentage: number;
  completed: number;
  total: number;
  missingFields: string[];
  canJoin: boolean;
}

const PROFILE_FIELDS: { label: string; key: keyof UserProfile }[] = [
  { label: 'Player Name', key: 'name' },
  { label: 'Email', key: 'email' },
  { label: 'Phone Number', key: 'phoneNumber' },
  { label: 'Free Fire UID', key: 'freeFireUid' },
  { label: 'UPI ID', key: 'upiId' },
  { label: 'WhatsApp Number', key: 'whatsappNumber' },
];

export const TOTAL_PROFILE_FIELDS = PROFILE_FIELDS.length; // 6
export const MIN_FIELDS_TO_JOIN = 5; // 80% of 6 = 5

export function getProfileCompletion(profile: UserProfile | null): ProfileCompletionResult {
  if (!profile) {
    return {
      percentage: 0,
      completed: 0,
      total: TOTAL_PROFILE_FIELDS,
      missingFields: PROFILE_FIELDS.map(f => f.label),
      canJoin: false,
    };
  }

  const missingFields = PROFILE_FIELDS
    .filter(f => !String(profile[f.key] ?? '').trim())
    .map(f => f.label);

  const completed = TOTAL_PROFILE_FIELDS - missingFields.length;
  const percentage = Math.round((completed / TOTAL_PROFILE_FIELDS) * 100);
  const canJoin = completed >= MIN_FIELDS_TO_JOIN;

  return { percentage, completed, total: TOTAL_PROFILE_FIELDS, missingFields, canJoin };
}
