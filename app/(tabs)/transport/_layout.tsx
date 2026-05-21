import { Stack } from 'expo-router';

export default function TransportLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f0fdf4' },
        headerTintColor: '#14532d',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Back',
      }}>
      <Stack.Screen name="index" options={{ title: 'Farm Transport', headerShown: false }} />
      <Stack.Screen name="request" options={{ title: 'Request Transport' }} />
      <Stack.Screen name="providers" options={{ title: 'Available Drivers' }} />
      <Stack.Screen name="negotiate" options={{ title: 'Negotiate Price' }} />
      <Stack.Screen name="confirm" options={{ title: 'Booking Confirmed' }} />
      <Stack.Screen name="register" options={{ title: 'Offer Transport' }} />
      <Stack.Screen name="trips" options={{ title: 'My Trips' }} />
    </Stack>
  );
}
