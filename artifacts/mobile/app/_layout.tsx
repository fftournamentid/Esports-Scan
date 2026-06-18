import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import "@/utils/notifications";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { TournamentProvider } from "@/context/TournamentContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Routes where admin is allowed to be (other than admin/* and admin-dashboard)
const ADMIN_PASSTHROUGH = new Set([
  'tournament', 'room', 'results', 'payment', 'join', 'notifications', '+not-found',
]);

function AuthGate({ children }: { children: React.ReactNode }) {
  const { firebaseUser, userProfile, authLoading } = useAuth();
  const segments = useSegments();

  // While auth state is being determined, render nothing (splash is still showing)
  if (authLoading) return null;

  const firstSegment = segments[0] as string | undefined;
  const inAuthGroup = firstSegment === "auth";
  const inAdminGroup = firstSegment === "admin" || firstSegment === "admin-dashboard";
  const isAdmin = userProfile?.role === "admin";

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!firebaseUser) {
    if (!inAuthGroup) {
      return <Redirect href="/auth/login" />;
    }
    return <>{children}</>;
  }

  // ── Admin user ─────────────────────────────────────────────────────────────
  if (isAdmin) {
    // Admin must stay in admin area unless on a passthrough detail route
    if (!inAdminGroup && !ADMIN_PASSTHROUGH.has(firstSegment ?? "")) {
      return <Redirect href="/admin-dashboard" />;
    }
    return <>{children}</>;
  }

  // ── Regular user ───────────────────────────────────────────────────────────
  // Block access to auth and admin routes
  if (inAuthGroup || inAdminGroup) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
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
        <Stack.Screen name="admin-dashboard" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AuthGate>
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

  if (!fontsLoaded && !fontError) return null;

  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
