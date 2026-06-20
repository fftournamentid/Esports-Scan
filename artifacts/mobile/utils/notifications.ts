import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parseISTDateTime } from './time';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Schedules 3 local notifications: 15 min, 10 min, and 5 min before match start.
 * Safe to call multiple times — uses stable identifiers so existing alerts are replaced.
 * Silently no-ops on web or if permission is not granted.
 */
export async function scheduleMatchNotifications(
  tournamentId: string,
  date: string,
  time: string,
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const matchTime = parseISTDateTime(date, time).getTime();
    const now = Date.now();

    const alerts: { minutesBefore: number }[] = [
      { minutesBefore: 15 },
      { minutesBefore: 10 },
      { minutesBefore: 5 },
    ];

    for (const { minutesBefore } of alerts) {
      const triggerAt = matchTime - minutesBefore * 60 * 1000;
      const secondsUntil = Math.floor((triggerAt - now) / 1000);
      if (secondsUntil <= 0) continue;

      await Notifications.scheduleNotificationAsync({
        identifier: `${tournamentId}_${minutesBefore}`,
        content: {
          title: '🔥 Tournament Starting Soon',
          body: `Your tournament starts in ${minutesBefore} minutes. Open the app and check Room ID & Password.`,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntil,
          repeats: false,
        },
      });
    }
  } catch {
    // Notifications are best-effort — silently ignore failures
  }
}

export async function cancelMatchNotifications(tournamentId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith(`${tournamentId}_`)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch {
    // silently ignore
  }
}
