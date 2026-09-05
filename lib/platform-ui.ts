import { Platform, StatusBar, type ViewStyle } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

import { DS } from '@/constants/design-system';

/** Standard safe-area edges for full screens with custom headers */
export const SCREEN_EDGES: Edge[] = ['top', 'left', 'right'];

/**
 * Distance from the top of the window to the first control.
 *
 * On Android 15 the app draws under the status bar and `insets.top` is
 * sometimes 0 on the first frame, which parks the menu on the clock. The
 * status-bar height is the floor so chrome never sits in the system tray,
 * the notch, or the camera cutout.
 */
export function topChrome(insetsTop: number): number {
  const statusBar = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  return Math.max(insetsTop, statusBar, 12);
}

/** Extra padding when SafeAreaView already applied `insets.top` but that value was 0. */
export function extraTopPad(insetsTop: number): number {
  return Math.max(0, topChrome(insetsTop) - insetsTop);
}

/** Card shadow that renders on both iOS (shadow*) and Android (elevation) */
export function cardShadow(elevated = false): ViewStyle {
  return elevated ? DS.shadow.elevated : DS.shadow.card;
}

/** Bottom tab bar — accounts for home indicator / gesture navigation */
export function tabBarStyle(bottomInset: number): ViewStyle {
  const baseHeight = Platform.OS === 'ios' ? 56 : 58;
  return {
    backgroundColor: DS.colors.surface,
    borderTopColor: DS.colors.border,
    borderTopWidth: 1,
    height: baseHeight + bottomInset,
    paddingTop: 6,
    paddingBottom: Math.max(bottomInset, Platform.OS === 'android' ? 12 : 8),
    // The tab bar sits above content, so its separation comes from the border
    // above rather than a shadow cast upward.
    elevation: 0,
  };
}

export const platformPressable = Platform.select({
  ios: { opacity: 0.85 },
  android: { opacity: 0.88 },
  default: { opacity: 0.85 },
});

/** Consistent hit slop for touch targets (accessibility) */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
