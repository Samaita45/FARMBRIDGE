import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState } from '@/components/design-system';
import { RouteMap } from '@/components/transport/route-map';
import { VEHICLE_LABELS, VehicleIcon } from '@/components/transport/vehicle-icon';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { whatsAppUrl } from '@/constants/support';
import { PAYMENT_METHODS, TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { asHref } from '@/lib/href';
import { insertBooking } from '@/services/transportDb';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useTransportStore, type TransportState } from '@/stores/transportStore';
import type { TransportBooking } from '@/types/transport';

const PAYMENT_IDS = ['ecocash', 'onemoney', 'cash_usd', 'zwg'];

export default function ConfirmScreen() {
  const { price: priceParam } = useLocalSearchParams<{ price?: string; mode?: string }>();
  const { showToast } = useToast();
  const user = useAuthStore((s: AuthState) => s.user);
  const request = useTransportStore((s: TransportState) => s.request);
  const distanceKm = useTransportStore((s: TransportState) => s.distanceKm);
  const selectedProviderId = useTransportStore((s: TransportState) => s.selectedProviderId);
  const counterPriceUSD = useTransportStore((s: TransportState) => s.counterPriceUSD);
  const askingPrice = useTransportStore((s: TransportState) => s.askingPriceUSD);
  const clear = useTransportStore((s: TransportState) => s.clear);

  const [paymentMethod, setPaymentMethod] = useState('ecocash');
  const [placing, setPlacing] = useState(false);
  const [reference, setReference] = useState('');

  const provider = TRANSPORT_PROVIDERS.find((p) => p.id === selectedProviderId);
  const agreedPrice = counterPriceUSD ?? (priceParam ? parseFloat(priceParam) : askingPrice);

  if (!request || !provider) {
    return (
      <View style={styles.centre}>
        <EmptyState
          icon="clipboard-outline"
          title="Booking details missing"
          description="Start a transport request and choose a transporter to get here."
          actionLabel="Start a request"
          onAction={() => router.replace(asHref('/(tabs)/transport/request'))}
        />
      </View>
    );
  }

  const placeBooking = async () => {
    setPlacing(true);
    try {
      const id = `TRP-${Date.now().toString(36).toUpperCase()}`;
      const booking: TransportBooking = {
        id,
        userId: user?.id ?? 'guest',
        providerId: provider.id,
        providerName: provider.name,
        providerPhone: provider.phone,
        vehicleType: provider.vehicleType,
        pickup: request.pickup,
        destination: request.destination,
        goodsDescription: request.goodsDescription,
        weightKg: request.weightKg,
        category: request.category,
        preferredDate: request.preferredDate,
        distanceKm,
        agreedPriceUSD: agreedPrice,
        counterPriceUSD: counterPriceUSD ?? undefined,
        // Requested, not confirmed. No payment has been taken and the
        // transporter has not acknowledged it — they do that by phone, and the
        // trips screen is where the status moves on.
        status: 'pending',
        paymentMethod,
        createdAt: new Date().toISOString(),
      };
      await insertBooking(booking);
      setReference(id);
      showToast('Request sent — call the transporter to confirm', 'success');
    } catch {
      showToast('Could not save the booking. Try again.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  if (reference) {
    return (
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={44} color={DS.semantic.success.solid} />
        </View>
        <Text style={styles.successTitle}>Request sent</Text>
        <Text style={styles.successRef}>Reference {reference}</Text>

        <Card style={styles.card}>
          <View style={styles.providerRow}>
            <View style={styles.avatar}>
              <VehicleIcon type={provider.vehicleType} size={20} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerMeta}>
                {VEHICLE_LABELS[provider.vehicleType]} · ${agreedPrice}
              </Text>
            </View>
          </View>
          <Text style={styles.route}>
            {request.pickup} → {request.destination}
          </Text>
          <Text style={styles.routeMeta}>{request.preferredDate}</Text>
        </Card>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={15} color={DS.semantic.warning.fg} />
          <Text style={styles.noticeText}>
            Nothing has been paid yet. Agree the details and payment directly with the
            transporter, then update the trip status under My trips.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Call transporter"
            icon="call-outline"
            onPress={() => void Linking.openURL(`tel:${provider.phone}`)}
            accessibilityLabel={`Call ${provider.name} on ${provider.phone}`}
          />
          <Button
            title="Message on WhatsApp"
            variant="outline"
            icon="logo-whatsapp"
            onPress={() =>
              void Linking.openURL(
                whatsAppUrl(
                  `Hi ${provider.name}, I requested transport ${reference} from ${request.pickup} to ${request.destination}.`
                )
              )
            }
          />
          <Button
            title="Back to transport"
            variant="ghost"
            onPress={() => {
              clear();
              router.replace(asHref('/(tabs)/transport'));
            }}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      <Text style={styles.step}>Step 3 of 3 — review and send</Text>

      <RouteMap
        pickup={request.pickup}
        destination={request.destination}
        distanceKm={distanceKm}
      />

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Booking summary</Text>
        <Row label="Transporter" value={provider.name} />
        <Row label="Vehicle" value={VEHICLE_LABELS[provider.vehicleType]} />
        <Row label="Route" value={`${request.pickup} → ${request.destination}`} />
        <Row label="Distance" value={`About ${distanceKm} km`} />
        <Row label="Goods" value={request.goodsDescription} />
        <Row label="Date" value={request.preferredDate} />
        <Row label="Agreed price" value={`$${agreedPrice}`} highlight />
      </Card>

      <View>
        <Text style={styles.sectionTitle}>How you plan to pay</Text>
        <View style={styles.payRow}>
          {PAYMENT_METHODS.filter((p) => PAYMENT_IDS.includes(p.id)).map((pm) => {
            const active = paymentMethod === pm.id;
            return (
              <Pressable
                key={pm.id}
                onPress={() => setPaymentMethod(pm.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={pm.name}
                style={[styles.payChip, active && styles.payChipActive]}>
                <Text style={[styles.payText, active && styles.payTextActive]}>{pm.name}</Text>
              </Pressable>
            );
          })}
        </View>
        {/*
          In-app payment does not exist yet. Rather than print a USSD string
          that implies the app collected the money, this states who settles it.
        */}
        <Text style={styles.payNote}>
          Payment is arranged directly with the transporter. FarmBridge does not take
          payment for transport yet.
        </Text>
      </View>

      <Button
        title="Send request"
        icon="paper-plane-outline"
        loading={placing}
        onPress={placeBooking}
        accessibilityHint="Saves the request and shows the transporter's contact details"
      />
    </ScrollView>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, justifyContent: 'center', backgroundColor: DS.colors.background },
  body: {
    padding: DS.spacing.md,
    paddingBottom: DS.spacing.xl,
    gap: DS.spacing.md,
    backgroundColor: DS.colors.background,
    flexGrow: 1,
  },
  flex: { flex: 1 },

  step: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  successIcon: { alignItems: 'center', marginTop: DS.spacing.md },
  successTitle: {
    fontSize: DS.typography.h1.fontSize,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
    textAlign: 'center',
  },
  successRef: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    textAlign: 'center',
    marginTop: -DS.spacing.sm,
  },

  card: { gap: DS.spacing.sm },
  cardTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.xs,
  },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 4 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  providerMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  route: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },
  routeMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: DS.spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.borderLight,
  },
  rowLabel: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  rowValueHighlight: {
    fontSize: DS.typography.bodySm.fontSize,
    color: DS.colors.primary,
  },

  sectionTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  payRow: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm },
  payChip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  payChipActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  payText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  payTextActive: { color: DS.colors.textInverse },
  payNote: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
    marginTop: DS.spacing.sm,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.spacing.sm,
    backgroundColor: DS.semantic.warning.bg,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.semantic.warning.border,
    padding: DS.spacing.sm + 4,
  },
  noticeText: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 18,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.warning.fg,
  },

  actions: { gap: DS.spacing.sm },
});
