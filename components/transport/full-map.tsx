import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { locate, Maps } from '@/components/transport/maps';
import { VEHICLE_LABELS } from '@/components/transport/vehicle-icon';
import { DS } from '@/constants/design-system';
import type { AppLocation } from '@/hooks/useLocation';
import type { TransportProvider } from '@/types';

interface FullMapProps {
  centre: AppLocation;
  providers: TransportProvider[];
}

/**
 * The map behind the whole screen, as inDrive has it.
 *
 * PANNABLE, UNLIKE THE CARD VERSION. `NearbyMap` sits inside a scrolling page,
 * so it disables its own gestures to avoid fighting the scroll. This one is the
 * background of a screen whose only other content is a sheet pinned to the
 * bottom, so it can be dragged and zoomed — which is the point of putting a map
 * there rather than a picture of one.
 *
 * Pins still sit on the town each transporter works from, and the caption on
 * the sheet says so. There is no live tracking, and a marker that moved would
 * be inventing one.
 *
 * When react-native-maps is unavailable the screen gets a plain ground rather
 * than a hole: the sheet above it carries everything you actually need.
 */
export function FullMap({ centre, providers }: FullMapProps) {
  const M = Maps;

  if (!M) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.fallback]}>
        <Ionicons name="map-outline" size={30} color={DS.colors.textFaint} />
        <Text style={styles.fallbackText}>Map unavailable on this build</Text>
      </View>
    );
  }

  const pins = providers
    .map((p) => ({ provider: p, point: locate(p.location) }))
    .filter((r): r is { provider: TransportProvider; point: NonNullable<typeof r.point> } =>
      r.point !== null
    );

  return (
    <M.default
      style={StyleSheet.absoluteFill}
      initialRegion={{
        latitude: centre.latitude,
        longitude: centre.longitude,
        latitudeDelta: 3.5,
        longitudeDelta: 3.5,
      }}
      showsCompass={false}
      toolbarEnabled={false}
      accessibilityLabel={`Map of ${pins.length} available transporters around ${centre.label}`}>
      <M.Marker
        coordinate={{ latitude: centre.latitude, longitude: centre.longitude }}
        title="You"
        description={centre.label}
        pinColor={DS.colors.primary}
      />
      {pins.map(({ provider, point }) => (
        <M.Marker
          key={provider.id}
          coordinate={{ latitude: point.latitude, longitude: point.longitude }}
          title={provider.name}
          description={`${VEHICLE_LABELS[provider.vehicleType]} · ${provider.capacity}t · works from ${provider.location}`}
          pinColor={DS.semantic.success.solid}
        />
      ))}
    </M.default>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    backgroundColor: DS.colors.surfaceMuted,
  },
  fallbackText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
