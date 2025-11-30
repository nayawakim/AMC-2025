import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import ZombieWatcher from "@/components/logic/ZombieWatcher";

export default function TabLayout() {
  return (
    <>
      {/* Surveillance zombies globale → pas d'UI visible */}
      <ZombieWatcher />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#000",
          tabBarButton: HapticTab,
        }}
      >
        {/* === Onglet MAP === */}
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="map.fill" color={color} />
            ),
          }}
        />

        {/* === Onglet CAMERA (Chat / Scanner / Photo) === */}
        <Tabs.Screen
          name="camera"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="camera.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}


