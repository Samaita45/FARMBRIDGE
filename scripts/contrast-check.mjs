/**
 * Every control must be visible on the surface it sits on.
 *
 * WHY THIS EXISTS. A sign-in button was reported as invisible three times. The
 * label was always fine — the *edge* was not: `outline` drew its boundary in
 * `colors.border`, a divider colour measuring 1.23:1 against white, and
 * `secondary` was a pale mint fill at 1.27:1 that was never stroked at all.
 * Reading the code caught none of it, because nothing in the code looks wrong.
 * Only the numbers show it.
 *
 * WCAG 2.2 asks for 4.5:1 on body text and 3:1 on the boundary of a user
 * interface component. This asserts both, for every button variant, against the
 * surfaces the app actually puts them on.
 *
 * It imports the same table the component renders from, rather than keeping its
 * own copy — a checker that can drift from the thing it checks is worse than no
 * checker, because it reports success either way.
 *
 * Run: npm run test:contrast
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const tokens = require('../constants/design-tokens');
const { BUTTON_VARIANTS } = require('../constants/button-variants');

const { colors } = tokens;

let failures = 0;

function check(label, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

function luminance(hex) {
  const parts = hex.replace('#', '').match(/../g);
  if (!parts) throw new Error(`Not a hex colour: ${hex}`);
  const [r, g, b] = parts
    .map((p) => parseInt(p, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The grounds a button is placed on in this app. */
const SURFACES = {
  'white card': colors.surface,
  'app background': colors.background,
};

const TEXT_MIN = 4.5;
const CONTROL_MIN = 3;

for (const [name, variant] of Object.entries(BUTTON_VARIANTS)) {
  // Its ground is a photograph rather than a token, so there is nothing here to
  // measure it against. It carries its own scrim for exactly that reason.
  if (variant.overPhotography) {
    check(`${name} is exempt: it sits on photography`, true);
    continue;
  }

  const filled = variant.background !== 'transparent';

  for (const [surfaceName, surface] of Object.entries(SURFACES)) {
    // The label is read against the button's own fill, or against the surface
    // when the button has none.
    const behind = filled ? variant.background : surface;
    const r = ratio(variant.foreground, behind);
    check(`${name} label on ${surfaceName}`, r >= TEXT_MIN, `${r.toFixed(2)}:1`);
  }

  /*
    A stroke is the edge wherever there is one, whether or not the button is
    filled — that is the entire point of stroking a pale fill like `secondary`,
    whose mint measures 1.27:1 and needs the border to have any visible extent.
    Failing that, a filled button is its own edge, and an unstroked unfilled one
    has none.

    Getting this the wrong way round is what the first draft of this file did:
    it measured secondary's fill, reported a failure, and would have had me
    darken a fill that was never the problem.
  */
  const edge = variant.stroked ? variant.border : filled ? variant.background : null;

  if (!edge) {
    check(
      `${name} has no edge by design`,
      name === 'ghost',
      name === 'ghost' ? 'text action, held to the text threshold' : 'nothing marks its extent'
    );
    continue;
  }

  for (const [surfaceName, surface] of Object.entries(SURFACES)) {
    const r = ratio(edge, surface);
    check(`${name} edge on ${surfaceName}`, r >= CONTROL_MIN, `${r.toFixed(2)}:1`);
  }
}

/*
  The tokens most often reached for when something needs an outline. `border`
  and its lighter siblings are dividers — they are allowed to be faint, and this
  records which of them must never be used as a control boundary.
*/
console.log('');
for (const name of ['border', 'borderLight', 'borderStrong', 'borderControl']) {
  const r = ratio(colors[name], colors.surface);
  console.log(
    `      ${name.padEnd(14)} ${colors[name]}  ${r.toFixed(2).padStart(5)}:1  ${
      r >= CONTROL_MIN ? 'usable as a control edge' : 'divider only'
    }`
  );
}
check(
  'borderControl is still strong enough to outline a control',
  ratio(colors.borderControl, colors.surface) >= CONTROL_MIN,
  `${ratio(colors.borderControl, colors.surface).toFixed(2)}:1`
);

console.log('');
if (failures > 0) {
  console.log(`${failures} CHECK(S) FAILED`);
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
