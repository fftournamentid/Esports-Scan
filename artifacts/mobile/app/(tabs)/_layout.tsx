import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet } from "react-native";

import { useColors } from "@/hooks/useColors";

const absoluteFill = StyleSheet.absoluteFillObject;

export default function TabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: isWeb
          ? {
              position: "absolute" as const,
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              height: 84,
            }
          : {
              position: "absolute" as const,
              backgroundColor: isIOS ? "transparent" : colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              elevation: 0,
            },
        tabBarBackground: isWeb
          ? undefined
          : isIOS
          ? () => (
              <BlurView
                intensity={80}
                tint="dark"
                style={absoluteFill}
              />
            )
          : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="my-tournaments"
        options={{
          title: "My Tournaments",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="trophy" tintColor={color} size={24} />
            ) : (
              <Feather name="award" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}
