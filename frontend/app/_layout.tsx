import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { OverlayProvider } from "@/context/OverlayContext";
import { AdminSettingsProvider } from "@/context/AdminSettingsContext";
import { ensureNotificationChannel } from "@/utils/notifications";
import { bootstrapLocalDb } from "@/localdb/bootstrap";


// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true)

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useIconFonts();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    bootstrapLocalDb()
      .catch((e) => console.log('Local DB bootstrap error:', e))
      .finally(() => setDbReady(true));
  }, []);

  useEffect(() => {
    if ((iconsLoaded || iconsError) && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [iconsLoaded, iconsError, dbReady]);

  useEffect(() => {
    ensureNotificationChannel();
  }, []);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app — icons will tofu, but the app still boots. Also wait for the
  // one-time local database bootstrap/migration to finish before rendering
  // any screen that reads data.
  if (!(iconsLoaded || iconsError) || !dbReady) return null;

  return (
    <SafeAreaProvider>
      <OverlayProvider>
        <AdminSettingsProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="dragon-form" options={{ presentation: "modal" }} />
            <Stack.Screen name="schedule-slot-form" options={{ presentation: "modal" }} />
            <Stack.Screen name="list-item-form" options={{ presentation: "modal" }} />
            <Stack.Screen name="dragon-weight" options={{ presentation: "modal" }} />
            <Stack.Screen name="feeding-suggestions" />
            <Stack.Screen name="help" />
          </Stack>
        </AdminSettingsProvider>
      </OverlayProvider>
    </SafeAreaProvider>
  );
}
