import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { OverlayProvider } from "@/context/OverlayContext";
import { AdminSettingsProvider } from "@/context/AdminSettingsContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ensureNotificationChannel } from "@/utils/notifications";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { token, initializing } = useAuth();

  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync();
  }, [initializing]);

  if (initializing) return null;

  const isAuthed = !!token;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Authenticated area */}
      <Stack.Protected guard={isAuthed}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="users" options={{ presentation: "modal" }} />
        <Stack.Screen name="dragon-form" options={{ presentation: "modal" }} />
        <Stack.Screen name="schedule-slot-form" options={{ presentation: "modal" }} />
        <Stack.Screen name="list-item-form" options={{ presentation: "modal" }} />
        <Stack.Screen name="dragon-weight" options={{ presentation: "modal" }} />
        <Stack.Screen name="feeding-suggestions" />
        <Stack.Screen name="help" />
      </Stack.Protected>

      {/* Public / auth area */}
      <Stack.Protected guard={!isAuthed}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useIconFonts();

  useEffect(() => {
    ensureNotificationChannel();
  }, []);

  if (!(iconsLoaded || iconsError)) return null;

  return (
    <SafeAreaProvider>
      <OverlayProvider>
        <AuthProvider>
          <AdminSettingsProvider>
            <RootNavigator />
          </AdminSettingsProvider>
        </AuthProvider>
      </OverlayProvider>
    </SafeAreaProvider>
  );
}
