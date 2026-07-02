import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { OverlayProvider } from "@/context/OverlayContext";
import { ensureNotificationChannel } from "@/utils/notifications";


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
  const [customFontsLoaded] = useFonts({
    "Nunito": require("../assets/fonts/Nunito-Regular.ttf"),
    "Manrope": require("../assets/fonts/Manrope-Regular.ttf"),
  });

  useEffect(() => {
    if ((iconsLoaded || iconsError) && customFontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [iconsLoaded, iconsError, customFontsLoaded]);

  useEffect(() => {
    ensureNotificationChannel();
  }, []);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app — icons will tofu, but the app still boots.
  if (!(iconsLoaded || iconsError) || !customFontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <OverlayProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="dragon-form" options={{ presentation: "modal" }} />
          <Stack.Screen name="schedule-slot-form" options={{ presentation: "modal" }} />
          <Stack.Screen name="list-item-form" options={{ presentation: "modal" }} />
        </Stack>
      </OverlayProvider>
    </SafeAreaProvider>
  );
}
