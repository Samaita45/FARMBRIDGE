import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';

export interface ChipTabItem {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface ChipTabsProps {
  items: ChipTabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export function ChipTabs({ items, activeId, onChange }: ChipTabsProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onChange(item.id)}
              style={[styles.chip, active && styles.chipActive]}>
              {item.icon ? (
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={active ? DS.colors.textInverse : DS.colors.textMuted}
                />
              ) : null}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: DS.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.border,
  },
  content: {
    paddingHorizontal: DS.spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  chipActive: {
    backgroundColor: DS.colors.primary,
    borderColor: DS.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: DS.colors.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  chipTextActive: { color: DS.colors.textInverse },
});
