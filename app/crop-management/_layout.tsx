import { Stack } from 'expo-router';

import { DS } from '@/constants/design-system';

export default function CropManagementLayout() {
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
        contentStyle: { backgroundColor: DS.colors.background },
      }}>
      {/* The hub renders its own header so it can carry the stat row. */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="planner" options={{ title: 'Crop Planner' }} />
      <Stack.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Stack.Screen name="health" options={{ title: 'Crop Health' }} />
      <Stack.Screen name="soil" options={{ title: 'Soil & Fertilizer' }} />
    </Stack>
  );
}
