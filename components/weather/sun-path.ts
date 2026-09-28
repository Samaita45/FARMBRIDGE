/**
 * Where the sun is along its arc, from the day's real sunrise and sunset.
 *
 * The card draws a dashed arc with a dot on it. The dot is the one part of that
 * picture that can be wrong, so it is computed from the forecast's own sunrise
 * and sunset rather than from a fixed 6am-to-6pm assumption — Zimbabwe's
 * sunrise moves by about an hour across the year, and a dot that says the sun
 * is overhead at four in the afternoon is worse than no dot.
 */

export interface SunPosition {
  /** 0 at sunrise, 1 at sunset. Clamped, so night sits at one end or the other. */
  progress: number;
  /** True between sunrise and sunset. */
  isUp: boolean;
}

export function sunPosition(sunrise: string, sunset: string, now = new Date()): SunPosition {
  const rise = new Date(sunrise).getTime();
  const set = new Date(sunset).getTime();
  const t = now.getTime();

  // A malformed or missing pair must not produce NaN on screen.
  if (!Number.isFinite(rise) || !Number.isFinite(set) || set <= rise) {
    return { progress: 0.5, isUp: false };
  }

  const raw = (t - rise) / (set - rise);
  return { progress: Math.min(Math.max(raw, 0), 1), isUp: raw >= 0 && raw <= 1 };
}

/**
 * A point on the arc, as percentages of the box it is drawn in.
 *
 * The arc is the top half of an ellipse: at sunrise the sun sits on the left
 * baseline, at midday at the apex, at sunset on the right baseline.
 *
 * PERCENTAGES, NOT POINTS, AND DELIBERATELY SO. The first version of this card
 * measured the arc's container with onLayout and drew a border-radius dome
 * sized from it. The measurement came back wider than the container it was
 * measuring — 424 inside 408 — and the arc rendered as a flat line off the top
 * of its box. Expressed as a fraction of the box, the geometry cannot disagree
 * with the layout, because it never asks the layout anything.
 */
export function pointOnArc(progress: number): { xPercent: number; yPercent: number } {
  const angle = Math.PI * Math.min(Math.max(progress, 0), 1);
  return {
    xPercent: ((1 - Math.cos(angle)) / 2) * 100,
    yPercent: (1 - Math.sin(angle)) * 100,
  };
}
