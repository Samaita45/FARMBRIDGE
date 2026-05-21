import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DS } from '@/constants/design-system';

interface TabScreenHeaderProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  rightAction?: ReactNode;
  searchTint?: 'light' | 'dark';
}

export function TabScreenHeader({
  title,
  subtitle,
  icon,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  rightAction,
  searchTint = 'dark',
}: TabScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const showSearch = onSearchChange !== undefined;

  return (
    <LinearGradient
      colors={[DS.colors.primaryLight, DS.colors.primary, DS.colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={icon} size={20} color={DS.colors.textInverse} />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {rightAction}
      </View>

      {showSearch ? (
        <View
          style={[
            styles.searchBar,
            searchTint === 'light' && styles.searchBarLight,
          ]}>
          <Ionicons
            name="search"
            size={18}
            color={searchTint === 'light' ? 'rgba(255,255,255,0.75)' : DS.colors.textSoft}
          />
          <TextInput
            style={[
              styles.searchInput,
              searchTint === 'light' && styles.searchInputLight,
            ]}
            placeholder={searchPlaceholder}
            placeholderTextColor={
              searchTint === 'light' ? 'rgba(255,255,255,0.55)' : DS.colors.textSoft
            }
            value={searchValue}
            onChangeText={onSearchChange}
          />
          {searchValue && searchValue.length > 0 ? (
            <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={18}
                color={searchTint === 'light' ? 'rgba(255,255,255,0.75)' : DS.colors.textSoft}
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingHorizontal: DS.spacing.md,
    paddingBottom: DS.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DS.spacing.sm,
  },
  titleBlock: { flex: 1, marginRight: DS.spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: DS.colors.textInverse,
    fontFamily: 'Fraunces_700Bold',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    marginLeft: 50,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...DS.shadow.soft,
  },
  searchBarLight: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: DS.colors.text,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  searchInputLight: { color: DS.colors.textInverse },
});
