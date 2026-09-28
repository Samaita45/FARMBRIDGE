/**
 * Asserts the home hero's text clears WCAG on what is actually behind it.
 *
 * TWO THINGS ARE BEHIND IT, not one. There is the gradient, and there is a
 * stack of glow discs on top of the gradient reaching about 80% cumulative
 * alpha at its core. Checking only the gradient passed a greeting that sat on
 * the bright side of the sun — the numbers said 8:1 and the screen showed
 * white on pale yellow.
 *
 * Everything is read from `constants/sky-gradients.js`, so moving a glow or
 * restyling a sky without re-checking fails here rather than on a phone.
 *
 *   npm run test:hero
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  DAY_SKY,
  NIGHT_SKY,
  SKY_LOCATIONS,
  SKY_TEXT,
  SKY_HEIGHT,
  SUN_GLOW_SPEC,
  MOON_GLOW_SPEC,
} = require('../constants/sky-gradients.js');
const tokens = require('../constants/design-tokens.js');
const { darkColors } = require('../constants/dark-palette.js');

const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const parse = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const luminance = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrastRgb = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const contrast = (a, b) => contrastRgb(parse(a), parse(b));
const composite = (fg, alpha, bg) => bg.map((c, i) => fg[i] * alpha + c * (1 - alpha));

/** The gradient's colour at fraction `t` down the sky. */
function skyAt(stops, t) {
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (t >= SKY_LOCATIONS[i] && t <= SKY_LOCATIONS[i + 1]) {
      const span = SKY_LOCATIONS[i + 1] - SKY_LOCATIONS[i] || 1;
      const f = (t - SKY_LOCATIONS[i]) / span;
      const a = parse(stops[i]);
      const b = parse(stops[i + 1]);
      return a.map((c, k) => c + (b[k] - c) * f);
    }
  }
  return parse(stops[stops.length - 1]);
}

/**
 * How much glow covers a point, as a single alpha.
 *
 * Each disc that contains the point contributes independently, so `n` discs of
 * alpha `a` compound to 1-(1-a)^n rather than summing. The component builds its
 * sizes with the same curve, so counting discs here counts the same discs.
 */
function glowAlphaAt(spec, x, y) {
  const dist = Math.hypot(x - spec.cx, y - spec.cy);
  let covering = 0;
  for (let i = 0; i < spec.count; i += 1) {
    const t = i / (spec.count - 1);
    const size = Math.round(spec.maxSize - spec.span * t ** spec.curve);
    if (dist <= size / 2) covering += 1;
  }
  return 1 - (1 - spec.alpha) ** covering;
}

let failures = 0;
function report(label, ratio, min, note = '') {
  const pass = ratio >= min;
  if (!pass) failures += 1;
  console.log(
    `  ${label.padEnd(38)} ${ratio.toFixed(2).padStart(6)}:1  need ${String(min).padEnd(4)} ${pass ? 'pass' : 'FAIL'}${note}`
  );
}

for (const [scheme, stops, glow] of [
  ['day', DAY_SKY, SUN_GLOW_SPEC],
  ['night', NIGHT_SKY, MOON_GLOW_SPEC],
]) {
  console.log(`\n${scheme} sky  ${stops.join(' -> ')}  glow at (${glow.cx},${glow.cy})`);
  for (const { name, x, y, alpha, min } of SKY_TEXT) {
    const gradient = skyAt(stops, Math.min(y / SKY_HEIGHT, 1));
    const ga = glowAlphaAt(glow, x, y);
    const ground = ga > 0 ? composite(glow.rgb, ga, gradient) : gradient;
    const fg = composite([255, 255, 255], alpha, ground);
    report(
      `${name} @ (${x},${y})`,
      contrastRgb(fg, ground),
      min,
      ga > 0 ? `  [glow ${(ga * 100).toFixed(0)}%]` : ''
    );
  }
}

/*
  The tiles and the search pill sit on solid ground in both schemes — that is
  why the pale foot of the day sky never has to hold text.
*/
const c = tokens.colors;
console.log('\ntiles and search, light scheme');
report('tile value on surfaceMuted', contrast(c.text, c.surfaceMuted), 4.5);
report('tile label on surfaceMuted', contrast(c.textMuted, c.surfaceMuted), 4.5);
report('search text on surface', contrast(c.textSoft, c.surface), 4.5);

/*
  The hero used to state its own dark grounds, because there was no dark
  palette to read. There is one now and the hero reads it like everything else,
  so this checks the palette the hero actually renders with.
*/
const d = darkColors;
console.log('\ntiles and search, dark scheme');
report('tile value on surfaceMuted', contrast(d.text, d.surfaceMuted), 4.5);
report('tile label on surfaceMuted', contrast(d.textMuted, d.surfaceMuted), 4.5);
report('search text on surface', contrast(d.textSoft, d.surface), 4.5);
report('tile edge on surface', contrast(d.borderLight, d.surface), 1.2);

console.log('\nfoot of each sky (no text may land here)');
console.log(`  day   ${DAY_SKY[3]}  white would be ${contrast('#FFFFFF', DAY_SKY[3]).toFixed(2)}:1`);
console.log(`  night ${NIGHT_SKY[3]}  white would be ${contrast('#FFFFFF', NIGHT_SKY[3]).toFixed(2)}:1`);

console.log(failures === 0 ? '\nALL HERO CONTRAST CHECKS PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
