import { Stack } from 'expo-router';

export default function MarketLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f0fdf4' },
        headerTintColor: '#14532d',
        headerTitleStyle: { fontWeight: '700' },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Product' }} />
      <Stack.Screen name="cart" options={{ title: 'Cart' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      <Stack.Screen name="success" options={{ title: 'Order Placed', headerShown: false }} />
      <Stack.Screen name="seller" options={{ title: 'My Listings' }} />
    </Stack>
  );
}
