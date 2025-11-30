// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { BottomTabBarProps } from "@react-navigation/bottom-tabs"; // ✅ FIX !

// Icônes centralisées
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const INDICATOR_WIDTH = 40;

function AnimatedTabBar(props: BottomTabBarProps) {
    const { state, descriptors, navigation } = props;

    const tabWidth = SCREEN_WIDTH / state.routes.length;

    const translateX = useRef(
        new Animated.Value(
            state.index * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2
        )
    ).current;

    useEffect(() => {
        const toValue =
            state.index * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;

        Animated.spring(translateX, {
            toValue,
            useNativeDriver: true,
            stiffness: 200,
            damping: 20,
            mass: 1,
        }).start();
    }, [state.index, tabWidth, translateX]);

    return (
        <View style={styles.tabBarContainer}>
            {/* Barre rouge qui slide au-dessus de l'icône active */}
            <Animated.View
                style={[
                    styles.indicator,
                    {
                        width: INDICATOR_WIDTH,
                        transform: [{ translateX }],
                    },
                ]}
            />

            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];

                let label: string;
                if (typeof options.tabBarLabel === "string") {
                    label = options.tabBarLabel;
                } else if (typeof options.title === "string") {
                    label = options.title;
                } else {
                    label = route.name;
                }

                const isFocused = state.index === index;

                let source;
                if (route.name === "map") {
                    source = isFocused ? icons.map.active : icons.map.inactive;
                } else if (route.name === "chat") {
                    source = isFocused
                        ? icons.chat.active
                        : icons.chat.inactive;
                } else if (route.name === "scan") {
                    source = isFocused
                        ? icons.scan.active
                        : icons.scan.inactive;
                } else {
                    source = undefined;
                }

                const onPress = () => {
                    const event = navigation.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        onPress={onPress}
                        style={styles.tabItem}
                        activeOpacity={0.8}
                    >
                        {source && (
                            <Image
                                source={source}
                                style={[
                                    route.name === "map"
                                        ? styles.mapIcon
                                        : styles.defaultIcon,
                                ]}
                            />
                        )}

                        <Text
                            style={[
                                styles.label,
                                isFocused && styles.labelFocused,
                            ]}
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
            }}
            // on remplace la tabBar par notre version animée
            tabBar={(props) => <AnimatedTabBar {...props} />}
        >
            <Tabs.Screen name="map" options={{ title: "Carte" }} />
            <Tabs.Screen name="chat" options={{ title: "Chat" }} />
            <Tabs.Screen name="scan" options={{ title: "Scanner" }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        flexDirection: "row",
        backgroundColor: "#1A1A1A",
        borderTopWidth: 0,
        height: 75,
        paddingTop: 6,
        paddingBottom: 4,
    },
    indicator: {
        position: "absolute",
        top: 0,
        height: 4,
        borderRadius: 999,
        backgroundColor: "#ef4444",
    },
    tabItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
    },

    /** 👉 ICÔNES ICI — c'est ce qui fixe la taille Rouge/Gris */
    defaultIcon: {
        width: 40,
        height: 40,
        resizeMode: "contain",
    },

    mapIcon: {
        width: 60, // ajuste comme tu veux
        height: 50,
        resizeMode: "contain",
    },

    label: {
        fontSize: 12,
        marginTop: 2,
        marginBottom: 4,
        color: "#9ca3af",
    },
    labelFocused: {
        color: "#ffffff",
    },
});
