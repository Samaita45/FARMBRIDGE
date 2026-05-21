# FarmBridge Design System

## Tokens (`constants/design-system.ts`)

| Token | Value |
|-------|--------|
| Primary | `#2563EB` |
| Accent | `#16A34A` |
| Background | `#F8FAFC` |
| Radius (cards) | `22–28px` |

Import: `import { DS } from '@/constants/design-system'`

Legacy alias: `Premium` (re-exported from same file)

## Components (`components/design-system/`)

- **AppText** — typography variants
- **GlassCard** — elevated surfaces, optional iOS blur
- **AnimatedPressable** — Moti scale + haptics
- **FadeInView** — staggered entrance
- **EmptyState** — consistent empty UX
- **SectionHeader** — module section titles
- **ModuleHeader** — gradient screen headers

## Screen shell

Use `Screen` from `@/components/ui/screen` with `DS.colors.background`.

## Animations

- **Moti** — micro-interactions (`AnimatedPressable`, `FadeInView`)
- **Reanimated** — skeletons, toasts, charts

## Data layer (current)

The app is **local-first** (SQLite + AsyncStorage + Zustand). Firebase/Firestore is not wired yet.

Planned adapter: `services/data/` when backend is added.

## Migration checklist

- [x] Phase 2: Market, Community, Profile tabs → `TabScreenHeader`, `GlassCard`, `ChipTabs`
- [ ] Replace remaining hardcoded colors in transport / financials / crop-management
- [ ] Migrate NativeWind screens to `Screen` + `GlassCard`
- [ ] Consolidate `primary-button` → `Button`
- [ ] Add Firebase auth/sync behind `services/data/`
