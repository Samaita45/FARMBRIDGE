import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
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

import { Button, Card, Input } from '@/components/design-system';
import { CheckoutSteps, StepHeading } from '@/components/market/checkout-steps';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { PAYMENT_METHODS, PROVINCES } from '@/constants/zimbabwe-data';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { asHref } from '@/lib/href';
import { insertOrder } from '@/services/orderService';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useCartStore, type CartItem } from '@/stores/cartStore';
import type { MarketOrder } from '@/types/market';

/**
 * Checkout, in the two steps the reference lays out: delivery, then payment.
 *
 * WHAT THIS DOES NOT DO. No money moves. FarmBridge has no payment provider
 * wired up, so the payment step records how the buyer intends to pay and the
 * order is written as awaiting payment — never as paid. The screen says so
 * rather than implying a transaction occurred.
 */
export default function CheckoutScreen() {
  const { showToast } = useToast();
  const user = useAuthStore((s: AuthState) => s.user);
  const { items, getTotalUSD, clearCart } = useCartStore();
  const { rate, isIndicative } = useExchangeRate();

  const [step, setStep] = useState<1 | 2>(1);
  const [placing, setPlacing] = useState(false);

  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] ?? '');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') ?? '');
  const [province, setProvince] = useState(user?.province ?? '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState('ecocash');
  const [touched, setTouched] = useState(false);

  const totalUSD = getTotalUSD();

  const errors = {
    firstName: firstName.trim() ? undefined : 'Field is required',
    lastName: lastName.trim() ? undefined : 'Field is required',
    province: province.trim() ? undefined : 'Field is required',
    street: deliveryMethod === 'delivery' && !street.trim() ? 'Field is required' : undefined,
    city: deliveryMethod === 'delivery' && !city.trim() ? 'Field is required' : undefined,
    phone: phone.trim() ? undefined : 'Field is required',
  };
  const deliveryValid = Object.values(errors).every((e) => !e);

  const goToPayment = () => {
    setTouched(true);
    if (!deliveryValid) {
      showToast('Fill in the required fields', 'warning');
      return;
    }
    setStep(2);
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const reference = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const order: MarketOrder = {
        id: reference,
        userId: user?.id ?? 'guest',
        items: items.map((i: CartItem) => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
          priceUSD: i.product.priceUSD,
          priceZWG: i.product.priceZWG,
        })),
        subtotalUSD: totalUSD,
        subtotalZWG: Math.round(totalUSD * rate.usdToZwg),
        deliveryAddress:
          deliveryMethod === 'delivery'
            ? `${street.trim()}, ${city.trim()}, ${province}`
            : `Collection · ${province}`,
        deliveryMethod,
        paymentMethod,
        // Never 'confirmed': nothing has been paid and no seller has accepted.
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await insertOrder(order);
      clearCart();
      router.replace(
        asHref({
          pathname: '/(tabs)/market/success',
          params: { orderId: reference, total: String(totalUSD), payment: paymentMethod },
        })
      );
    } catch {
      showToast('Could not place the order. Try again.', 'error');
    } finally {
      setPlacing(false);
    }
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
          <CheckoutSteps current={step === 1 ? 'delivery' : 'payment'} />

          {step === 1 ? (
            <>
              <StepHeading step={1} title="Delivery" />

              <View style={styles.fields}>
                <Input
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoComplete="given-name"
                  required
                  error={touched ? errors.firstName : undefined}
                />
                <Input
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoComplete="family-name"
                  required
                  error={touched ? errors.lastName : undefined}
                />

                <View>
                  <Text style={styles.fieldLabel}>
                    Province <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.chipWrap}>
                    {PROVINCES.map((p) => {
                      const active = province === p.name;
                      return (
                        <Pressable
                          key={p.id}
                          onPress={() => setProvince(p.name)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={p.name}
                          style={[styles.chip, active && styles.chipActive]}>
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {p.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {touched && errors.province ? (
                    <Text style={styles.error}>{errors.province}</Text>
                  ) : null}
                </View>

                <View>
                  <Text style={styles.fieldLabel}>How you want it</Text>
                  <View style={styles.chipWrap}>
                    {(['delivery', 'pickup'] as const).map((m) => {
                      const active = deliveryMethod === m;
                      return (
                        <Pressable
                          key={m}
                          onPress={() => setDeliveryMethod(m)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={m === 'delivery' ? 'Delivered' : 'Collect myself'}
                          style={[styles.chip, active && styles.chipActive]}>
                          <Ionicons
                            name={m === 'delivery' ? 'bus-outline' : 'walk-outline'}
                            size={13}
                            color={active ? DS.colors.textInverse : DS.colors.textMuted}
                          />
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {m === 'delivery' ? 'Delivered' : 'Collect myself'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {deliveryMethod === 'delivery' ? (
                  <>
                    <Input
                      label="Street"
                      value={street}
                      onChangeText={setStreet}
                      required
                      error={touched ? errors.street : undefined}
                    />
                    <Input
                      label="City or town"
                      value={city}
                      onChangeText={setCity}
                      required
                      error={touched ? errors.city : undefined}
                    />
                  </>
                ) : null}

                <Input
                  label="Phone number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  required
                  hint="The seller uses this to arrange handover"
                  error={touched ? errors.phone : undefined}
                />
              </View>
            </>
          ) : (
            <>
              <StepHeading step={2} title="Payment" />

              <View style={styles.fields}>
                <Text style={styles.fieldLabel}>How you will pay</Text>
                <View style={styles.payGrid}>
                  {PAYMENT_METHODS.map((pm) => {
                    const active = paymentMethod === pm.id;
                    return (
                      <Pressable
                        key={pm.id}
                        onPress={() => setPaymentMethod(pm.id)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={pm.name}
                        style={[styles.payTile, active && styles.payTileActive]}>
                        <Text style={[styles.payName, active && styles.payNameActive]}>
                          {pm.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/*
                  No provider is wired up, so this cannot take a payment. Saying
                  so here is the difference between an order and a false
                  receipt.
                */}
                <View style={styles.notice}>
                  <Ionicons
                    name="information-circle-outline"
                    size={15}
                    color={DS.semantic.warning.fg}
                  />
                  <Text style={styles.noticeText}>
                    FarmBridge does not take payment yet. Your order is sent to the seller and
                    you settle directly with them on delivery or collection.
                  </Text>
                </View>

                <Card variant="flat" style={styles.summary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Product price</Text>
                    <Text style={styles.summaryValue}>${totalUSD.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery</Text>
                    <Text style={styles.summaryValue}>Arranged with seller</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <View style={styles.totalValues}>
                      <Text style={styles.totalUSD}>${totalUSD.toFixed(2)}</Text>
                      <Text style={styles.totalZWG}>
                        ZWG {Math.round(totalUSD * rate.usdToZwg).toLocaleString()}
                        {isIndicative ? ' · indicative' : ''}
                      </Text>
                    </View>
                  </View>
                </Card>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step === 2 ? (
            <Button title="Back" variant="outline" size="lg" onPress={() => setStep(1)} />
          ) : null}
          <Button
            title={step === 1 ? 'Continue to payment' : 'Place order'}
            size="lg"
            loading={placing}
            onPress={step === 1 ? goToPayment : placeOrder}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  flex: { flex: 1 },
  body: { padding: DS.spacing.md, paddingBottom: DS.spacing.lg, gap: DS.spacing.md },

  fields: { gap: DS.spacing.md },
  fieldLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  required: { color: DS.semantic.danger.solid },
  error: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.danger.fg,
    marginTop: 5,
  },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: DS.radius.full,
    borderWidth: 1,
    borderColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
  },
  chipActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  chipText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  chipTextActive: { color: DS.colors.textInverse },

  payGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm },
  payTile: {
    minWidth: '30%',
    flexGrow: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DS.spacing.sm,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
  },
  payTileActive: { borderColor: DS.colors.primary, backgroundColor: DS.colors.primaryBg },
  payName: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
    textAlign: 'center',
  },
  payNameActive: { color: DS.colors.primaryDark },

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

  summary: { gap: DS.spacing.sm },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  summaryLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  summaryValue: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  divider: { height: 1, backgroundColor: DS.colors.border },
  totalLabel: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  totalValues: { alignItems: 'flex-end' },
  totalUSD: {
    fontSize: DS.typography.h1.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  totalZWG: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },

  footer: {
    flexDirection: 'row',
    gap: DS.spacing.sm,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.surface,
    borderTopWidth: 1,
    borderTopColor: DS.colors.border,
  },
});
