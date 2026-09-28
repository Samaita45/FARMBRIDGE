/**
 * The dark palette — the same token names as the light one, different values.
 *
 * WHY A SECOND PALETTE AND NOT AN INVERSION. Flipping lightness produces grey
 * text on grey grounds and a brand green that turns to mud. Each value here is
 * chosen for the ground it sits on, and `scripts/palette-check.mjs` asserts
 * every pair the app actually forms — so this file cannot quietly drift into
 * something unreadable.
 *
 * THE GROUND IS NOT BLACK. Pure black against white type maximises contrast
 * and is tiring to read at night, which is exactly when this palette is used.
 * The grounds carry a faint forest bias so the app still looks like itself.
 *
 * FILLS INVERT THEIR FOREGROUND. On light, `primary` is a dark green carrying
 * white text. On dark it is a pale green carrying dark text, so `textInverse`
 * here is near-black rather than white. Anything that hardcodes '#FFFFFF' on
 * a primary fill will be wrong in this scheme — take `textInverse`.
 */
const { forest, blue, green, orange, gray } = require('./design-tokens.js').colors;

const darkColors = {
  // Pale enough to read as text on the dark grounds, and to carry dark text
  // when used as a fill.
  primary: forest[300],
  primaryDark: forest[200],
  primaryLight: forest[400],
  // Tinted grounds rather than the neutral surface, for the same "this is ours"
  // job `primaryBg` does on light.
  primaryBg: '#1A2A1D',
  primaryMid: '#243629',

  accent: orange[400],
  // Text that sits ON the accent fill. The accent is bright in this scheme, so
  // its foreground is near-black here exactly as it is on light.
  accentOn: gray[900],
  accentText: orange[400],
  accentBg: '#2C1E12',
  accentBorder: '#4C3119',

  background: '#0E1512',
  surface: '#161E1A',
  surfaceMuted: '#1F2924',
  surfaceSunken: '#0A100D',

  text: '#EAF0EC',
  textMuted: '#B6C4BB',
  textSoft: '#94A79B',
  // Non-text only, as on light: icons repeating an adjacent label, dividers,
  // disabled affordances.
  textFaint: '#6F8177',
  // The foreground for a light fill — primary, accent, or any pale surface.
  textInverse: '#0E1512',

  border: '#2B372F',
  // #222D27 measured 1.19:1 against surface — a card edge nobody could see.
  borderLight: '#2E3B33',
  borderStrong: '#3D4C42',
  // 3:1 against `surface`, for the outline that tells you a control is there.
  borderControl: '#7F9285',

  overlay: 'rgba(0, 0, 0, 0.62)',
  surfaceGlass: 'rgba(22, 30, 26, 0.72)',
  surfaceGlassBorder: 'rgba(255, 255, 255, 0.14)',

  // Data-visualisation accents, lifted so they read on a dark ground.
  purple: '#A78BFA',
  teal: '#2DD4BF',

  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  red: '#F87171',

  forest,
  blue,
  green,
  orange,
  gray,
};

/**
 * Semantic states, dark.
 *
 * `fg` is the state as text on `bg`; `solid` is the loud treatment and
 * `onSolid` the text that goes on it. As on light, `onSolid` is not always
 * white — every `solid` here is a bright tint, so all four take near-black.
 * A warning nobody can read is worse than no warning.
 */
const darkSemantic = {
  success: { fg: '#6EE7A0', bg: '#122318', border: '#1E3D28', solid: '#4ADE80', onSolid: '#052E16' },
  warning: { fg: '#FCD34D', bg: '#2A2110', border: '#4A3A18', solid: '#FBBF24', onSolid: '#2A1A02' },
  danger: { fg: '#FCA5A5', bg: '#2A1516', border: '#4C2224', solid: '#F87171', onSolid: '#2E0A0A' },
  info: { fg: '#93C5FD', bg: '#111E2E', border: '#1E3454', solid: '#60A5FA', onSolid: '#06203F' },
  neutral: { fg: '#B6C4BB', bg: '#1F2924', border: '#3D4C42', solid: '#94A79B', onSolid: '#0E1512' },
};

module.exports = { darkColors, darkSemantic };
