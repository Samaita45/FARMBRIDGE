/**
 * The sky, as a gradient that follows the sun.
 *
 * WHY THIS IS A GRADIENT WHEN THE APP HAS NONE. Every decorative gradient was
 * stripped out of FarmBridge, and that still holds: a gradient behind a title
 * bar or a card is chrome pretending to be depth, and it puts text on a
 * background whose contrast changes across its own width. This one is not
 * chrome. It is a picture of the sky at the hour you are looking at it, which
 * is the subject of the panel it sits behind — the same reason the crop cards
 * carry photographs of crops.
 *
 * IT IS DRIVEN BY THE REAL SUN. The phase comes from the sunrise and sunset the
 * weather service reports for the user's own coordinates, not from a hardcoded
 * six-o'clock. Zimbabwe's sunrise moves by roughly an hour across the year, and
 * a farmer at dawn in June should not be shown a midday sky.
 *
 * EVERY PHASE CARRIES ITS OWN FOREGROUND, AND IT PASSES AT EVERY STOP. `onSky`
 * is measured against all three colours of its own gradient, not the average,
 * because a band that is legible in the middle and not at the top is the exact
 * failure the old gradient headers had. Daylight phases take near-black; night
 * and dusk take white.
 *
 * That constraint set the colours rather than the other way round. Dawn, day
 * and afternoon all began with a deep blue at the top which put near-black at
 * 1.70, 4.28 and 3.52 to one. Each top stop was lifted by the smallest blend
 * toward white that clears 4.6 — which is also what the sky actually does, the
 * cool blue sitting above the warm horizon rather than beside it.
 *
 * Nothing here should be read as a weather condition. It is the time of day.
 * Cloud and rain are reported by the icon and the words beside it.
 */

export type SkyPhase = 'night' | 'dawn' | 'morning' | 'day' | 'afternoon' | 'dusk';

export interface Sky {
  phase: SkyPhase;
  /** Top-to-bottom gradient stops. */
  colors: readonly [string, string, string];
  /** Text and icon colour, proven against the lightest stop above. */
  onSky: string;
  /** A short description, for the screen reader and for anyone who wants it named. */
  label: string;
}

const NEAR_BLACK = '#0B1220';
const WHITE = '#FFFFFF';

export const SKIES: Record<SkyPhase, Sky> = {
  // Deep blue through to the horizon glow of a town at night.
  night: {
    phase: 'night',
    colors: ['#0B1F3A', '#12305A', '#1E3A63'],
    onSky: WHITE,
    label: 'Night',
  },
  // The short, strong orange before the sun clears the horizon.
  dawn: {
    phase: 'dawn',
    colors: ['#757F9C', '#BD6746', '#E8A87C'],
    onSky: NEAR_BLACK,
    label: 'Dawn',
  },
  // Clear, pale, climbing.
  morning: {
    phase: 'morning',
    colors: ['#4A90D9', '#7FB5E5', '#BEDCF2'],
    onSky: NEAR_BLACK,
    label: 'Morning',
  },
  // Overhead sun, the brightest the band ever gets.
  day: {
    phase: 'day',
    colors: ['#3883C7', '#69ABDE', '#AFD5EF'],
    onSky: NEAR_BLACK,
    label: 'Daytime',
  },
  // Warming, lower, longer shadows.
  afternoon: {
    phase: 'afternoon',
    colors: ['#5682B2', '#8AA9C9', '#DDBF9A'],
    onSky: NEAR_BLACK,
    label: 'Afternoon',
  },
  // The sun on the horizon, going.
  dusk: {
    phase: 'dusk',
    colors: ['#1C2A4A', '#4A3A63', '#8A4A52'],
    onSky: WHITE,
    label: 'Dusk',
  },
};

/**
 * Which sky it is, from the actual sunrise and sunset for this place.
 *
 * The two transitional phases are anchored to the sun rather than to the clock:
 * dawn runs from 45 minutes before sunrise to 45 minutes after it, dusk the
 * same around sunset. What is left is split into morning, day and afternoon by
 * position through the daylight hours, so a long December day and a short June
 * one both get a full arc rather than June being called "afternoon" from two
 * o'clock.
 */
export function skyFor(now: Date, sunriseIso?: string, sunsetIso?: string): Sky {
  const sunrise = parseLocal(sunriseIso);
  const sunset = parseLocal(sunsetIso);

  // Without sun times there is nothing better than the hour.
  if (!sunrise || !sunset) return SKIES[hourPhase(now.getHours())];

  const t = now.getTime();
  const up = sunrise.getTime();
  const down = sunset.getTime();
  const EDGE = 45 * 60 * 1000;

  if (t < up - EDGE || t > down + EDGE) return SKIES.night;
  if (t <= up + EDGE) return SKIES.dawn;
  if (t >= down - EDGE) return SKIES.dusk;

  // Position through the daylight hours, 0 at sunrise and 1 at sunset.
  const through = (t - up) / Math.max(1, down - up);
  if (through < 0.35) return SKIES.morning;
  if (through < 0.65) return SKIES.day;
  return SKIES.afternoon;
}

/** Open-meteo returns local time with no zone suffix; Date parses that as local. */
function parseLocal(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function hourPhase(hour: number): SkyPhase {
  if (hour < 5 || hour >= 19) return 'night';
  if (hour < 7) return 'dawn';
  if (hour < 10) return 'morning';
  if (hour < 15) return 'day';
  if (hour < 17.5) return 'afternoon';
  return 'dusk';
}

/**
 * A colour for a temperature, for the range bars in the forecast.
 *
 * The scale runs cool blue to warm orange across the band Zimbabwe actually
 * sees — roughly 5°C on a June night on the highveld to 40°C in the Zambezi
 * valley in October. Anything outside is clamped to the ends rather than
 * wrapping to a colour that means something else.
 *
 * BLUE TO ORANGE ON PURPOSE. It is the one warm/cool pair that survives every
 * common form of colour blindness, which red/green does not. The bar is never
 * the only signal in any case: the low and the high are printed either side of
 * it, and the bar is there to make the days comparable at a glance rather than
 * to be read on its own.
 */
const TEMP_SCALE: { at: number; color: string }[] = [
  { at: 5, color: '#2563EB' },
  { at: 14, color: '#38BDF8' },
  { at: 20, color: '#5EEAD4' },
  { at: 26, color: '#FACC15' },
  { at: 32, color: '#F97316' },
  { at: 40, color: '#DC2626' },
];

export function tempColor(celsius: number): string {
  const t = Number.isFinite(celsius) ? celsius : 20;
  if (t <= TEMP_SCALE[0].at) return TEMP_SCALE[0].color;
  const last = TEMP_SCALE[TEMP_SCALE.length - 1];
  if (t >= last.at) return last.color;

  for (let i = 0; i < TEMP_SCALE.length - 1; i++) {
    const a = TEMP_SCALE[i];
    const b = TEMP_SCALE[i + 1];
    if (t >= a.at && t <= b.at) {
      return mix(a.color, b.color, (t - a.at) / (b.at - a.at));
    }
  }
  return last.color;
}

function mix(from: string, to: string, ratio: number): string {
  const a = rgb(from);
  const b = rgb(to);
  const out = a.map((v, i) => Math.round(v + (b[i] - v) * ratio));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function rgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
