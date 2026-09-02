/**
 * FarmBridge primitive design tokens — the single source of truth.
 *
 * Plain CommonJS on purpose: `tailwind.config.js` requires this file directly,
 * and `constants/design-system.ts` imports it. Neither can drift from the other
 * because there is only one set of values.
 *
 * Design direction: a serious agritech product. Blue and white carry the brand,
 * agricultural green is an accent and never a background wash. Restrained
 * radii, neutral shadows, no gradient as a default surface treatment.
 *
 * Edit values here. Do not add a second palette anywhere else.
 */

// ─── Brand ───────────────────────────────────────────────────────────────────

/**
 * Brand forest green.
 *
 * The written brief specified blue and white. The reference designs the client
 * later supplied use a dark forest green for every primary action, and that
 * decision was confirmed: green wins. It is also the more natural fit — this is
 * an agricultural product, and green reads as agriculture without having to be
 * explained.
 *
 * 600 is the action colour, sampled from the reference. White on it measures
 * 7.7:1, comfortably past AAA, so filled buttons need no special handling.
 */
const forest = {
  50: '#F1F5F1',
  100: '#DDE7DE',
  200: '#BCCDBE',
  300: '#93AC96',
  400: '#6B8A6F',
  500: '#4E6E52',
  600: '#3D5A40',
  700: '#324A35',
  800: '#283B2B',
  900: '#1C2A1E',
};

/**
 * Retained for data visualisation and informational states, not for chrome.
 * The chart palette is colour-vision validated with blue in slot one; moving
 * it would mean re-running that validation for no benefit.
 */
const blue = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',
  600: '#2563EB', // primary
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
};

const green = {
  50: '#F0FDF4',
  100: '#DCFCE7',
  200: '#BBF7D0',
  500: '#22C55E',
  600: '#16A34A', // accent
  700: '#15803D',
  800: '#166534',
};

/** Slate. The neutral is blue-biased so it sits with the brand rather than against it. */
const gray = {
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
};

// ─── Colour roles ────────────────────────────────────────────────────────────

const colors = {
  primary: forest[600],
  primaryDark: forest[700],
  primaryLight: forest[400],
  primaryBg: forest[50],
  primaryMid: forest[100],

  // A brighter, more saturated green than the brand forest, so "organic",
  // "in season" and "available" badges stay distinguishable from a primary
  // action rather than reading as the same thing.
  accent: green[600],
  accentLight: green[100],
  accentDark: green[700],

  background: gray[50],
  surface: '#FFFFFF',
  surfaceMuted: gray[100],
  surfaceSunken: gray[100],

  // Text. Every value below passes 4.5:1 on `surface` and on `background`.
  // `textFaint` is the exception and is for non-text use only — icons that
  // repeat an adjacent label, dividers, disabled affordances.
  text: gray[900],
  textMuted: gray[600],
  textSoft: gray[500],
  textFaint: gray[400],
  textInverse: '#FFFFFF',

  border: gray[200],
  borderLight: gray[100],
  borderStrong: gray[300],
  // The outline of an interactive control. WCAG 1.4.11 wants 3:1 against the
  // surface behind it when the outline is what tells you a control is there;
  // none of the grey ramp reaches that on white, so this sits between 400 and
  // 500. Use it for input and search field borders, not for card edges — a
  // card is not a control, and its hairline is allowed to be quiet.
  borderControl: '#7E8B9C',

  overlay: 'rgba(15, 23, 42, 0.45)',

  // Retained for the few places a translucent surface genuinely helps. Not a
  // default: prefer `surface` with a border.
  surfaceGlass: 'rgba(255, 255, 255, 0.72)',
  surfaceGlassBorder: 'rgba(255, 255, 255, 0.85)',

  // Data-visualisation and category accents. Not brand colours — use only to
  // distinguish series or categories, never for chrome.
  orange: '#EA580C',
  purple: '#7C3AED',
  teal: '#0D9488',

  // State shorthands. `semantic` below is richer (it pairs a foreground with a
  // surface); these exist because screens already reference them directly.
  success: green[600],
  warning: '#D97706',
  danger: '#DC2626',
  red: '#DC2626',

  forest,
  blue,
  green,
  gray,
};

