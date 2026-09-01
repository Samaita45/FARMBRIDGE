# FarmBridge Design System

## Where the values live

`constants/design-tokens.js` is the single source of truth. It is plain
CommonJS because two consumers read it:

- `constants/design-system.ts` — the typed `DS` object every screen should use
- `tailwind.config.js` — so NativeWind classes resolve to the same palette

There is no second palette. Do not add one.

```ts
import { DS } from '@/constants/design-system';
```

## Token groups

| Group | Contents |
|-------|----------|
| `DS.colors` | Brand (blue), accent (green), neutrals (slate), text roles, borders, surfaces |
| `DS.semantic` | `success` · `warning` · `danger` · `info` · `neutral`, each with `fg` / `bg` / `border` / `solid` |
| `DS.spacing` | `xs 4` · `sm 8` · `md 16` · `lg 24` · `xl 32` · `xxl 48` |
| `DS.radius` | `xs 4` · `sm 6` · `md 8` · `lg 12` · `xl 16` · `xxl 20` · `full` |
| `DS.shadow` | `soft` · `card` · `elevated` — all neutral |
| `DS.typography` | `display` · `h1` · `h2` · `h3` · `body` · `bodySm` · `caption` · `label` · `button` |
| `DS.fontFamily` | `display` · `regular` · `semibold` · `bold` |
| `DS.motion` | `fast 150` · `normal 240` · `slow 380` · `spring` |
| `DS.layout` | `touchTarget 48` · `maxFontScale 1.4` · `screenPadding 16` · `hairline` |

## Design direction

Blue and white carry the brand; agricultural green is an accent, never a
background wash. Gradients, blur and glass are not default treatments — a
surface is `DS.colors.surface` with a `DS.colors.border` hairline unless there
is a specific reason otherwise.

Three rules that came out of the audit:

1. **Weight comes from the font family, not `fontWeight`.** Setting both makes
   Android synthesise a second bold over an already-bold face.
2. **Shadows are neutral.** A coloured shadow is a glow, not an elevation cue.
3. **`textFaint` is not for text.** It fails contrast on white. Use it for
   dividers, disabled affordances, and icons that repeat an adjacent label.

## Semantic colour

Alert and status surfaces come from `DS.semantic`, not ad-hoc hex:

```ts
const s = StyleSheet.create({
  alert: {
    backgroundColor: DS.semantic.warning.bg,
    borderColor: DS.semantic.warning.border,
    borderWidth: 1,
  },
  alertText: { color: DS.semantic.warning.fg },
});
```

Each role's `fg` passes 4.5:1 on its own `bg`.

## Components

| Component | Notes |
|-----------|-------|
| `Button` | `primary` · `secondary` · `outline` · `ghost` · `danger` · `success`; sizes `sm` 40 / `md` 48 / `lg` 54; loading, disabled, icon, press animation that respects reduced motion |
| `IconButton` | Icon-only. Requires `accessibilityLabel` — an icon alone announces nothing. `hitSlop` keeps the target at 48. |
| `Input` | Label, error, hint, leading/trailing icons, focus and error styling, wired to assistive tech |
| `Card` | `outlined` (default) · `flat` · `raised`. A hairline border reads as structure; a shadow on every card reads as noise. |
| `LoadingState` `ErrorState` `OfflineState` `EmptyState` | The four states every feature owes the user |

Text inside these caps at `DS.layout.maxFontScale`, so fixed-height rows
survive the largest OS font setting.

## Deprecated aliases

These still resolve, but every value now comes from `DS`. They are deleted once
the screen sweep removes the last import:

| File | Replacement |
|------|-------------|
| `constants/colors.ts` (`Colors`) | `DS.colors` |
| `constants/Typography.ts` | `DS.typography` |
| `constants/Spacing.ts` | `DS.spacing` / `DS.radius` / `DS.shadow` |
| `constants/theme.ts` (`Spacing`, `BorderRadius`, `Shadows`, `Typography`) | `DS.*` |
| `constants/premium-home.ts` (`Premium`) | `DS` |

`constants/theme.ts` still owns the light/dark map for `useThemeColor`. The dark
palette is a placeholder — FarmBridge ships light-only, and a real dark theme
needs its own contrast pass rather than an inversion.

## Status

- [x] One token source, read by both TypeScript and Tailwind
- [x] Radii reduced from 12–30 to 4–20
- [x] Neutral shadows; blue glow removed
- [x] Muted text raised to pass 4.5:1
- [x] Semantic colour roles defined
- [x] Shared component layer: `Button`, `IconButton`, `Input`, `Card`,
      `LoadingState`, `ErrorState`, `OfflineState`, `EmptyState`
- [x] 19 superseded and template-residue components deleted
- [ ] `ScreenHeader` — consolidates `ModuleHeader` / `TabScreenHeader` /
      `ProfileScreenHeader`; deferred to the sweep, where the call sites move
- [ ] Screen sweep: replace 99 inline button styles and ~300 hex literals
- [ ] Delete the deprecated aliases
