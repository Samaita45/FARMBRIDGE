import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';
import type { IconName } from '@/types/icons';
import type { UserRole } from '@/types';

const ROLES: { value: UserRole; label: string; icon: IconName; desc: string }[] = [
  { value: 'farmer', label: 'Farmer', icon: 'leaf-outline', desc: 'I grow crops' },
  { value: 'buyer', label: 'Buyer', icon: 'cart-outline', desc: 'I buy produce' },
  { value: 'both', label: 'Both', icon: 'swap-horizontal-outline', desc: 'I do both' },
];

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  error?: string;
}

export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label} maxFontSizeMultiplier={DS.layout.maxFontScale}>
        I am a
      </Text>

      <View style={styles.row} accessibilityRole="radiogroup">
        {ROLES.map((role) => {
          const active = value === role.value;
          return (
            <Pressable
              key={role.value}
              onPress={() => onChange(role.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${role.label}. ${role.desc}`}
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && !active && styles.pressed,
              ]}>
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Ionicons
                  name={role.icon}
                  size={16}
                  color={active ? DS.colors.textInverse : DS.colors.primary}
                />
              </View>
              <Text
                style={[styles.optionLabel, active && styles.optionLabelActive]}
                maxFontSizeMultiplier={DS.layout.maxFontScale}>
                {role.label}
              </Text>
              <Text
                style={[styles.optionDesc, active && styles.optionDescActive]}
                numberOfLines={2}
                maxFontSizeMultiplier={DS.layout.maxFontScale}>
                {role.desc}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text style={styles.error} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: DS.spacing.sm },
  label: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  row: { flexDirection: 'row', gap: DS.spacing.sm },

  option: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    minHeight: 92,
    paddingVertical: DS.spacing.sm + 4,
    paddingHorizontal: DS.spacing.sm,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
  },
  // Selection is carried by fill and border, not by a coloured glow.
  optionActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  pressed: { backgroundColor: DS.colors.surfaceMuted },

  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: DS.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primaryBg,
  },
  iconWrapActive: { backgroundColor: 'rgba(255, 255, 255, 0.22)' },

  optionLabel: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  optionLabelActive: { color: DS.colors.textInverse },

  optionDesc: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  optionDescActive: { color: 'rgba(255, 255, 255, 0.85)' },

  error: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.danger.fg,
  },
});
