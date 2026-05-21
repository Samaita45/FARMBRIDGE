import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/colors';

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
        <Ionicons name={icon} size={20} color={danger ? Colors.error : Colors.primary} />
      </View>
      <View style={s.textBlock}>
        <Text style={[s.label, danger && s.labelDanger]}>{label}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View style={s.badge}><Text style={s.badgeText}>{badge}</Text></View>
      ) : null}
      {!danger && <Ionicons name="chevron-forward" size={16} color={Colors.gray[400]} />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  rowPressed: { backgroundColor: Colors.gray[100] },
  iconBox: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxDanger: { backgroundColor: '#fee2e2' },
  textBlock: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  labelDanger: { color: Colors.error },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  badge: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
