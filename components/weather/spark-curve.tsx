import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

interface SparkCurveProps {
  /** One value per point. Two or fewer and nothing is drawn. */
  values: number[];
  width: number;
  height: number;
  color?: string;
  thickness?: number;
  /** Points inserted between each pair. Higher is smoother and costs more views. */
  resolution?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A smooth line through a handful of points, drawn without SVG.
 *
 * WHY NOT SVG. react-native-svg would draw this in one path element, and it is
 * also a native module. This project is in the middle of getting a development
 * build produced, and a new native dependency invalidates that build — a real
 * cost today against a convenience.
 *
 * WHAT IT DOES INSTEAD. The points are interpolated with a Catmull-Rom spline
 * into a dense polyline, and each short segment is drawn as a thin view rotated
 * to its own angle. At the default resolution a seven-point series becomes
 * about ninety segments, which is cheap — they are plain views with no state,
 * no measurement and no animation of their own.
 *
 * The rounded caps matter more than they sound: without them each segment ends
 * square and the joins show as nicks along the curve wherever the angle changes
 * quickly.
 */
export function SparkCurve({
  values,
  width,
  height,
  color = 'rgba(255,255,255,0.9)',
  thickness = 2,
  resolution = 14,
  style,
}: SparkCurveProps) {
  if (values.length < 2 || width <= 0 || height <= 0) return null;

  const points = toPoints(values, width, height, resolution);

  return (
    <View style={[{ width, height }, style]} pointerEvents="none">
      {points.slice(0, -1).map((point, i) => {
        const next = points[i + 1];
        if (!next) return null;

        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < 0.01) return null;
        const angle = Math.atan2(dy, dx);

        return (
          <View
            key={i}
            style={[
              styles.segment,
              {
                left: point.x,
                top: point.y - thickness / 2,
                width: length + thickness / 2,
                height: thickness,
                borderRadius: thickness / 2,
                backgroundColor: color,
                transform: [{ rotate: `${angle}rad` }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/**
 * Where a value sits vertically, as a fraction of the box.
 *
 * `pad` keeps the extremes off the very edge so the stroke is never clipped.
 * It was 0.18, which left a week of temperatures occupying under two thirds of
 * the box and reading as almost flat — the difference between a mild night and
 * a frost looked like nothing at all.
 */
export function valueToY(value: number, values: number[], height: number, pad = 0.1): number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat series would divide by zero and put every point at the top.
  const span = max - min || 1;
  const t = (value - min) / span;
  const usable = height * (1 - pad * 2);
  return height - (pad * height + t * usable);
}

function toPoints(
  values: number[],
  width: number,
  height: number,
  resolution: number
): { x: number; y: number }[] {
  const anchors = values.map((value, i) => ({
    x: (i / (values.length - 1)) * width,
    y: valueToY(value, values, height),
  }));

  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < anchors.length - 1; i += 1) {
    // Catmull-Rom needs a point either side; the ends borrow their neighbour.
    const p0 = anchors[i - 1] ?? anchors[i]!;
    const p1 = anchors[i]!;
    const p2 = anchors[i + 1]!;
    const p3 = anchors[i + 2] ?? p2;

    for (let step = 0; step < resolution; step += 1) {
      const t = step / resolution;
      out.push({
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, t),
      });
    }
  }
  out.push(anchors[anchors.length - 1]!);
  return out;
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

const styles = StyleSheet.create({
  // Rotating about the left edge keeps each segment starting exactly where the
  // previous one ended; rotating about the centre would leave gaps.
  segment: { position: 'absolute', transformOrigin: 'left center' },
});
