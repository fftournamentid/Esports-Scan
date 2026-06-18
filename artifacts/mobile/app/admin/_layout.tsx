import { Redirect, Stack, useSegments } from 'expo-router';
import { useTournament } from '@/context/TournamentContext';

export default function AdminLayout() {
  const { isAdminAuthenticated } = useTournament();
  const segments = useSegments();

  const isOnLogin = segments[segments.length - 1] === 'login';

  if (!isAdminAuthenticated && !isOnLogin) {
    return <Redirect href="/admin/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
