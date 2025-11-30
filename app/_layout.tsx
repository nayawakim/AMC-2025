import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "./global.css";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <ThemeProvider defaultTheme="system">
      <AppContent />
    </ThemeProvider>
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
