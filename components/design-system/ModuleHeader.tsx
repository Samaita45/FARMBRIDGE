import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/design-system/AppText';
import { DS } from '@/constants/design-system';

interface ModuleHeaderProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onBack?: () => void;
}

export function ModuleHeader({ title, subtitle, icon, onBack }: ModuleHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[DS.colors.primaryLight, DS.colors.primary, DS.colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        style={styles.backBtn}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={20} color={DS.colors.textInverse} />
      </Pressable>
      <View style={styles.titleRow}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={22} color={DS.colors.textInverse} />
        </View>
        <View>
          <AppText variant="h2" color={DS.colors.textInverse}>
            {title}
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.85)">
            {subtitle}
          </AppText>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingHorizontal: DS.spacing.md,
    paddingBottom: DS.spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DS.spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.md },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: DS.radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
