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
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { TournamentProvider } from "@/context/TournamentContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { firebaseUser, authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === "auth";
    const inAdminGroup =
      firstSegment === "admin" ||
      firstSegment === "admin-dashboard";

    if (!firebaseUser && !inAuthGroup && !inAdminGroup) {
      router.replace("/auth/login" as never);
    } else if (firebaseUser && inAuthGroup) {
      router.replace("/" as never);
    }
  }, [firebaseUser, authLoading, segments]);

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
