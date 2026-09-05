import { Ionicons } from '@expo/vector-icons';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Maps, regionForPoints } from '@/components/transport/maps';
import { DS } from '@/constants/design-system';
import type { GeoPoint } from '@/types/geo';

export type MapMarkerKind = 'pickup' | 'destination' | 'transporter' | 'user';

export interface FarmMapMarker extends GeoPoint {
  id: string;
  kind: MapMarkerKind;
  title?: string;
  description?: string;
}

export type FarmMapState = 'ready' | 'loading' | 'unavailable' | 'error';

export interface FarmMapProps {
  centre: GeoPoint;
  markers?: FarmMapMarker[];
  /** Road or straight-line path. */
  route?: GeoPoint[];
  showsUserLocation?: boolean;
  interactive?: boolean;
  height?: number;
  state?: FarmMapState;
  onRecentre?: () => void;
  /** Bump to rebuild the camera on the current centre. */
  focusKey?: number;
  accessibilityLabel?: string;
  children?: ReactNode;
}

const MARKER_COLOR: Record<MapMarkerKind, string> = {
  pickup: DS.colors.primary,
  destination: DS.semantic.success.solid,
  transporter: DS.colors.accent,
  user: DS.colors.primaryDark,
};

class MapErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('FarmMap failed', error.message, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Map unavailable</Text>
          <Text style={styles.fallbackText}>The map could not be drawn on this build.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

/**
 * The one map surface the app should use.
 *
 * Existing transport maps (hub, route preview, nearby) stay in place. New
 * screens, and screens we migrate, import this instead of opening MapView
 * themselves — marker colours, empty states and the defensive loader live
 * here once.
 *
 * Needs a development or production native build with the Maps SDK keys in
 * app.config.js. Expo Go is not assumed to show tiles.
 */
export function FarmMap({
  centre,
  markers = [],
  route,
  showsUserLocation = true,
  interactive = true,
  height,
  state = 'ready',
  onRecentre,
  focusKey = 0,
  accessibilityLabel,
  children,
}: FarmMapProps) {
  if (state === 'loading') {
    return (
      <View style={[styles.fallback, height ? { height } : styles.flex]}>
        <ActivityIndicator color={DS.colors.primary} />
        <Text style={styles.fallbackText}>Finding your location</Text>
      </View>
    );
  }

  if (state === 'unavailable') {
    return (
      <View style={[styles.fallback, height ? { height } : styles.flex]}>
        <Text style={styles.fallbackTitle}>Location unavailable</Text>
        <Text style={styles.fallbackText}>
          Turn on location services, or pick a town from the list.
        </Text>
      </View>
    );
  }

  if (state === 'error' || !Maps) {
    return (
      <View style={[styles.fallback, height ? { height } : styles.flex]}>
        <Text style={styles.fallbackTitle}>Map unavailable</Text>
        <Text style={styles.fallbackText}>
          Maps need a FarmBridge development or production build with Google Maps
          configured. Town names still work without the map.
        </Text>
      </View>
    );
  }

  const M = Maps;
  const box = height ? { height } : styles.flex;
  const fit = [centre, ...markers, ...(route ?? [])];
  const unique = new Set(fit.map((p) => `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`));
  const region =
    unique.size <= 1
      ? {
          latitude: centre.latitude,
          longitude: centre.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }
      : regionForPoints(fit);

  return (
    <View style={[styles.wrap, box]}>
      <MapErrorBoundary>
        <M.default
          key={`farm-map-${focusKey}`}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showsUserLocation={showsUserLocation}
          showsCompass={false}
          showsPointsOfInterests={false}
          toolbarEnabled={false}
          scrollEnabled={interactive}
          zoomEnabled={interactive}
          rotateEnabled={false}
          pitchEnabled={false}
          accessibilityLabel={accessibilityLabel ?? 'Map'}>
          <>
            {markers.map((marker) => (
              <M.Marker
                key={marker.id}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                title={marker.title}
                description={marker.description}
                pinColor={MARKER_COLOR[marker.kind]}
              />
            ))}
            {route && route.length >= 2 ? (
              <M.Polyline
                coordinates={route.map((p) => ({
                  latitude: p.latitude,
                  longitude: p.longitude,
                }))}
                strokeColor={DS.colors.primary}
                strokeWidth={3}
              />
            ) : null}
            {children}
          </>
        </M.default>
      </MapErrorBoundary>
      {onRecentre ? (
        <Pressable
          onPress={onRecentre}
          accessibilityRole="button"
          accessibilityLabel="Recentre map"
          style={({ pressed }) => [styles.control, pressed && styles.controlPressed]}>
          <Ionicons name="locate-outline" size={18} color={DS.colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: DS.colors.surfaceMuted, overflow: 'hidden' },
  flex: { flex: 1 },
  fallback: {
    flex: 1,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.surfaceMuted,
  },
  fallbackTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  fallbackText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  control: {
    position: 'absolute',
    right: DS.spacing.sm,
    bottom: DS.spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
  },
  controlPressed: { opacity: 0.85 },
});
