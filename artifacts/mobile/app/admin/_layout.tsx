import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout() {
  const { userProfile, authLoading } = useAuth();

  if (authLoading) return null;

  if (userProfile?.role !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
