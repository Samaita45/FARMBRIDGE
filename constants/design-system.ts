/**
 * FarmBridge — unified design system (single source of truth).
 * Fintech/agritech tokens: Revolut × Stripe × Google Weather.
 */
export const DS = {
  colors: {
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#60A5FA',
    primaryBg: '#EFF6FF',
    primaryMid: '#DBEAFE',

    accent: '#16A34A',
    accentLight: '#DCFCE7',
    accentDark: '#15803D',

    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceGlass: 'rgba(255,255,255,0.72)',
    surfaceGlassBorder: 'rgba(255,255,255,0.85)',
    surfaceMuted: '#F1F5F9',

    text: '#0F172A',
    textMuted: '#64748B',
    textSoft: '#94A3B8',
    textInverse: '#FFFFFF',

    orange: '#F97316',
    purple: '#8B5CF6',
    red: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',

    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    overlay: 'rgba(15,23,42,0.45)',

    gray: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  radius: {
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    xxl: 30,
    full: 9999,
  },

  typography: {
    display: { fontSize: 28, lineHeight: 34, fontFamily: 'Fraunces_700Bold' as const },
    h1: { fontSize: 24, lineHeight: 30, fontFamily: 'Fraunces_700Bold' as const },
    h2: { fontSize: 20, lineHeight: 26, fontFamily: 'PlusJakartaSans_700Bold' as const },
    h3: { fontSize: 17, lineHeight: 24, fontFamily: 'PlusJakartaSans_600SemiBold' as const },
    body: { fontSize: 16, lineHeight: 24, fontFamily: 'PlusJakartaSans_400Regular' as const },
    bodySm: { fontSize: 14, lineHeight: 20, fontFamily: 'PlusJakartaSans_400Regular' as const },
    caption: { fontSize: 12, lineHeight: 16, fontFamily: 'PlusJakartaSans_400Regular' as const },
    label: { fontSize: 11, lineHeight: 14, fontFamily: 'PlusJakartaSans_600SemiBold' as const },
    button: { fontSize: 16, lineHeight: 22, fontFamily: 'PlusJakartaSans_600SemiBold' as const },
  },

  shadow: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 6,
    },
    elevated: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 10,
    },
    soft: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
  },

  animation: {
    fast: 150,
    normal: 280,
    slow: 420,
    spring: { damping: 18, stiffness: 180 },
  },
} as const;

/** @deprecated Use DS — kept for gradual migration */
export const Premium = {
  primary: DS.colors.primary,
  primaryBg: DS.colors.primaryBg,
  primaryDark: DS.colors.primaryDark,
  primaryLight: DS.colors.primaryLight,
  green: DS.colors.accent,
  greenLight: DS.colors.accentLight,
  background: DS.colors.background,
  surface: DS.colors.surface,
  surfaceGlass: DS.colors.surfaceGlass,
  surfaceGlassBorder: DS.colors.surfaceGlassBorder,
  text: DS.colors.text,
  textMuted: DS.colors.textMuted,
  textSoft: DS.colors.textSoft,
  orange: DS.colors.orange,
  purple: DS.colors.purple,
  red: DS.colors.red,
  cream: '#FFFBEB',
  creamBorder: '#FDE68A',
  radiusXl: 30,
  radiusLg: DS.radius.xl,
  radiusMd: DS.radius.lg,
  radiusSm: DS.radius.md,
  shadow: DS.shadow.elevated,
  shadowSoft: DS.shadow.card,
} as const;
