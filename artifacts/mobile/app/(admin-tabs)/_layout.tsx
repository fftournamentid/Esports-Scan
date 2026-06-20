import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const absoluteFill = StyleSheet.absoluteFillObject;

export default function AdminTabLayout() {
  const colors = useColors();
  const { userProfile, authLoading } = useAuth();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  if (authLoading) return null;
  if (userProfile?.role !== 'admin') return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: isWeb
          ? {
              position: 'absolute' as const,
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              height: 64,
            }
          : {
              position: 'absolute' as const,
              backgroundColor: isIOS ? 'transparent' : colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              elevation: 0,
            },
        tabBarBackground: isIOS
          ? () => <BlurView intensity={80} tint="dark" style={absoluteFill} />
          : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Tournaments',
          tabBarIcon: ({ color }) => <Feather name="zap" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color }) => <Feather name="credit-card" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Feather name="settings" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
