import { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Maps } from '@/components/transport/maps';
import { DS } from '@/constants/design-system';
import type { AppLocation } from '@/hooks/useLocation';

interface MapCamera {
  animateToRegion: (
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    },
    duration?: number
  ) => void;
}

interface FullMapProps {
  centre: AppLocation;
  /** Bump this to fly the camera back to `centre`. `initialRegion` alone never moves. */
  focusKey?: number;
}

class MapErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('Transport map failed to render', error.message, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return <View style={styles.fallback} />;
    }
    return this.props.children;
  }
}

/**
 * The map in the top half of the transport hub.
 *
 * It must live in a bounded box above the sheet, not as a full-screen native
 * surface behind the controls. Google's MapView draws above every React view
 * regardless of z-index, which is why this tab was a blank rectangle: the map
 * loaded with no tiles and covered the menu, the sheet, and every button.
 */
export function FullMap({ centre, focusKey = 0 }: FullMapProps) {
  const M = Maps;
  /*
    Held as MapCamera because only `animateToRegion` is used. MapView's own ref
    type no longer overlaps a narrower interface in this version, so the cast
    happens where the ref is attached rather than by widening this to `any`.
  */
  const mapRef = useRef<MapCamera | null>(null);

  const region = {
    latitude: centre.latitude,
    longitude: centre.longitude,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  useEffect(() => {
    if (focusKey === 0) return;
    mapRef.current?.animateToRegion(region, 450);
  }, [focusKey, region.latitude, region.longitude]);

  if (!M) {
    return <View style={styles.fallback} />;
  }

  return (
    <MapErrorBoundary>
      <View style={styles.wrap}>
        {/*
          The ref is attached through a callback so the narrow MapCamera view of
          MapView does not have to satisfy MapView's own ref type. Only
          `animateToRegion` is ever called on it.
        */}
        <M.default
          ref={(node) => {
            mapRef.current = (node as unknown as MapCamera) ?? null;
          }}
          style={styles.map}
          initialRegion={region}
          showsUserLocation
          showsCompass={false}
          showsPointsOfInterests={false}
          toolbarEnabled={false}
          accessibilityLabel={`Map around ${centre.label}`}
        />
      </View>
    </MapErrorBoundary>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { flex: 1 },
  fallback: {
    flex: 1,
    backgroundColor: DS.colors.surfaceMuted,
  },
});
