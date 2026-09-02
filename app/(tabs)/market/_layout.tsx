import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/lib/navigation';

export default function MarketLayout() {
  return (
    <Stack
      screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Product' }} />
      <Stack.Screen name="cart" options={{ title: 'Your cart' }} />
      <Stack.Screen name="checkout" options={{ title: 'Check out' }} />
      <Stack.Screen name="success" options={{ title: 'Order placed', headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="seller" options={{ title: 'My Listings' }} />
    </Stack>
  );
}
