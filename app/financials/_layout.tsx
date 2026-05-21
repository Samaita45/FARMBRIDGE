import { Stack } from 'expo-router';

export default function FinancialsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f0fdf4' },
        headerTintColor: '#14532d',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Back',
      }}>
      <Stack.Screen name="index" options={{ title: 'Financials', headerShown: false }} />
      <Stack.Screen name="income" options={{ title: 'Income' }} />
      <Stack.Screen name="expense" options={{ title: 'Expenses' }} />
      <Stack.Screen name="calculator" options={{ title: 'Profit Calculator' }} />
      <Stack.Screen name="loans" options={{ title: 'Agri-Finance' }} />
      <Stack.Screen name="alerts" options={{ title: 'Price Alerts' }} />
    </Stack>
  );
}
