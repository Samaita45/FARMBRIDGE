import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DS } from '@/constants/design-system';

interface TabScreenHeaderProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  rightAction?: ReactNode;
}

/**
 * The header at the top of a tab.
 *
 * It used to be a three-stop gradient with white text. That put every screen's
 * most important words on a background whose contrast changed across its own
 * width, and it made the search field — the one control up here — compete with
 * the colour behind it. A plain surface with a hairline rule underneath gives
 * the title and the field a fixed, predictable ground, and lets the content
 * below carry the colour instead.
 *
 * The screen's own SafeAreaView handles the top inset, so this does not add one.
 */
export function TabScreenHeader({
  title,
  subtitle,
  icon,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  rightAction,
}: TabScreenHeaderProps) {
  const showSearch = onSearchChange !== undefined;

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.iconTile}>
          <Ionicons name={icon} size={20} color={DS.colors.primary} />
        </View>

        <View style={styles.titleBlock}>
          <Text
            style={styles.title}
            numberOfLines={1}
            maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {title}
          </Text>
          <Text
            style={styles.subtitle}
            numberOfLines={1}
            maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {subtitle}
          </Text>
        </View>

        {rightAction}
      </View>

      {showSearch ? (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={DS.colors.textSoft} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={DS.colors.textMuted}
            value={searchValue}
            onChangeText={onSearchChange}
            returnKeyType="search"
            accessibilityLabel={searchPlaceholder}
            maxFontSizeMultiplier={DS.layout.maxFontScale}
          />
          {searchValue && searchValue.length > 0 ? (
            <Pressable
              onPress={() => onSearchChange('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={DS.colors.textSoft} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: DS.colors.surface,
    borderBottomWidth: DS.layout.hairline,
    borderBottomColor: DS.colors.border,
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.sm,
    paddingBottom: DS.spacing.md,
    gap: DS.spacing.sm + 4,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 4 },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1 },
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
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.md,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.borderControl,
    paddingHorizontal: 14,
    minHeight: DS.layout.touchTarget,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: DS.typography.body.fontSize,
    color: DS.colors.text,
    fontFamily: DS.fontFamily.regular,
  },
});
