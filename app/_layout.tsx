import {
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { ToastProvider } from '@/components/ui/toast-provider';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { Colors } from '@/constants/colors';
import { useDailyDigestScheduler } from '@/hooks/useDailyDigestScheduler';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { requestNotificationPermissions } from '@/services/notificationService';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

const ZimFarmLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.surface,
    card: Colors.white,
    text: Colors.gray[900],
    border: Colors.gray[200],
  },
};

const ZimFarmDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
  },
};

function AppBootstrap() {
  useDailyDigestScheduler();
  useEffect(() => {
    void requestNotificationPermissions();
  }, []);
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
    void hydrate();
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
        <ThemeProvider value={colorScheme === 'dark' ? ZimFarmDarkTheme : ZimFarmLightTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="crop-management" />
              <Stack.Screen name="financials" />
              <Stack.Screen name="tutorials" />
              <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: 'modal', headerShown: true, title: 'Modal' }}
              />
            </Stack>
            <StatusBar style="auto" />
        </ThemeProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
