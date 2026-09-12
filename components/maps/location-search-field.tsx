import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { matchPlace, PlaceField } from '@/components/forms/place-field';
import { mapsApi, newSessionToken, type PlaceSuggestion } from '@/services/api/maps.api';
import { DS } from '@/constants/design-system';
import { useLocation } from '@/hooks/useLocation';
import type { PlaceRole, ResolvedPlace } from '@/types/geo';

interface LocationSearchFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onResolved?: (place: ResolvedPlace | null) => void;
  role?: PlaceRole;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  /** Offer the device GPS as a one-tap fill. */
  allowCurrentLocation?: boolean;
}

/**
 * Town search with optional Places autocomplete.
 *
 * Gazetteer suggestions stay first and work offline. When the API is on,
 * Google Places results follow — fetched through Nest, never with a client
 * key. Typing is debounced so each keystroke does not become a billable call.
 */
export function LocationSearchField({
  label,
  value,
  onChangeText,
  onResolved,
  role,
  placeholder,
  required,
  error,
  hint,
  allowCurrentLocation,
}: LocationSearchFieldProps) {
  const { location, permission, refresh } = useLocation();
  const [remote, setRemote] = useState<PlaceSuggestion[]>([]);
  /*
    THE AUTOCOMPLETE SESSION.

    Google prices autocomplete two ways: per request, or — when every request
    shares a token and a Place Details call closes the session with that same
    token — as one session regardless of how many keystrokes it took. This field
    debounces, so a single address is still four to eight requests; getting the
    session right is the difference between paying for all of them and paying
    for one.

    A UUID, not a timestamp: two fields mounting in the same millisecond would
    otherwise share a token and merge two unrelated searches into one session.

    It is a ref rather than state because changing it must not re-render — and
    it rotates on `newSession()` after each selection, because a token is spent
    once the details call has closed its session.
  */
  const session = useRef(newSessionToken());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const local = useMemo(() => matchPlace(value), [value]);
  const lastResolved = useRef('');

  useEffect(() => {
    const address = value.trim();
    if (local) {
      lastResolved.current = address;
      onResolved?.({
        latitude: local.latitude,
        longitude: local.longitude,
        address,
        source: 'gazetteer',
        role,
      });
      return;
    }
    if (address !== lastResolved.current) {
      onResolved?.(null);
    }
    // Intentionally not depending on onResolved: parents pass inline closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local?.name, value, role]);

  /*
    Whether suggestions should show is derived below rather than cleared here.
    Clearing state in an effect body is what the React Compiler rejects, and
    deriving it is better anyway: a stale list cannot outlive the keystroke that
    invalidated it, because it is never shown for a query that does not want it.
  */
  const wantsRemote = value.trim().length >= 3 && !local;
  const suggestions = wantsRemote ? remote : [];

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const query = value.trim();
    if (!wantsRemote) return;
    timer.current = setTimeout(() => {
      void mapsApi.autocomplete(query, session.current).then(setRemote);
    }, 380);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, local, wantsRemote]);

  /*
    Named as a handler, not a hook. It was `useCurrent`, which the linter reads
    as a custom hook being called inside a Pressable's onPress — a rules-of-hooks
    violation — and which misleads anyone reading it into thinking there is a
    hook here. It is an ordinary async function.
  */
  const applyCurrentLocation = async () => {
    await refresh();
    const address = location.label;
    lastResolved.current = address;
    onChangeText(address);
    onResolved?.({
      latitude: location.latitude,
      longitude: location.longitude,
      address,
      source: 'gps',
      role,
    });
  };

  const pickRemote = async (item: PlaceSuggestion) => {
    const details = await mapsApi.placeDetails(item.placeId, session.current);
    // Spent: this token has closed its session and must not be reused.
    session.current = newSessionToken();
    const line = details?.address ?? `${item.primaryText}, ${item.secondaryText}`;
    lastResolved.current = line;
    onChangeText(line);
    if (details) onResolved?.({ ...details, role });
    setRemote([]);
  };

  return (
    <View style={styles.wrap}>
      <PlaceField
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        required={required}
        error={error}
        hint={hint}
      />

      {allowCurrentLocation && permission !== 'denied' ? (
        <Pressable
          onPress={() => void applyCurrentLocation()}
          accessibilityRole="button"
          accessibilityLabel="Use my current location"
          style={({ pressed }) => [styles.current, pressed && styles.pressed]}>
          <Ionicons name="navigate-outline" size={16} color={DS.colors.primary} />
          <Text style={styles.currentText}>Use current location</Text>
        </Pressable>
      ) : null}

      {suggestions.length > 0 ? (
        <View style={styles.remote}>
          {suggestions.map((item) => (
            <Pressable
              key={item.placeId}
              onPress={() => void pickRemote(item)}
              accessibilityRole="button"
              accessibilityLabel={item.primaryText}
              style={({ pressed }) => [styles.remoteRow, pressed && styles.pressed]}>
              <Ionicons name="location-outline" size={16} color={DS.colors.textSoft} />
              <View style={styles.remoteText}>
                <Text style={styles.remotePrimary} numberOfLines={1}>
                  {item.primaryText}
                </Text>
                {item.secondaryText ? (
                  <Text style={styles.remoteSecondary} numberOfLines={1}>
                    {item.secondaryText}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  pressed: { opacity: 0.85 },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 2,
  },
  currentText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },
  remote: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    overflow: 'hidden',
  },
  remoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  remoteText: { flex: 1, gap: 1 },
  remotePrimary: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  remoteSecondary: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
