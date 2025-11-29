import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#000000",
                headerShown: false,
                tabBarButton: HapticTab,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={28}
                            name="house.fill"
                            color={"#000000"}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="explore"
                options={{
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={28}
                            name="paperplane.fill"
                            color={"#000000"}
                        />
                    ),
                }}
            />

            {/* Onglet MAP (ajout de ton équipe) */}
            <Tabs.Screen
                name="map"
                options={{
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={28}
                            name="map.fill"
                            color={"#000000"}
                        />
                    ),
                }}
            />

            {/* Onglet CAMERA (ton ajout) */}
            <Tabs.Screen
                name="camera"
                options={{
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={28}
                            name="camera.fill"
                            color={"#000000"}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

