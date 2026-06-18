/**
 * IST time utilities for Free Fire Tournament app.
 * All tournament times are stored and entered in IST (Asia/Kolkata, UTC+5:30).
 */

/**
 * Converts a 24-hour "HH:MM" string to 12-hour format with AM/PM.
 * e.g. "14:00" → "2:00 PM", "18:00" → "6:00 PM", "23:00" → "11:00 PM"
 */
export function formatTimeIST(time: string): string {
  const parts = time.split(':');
  if (parts.length < 2) return time;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return time;
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours}:${minutes} ${period}`;
}

/**
 * Parses a tournament date + time (both in IST) to a JS Date.
 * Uses explicit +05:30 offset so countdown is accurate on any device timezone.
 */
export function parseISTDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+05:30`);
}

/**
 * Formats a YYYY-MM-DD date string for display in Indian format.
 * e.g. "2025-12-31" → "31 Dec 2025"
 */
export function formatDateDisplay(date: string): string {
  try {
    const d = new Date(`${date}T00:00:00+05:30`);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return date;
  }
}

/**
 * For daily tournaments: returns the next Date when `time` occurs in IST.
 * If today's occurrence is still in the future, returns it. Otherwise returns tomorrow's.
 */
export function getNextDailyOccurrenceIST(time: string): Date {
  const nowIST = Date.now();
  // Get today's date string in IST (YYYY-MM-DD)
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const todayOccurrence = parseISTDateTime(todayStr, time);

  if (todayOccurrence.getTime() > nowIST) {
    return todayOccurrence;
  }
  // Tomorrow
  const tomorrow = new Date(todayOccurrence.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return parseISTDateTime(tomorrowStr, time);
}

/**
 * Returns the current date string in IST (YYYY-MM-DD).
 */
export function getTodayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
