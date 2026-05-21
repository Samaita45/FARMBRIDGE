import { Stack } from 'expo-router';

export default function TutorialsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f0fdf4' },
        headerTintColor: '#14532d',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Back',
      }}>
      <Stack.Screen name="index" options={{ title: 'Tutorials', headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Tutorial' }} />
    </Stack>
  );
}
