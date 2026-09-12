import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { FarmMap } from '@/components/maps/farm-map';
import { locate } from '@/components/transport/maps';
import { DS } from '@/constants/design-system';
import { decodePolyline } from '@/lib/polyline';
import type { GeoPoint } from '@/types/geo';

/**
 * Route preview for the existing transport screens.
 *
 * Screens keep importing this component. Coordinates and a road polyline are
 * optional: when they are missing the gazetteer still places the pins, and a
 * dashed bearing is drawn instead of a road. A marker is never invented.
 */

interface RouteMapProps {
  pickup: string;
  destination: string;
  pickupCoord?: GeoPoint | null;
  destinationCoord?: GeoPoint | null;
  routePolyline?: string | null;
  distanceKm?: number;
  durationSeconds?: number | null;
  height?: number;
}

export function RouteMap({
  pickup,
  destination,
  pickupCoord,
  destinationCoord,
  routePolyline,
  distanceKm,
  durationSeconds,
  height = 180,
}: RouteMapProps) {
  const fromGazetteer = locate(pickup);
  const toGazetteer = locate(destination);
  const from = pickupCoord ?? (fromGazetteer
    ? { latitude: fromGazetteer.latitude, longitude: fromGazetteer.longitude }
    : null);
  const to = destinationCoord ?? (toGazetteer
    ? { latitude: toGazetteer.latitude, longitude: toGazetteer.longitude }
    : null);

  const road = routePolyline ? decodePolyline(routePolyline) : [];
  const canDraw = from !== null && to !== null;
  const isRoad = road.length >= 2;
  const eta = formatDuration(durationSeconds);

  return (
    <View style={styles.wrap}>
      {canDraw && from && to ? (
        <FarmMap
          centre={{
            latitude: (from.latitude + to.latitude) / 2,
            longitude: (from.longitude + to.longitude) / 2,
          }}
          markers={[
            {
              id: 'pickup',
              kind: 'pickup',
              latitude: from.latitude,
              longitude: from.longitude,
              title: 'Pickup',
              description: pickup,
            },
            {
              id: 'destination',
              kind: 'destination',
              latitude: to.latitude,
              longitude: to.longitude,
              title: 'Destination',
              description: destination,
            },
          ]}
          route={isRoad ? road : [from, to]}
          showsUserLocation={false}
          interactive={false}
          height={height}
          accessibilityLabel={`Route map from ${pickup} to ${destination}`}
        />
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
          {distanceKm ? (
            <Text style={styles.distance}>
              ~{distanceKm} km{eta ? ` · ${eta}` : ''}
            </Text>
          ) : null}
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
          {!canDraw
            ? 'Enter a town or pick a place to see the route on a map.'
            : isRoad
              ? 'Road route from the server. Times are estimates.'
              : 'Straight-line preview between known points, not a road route.'}
        </Text>
      </View>
    </View>
  );
}

function formatDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours <= 0) return `about ${minutes} min`;
  if (minutes === 0) return `about ${hours} h`;
  return `about ${hours} h ${minutes} min`;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    overflow: 'hidden',
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
