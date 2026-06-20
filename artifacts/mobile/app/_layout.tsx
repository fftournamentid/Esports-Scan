import "@/utils/webErrorCapture";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import "@/utils/notifications";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { TournamentProvider } from "@/context/TournamentContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const ADMIN_PASSTHROUGH = new Set([
  'tournament', 'room', 'results', 'payment', 'join', 'notifications', '+not-found',
]);

function AuthGate({ children }: { children: React.ReactNode }) {
  const { firebaseUser, userProfile, authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  console.log('[AuthGate] render — authLoading:', authLoading, '| user:', firebaseUser?.uid ?? null, '| segments:', JSON.stringify(segments));

  useEffect(() => {
    if (authLoading) return;

    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === "auth";
    const inAdminGroup =
      firstSegment === "admin" ||
      firstSegment === "admin-dashboard" ||
      firstSegment === "(admin-tabs)";
    const isAdmin = userProfile?.role === "admin";

    console.log('[AuthGate] effect — firebaseUser:', firebaseUser?.uid ?? null, '| segment:', firstSegment, '| isAdmin:', isAdmin);

    if (!firebaseUser) {
      if (!inAuthGroup) {
        console.log('[AuthGate] no user, not in auth group → replace /auth/login');
        router.replace('/auth/login' as never);
      }
      return;
    }

    if (isAdmin) {
      if (!inAdminGroup && !ADMIN_PASSTHROUGH.has(firstSegment ?? "")) {
        console.log('[AuthGate] admin outside admin area → replace /(admin-tabs)/');
        router.replace('/(admin-tabs)/' as never);
      }
      return;
    }

    if (inAuthGroup || inAdminGroup) {
      console.log('[AuthGate] regular user on auth/admin route → replace /');
      router.replace('/' as never);
    }
  }, [firebaseUser, userProfile, authLoading, segments]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D14' }}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="tournament/[id]" />
          <Stack.Screen name="payment/[id]" />
          <Stack.Screen name="join/[id]" />
          <Stack.Screen name="room/[id]" />
          <Stack.Screen name="results/[id]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="(admin-tabs)" />
          <Stack.Screen name="admin-dashboard" />
          <Stack.Screen name="admin" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthGate>
      <FloatingWhatsApp />
    </View>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    return (
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TournamentProvider>
                {children}
              </TournamentProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TournamentProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                {children}
              </GestureHandlerRootView>
            </TournamentProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
