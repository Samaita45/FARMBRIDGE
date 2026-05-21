import { Stack } from 'expo-router';

export default function CropManagementLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f0fdf4' },
        headerTintColor: '#14532d',
        headerTitleStyle: { fontWeight: '700' },
      }}>
      <Stack.Screen name="index" options={{ title: 'Crop Management' }} />
      <Stack.Screen name="planner" options={{ title: 'Crop Planner' }} />
      <Stack.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Stack.Screen name="health" options={{ title: 'Crop Health' }} />
      <Stack.Screen name="soil" options={{ title: 'Soil & Fertilizer' }} />
    </Stack>
  );
}
