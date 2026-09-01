/**
 * The app uses one icon set. Typing icon names against it means a typo is a
 * compile error rather than a silently missing glyph.
 */
export type IconName = keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
