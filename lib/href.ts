import type { Href } from 'expo-router';

/** Routes not covered by generated typed routes, or dynamic segments. */
export function asHref(path: string | Record<string, unknown>): Href {
  return path as Href;
}
