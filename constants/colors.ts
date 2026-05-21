/**
 * FarmBridge Design System — Color Tokens
 *
 * Primary palette: Royal Blue (#2563EB) — unified with design-system.ts
 * Accent: Green (#16a34a) — agriculture identity kept as a highlight
 */
const Colors = {
  // ─── Primary Blue ─────────────────────────────────
  primary:      '#2563EB',
  primaryDark:  '#1D4ED8',
  primaryLight: '#60A5FA',
  primaryBg:    '#F8FAFC',
  primaryMid:   '#DBEAFE',

  // ─── Accent Green (agriculture identity) ──────────
  accent:       '#16a34a',   // green — crop badges, success, FAB, tags
  accentLight:  '#dcfce7',   // light green — success backgrounds

  // ─── Neutrals ─────────────────────────────────────
  white:        '#ffffff',
  black:        '#000000',
  inputBg:      '#f8fafc',   // off-white input background
  inputBorder:  '#e2e8f0',   // subtle border
  placeholder:  '#94a3b8',   // placeholder text
  textPrimary:  '#0f172a',   // main body text (near-black)
  textSecondary:'#64748b',   // secondary / hint text
  textLight:    '#ffffff',   // text on dark/coloured backgrounds

  // ─── Status ───────────────────────────────────────
  error:        '#ef4444',
  success:      '#22c55e',
  warning:      '#f59e0b',

  // ─── Overlay ──────────────────────────────────────
  overlay:      'rgba(0,0,0,0.45)',

  // ─── Legacy aliases (keep nativewind + older components working) ─
  surface:      '#F8FAFC',
  dark:         '#0F172A',
  secondary:    '#1D4ED8',

  // ─── Gray scale (Tailwind Slate) ──────────────────
  gray: {
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
} as const;

export default Colors;
export { Colors };
export type ColorKey = keyof typeof Colors;
