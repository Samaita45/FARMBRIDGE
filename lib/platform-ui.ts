import { Platform, type ViewStyle } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

import { Shadows } from '@/constants/Spacing';
import Colors from '@/constants/colors';

/** Standard safe-area edges for full screens with custom headers */
export const SCREEN_EDGES: Edge[] = ['top', 'left', 'right'];

/** Card shadow that renders on both iOS (shadow*) and Android (elevation) */
export function cardShadow(elevated = false): ViewStyle {
  return elevated ? Shadows.elevated : Shadows.card;
}

/** Bottom tab bar — accounts for home indicator / gesture navigation */
export function tabBarStyle(bottomInset: number): ViewStyle {
  const baseHeight = Platform.OS === 'ios' ? 56 : 58;
  return {
    backgroundColor: Colors.white,
    borderTopColor: Colors.gray[200],
    borderTopWidth: 1,
    height: baseHeight + bottomInset,
    paddingTop: 6,
    paddingBottom: Math.max(bottomInset, Platform.OS === 'android' ? 10 : 6),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  };
}

export const platformPressable = Platform.select({
  ios: { opacity: 0.85 },
  android: { opacity: 0.88 },
  default: { opacity: 0.85 },
});

/** Consistent hit slop for touch targets (accessibility) */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
