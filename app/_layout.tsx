import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "./global.css";

export const unstable_settings = {
    anchor: "(tabs)",
};

// Get Convex URL from environment variables
// You can set this in a .env file as EXPO_PUBLIC_CONVEX_URL
// Or run: npx convex dev to get the URL automatically

const convexUrl =
    process.env.EXPO_PUBLIC_CONVEX_URL ||
    Constants.expoConfig?.extra?.convexUrl;

if (!convexUrl) {
    throw new Error(
        "Missing Convex URL!\n" +
            "Please set EXPO_PUBLIC_CONVEX_URL in your .env file.\n" +
            "You can get your Convex URL by running: npx convex dev"
    );
}

const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

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
