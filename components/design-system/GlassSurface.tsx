import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { DS } from '@/constants/design-system';

/**
 * Liquid Glass, with a fallback that is not glass at all.
 *
 * WHAT THE PLATFORM ACTUALLY GIVES US. `expo-glass-effect` renders Apple's
 * Liquid Glass material on iOS 26 and above. Everywhere else — Android, and
 * every iPhone still on iOS 18 — `GlassView` degrades to a plain, and therefore
 * TRANSPARENT, View. That degradation is the whole risk: a card whose
 * legibility comes from the material becomes text floating over whatever
 * happens to be behind it, which is precisely why glassmorphism was stripped
 * out of this app in the first place.
 *
 * So this component never lets the material carry the contrast. On iOS 26 the
 * real glass renders with a light tint over it; everywhere else it draws a
 * solid surface with a hairline. Both cases give the content a known ground,
 * and the design reads as the same component either way rather than one
 * platform getting a broken version of the other's.
 *
 * `tint` picks which ground: `light` for glass over photography and dark
 * headers, `dark` for glass over a bright scene. Take the matching `onGlass`
 * colour from `glassForeground()` rather than assuming white — the light tint
 * needs dark text.
 */

type GlassModule = typeof import('expo-glass-effect');

/**
 * Loaded defensively and once. The require resolves even when the native side
 * is absent, so the availability check is what actually decides.
 */
function loadGlass(): GlassModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-glass-effect') as GlassModule | undefined;
    // `GlassView` is a component and therefore always truthy even when the
    // native side is missing, so the module is only accepted if the package
    // exposes the availability check it is meant to be gated on.
    return typeof mod?.isLiquidGlassAvailable === 'function' ? mod : null;
  } catch {
    return null;
  }
}

const Glass = loadGlass();

/** True when the real material will render. False on Android and iOS below 26. */
export const LIQUID_GLASS_AVAILABLE = (() => {
  try {
    return Glass?.isLiquidGlassAvailable?.() ?? false;
  } catch {
    return false;
  }
})();

export type GlassTint = 'light' | 'dark';

export interface GlassSurfaceProps extends ViewProps {
  tint?: GlassTint;
  /** `DS.radius` value. The material is clipped to it. */
  radius?: number;
  /** `DS.spacing` value. */
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

/** The text and icon colour that passes on a given tint, in both render paths. */
export function glassForeground(tint: GlassTint = 'light'): string {
  return tint === 'light' ? DS.colors.text : DS.colors.textInverse;
}

export function GlassSurface({
  tint = 'light',
  radius = DS.radius.lg,
  padding = DS.spacing.md,
  style,
  children,
  ...props
}: GlassSurfaceProps) {
  const shell: StyleProp<ViewStyle> = [{ borderRadius: radius, padding }, style];

  if (Glass && LIQUID_GLASS_AVAILABLE) {
    return (
      <Glass.GlassView
        glassEffectStyle={tint === 'dark' ? 'clear' : 'regular'}
        isInteractive={false}
        style={[styles.glass, { borderRadius: radius }, shell]}
        {...props}>
        {/*
          A tint over the material, not instead of it. Apple's glass adapts to
          what is behind it, which means it cannot guarantee a contrast ratio on
          its own; this floor keeps the text readable over a white sky or a dark
          field while the refraction still reads as glass.
        */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius },
            tint === 'light' ? styles.floorLight : styles.floorDark,
          ]}
        />
        {children}
      </Glass.GlassView>
    );
  }

  // No material here. A solid surface, not a translucent imitation of one.
  return (
    <View
      style={[styles.solid, tint === 'dark' && styles.solidDark, shell]}
      {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: { overflow: 'hidden' },
  /*
    The floors are the minimum that hold against ANY scene behind the glass,
    measured rather than chosen. 0.55 white puts near-black at 5.31:1 over a
    black backdrop and 17.85 over white. The dark floor needed 0.59, not the
    matching 0.55 — over a bright sky that left white text at 4.23:1.
  */
  floorLight: { backgroundColor: 'rgba(255, 255, 255, 0.55)' },
  floorDark: { backgroundColor: 'rgba(15, 23, 42, 0.59)' },

  solid: {
    backgroundColor: DS.colors.surface,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
  },
  solidDark: {
    backgroundColor: DS.colors.primaryDark,
    borderColor: 'rgba(255,255,255,0.18)',
  },
});
