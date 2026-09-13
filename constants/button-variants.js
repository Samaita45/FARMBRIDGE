const tokens = require('./design-tokens');

const { colors, semantic } = tokens;

/**
 * What each button variant is painted with.
 *
 * This is plain JavaScript, and it lives outside the component, for one reason:
 * `scripts/contrast-check.mjs` has to measure the same values the app renders.
 * A checker with its own copy of this table is worse than no checker — it keeps
 * passing while the component drifts away from it.
 *
 * `stroked` is part of the data rather than a detail of the render, because a
 * border colour on a variant that never draws one is invisible on screen and
 * would still measure fine. A filled variant is its own edge; an unfilled one
 * has an edge only if it is stroked.
 */
const BUTTON_VARIANTS = {
  primary: {
    background: colors.primary,
    border: colors.primary,
    foreground: colors.textInverse,
    pressedBackground: colors.primaryDark,
    stroked: false,
  },
  /*
    A pale mint fill measures about 1.27:1 against white, so this one is drawn
    with an edge. Without it the button had no visible extent at all — only its
    label, floating on the card.
  */
  secondary: {
    background: colors.primaryMid,
    border: colors.forest[400],
    foreground: colors.primaryDark,
    pressedBackground: colors.blue[200],
    stroked: true,
  },
  /*
    `borderControl`, not `border`. The latter is a divider colour at 1.23:1
    against white and was what made this variant read as text rather than as a
    button. Input has used borderControl for its own edge all along; the two had
    simply drifted apart.
  */
  outline: {
    background: 'transparent',
    border: colors.borderControl,
    foreground: colors.text,
    pressedBackground: colors.surfaceMuted,
    stroked: true,
  },
  /** A text action. No box by design, so it is held to the text threshold. */
  ghost: {
    background: 'transparent',
    border: 'transparent',
    foreground: colors.primary,
    pressedBackground: colors.primaryBg,
    stroked: false,
  },
  danger: {
    background: semantic.danger.solid,
    border: semantic.danger.solid,
    foreground: semantic.danger.onSolid,
    pressedBackground: semantic.danger.fg,
    stroked: false,
  },
  success: {
    background: semantic.success.solid,
    border: semantic.success.solid,
    foreground: semantic.success.onSolid,
    pressedBackground: semantic.success.fg,
    stroked: false,
  },
  /**
   * For controls placed over photography, where neither a light nor a dark
   * token can be relied on to contrast with whatever is behind them. A dark
   * scrim disc with a white glyph reads on any image.
   *
   * Exempt from the contrast checks: its ground is a photograph, not a token,
   * so there is no surface to measure it against.
   */
  onImage: {
    background: 'rgba(15, 23, 42, 0.55)',
    border: 'rgba(255, 255, 255, 0.35)',
    foreground: colors.textInverse,
    pressedBackground: 'rgba(15, 23, 42, 0.75)',
    stroked: true,
    overPhotography: true,
  },
};

module.exports = { BUTTON_VARIANTS };
