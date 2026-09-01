import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/lib/navigation';

export default function TransportLayout() {
  return (
    <Stack
      screenOptions={stackScreenOptions}>
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
