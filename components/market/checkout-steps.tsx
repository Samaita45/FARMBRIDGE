import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';
import type { IconName } from '@/types/icons';

export type CheckoutStep = 'delivery' | 'payment' | 'done';

const STEPS: { key: CheckoutStep; icon: IconName; label: string }[] = [
  { key: 'delivery', icon: 'location', label: 'Delivery' },
  { key: 'payment', icon: 'card', label: 'Payment' },
  { key: 'done', icon: 'checkmark-circle', label: 'Done' },
];

/**
 * The checkout progress indicator from the reference: three markers joined by
 * dotted connectors, with everything up to the current step filled in.
 *
 * It is a status display, not a control — tapping ahead would skip validation
 * the next step depends on, so the steps are not pressable.
 */
export function CheckoutSteps({ current }: { current: CheckoutStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Checkout, step ${currentIndex + 1} of ${STEPS.length}: ${STEPS[currentIndex]?.label ?? ''}`}>
      {STEPS.map((step, index) => {
        const reached = index <= currentIndex;
        return (
          <View key={step.key} style={styles.segment}>
            <View style={[styles.marker, reached && styles.markerReached]}>
              <Ionicons
                name={step.icon}
                size={15}
                color={reached ? DS.colors.textInverse : DS.colors.textFaint}
              />
            </View>

            {index < STEPS.length - 1 ? (
              <View style={styles.connector}>
                {Array.from({ length: 6 }).map((_, dot) => (
                  <View
                    key={dot}
                    style={[styles.dot, index < currentIndex && styles.dotReached]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** The eyebrow and title that sit under the indicator on each step. */
export function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.eyebrow}>STEP {step}</Text>
      <Text style={styles.title} maxFontSizeMultiplier={DS.layout.maxFontScale}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: DS.spacing.sm },
  segment: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  marker: {
    width: 30,
    height: 30,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surfaceMuted,
  },
  markerReached: { backgroundColor: DS.colors.primary },

  connector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    minWidth: 40,
    paddingHorizontal: DS.spacing.sm,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: DS.colors.border,
  },
  dotReached: { backgroundColor: DS.colors.primary },

  heading: { gap: 2 },
  eyebrow: {
    fontSize: DS.typography.label.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textSoft,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: DS.typography.display.fontSize,
    lineHeight: DS.typography.display.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
});
