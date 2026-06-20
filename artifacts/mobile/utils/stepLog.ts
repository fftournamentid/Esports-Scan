import { Platform } from 'react-native';

const DEBUG_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/debuglog`;

function postLog(msg: string): void {
  if (Platform.OS !== 'web') return;
  try {
    fetch(DEBUG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg }),
    }).catch(() => {});
  } catch (_) {}
}

export function stepLog(msg: string): void {
  console.log(msg);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      (window as unknown as Record<string, (m: string) => void>).__stepLog?.(msg);
    } catch (_) {}
    postLog(msg);
  }
}
