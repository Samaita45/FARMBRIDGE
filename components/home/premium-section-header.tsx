import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Premium } from '@/constants/premium-home';

interface PremiumSectionHeaderProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onPress?: () => void;
}

export function PremiumSectionHeader({
  title,
  icon,
  actionLabel = 'View all',
  onPress,
}: PremiumSectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {icon ? (
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={18} color={Premium.primary} />
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {onPress ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.75 }]}>
          <Text style={styles.btnText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={Premium.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Premium.text,
    letterSpacing: -0.3,
    flex: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  btnText: { fontSize: 13, fontWeight: '700', color: Premium.primary },
});
