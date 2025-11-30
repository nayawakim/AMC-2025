// app/(tabs)/_layout.tsx


import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#000000",
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {/* --- Onglet MAP --- */}
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: () => (
            <IconSymbol size={28} name="map.fill" color={"#000"} />
          ),
        }}
      />

      {/* --- Onglet CAMERA --- */}
      <Tabs.Screen
        name="camera"
        options={{
          tabBarIcon: () => (
            <IconSymbol size={28} name="camera.fill" color={"#000"} />
          ),
        }}
      />
    </Tabs>
  );
}
