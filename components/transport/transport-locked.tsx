import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card } from '@/components/design-system';
import { VEHICLE_LABELS, VehicleIcon } from '@/components/transport/vehicle-icon';
import { DS } from '@/constants/design-system';
import { SUBSCRIPTION_PLANS, TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';

/**
 * The transport paywall.
 *
 * The feature list previously advertised real-time GPS tracking, secure
 * EcoCash payment and cold-chain options. None of those exist. Promising them
 * on the screen that asks for money is the worst place in the app to be
 * inaccurate, so the list below is what a subscriber actually gets today.
 */
const INCLUDED = [
  `Contact details for ${TRANSPORT_PROVIDERS.length} transporters across Zimbabwe`,
  'Compare estimated prices for your route',
  'Send a price offer and agree a rate',
  'Keep a record of every trip and its status',
];

export function TransportLocked() {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === 'farmer');
  const preview = TRANSPORT_PROVIDERS.slice(0, 3);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Transport</Text>
          <Text style={styles.subtitle}>Move your harvest safely and affordably</Text>
        </View>

        <View
          style={styles.preview}
          accessible
          accessibilityLabel={`Preview of ${preview.length} transporters. Subscribe to see contact details.`}>
          {preview.map((p) => (
            <View key={p.id} style={styles.previewRow}>
              <View style={styles.previewAvatar}>
                <VehicleIcon type={p.vehicleType} size={18} color={DS.colors.textFaint} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.previewName}>{p.name}</Text>
                <Text style={styles.previewMeta}>
                  {VEHICLE_LABELS[p.vehicleType]} · {p.capacity}t
                </Text>
              </View>
              <Text style={styles.previewRate}>${p.pricePerKm}/km</Text>
            </View>
          ))}
          <View style={styles.previewFade} pointerEvents="none" />
        </View>

        <Card style={styles.lockCard}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed-outline" size={24} color={DS.colors.primary} />
          </View>

          <Text style={styles.lockTitle}>Transport needs a subscription</Text>
          <Text style={styles.lockSub}>
            {plan?.name ?? 'Farmer Pro'} costs ${plan?.priceUSD ?? 3} a month.
          </Text>

          <View style={styles.features}>
            {INCLUDED.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={DS.semantic.success.solid}
                />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={14} color={DS.colors.textSoft} />
            <Text style={styles.noticeText}>
              Live tracking and in-app payment are not available yet. Payment is arranged
              directly with the transporter.
            </Text>
          </View>

          {/*
            No payment provider is wired up, so this cannot take money. It says
            so rather than presenting a Subscribe button that does nothing.
          */}
          <Button
            title="Subscriptions coming soon"
            variant="outline"
            disabled
            accessibilityLabel="Subscriptions are not available yet"
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  body: { padding: DS.spacing.md, paddingBottom: DS.spacing.xl, gap: DS.spacing.md },
  flex: { flex: 1 },

  header: { gap: 2 },
  title: {
    fontSize: DS.typography.h1.fontSize,
    lineHeight: DS.typography.h1.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  subtitle: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  preview: { position: 'relative', gap: DS.spacing.sm },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 4,
  },
  previewAvatar: {
    width: 36,
    height: 36,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textSoft,
  },
  previewMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textFaint,
  },
  previewRate: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textFaint,
  },
  previewFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DS.colors.background,
    opacity: 0.55,
    borderRadius: DS.radius.lg,
  },

  lockCard: { gap: DS.spacing.sm + 4 },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockTitle: {
    fontSize: DS.typography.h2.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  lockSub: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: -DS.spacing.sm,
  },

  features: { gap: DS.spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: DS.spacing.sm },
  featureText: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 20,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.sm,
    padding: DS.spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
