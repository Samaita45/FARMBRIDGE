import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { locate, Maps, regionFor } from '@/components/transport/maps';
import { DS } from '@/constants/design-system';

/**
 * A map of the trip's route.
 *
 * WHAT IT CAN AND CANNOT DO. Pickup and destination are free text, and there is
 * no geocoder, so a location is placed only when its text matches a known
 * province or provincial capital. When it does not, the map is not drawn at all
 * rather than dropping a pin somewhere plausible — a marker in the wrong place
 * is worse than no marker on a screen about moving goods.
 *
 * The straight line between two points is a bearing, not a road route, and the
 * caption says so. Turn-by-turn routing needs a directions API.
 *
 * The native module is loaded defensively in `./maps`: if react-native-maps is
 * unavailable the component renders the same route summary without the map, so
 * a missing dependency can never take the screen down.
 */

interface RouteMapProps {
  pickup: string;
  destination: string;
  distanceKm?: number;
  height?: number;
}

export function RouteMap({ pickup, destination, distanceKm, height = 180 }: RouteMapProps) {
  const from = locate(pickup);
  const to = locate(destination);
  const canDrawMap = Maps !== null && from !== null && to !== null;

  return (
    <View style={styles.wrap}>
      {canDrawMap && Maps ? (
        <View style={[styles.mapBox, { height }]}>
          <Maps.default
            style={StyleSheet.absoluteFill}
            // Non-interactive: this is a route preview inside a scrolling form,
            // and a pannable map would fight the scroll gesture.
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
            initialRegion={regionFor(from!, to!)}
            accessibilityLabel={`Route map from ${from!.label} to ${to!.label}`}>
            <Maps.Marker
              coordinate={{ latitude: from!.latitude, longitude: from!.longitude }}
              title="Pickup"
              description={pickup}
              pinColor={DS.colors.primary}
            />
            <Maps.Marker
              coordinate={{ latitude: to!.latitude, longitude: to!.longitude }}
              title="Destination"
              description={destination}
              pinColor={DS.semantic.success.solid}
            />
            <Maps.Polyline
              coordinates={[
                { latitude: from!.latitude, longitude: from!.longitude },
                { latitude: to!.latitude, longitude: to!.longitude },
              ]}
              strokeColor={DS.colors.primary}
              strokeWidth={3}
              lineDashPattern={[6, 6]}
            />
          </Maps.default>
        </View>
      ) : null}

      <View style={styles.summary}>
        <View style={styles.leg}>
          <View style={[styles.dot, { backgroundColor: DS.colors.primary }]} />
          <Text style={styles.legText} numberOfLines={1}>
            {pickup || 'Pickup not set'}
          </Text>
        </View>

        <View style={styles.connector}>
          <View style={styles.connectorLine} />
          {distanceKm ? <Text style={styles.distance}>~{distanceKm} km</Text> : null}
          <View style={styles.connectorLine} />
        </View>

        <View style={styles.leg}>
          <View style={[styles.dot, { backgroundColor: DS.semantic.success.solid }]} />
          <Text style={styles.legText} numberOfLines={1}>
            {destination || 'Destination not set'}
          </Text>
        </View>
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={12} color={DS.colors.textSoft} />
        <Text style={styles.noteText}>
          {canDrawMap
            ? 'Straight-line preview between town centres, not a road route.'
            : 'Enter a town or province to see the route on a map.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    overflow: 'hidden',
  },
  mapBox: {
    width: '100%',
    backgroundColor: DS.colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.border,
  },

  summary: { padding: DS.spacing.sm + 4, gap: 4 },
  leg: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legText: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  connector: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm, marginLeft: 4 },
  connectorLine: {
    width: 1,
    height: 10,
    backgroundColor: DS.colors.border,
    marginLeft: 4,
  },
  distance: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: DS.spacing.sm + 4,
    paddingBottom: DS.spacing.sm + 4,
  },
  noteText: {
    flex: 1,
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
});
