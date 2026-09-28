/**
 * Asserts both palettes on every pair the app actually forms.
 *
 * A dark palette is easy to write and easy to get wrong in ways that only show
 * up on a phone at night. This checks the light palette too, because the two
 * are edited together and a guard that only watches one of them will be
 * satisfied while the other rots.
 *
 *   npm run test:palette
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const light = require('../constants/design-tokens.js');
const { darkColors, darkSemantic } = require('../constants/dark-palette.js');

const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
function luminance(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let failures = 0;
function check(scheme, label, fg, bg, min) {
  const r = contrast(fg, bg);
  const pass = r >= min;
  if (!pass) failures += 1;
  if (!pass || process.env.VERBOSE) {
    console.log(`  ${label.padEnd(44)} ${r.toFixed(2).padStart(6)}:1  need ${String(min).padEnd(4)} ${pass ? 'pass' : 'FAIL'}`);
  }
  return pass;
}

/** Every ground a screen actually puts text on. */
const GROUNDS = ['background', 'surface', 'surfaceMuted', 'surfaceSunken'];

for (const [scheme, colors, semantic] of [
  ['light', light.colors, light.semantic],
  ['dark', darkColors, darkSemantic],
]) {
  console.log(`\n── ${scheme} ──`);
  const before = failures;

  // Body text on every ground.
  for (const ground of GROUNDS) {
    for (const role of ['text', 'textMuted', 'textSoft']) {
      check(scheme, `${role} on ${ground}`, colors[role], colors[ground], 4.5);
    }
    // The brand green is used as a link and as an icon beside a label.
    check(scheme, `primary on ${ground}`, colors.primary, colors[ground], 4.5);
    check(scheme, `accentText on ${ground}`, colors.accentText, colors[ground], 4.5);
    // 1.4.11: a control's outline must be findable.
    check(scheme, `borderControl on ${ground}`, colors.borderControl, colors[ground], 3);
  }

  // Foregrounds on fills. textInverse is the pair for primary, which is why it
  // is near-black in the dark scheme and white in the light one.
  check(scheme, 'textInverse on primary', colors.textInverse, colors.primary, 4.5);
  check(scheme, 'textInverse on primaryDark', colors.textInverse, colors.primaryDark, 4.5);
  check(scheme, 'accentOn on accent', colors.accentOn, colors.accent, 4.5);

  // Semantic states, quiet and loud.
  for (const state of Object.keys(semantic)) {
    const s = semantic[state];
    check(scheme, `${state}.fg on ${state}.bg`, s.fg, s.bg, 4.5);
    check(scheme, `${state}.onSolid on ${state}.solid`, s.onSolid, s.solid, 4.5);
    check(scheme, `${state}.fg on surface`, s.fg, colors.surface, 4.5);
  }

  /*
    The state shorthands are fills — a dot, a bar, a chart mark — and two of
    them are deliberately too bright to read as text: success measures 3.30:1
    on surface and warning 3.19:1. Requiring them to pass as text would force
    both darker and take the life out of every fill that uses them. The real
    contract is that text takes semantic.<state>.fg, so that is what gets
    asserted, below, against the source rather than against the palette.
  */
  for (const role of ['success', 'warning', 'danger']) {
    const r = contrast(colors[role], colors.surface);
    if (r >= 4.5) check(scheme, `${role} also safe as text`, colors[role], colors.surface, 4.5);
  }

  console.log(`  ${failures === before ? 'all pairs pass' : `${failures - before} failing`}`);
}

/*
  The contract the palette cannot enforce by itself: a fill must not be used as
  a text colour. This caught DS.colors.success and DS.colors.warning standing
  in as label colours at 3.30:1 and 3.19:1 in the crop-health diagnosis card.
*/
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FILL_ONLY = ['success', 'warning'];
const roots = ['app', 'components'];
const offenders = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.tsx?$/.test(p)) continue;
    const src = readFileSync(p, 'utf8');
    src.split(/\r?\n/).forEach((line, i) => {
      for (const role of FILL_ONLY) {
        // `color:` in a style object, or a `color={}` prop on an icon.
        const re = new RegExp('color(:\\s*|=\\{)DS\\.colors\\.' + role + '\\b');
        if (re.test(line)) offenders.push(`${p}:${i + 1}  ${line.trim()}`);
      }
    });
  }
}
for (const r of roots) walk(new URL('../' + r, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

console.log('\n── fills used as text ──');
if (offenders.length) {
  failures += offenders.length;
  for (const o of offenders) console.log('  FAIL ' + o);
  console.log('  take semantic.<state>.fg for text; the shorthands are fills');
} else {
  console.log('  none — text takes semantic.<state>.fg');
}

console.log(failures === 0 ? '\nALL PALETTE CHECKS PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
