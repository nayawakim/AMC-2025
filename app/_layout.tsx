import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import Constants from "expo-constants";
import "./global.css";

const convex = new ConvexReactClient(Constants.expoConfig?.extra?.EXPO_PUBLIC_CONVEX_URL || process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export const unstable_settings = {
  anchor: "(tabs)",
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
