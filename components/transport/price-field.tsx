import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DS } from '@/constants/design-system';

interface PriceFieldProps {
  value: number | null;
  onChange: (next: number) => void;
  /** What the trip would cost at the average transporter's rate. */
  suggested: number | null;
  step?: number;
  error?: string;
}

/**
 * You name the price.
 *
 * This is inDrive's idea, and it fits here better than it fits a taxi: a
 * smallholder moving two tonnes of tomatoes knows what the trip is worth to
 * them, and the current flow made them accept whatever the estimator produced.
 *
 * THE SUGGESTION IS A REAL AVERAGE, NOT AN ANCHOR. It is the mean of what the
 * available transporters would charge for this distance at their own published
 * rates, and it says so. inDrive's suggestion is tuned to what the market will
 * bear; this one is arithmetic on numbers already in the app, and the farmer
 * can go under it without the screen arguing.
 *
 * What the app cannot do is take the offer to anybody. There is no server and
 * no transporter is signed in, so the price travels with the request when the
 * farmer contacts them. The screen that lists transporters says which ones
 * usually charge more than the offer, so it is clear who is worth calling.
 */
export function PriceField({ value, onChange, suggested, step = 5, error }: PriceFieldProps) {
  const current = value ?? suggested ?? 0;

  const bump = (delta: number) => onChange(Math.max(1, Math.round(current + delta)));

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Your price</Text>
        {suggested !== null ? (
          <Pressable
            onPress={() => onChange(suggested)}
            accessibilityRole="button"
            accessibilityLabel={`Use the average rate, $${suggested}`}
            hitSlop={8}>
            <Text style={styles.suggestion}>Average ${suggested} · use it</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.field, error ? styles.fieldError : null]}>
        <Pressable
          onPress={() => bump(-step)}
          disabled={current <= 1}
          accessibilityRole="button"
          accessibilityLabel={`Lower the offer by ${step} dollars`}
          style={[styles.step, current <= 1 && styles.stepDisabled]}>
          <Ionicons name="remove" size={20} color={DS.colors.text} />
        </Pressable>

        <View style={styles.amount}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={styles.input}
            value={value === null ? '' : String(value)}
            onChangeText={(t) => {
              const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
              onChange(Number.isFinite(n) ? n : 0);
            }}
            keyboardType="number-pad"
            placeholder={suggested !== null ? String(suggested) : '0'}
            placeholderTextColor={DS.colors.textFaint}
            accessibilityLabel="Your price in US dollars"
            maxFontSizeMultiplier={DS.layout.maxFontScale}
          />
        </View>

        <Pressable
          onPress={() => bump(step)}
          accessibilityRole="button"
          accessibilityLabel={`Raise the offer by ${step} dollars`}
          style={styles.step}>
          <Ionicons name="add" size={20} color={DS.colors.text} />
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <Text style={styles.hint}>
          Transporters see this when you contact them. Offer what the trip is worth to you.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: DS.spacing.sm,
  },
  label: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  suggestion: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: DS.radius.full,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.borderControl,
    backgroundColor: DS.colors.surface,
    padding: 5,
  },
  fieldError: { borderColor: DS.semantic.danger.solid },
  step: {
    width: 46,
    height: 46,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surfaceMuted,
  },
  stepDisabled: { opacity: 0.4 },

  amount: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  currency: {
    fontSize: DS.typography.h2.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.textMuted,
  },
  input: {
    minWidth: 70,
    paddingVertical: 0,
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 36,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },

  hint: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
  error: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.danger.fg,
  },
});