/**
 * Semantic states. Each carries a foreground that passes contrast on its own
 * background, so alert surfaces stop being assembled from ad-hoc hex literals.
 */
const semantic = {
  success: { fg: green[800], bg: green[50], border: green[200], solid: green[600] },
  warning: { fg: '#92400E', bg: '#FFFBEB', border: '#FDE68A', solid: '#D97706' },
  danger: { fg: '#991B1B', bg: '#FEF2F2', border: '#FECACA', solid: '#DC2626' },
  // Informational stays blue: it must not be mistaken for a primary action now
  // that actions are green.
  info: { fg: blue[800], bg: blue[50], border: blue[200], solid: blue[600] },
  neutral: { fg: gray[700], bg: gray[100], border: gray[200], solid: gray[500] },
};

/**
 * Chart colours.
 *
 * `categorical` is capped at three on purpose. It was five, and the set failed
 * colour-vision checks badly: orange against green measured ΔE 4.8 under
 * protanopia, and purple against blue ΔE 0.4 under deuteranopia — literally the
 * same colour to those readers. Checked across every pair rather than only
 * adjacent ones, three is the largest set that passes, because any two series
 * in a filterable chart can end up side by side.
 *
 * Verified with the dataviz validator on the light surface: lightness band,
 * chroma floor, CVD separation, normal-vision floor and 3:1 contrast all pass.
 * Re-run it before changing a value; do not eyeball this.
 *
 * A chart needing more than three series should facet into small multiples
 * rather than reach for a fourth hue.
 */
const chart = {
  categorical: ['#2563EB', '#EA580C', '#0D9488'],
  maxCategorical: 3,
  /** Single hue, light to dark, for magnitude. */
  sequential: ['#DBEAFE', '#93C5FD', '#3B82F6', '#2563EB', '#1E40AF'],
  /** Recessive chrome — the data should be the only thing with weight. */
  grid: gray[200],
  axis: gray[400],
  /** The unfilled portion of a bar track. */
  track: gray[100],
};

// ─── Geometry ────────────────────────────────────────────────────────────────

/** 4-point grid. */
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Restrained. The previous scale ran 12–30px, which read as consumer-app
 * bubbly; production fintech and agritech surfaces sit nearer 8–16.
 */
const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

/**
 * Neutral and quiet. The previous `elevated` cast a blue shadow at 24px, which
 * is a glow rather than an elevation cue.
 */
const shadow = {
  soft: {
    shadowColor: gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowColor: gray[900],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
};

// ─── Type ────────────────────────────────────────────────────────────────────

/**
 * Weight is carried by the family, not by `fontWeight` — setting both makes
 * Android synthesise a second bold on top of an already-bold face.
 */
const fontFamily = {
  display: 'Fraunces_700Bold',
  regular: 'PlusJakartaSans_400Regular',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

const typography = {
  display: { fontSize: 28, lineHeight: 34, fontFamily: fontFamily.display },
  h1: { fontSize: 24, lineHeight: 30, fontFamily: fontFamily.display },
  h2: { fontSize: 20, lineHeight: 26, fontFamily: fontFamily.bold },
  h3: { fontSize: 17, lineHeight: 24, fontFamily: fontFamily.semibold },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fontFamily.regular },
  bodySm: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.regular },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.regular },
  label: { fontSize: 11, lineHeight: 14, fontFamily: fontFamily.semibold },
  button: { fontSize: 16, lineHeight: 22, fontFamily: fontFamily.semibold },
};

// ─── Motion ──────────────────────────────────────────────────────────────────

const motion = {
  fast: 150,
  normal: 240,
  slow: 380,
  spring: { damping: 18, stiffness: 180 },
};

// ─── Layout ──────────────────────────────────────────────────────────────────

const layout = {
  /** Minimum touch target. Below this, controls fail accessibility guidance. */
  touchTarget: 48,
  /** Caps text growth so fixed-height rows survive the largest OS font setting. */
  maxFontScale: 1.4,
  screenPadding: 16,
  hairline: 1,
};

module.exports = {
  colors,
  semantic,
  chart,
  spacing,
  radius,
  shadow,
  fontFamily,
  typography,
  motion,
  layout,
};
