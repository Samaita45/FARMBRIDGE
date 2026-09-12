import 'react-native-reanimated';
import '../global.css';
/*
  Imported for its side effect, and it has to be from here.

  The driver-location task registers itself with TaskManager at module scope.
  When the OS wakes the app in the background to hand over a position, it
  evaluates the bundle from this root and then looks for a task by name — so if
  registration only happened when the tracking screen's module loaded, which
  expo-router does lazily, the task would not exist yet and the update would be
  dropped. That is the usual reason background location appears to work in
  testing and never fires in the field.
*/
import '@/services/backgroundLocation';

import {
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ToastProvider } from '@/components/ui/toast-provider';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { DS } from '@/constants/design-system';
import { useDailyDigestScheduler } from '@/hooks/useDailyDigestScheduler';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  registerNotificationListeners,
  requestNotificationPermissions,
} from '@/services/notificationService';
import { setSessionExpiredHandler } from '@/services/api/client';
import { hydrateFastStorage } from '@/services/fastStorage';
import { migrateNamespace } from '@/services/migrations/rename-namespace';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

/**
 * React Navigation's own theme, derived from DS so the chrome it draws (screen
 * backgrounds during transitions, default header tints) matches the app rather
 * than sitting a shade off it.
 */
const NavigationLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: DS.colors.primary,
    background: DS.colors.background,
    card: DS.colors.surface,
    text: DS.colors.text,
    border: DS.colors.border,
  },
};

// Placeholder until a real dark theme gets its own contrast pass; the app
// ships light-only today.
const NavigationDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: DS.colors.primaryLight },
};

function AppBootstrap() {
  useDailyDigestScheduler();
  const userId = useAuthStore((s: AuthState) => s.user?.id);
  const addNotification = useNotificationStore((s) => s.add);
  const logout = useAuthStore((s: AuthState) => s.logout);

  useEffect(() => {
    void requestNotificationPermissions();
  }, []);

  // When a refresh token is rejected the API layer clears it and calls this, so
  // the app returns to a signed-out state instead of sitting on a dead session
  // and failing every request.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      void logout();
    });
    return () => setSessionExpiredHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!userId) return;
    let remove: (() => void) | undefined;
    void registerNotificationListeners((item) => {
      void addNotification(userId, item);
    }).then((fn) => {
      remove = fn ?? undefined;
    });
    return () => remove?.();
  }, [userId, addNotification]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrate = useAuthStore((s: AuthState) => s.hydrate);

  const [fontsLoaded, fontError] = useFonts({
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    // The namespace migration must finish before anything reads storage,
    // otherwise hydrate() looks under the new prefix while the data is still
    // filed under the old one and the app appears empty.
    void (async () => {
      // Order matters. The synchronous store's mirror has to be filled before
      // the migration reads its completion flag, and both must finish before
      // hydrate() looks for the session.
      await hydrateFastStorage();
      await migrateNamespace();
      await hydrate();
    })();
  }, [hydrate]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AppBootstrap />
        <OfflineBanner />
        <ThemeProvider value={colorScheme === 'dark' ? NavigationDarkTheme : NavigationLightTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="crop-management" />
              <Stack.Screen name="financials" />
              <Stack.Screen name="tutorials" />
              <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
              <Stack.Screen
                name="notifications"
                options={{ headerShown: true, title: 'Notifications' }}
              />
            </Stack>
            {/* `translucent` went in SDK 57 — under edge-to-edge, which this
                app enables, the bar is translucent already. */}
            <StatusBar style="dark" />
        </ThemeProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
