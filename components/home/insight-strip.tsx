import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';
import type { IconName } from '@/types/icons';

export interface InsightItem {
  id: string;
  icon: IconName;
  label: string;
  value: string;
  /** Optional qualifier, e.g. the source or freshness of the figure. */
  trend?: string;
  tone: keyof typeof DS.semantic;
}

interface InsightStripProps {
  items: InsightItem[];
}

/**
 * A row of at-a-glance figures.
 *
 * Each tile was previously a two-stop gradient with a translucent white border
 * and a staggered Moti entrance. The numbers are the point, so the tiles are
 * now flat surfaces and the only colour is the semantic tone on the icon.
 */
export function InsightStrip({ items }: InsightStripProps) {
  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      renderItem={({ item }) => {
        const tone = DS.semantic[item.tone];
        return (
          <View
            style={styles.card}
            accessibilityRole="summary"
            accessibilityLabel={`${item.label}: ${item.value}${item.trend ? `. ${item.trend}` : ''}`}>
            <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
              <Ionicons name={item.icon} size={18} color={tone.fg} />
            </View>
            <Text style={styles.label} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {item.label}
            </Text>
            <Text
              style={styles.value}
              numberOfLines={1}
              maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {item.value}
            </Text>
            {item.trend ? (
              <Text style={styles.trend} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                {item.trend}
              </Text>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { gap: DS.spacing.sm + 2, paddingRight: DS.spacing.sm, paddingVertical: 2 },
  card: {
    width: 138,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 4,
    gap: 2,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: DS.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DS.spacing.sm,
  },
  label: {
    fontSize: DS.typography.label.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: DS.typography.h2.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  trend: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
