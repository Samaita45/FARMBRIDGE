import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { locate, Maps } from '@/components/transport/maps';
import { VEHICLE_LABELS } from '@/components/transport/vehicle-icon';
import { DS } from '@/constants/design-system';
import type { AppLocation } from '@/hooks/useLocation';
import type { TransportProvider } from '@/types';

interface NearbyMapProps {
  centre: AppLocation;
  providers: TransportProvider[];
  height?: number;
}

/**
 * Where the available transporters are, relative to you.
 *
 * WHAT THE PINS MEAN. Each marker sits on the centre of the town a transporter
 * is based in, because that is the only location the app holds — there is no
 * live vehicle tracking, and a marker that moved would be inventing one. The
 * caption underneath says so. A transporter whose town cannot be resolved is
 * counted in the caption but not pinned, rather than dropped somewhere
 * approximate.
 *
 * If react-native-maps is missing the component renders nothing, so the screen
 * around it simply loses a panel instead of failing.
 */
export function NearbyMap({ centre, providers, height = 200 }: NearbyMapProps) {
  // Held in a local so the null check narrows inside the marker callback too.
  const M = Maps;

  const pinnable = providers.filter((p) => locate(p.location) !== null);

  if (!M) {
    // Saying the map is unavailable beats silently dropping a panel people can
    // see is missing.
    return (
      <View style={styles.wrap}>
        <View style={styles.unavailable}>
          <Ionicons name="map-outline" size={22} color={DS.colors.textSoft} />
          <Text style={styles.unavailableTitle}>Map unavailable on this build</Text>
          <Text style={styles.unavailableText}>
            {pinnable.length} of {providers.length} available transporters work from towns we can
            place. Their names and areas are listed below.
          </Text>
        </View>
      </View>
    );
  }

  const pins = pinnable
    .map((p) => ({ provider: p, point: locate(p.location) }))
    .filter((r): r is { provider: TransportProvider; point: NonNullable<typeof r.point> } =>
      r.point !== null
    );

  return (
    <View style={styles.wrap}>
      <View style={[styles.mapBox, { height }]}>
        <M.default
          style={StyleSheet.absoluteFill}
          // Non-interactive: this sits inside a scrolling page, and a pannable
          // map would fight the scroll gesture.
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          initialRegion={{
            latitude: centre.latitude,
            longitude: centre.longitude,
            latitudeDelta: 4.5,
            longitudeDelta: 4.5,
          }}
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
              description={`${VEHICLE_LABELS[provider.vehicleType]} · ${provider.capacity}t · based in ${provider.location}`}
              pinColor={DS.semantic.success.solid}
            />
          ))}
        </M.default>
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={12} color={DS.colors.textSoft} />
        <Text style={styles.noteText}>
          Pins show the town each transporter works from, not where their vehicle is now.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    overflow: 'hidden',
  },
  mapBox: { width: '100%', backgroundColor: DS.colors.surfaceMuted },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: DS.spacing.sm + 4,
    paddingVertical: DS.spacing.sm,
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.borderLight,
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },

  unavailable: { alignItems: 'center', gap: 4, padding: DS.spacing.md },
  unavailableTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  unavailableText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
