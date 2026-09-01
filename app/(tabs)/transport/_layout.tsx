import { Stack } from 'expo-router';

import { DS } from '@/constants/design-system';

export default function TransportLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: DS.colors.surface },
        headerTintColor: DS.colors.text,
        headerTitleStyle: {
          fontFamily: DS.fontFamily.semibold,
          fontSize: DS.typography.h3.fontSize,
        },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: DS.colors.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'Transport', headerShown: false }} />
      <Stack.Screen name="request" options={{ title: 'Request transport' }} />
      <Stack.Screen name="providers" options={{ title: 'Available transporters' }} />
      <Stack.Screen name="negotiate" options={{ title: 'Negotiate price' }} />
      <Stack.Screen name="confirm" options={{ title: 'Booking confirmed' }} />
      <Stack.Screen name="register" options={{ title: 'Offer transport' }} />
      <Stack.Screen name="trips" options={{ title: 'My trips' }} />
    </Stack>
  );
}
