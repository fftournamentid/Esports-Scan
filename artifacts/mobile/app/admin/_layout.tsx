import { Redirect, Stack, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContext';

export default function AdminLayout() {
  const { userProfile } = useAuth();
  const { isAdminAuthenticated } = useTournament();
  const segments = useSegments();

  const isOnLogin = segments[segments.length - 1] === 'login';
  const hasAccess = userProfile?.role === 'admin' || isAdminAuthenticated;

  if (!hasAccess && !isOnLogin) {
    return <Redirect href="/admin/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
