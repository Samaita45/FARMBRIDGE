import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f0fdf4' },
        headerTintColor: '#14532d',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Back',
      }}>
      <Stack.Screen name="index" options={{ title: 'Profile', headerShown: false }} />
      <Stack.Screen name="edit-farm" options={{ title: 'My Farm' }} />
      <Stack.Screen name="orders" options={{ title: 'My Orders' }} />
      <Stack.Screen name="earnings" options={{ title: 'Earnings' }} />
    </Stack>
  );
}
