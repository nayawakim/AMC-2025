import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "./global.css";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
    unsavedChangesWarning: false,
});

// 👇 Désactive le router-debug-nav en bas et fixe la page d'entrée
export const unstable_settings = {
  initialRouteName: "map",
};

export default function RootLayout() {
    return (
        <ConvexProvider client={convex}>
            <ThemeProvider defaultTheme="system">
                <AppContent />
            </ThemeProvider>
        </ConvexProvider>
    );
}

function AppContent() {
    const { activeTheme } = useTheme();
    return (
        <>
            <Stack
                screenOptions={{
                    contentStyle: activeTheme,
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="modal"
                    options={{ presentation: "modal", title: "Modal" }}
                />
            </Stack>
            <StatusBar style="auto" />
        </>
    );
}
