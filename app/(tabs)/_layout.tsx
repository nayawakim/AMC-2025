// app/(tabs)/_layout.tsx
import { HapticTab } from "@/components/haptic-tab";
import { Tabs } from "expo-router";
import React from "react";
import { Image } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#1A1A1A",
          borderTopWidth: 0,
          height: 70,
        paddingTop: 5,       
        paddingBottom: 5,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 6,
        },
tabBarIcon: ({ focused }) => {
  let icon;
  let size = 32; // taille par défaut

  if (route.name === "map") {
    icon = focused
      ? require("../../assets/icons/logoMaps.png")
      : require("../../assets/icons/logoMapsgris.png");

    size = 45; // 👈 taille spéciale pour MAP
  }

  if (route.name === "chat") {
    icon = focused
      ? require("../../assets/icons/logoChat.png")
      : require("../../assets/icons/logoChatgris.png");

    size = 32; // 👈 taille normale pour CHAT
  }

  return (
    <Image
      source={icon}
      style={{
        width: size,
        height: size,
        resizeMode: "contain",
      }}
    />
  );
},

      })}
    >
      <Tabs.Screen
        name="map"
        options={{ title: "map" }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: "chat" }}
      />
    </Tabs>
  );
}
