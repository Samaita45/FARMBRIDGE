import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, Input } from '@/components/design-system';
import { VEHICLE_LABELS, VehicleIcon } from '@/components/transport/vehicle-icon';
import { DS } from '@/constants/design-system';
import { TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { asHref } from '@/lib/href';
import { useTransportStore, type TransportState } from '@/stores/transportStore';

export default function NegotiateScreen() {
  const selectedProviderId = useTransportStore((s: TransportState) => s.selectedProviderId);
  const askingPriceUSD = useTransportStore((s: TransportState) => s.askingPriceUSD);
  const setCounterPrice = useTransportStore((s: TransportState) => s.setCounterPrice);

  const [counter, setCounter] = useState(String(Math.max(1, askingPriceUSD - 5)));
  const [reply, setReply] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);

  const provider = TRANSPORT_PROVIDERS.find((p) => p.id === selectedProviderId);

  const parsed = Number(counter);
  const counterError =
    !counter.trim()
      ? 'Enter your offer'
      : Number.isNaN(parsed)
        ? 'Enter a number, for example 45'
        : parsed <= 0
          ? 'Your offer must be more than zero'
          : parsed > askingPriceUSD
            ? `That is above the asking price of $${askingPriceUSD}`
            : undefined;

  if (!provider) {
    return (
      <View style={styles.centre}>
        <EmptyState
          icon="bus-outline"
          title="No transporter selected"
          description="Pick a transporter from the quotes list to negotiate a price."
          actionLabel="See transporters"
          onAction={() => router.replace(asHref('/(tabs)/transport/providers'))}
        />
      </View>
    );
  }

  const sendCounter = () => {
    setTouched(true);
    if (counterError) return;
    setCounterPrice(parsed);
    setReply(Math.round((askingPriceUSD + parsed) / 2));
  };

  const acceptDeal = () => {
    const finalPrice = reply ?? askingPriceUSD;
    setCounterPrice(finalPrice);
    router.push(
      asHref({
        pathname: '/(tabs)/transport/confirm',
        params: { mode: 'negotiated', price: String(finalPrice) },
      })
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Card style={styles.providerCard}>
          <View style={styles.providerRow}>
            <View style={styles.avatar}>
              <VehicleIcon type={provider.vehicleType} size={22} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerMeta}>
                {VEHICLE_LABELS[provider.vehicleType]} · {provider.capacity}t
              </Text>
            </View>
          </View>
          <View style={styles.askRow}>
            <Text style={styles.askLabel}>Asking price</Text>
            <Text style={styles.askValue}>${askingPriceUSD}</Text>
          </View>
        </Card>

        <Card style={styles.offerCard}>
          <Input
            label="Your offer"
            icon="pricetag-outline"
            value={counter}
            onChangeText={setCounter}
            keyboardType="decimal-pad"
            placeholder={String(Math.max(1, askingPriceUSD - 5))}
            required
            error={touched ? counterError : undefined}
            hint="In US dollars, for the whole trip"
          />
          <Button
            title="Send offer"
            variant="outline"
            icon="paper-plane-outline"
            onPress={sendCounter}
            accessibilityLabel={`Send your offer of $${counter} to ${provider.name}`}
          />
        </Card>

        {reply !== null ? (
          <Card style={styles.replyCard}>
            <View style={styles.replyHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={DS.colors.primary} />
              <Text style={styles.replyLabel}>{provider.name} responds</Text>
            </View>
            <Text style={styles.replyValue}>${reply}</Text>
            {/*
              There is no transporter on the other end of this yet. The figure
              is the midpoint of the two prices, and the screen says so rather
              than implying a real person replied.
            */}
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={13} color={DS.semantic.warning.fg} />
              <Text style={styles.noticeText}>
                Placeholder response — the midpoint of the two prices. Live bidding
                arrives with transporter accounts.
              </Text>
            </View>
          </Card>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={reply !== null ? `Accept $${reply} and book` : `Book at $${askingPriceUSD}`}
          icon="checkmark-circle-outline"
          onPress={acceptDeal}
        />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  centre: { flex: 1, justifyContent: 'center', backgroundColor: DS.colors.background },
  flex: { flex: 1 },
  body: { padding: DS.spacing.md, gap: DS.spacing.md },

  providerCard: { gap: DS.spacing.sm + 4 },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  providerMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },
  askRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: DS.spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
  },
  askLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  askValue: {
    fontSize: DS.typography.display.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },

  offerCard: { gap: DS.spacing.sm + 4 },

  replyCard: { gap: DS.spacing.sm },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  replyValue: {
    fontSize: DS.typography.h1.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.primary,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: DS.semantic.warning.bg,
    borderRadius: DS.radius.sm,
    borderWidth: 1,
    borderColor: DS.semantic.warning.border,
    padding: DS.spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.warning.fg,
  },

  footer: {
    gap: DS.spacing.sm,
    padding: DS.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
    backgroundColor: DS.colors.surface,
  },
});
