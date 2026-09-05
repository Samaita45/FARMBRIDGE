import type { NativeStackNavigationOptions } from 'expo-router';

import { DS } from '@/constants/design-system';

/**
 * Shared stack header styling.
 *
 * Seven stack layouts each declared their own `screenOptions`, and all seven
 * carried the same hardcoded green (`#f0fdf4` on `#14532d`) that belonged to no
 * palette in the app. Defining it once means a header change lands everywhere
 * and the values cannot drift apart again.
 */
export const stackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: DS.colors.surface },
  headerTintColor: DS.colors.text,
  headerTitleStyle: {
    fontFamily: DS.fontFamily.semibold,
    fontSize: DS.typography.h3.fontSize,
  },
  // A hairline border reads as structure; a drop shadow under every header
  // reads as noise.
  headerShadowVisible: false,
  headerBackTitle: 'Back',
  contentStyle: { backgroundColor: DS.colors.background },
};
