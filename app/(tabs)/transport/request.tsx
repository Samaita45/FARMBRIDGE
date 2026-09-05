import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input } from '@/components/design-system';
import { matchPlace } from '@/components/forms/place-field';
import { PriceField } from '@/components/transport/price-field';
import { RouteFields } from '@/components/transport/route-fields';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { useLocation } from '@/hooks/useLocation';
import { asHref } from '@/lib/href';
import { TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { mapsApi } from '@/services/api/maps.api';
import { estimateDistanceKm, estimateDistanceKmFromCoords, estimatePrice } from '@/services/transportDb';
import { useTransportStore, type TransportState } from '@/stores/transportStore';
import type { ResolvedPlace, RouteEstimate } from '@/types/geo';
import {
  GOODS_CATEGORIES,
  SPECIAL_REQUIREMENTS,
  type GoodsCategory,
} from '@/types/transport';

/**
 * The order: where, for how much, and what is being moved.
 *
 * This is what inDrive's "Where to & for how much?" opens onto, and it is the
 * only screen in the flow that asks for anything. Route and price sit at the
 * top because they are the two things a farmer beside a loaded bakkie already
 * knows; the load details follow, because a transporter cannot agree to two
 * tonnes of tomatoes without being told it is two tonnes of tomatoes.
 *
 * Pickup and destination now go through a field that knows Zimbabwean towns,
 * because everything after this screen depends on resolving them: the route
 * map, the distance, and every quoted price. When they do not resolve the
 * screen says so instead of quietly handing on a fabricated number.
 *
 * It also used to `return` silently when a required field was empty, so the
 * button appeared broken. Errors are now shown against the fields.
 */
export default function TransportRequestScreen() {
  const { location } = useLocation();
  const { showToast } = useToast();
  // Tapping a recent destination on the hub arrives with it already filled in.
  const { to } = useLocalSearchParams<{ to?: string }>();

  const setRequest = useTransportStore((s: TransportState) => s.setRequest);
  const setOffer = useTransportStore((s: TransportState) => s.setOffer);
  const storedOffer = useTransportStore((s: TransportState) => s.offeredPriceUSD);

  const [pickup, setPickup] = useState(location.label);
  const [destination, setDestination] = useState(to ?? '');
  const [pickupPlace, setPickupPlace] = useState<ResolvedPlace | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<ResolvedPlace | null>(null);
  const [routeEstimate, setRouteEstimate] = useState<RouteEstimate | null>(null);
  const [price, setPrice] = useState<number | null>(storedOffer);
  const [note, setNote] = useState('');
  const [goods, setGoods] = useState('');
  const [weight, setWeight] = useState('500');
  const [category, setCategory] = useState<GoodsCategory>('Fresh Produce');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('08:00');
  const [loads, setLoads] = useState('1');
  const [special, setSpecial] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!pickupPlace || !destinationPlace) {
      setRouteEstimate(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void mapsApi.route(pickupPlace, destinationPlace).then((route) => {
        if (!cancelled) setRouteEstimate(route);
      });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pickupPlace, destinationPlace]);

  const distanceKm = useMemo(() => {
    if (routeEstimate) return routeEstimate.distanceKm;
    if (pickupPlace && destinationPlace) {
      return estimateDistanceKmFromCoords(pickupPlace, destinationPlace);
    }
    return estimateDistanceKm(pickup, destination);
  }, [routeEstimate, pickupPlace, destinationPlace, pickup, destination]);

  /*
    The mean of what the available transporters would charge for this distance
    at their own published rates. Arithmetic on numbers already in the app, not
    a figure tuned to move the offer one way or the other.
  */
  const suggested = useMemo(() => {
    if (distanceKm === null) return null;
    const free = TRANSPORT_PROVIDERS.filter((p) => p.isAvailable);
    if (free.length === 0) return null;
    return Math.round(
      free.reduce((sum, p) => sum + estimatePrice(p, distanceKm), 0) / free.length
    );
  }, [distanceKm]);

  const errors = {
    pickup: !pickup.trim()
      ? 'Where is the load now?'
      : pickupPlace || matchPlace(pickup)
        ? undefined
        : 'Include a town we know, or pick a place from the list',
    destination: !destination.trim()
      ? 'Where is it going?'
      : destinationPlace || matchPlace(destination)
        ? undefined
        : 'Include a town we know, or pick a place from the list',
    goods: goods.trim() ? undefined : 'Say what is being moved',
    weight: Number(weight) > 0 ? undefined : 'Enter a weight in kilograms',
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? undefined : 'Use the format YYYY-MM-DD',
    price: price !== null && price > 0 ? undefined : 'Name a price',
  };
  const valid = Object.values(errors).every((e) => !e);

  const toggleSpecial = (req: string) => {
    setSpecial((prev) => (prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]));
  };

  const onContinue = () => {
    setTouched(true);
    if (!valid || distanceKm === null || price === null) {
      showToast('Fill in the highlighted fields', 'warning');
      return;
    }

    setRequest(
      {
        pickup: pickup.trim(),
        destination: destination.trim(),
        pickupLat: pickupPlace?.latitude,
        pickupLng: pickupPlace?.longitude,
        destinationLat: destinationPlace?.latitude,
        destinationLng: destinationPlace?.longitude,
        durationSeconds: routeEstimate?.durationSeconds,
        routePolyline: routeEstimate?.polyline,
        goodsDescription: goods.trim(),
        weightKg: Number(weight),
        category,
        preferredDate: date,
        preferredTime: time,
        loads: parseInt(loads, 10) || 1,
        specialRequirements: special,
      },
      distanceKm
    );
    setOffer(price, note.trim());
    router.push(asHref('/(tabs)/transport/providers'));
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.step}>Step 1 of 3 · Your order</Text>

          <RouteFields
            pickup={pickup}
            destination={destination}
            onPickupChange={setPickup}
            onDestinationChange={setDestination}
            onPickupResolved={setPickupPlace}
            onDestinationResolved={setDestinationPlace}
            pickupError={touched ? errors.pickup : undefined}
            destinationError={touched ? errors.destination : undefined}
          />

          {distanceKm !== null ? (
            <View style={styles.distance}>
              <Ionicons name="navigate-outline" size={16} color={DS.colors.primary} />
              <Text style={styles.distanceText}>
                About {distanceKm} km
                {routeEstimate?.durationSeconds
                  ? ` · about ${Math.round(routeEstimate.durationSeconds / 60)} min`
                  : ''}
                {routeEstimate?.source === 'routes'
                  ? '. Road distance from the route service.'
                  : ' by road. Quotes are built from this, and it is an estimate.'}
              </Text>
            </View>
          ) : null}

          <PriceField
            value={price}
            onChange={setPrice}
            suggested={suggested}
            error={touched ? errors.price : undefined}
          />

          <View style={styles.divider} />

          <Input
            label="What are you transporting?"
            value={goods}
            onChangeText={setGoods}
            placeholder="Tomatoes, 20 crates"
            required
            error={touched ? errors.goods : undefined}
          />

          <View>
            <Text style={styles.fieldLabel}>Goods category</Text>
            <View style={styles.chips}>
              {GOODS_CATEGORIES.map((c) => {
                const active = category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={c}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Input
            label="Weight"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="500"
            required
            error={touched ? errors.weight : undefined}
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <Input
                label="Date"
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                required
                error={touched ? errors.date : undefined}
              />
            </View>
            <View style={styles.flex}>
              <Input label="Time" value={time} onChangeText={setTime} placeholder="08:00" />
            </View>
          </View>

          <Input
            label="Number of loads"
            value={loads}
            onChangeText={setLoads}
            keyboardType="number-pad"
            placeholder="1"
          />

          <Input
            label="Anything they should know"
            value={note}
            onChangeText={setNote}
            placeholder="Loading at the gate, needs a tarpaulin, ready from 7am…"
            multiline
            numberOfLines={3}
          />

          <View>
            <Text style={styles.fieldLabel}>Special requirements</Text>
            <View style={styles.chips}>
              {SPECIAL_REQUIREMENTS.map((req) => {
                const active = special.includes(req);
                return (
                  <Pressable
                    key={req}
                    onPress={() => toggleSpecial(req)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={req}
                    style={[styles.chip, active && styles.chipActive]}>
                    {active ? (
                      <Ionicons name="checkmark" size={13} color={DS.colors.textInverse} />
                    ) : null}
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{req}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Find transporters" size="lg" onPress={onContinue} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  flex: { flex: 1 },
  body: {
    padding: DS.spacing.md,
    paddingBottom: DS.spacing.lg,
    gap: DS.spacing.md,
  },
  step: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  divider: { height: DS.layout.hairline, backgroundColor: DS.colors.borderLight },

  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    backgroundColor: DS.colors.primaryBg,
    borderRadius: DS.radius.md,
    padding: DS.spacing.sm + 4,
  },
  distanceText: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 17,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.primaryDark,
  },

  fieldLabel: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginBottom: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: DS.radius.full,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.borderControl,
    backgroundColor: DS.colors.surface,
  },
  chipActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  chipText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },
  chipTextActive: { fontFamily: DS.fontFamily.semibold, color: DS.colors.textInverse },

  row: { flexDirection: 'row', gap: DS.spacing.sm + 4 },

  footer: {
    backgroundColor: DS.colors.surface,
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.border,
    padding: DS.spacing.md,
  },
});
