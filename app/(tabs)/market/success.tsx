import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card } from '@/components/design-system';
import { CheckoutSteps } from '@/components/market/checkout-steps';
import { DS } from '@/constants/design-system';
import { asHref } from '@/lib/href';

/**
 * The end of checkout.
 *
 * Deliberately says "order placed" rather than the reference's "Order
 * Completed": nothing has been paid and no seller has accepted yet, so the
 * order is a request. Telling someone a purchase completed when no money moved
 * is the kind of thing they only discover when the goods do not arrive.
 */
export default function OrderPlacedScreen() {
  const { orderId, total } = useLocalSearchParams<{ orderId?: string; total?: string }>();
  const amount = total ? Number(total) : 0;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <CheckoutSteps current="done" />

        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <Ionicons name="bag-check-outline" size={44} color={DS.colors.primary} />
          </View>

          <Text style={styles.title} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            Order placed
          </Text>
          <Text style={styles.message} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            Your order has been sent to the seller. You can follow it under My orders in your
            profile.
          </Text>
        </View>

        <Card variant="flat" style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{orderId ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.value}>${amount.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment</Text>
            <Text style={styles.value}>Settled with the seller</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Continue shopping"
            size="lg"
            onPress={() => router.replace(asHref('/(tabs)/market'))}
          />
          <Button
            title="View my orders"
            variant="outline"
            size="lg"
            onPress={() => router.replace(asHref('/(tabs)/profile/orders'))}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  body: { flex: 1, padding: DS.spacing.md, gap: DS.spacing.lg },

  hero: { alignItems: 'center', gap: DS.spacing.sm, marginTop: DS.spacing.xl },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primaryBg,
    marginBottom: DS.spacing.sm,
  },
  title: {
    fontSize: DS.typography.display.fontSize,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  message: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 21,
    textAlign: 'center',
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    maxWidth: 300,
  },

  card: { gap: DS.spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: DS.spacing.md },
  label: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },

  actions: { marginTop: 'auto', gap: DS.spacing.sm },
});
