import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/lib/navigation';

export default function FinancialsLayout() {
  return (
    <Stack
      screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Financials', headerShown: false }} />
      <Stack.Screen name="income" options={{ title: 'Income' }} />
      <Stack.Screen name="expense" options={{ title: 'Expenses' }} />
      <Stack.Screen name="calculator" options={{ title: 'Profit Calculator' }} />
      <Stack.Screen name="loans" options={{ title: 'Agri-Finance' }} />
      <Stack.Screen name="alerts" options={{ title: 'Price Alerts' }} />
    </Stack>
  );
}
