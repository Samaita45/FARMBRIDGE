import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import type { Tokens } from '@/constants/design-system';
import { useTheme } from '@/contexts/theme';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Turns a stylesheet into one that follows the colour scheme.
 *
 * WHY THE FACTORY ARGUMENT IS CALLED `DS`. Every stylesheet in this app was
 * written against a module-level `import { DS }`. Naming the parameter `DS`
 * shadows that import inside the factory, so converting a file is one line at
 * the top and one at the bottom — the hundreds of `DS.colors.x` references in
 * between are untouched, and a conversion that rewrites nothing cannot
 * mistranslate anything.
 *
 *   const useStyles = makeStyles((DS) => ({
 *     card: { backgroundColor: DS.colors.surface },
 *   }));
 *
 *   function Card() {
 *     const s = useStyles();
 *     ...
 *   }
 *
 * Each scheme's sheet is built once, on first use, and kept — `StyleSheet.create`
 * is not free and a screen that rebuilt its sheet every render would pay for it
 * on every keystroke.
 */
export function makeStyles<T extends NamedStyles<T>>(factory: (tokens: Tokens) => T) {
  const cache = new Map<string, T>();

  return function useStyles(): T {
    const { scheme, tokens } = useTheme();
    return useMemo(() => {
      const hit = cache.get(scheme);
      if (hit) return hit;
      const sheet = StyleSheet.create(factory(tokens));
      cache.set(scheme, sheet);
      return sheet;
      // `factory` is module-scope and never changes; the sheet depends only on
      // which scheme is active.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scheme]);
  };
}
