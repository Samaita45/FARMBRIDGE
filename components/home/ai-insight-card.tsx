import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card } from '@/components/design-system';
import { DS } from '@/constants/design-system';
import { asHref } from '@/lib/href';

interface MarketInsightCardProps {
  message: string;
  locationLabel?: string;
}

/**
 * A single derived market insight.
 *
 * Previously branded "AI Farming Assistant · Powered by FarmBridge
 * Intelligence" and dressed in four gradients plus three decorative shapes.
 * There is no model behind it: the message is composed from the top-demand crop
 * and the user's location. It now says what it is. If a real model is added
 * later, the claim can come back with it.
 */
export function MarketInsightCard({ message, locationLabel }: MarketInsightCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="trending-up" size={18} color={DS.colors.primary} />
        </View>
        <Text style={styles.eyebrow} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          This week’s market signal
        </Text>
      </View>

      <Text style={styles.body} maxFontSizeMultiplier={DS.layout.maxFontScale}>
        {message}
      </Text>

      {locationLabel ? (
        <Text style={styles.meta} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          Based on demand data for {locationLabel}
        </Text>
      ) : null}

      <Link href={asHref('/tutorials')} asChild>
        <Button
          title="Growing guides"
          variant="outline"
          size="sm"
          icon="arrow-forward"
          iconPosition="right"
          fullWidth={false}
          style={styles.cta}
          accessibilityLabel="Open the growing guides"
        />
      </Link>
    </Card>
  );
}

/** @deprecated Use `MarketInsightCard`. */
export const AiInsightCard = MarketInsightCard;

const styles = StyleSheet.create({
  card: { gap: DS.spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    flex: 1,
    fontSize: DS.typography.label.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  body: {
    fontSize: DS.typography.body.fontSize,
    lineHeight: 24,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  meta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  cta: { alignSelf: 'flex-start', marginTop: DS.spacing.xs },
});
