import { Stack } from 'expo-router';

export default function CommunityLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f0fdf4' },
        headerTintColor: '#14532d',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Back',
      }}>
      <Stack.Screen name="index" options={{ title: 'Community', headerShown: false }} />
      <Stack.Screen name="create" options={{ title: 'New Post' }} />
      <Stack.Screen name="[id]" options={{ title: 'Discussion' }} />
      <Stack.Screen name="experts" options={{ title: 'Expert Q&A' }} />
    </Stack>
  );
}
