import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/colors';
import { Typography } from '@/constants/Typography';
import { getDailyTip } from '@/constants/tutorials-data';
import { cardShadow } from '@/lib/platform-ui';
import { asHref } from '@/lib/href';

export function DailyTipCard() {
  const tip = getDailyTip();

  return (
    <View style={s.card}>
      <View style={s.header}>
        <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
        <Text style={s.title}>Did you know?</Text>
      </View>
      <Text style={s.body}>{tip}</Text>
      <Link href={asHref('/tutorials')} asChild>
        <Pressable style={({ pressed }) => [s.linkBtn, pressed && { opacity: 0.8 }]}>
          <Text style={s.linkText}>More tutorials</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
        </Pressable>
      </Link>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
    ...cardShadow(),
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { ...Typography.heading3, color: Colors.textPrimary },
  body: { ...Typography.body, color: Colors.gray[700] },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  linkText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});
