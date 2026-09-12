import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';

interface ProfileMenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

export function ProfileMenuRow({ icon, label, subtitle, onPress, danger, badge }: ProfileMenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}>
      <View style={[s.iconBox, danger && s.iconBoxDanger]}>
        <Ionicons name={icon} size={20} color={danger ? DS.semantic.danger.solid : DS.colors.primary} />
      </View>
      <View style={s.textBlock}>
        <Text style={[s.label, danger && s.labelDanger]}>{label}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View style={s.badge}><Text style={s.badgeText}>{badge}</Text></View>
      ) : null}
      {!danger && <Ionicons name="chevron-forward" size={16} color={DS.colors.textFaint} />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DS.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.borderLight,
  },
  rowPressed: { backgroundColor: DS.colors.borderLight },
  iconBox: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxDanger: { backgroundColor: DS.semantic.danger.bg },
  textBlock: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: DS.colors.text },
  labelDanger: { color: DS.semantic.danger.solid },
  subtitle: { fontSize: 12, color: DS.colors.textMuted, marginTop: 1 },
  badge: { backgroundColor: DS.colors.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700', color: DS.colors.surface },
});
