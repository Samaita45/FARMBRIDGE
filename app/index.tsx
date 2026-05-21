import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { asHref } from '@/lib/href';
import { useAuthStore, type AuthState } from '@/stores/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore((s: AuthState) => s.isAuthenticated);
  const isHydrated = useAuthStore((s: AuthState) => s.isHydrated);

  if (!isHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={asHref('/(tabs)')} />;
  }

  return <Redirect href={asHref('/(auth)')} />;
}
