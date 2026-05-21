import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DS } from '@/constants/design-system';

interface ProfileScreenHeaderProps {
  label?: string;
  name: string;
  subtitle: string;
  roleLabel: string;
  avatar: ReactNode;
  stats: ReactNode;
}

export function ProfileScreenHeader({
  label = 'Profile',
  name,
  subtitle,
  roleLabel,
  avatar,
  stats,
}: ProfileScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[DS.colors.primaryLight, DS.colors.primary, DS.colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.label}>{label}</Text>
      {avatar}
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.rolePill}>
        <Text style={styles.roleText}>{roleLabel}</Text>
      </View>
      <View style={styles.statsWrap}>{stats}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    alignItems: 'center',
    paddingHorizontal: DS.spacing.lg,
    paddingBottom: DS.spacing.xl,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    alignSelf: 'flex-start',
    marginBottom: DS.spacing.md,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: DS.colors.textInverse,
    marginTop: DS.spacing.sm,
    fontFamily: 'Fraunces_700Bold',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  rolePill: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: DS.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: DS.colors.textInverse,
  },
  statsWrap: {
    width: '100%',
    marginTop: DS.spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingVertical: DS.spacing.md,
    paddingHorizontal: DS.spacing.sm,
  },
});
