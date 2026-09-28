/**
 * The hero's two skies, and where white text sits on them.
 *
 * This is a .js module with no imports for the same reason
 * `button-variants.js` is: the contrast checker in `scripts/` has to read the
 * real values. A palette that only exists inside a .tsx component is a palette
 * the guard can only be told about, and being told is how the two drift apart.
 *
 * WHY THE DAY SKY IS DARKER THAN THE CARD IT CAME FROM. The weather card's
 * gradient ran to #A9D2EE, and that was fine there — its only white text sat
 * in the top third. The hero is taller and carries text down to about 56% of
 * the sky, where that gradient measured 2.73:1 for the condition line and
 * 4.38:1 for the location. Same hues, pale end pushed below every piece of
 * text, which the tiles then cover.
 */

/** Gradient stops, deepest first.
 * @type {readonly [string, string, string, string]} */
const DAY_SKY = ['#144A86', '#1D5FA8', '#3E8BD0', '#8FC2E8'];
/** @type {readonly [string, string, string, string]} */
const NIGHT_SKY = ['#1B1A3A', '#2C2B63', '#4B3F8F', '#8C6699'];

/** Where each stop lands, as a fraction of the sky's height.
 * @type {readonly [number, number, number, number]} */
const SKY_LOCATIONS = [0, 0.45, 0.85, 1];

/** The sky's height at the reference width, in points. */
const SKY_HEIGHT = 344;

/**
 * Every piece of text drawn on the sky, with where it sits and the ratio it
 * has to clear.
 *
 * WCAG counts >=24px, or >=18.66px bold, as large text at 3:1; everything else
 * is 4.5:1. The temperature (64 bold) and greeting (20 bold) qualify.
 *
 * `x` is not the element's centre — it is the point on the element that comes
 * NEAREST the glow, because that is where contrast is worst. Checking a centre
 * would pass a label whose last two characters sit in the bright part.
 *
 * @type {ReadonlyArray<{name: string, x: number, y: number, alpha: number, min: number}>}
 */
const SKY_TEXT = [
  { name: 'greeting', x: 290, y: 54, alpha: 1, min: 3 },
  { name: 'location', x: 200, y: 74, alpha: 0.95, min: 4.5 },
  { name: 'location source', x: 250, y: 74, alpha: 0.82, min: 4.5 },
  { name: 'temperature', x: 110, y: 134, alpha: 1, min: 3 },
  { name: 'condition', x: 130, y: 194, alpha: 0.92, min: 4.5 },
  // Not text, but white on the sky and subject to the same wash-out.
  { name: 'bell icon', x: 340, y: 64, alpha: 1, min: 3 },
  { name: 'avatar initials', x: 380, y: 64, alpha: 1, min: 3 },
];

module.exports = { DAY_SKY, NIGHT_SKY, SKY_LOCATIONS, SKY_TEXT, SKY_HEIGHT };

/**
 * The hero's lower half — the search pill and the stat tiles.
 *
 * These sit on their own solid ground rather than on the gradient, so in dark
 * mode they need their own dark values: leaving them on the static
 * `DS.colors.surface` produced a hero whose sky was night and whose bottom
 * third was white. The app's palette is light-only today, so the dark values
 * are stated here rather than read from a theme that does not exist yet.
 *
 * @type {{surface: string, tile: string, tileBorder: string, text: string, muted: string}}
 */
const NIGHT_SURFACES = {
  surface: '#171532',
  tile: '#241F4B',
  tileBorder: '#332C63',
  text: '#F5F3FF',
  muted: '#BFB8E0',
};

module.exports.NIGHT_SURFACES = NIGHT_SURFACES;

/**
 * The glow stacks, and where their centres sit in the hero.
 *
 * Shared because the contrast guard has to composite them. The gradient alone
 * is not what the text sits on — a stack of discs at 84% cumulative alpha over
 * it is — and checking only the gradient is how white type ends up on the
 * bright side of the sun.
 *
 * Uniform alpha per disc is deliberate: varying it along a curve put the
 * largest opacity step on the innermost edge, which drew a visible ring.
 *
 * @type {{count: number, alpha: number, maxSize: number, span: number, curve: number, cx: number, cy: number, rgb: [number, number, number]}}
 */
const SUN_GLOW_SPEC = {
  count: 32, alpha: 0.05, maxSize: 300, span: 272, curve: 0.85,
  cx: 300, cy: 196, rgb: [255, 208, 92],
};

/** @type {{count: number, alpha: number, maxSize: number, span: number, curve: number, cx: number, cy: number, rgb: [number, number, number]}} */
const MOON_GLOW_SPEC = {
  count: 26, alpha: 0.055, maxSize: 200, span: 182, curve: 0.7,
  cx: 300, cy: 196, rgb: [226, 232, 255],
};

/** Hero width the positions above are authored against. */
const HERO_WIDTH = 400;

module.exports.SUN_GLOW_SPEC = SUN_GLOW_SPEC;
module.exports.MOON_GLOW_SPEC = MOON_GLOW_SPEC;
module.exports.HERO_WIDTH = HERO_WIDTH;
