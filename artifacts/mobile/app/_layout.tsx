import "@/utils/webErrorCapture";
import { stepLog } from "@/utils/stepLog";
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
stepLog('[STEP 1] _layout.tsx module loaded');

const queryClient = new QueryClient();

const ADMIN_PASSTHROUGH = new Set([
  'tournament', 'room', 'results', 'payment', 'join', 'notifications', '+not-found',
]);

function AuthGate({ children }: { children: React.ReactNode }) {
  const { firebaseUser, userProfile, authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const firstSegment = segments[0] as string | undefined;
  const inAuthGroup = firstSegment === "auth";
  const inAdminGroup =
    firstSegment === "admin" ||
    firstSegment === "admin-dashboard" ||
    firstSegment === "(admin-tabs)";
  const isAdmin = userProfile?.role === "admin";

  stepLog('[STEP 12] AuthGate render — authLoading:' + authLoading + ' user:' + (firebaseUser?.uid ?? null) + ' seg:' + firstSegment);

  useEffect(() => {
    if (authLoading) return;

    stepLog('[STEP 15] AuthGate effect — user:' + (firebaseUser?.uid ?? null) + ' seg:' + firstSegment + ' admin:' + isAdmin);

    if (!firebaseUser) {
      if (!inAuthGroup) {
        stepLog('[STEP 16] AuthGate: no user → replace /auth/login');
        router.replace('/auth/login' as never);
      }
      return;
    }

    if (isAdmin) {
      if (!inAdminGroup && !ADMIN_PASSTHROUGH.has(firstSegment ?? "")) {
        stepLog('[STEP 17] AuthGate: admin outside admin area → replace /(admin-tabs)/');
        router.replace('/(admin-tabs)/' as never);
      }
      return;
    }

    if (inAuthGroup || inAdminGroup) {
      stepLog('[STEP 18] AuthGate: regular user on auth/admin route → replace /');
      router.replace('/' as never);
    }
  }, [firebaseUser, userProfile, authLoading, segments]);

  // Show spinner while auth is loading
  if (authLoading) {
    stepLog('[STEP 13] AuthGate: showing spinner (authLoading=true)');
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  // Keep spinner while redirect is still pending to avoid briefly flashing the wrong screen.
  // Non-logged-in user not yet on /auth route → redirect to /auth/login is queued
  if (!firebaseUser && !inAuthGroup) {
    stepLog('[STEP 13b] AuthGate: no user, redirect pending → holding spinner');
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  // Admin user not yet on admin route → redirect pending
  if (firebaseUser && isAdmin && !inAdminGroup && !ADMIN_PASSTHROUGH.has(firstSegment ?? "")) {
    stepLog('[STEP 13c] AuthGate: admin redirect pending → holding spinner');
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  stepLog('[STEP 14] AuthGate: authLoading=false, route settled → rendering children');
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
  stepLog('[STEP 2] RootLayout: component rendering');
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      stepLog('[STEP 3] RootLayout: fonts ready (loaded=' + fontsLoaded + ' error=' + !!fontError + ') → hiding splash');
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // On web, useFonts can hang indefinitely (CSS font loading is async and unreliable
  // in the Metro dev bundle). Skip the wait on web — system/fallback fonts render fine.
  const isWeb = Platform.OS === 'web';
  if (!isWeb && !fontsLoaded && !fontError) {
    stepLog('[STEP 2b] RootLayout: waiting for fonts (native)...');
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  stepLog('[STEP 4] RootLayout: mounting AppProviders + RootLayoutNav');
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
