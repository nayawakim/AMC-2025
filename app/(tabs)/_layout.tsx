// app/(tabs)/_layout.tsx

import { HapticTab } from "@/components/haptic-tab";
import { Tabs } from "expo-router";
import React from "react";
import { Image } from "react-native";

// on centralise les icônes ici
const icons = {
    map: {
        active: require("../../assets/icons/logoMaps.png"),
        inactive: require("../../assets/icons/logoMapsgris.png"),
    },
    chat: {
        active: require("../../assets/icons/logoChat.png"),
        inactive: require("../../assets/icons/logoChatgris.png"),
    },
    scan: {
        active: require("../../assets/icons/logoScan.png"),
        inactive: require("../../assets/icons/logoScangris.png"),
    },
};

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarShowLabel: true,
                tabBarActiveTintColor: "#007AFE",
                tabBarInactiveTintColor: "#9ca3af",
                tabBarLabelStyle: {
                    fontSize: 12,
                    marginBottom: 4,
                },
                tabBarStyle: {
                    backgroundColor: "#1A1A1A",
                    borderTopWidth: 0,
                    height: 75,
                    paddingTop: 6,
                    paddingBottom: 4,
                },

                tabBarIcon: ({ focused }) => {
                    let source;

                    if (route.name === "map") {
                        source = focused
                            ? icons.map.active
                            : icons.map.inactive;
                    } else if (route.name === "chat") {
                        source = focused
                            ? icons.chat.active
                            : icons.chat.inactive;
                    } else if (route.name === "scan") {
                        source = focused
                            ? icons.scan.active
                            : icons.scan.inactive;
                    } else {
                        return null;
                    }
                    if (route.name === "map") {
                        return (
                            <Image
                                source={source}
                                style={{
                                    width: 80, // augmenté
                                    height: 60, // augmenté
                                    resizeMode: "contain",
                                }}
                            />
                        );
                    }
                    return (
                        <Image
                            source={source}
                            style={{
                                width: 40,
                                height: 40,
                                resizeMode: "contain",
                            }}
                        />
                    );
                },
            })}
        >
            <Tabs.Screen name="map" options={{ title: "map" }} />
            <Tabs.Screen name="chat" options={{ title: "chat" }} />
            <Tabs.Screen name="scan" options={{ title: "scan" }} />
        </Tabs>
    );
}
