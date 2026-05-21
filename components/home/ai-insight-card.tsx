import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Premium } from '@/constants/premium-home';
import { asHref } from '@/lib/href';

interface AiInsightCardProps {
  message: string;
  locationLabel?: string;
}

export function AiInsightCard({ message, locationLabel }: AiInsightCardProps) {
  return (
    <LinearGradient
      colors={['#FFFBEB', '#FEF9C3', '#FDE68A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>
      <View style={styles.header}>
        <LinearGradient
          colors={['#FFF', '#FEF3C7']}
          style={styles.iconBadge}>
          <Ionicons name="bulb" size={26} color={Premium.orange} />
        </LinearGradient>
        <View style={styles.headerText}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={12} color="#C2410C" />
            <Text style={styles.badgeText}>AI Farming Assistant</Text>
          </View>
          <Text style={styles.powered}>Powered by FarmBridge Intelligence</Text>
        </View>
      </View>

      <Text style={styles.body}>{message}</Text>
      {locationLabel ? (
        <Text style={styles.meta}>Personalized for {locationLabel}</Text>
      ) : null}

      <Link href={asHref('/tutorials')} asChild>
        <Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]}>
          <LinearGradient
            colors={[Premium.primary, Premium.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}>
            <Text style={styles.ctaText}>Learn More</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      </Link>

      <View style={styles.deco1} />
      <View style={styles.deco2} />
      <View style={styles.decoLeaf}>
        <Ionicons name="leaf" size={48} color="rgba(22,163,74,0.12)" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Premium.radiusXl,
    padding: 22,
    borderWidth: 1,
    borderColor: Premium.creamBorder,
    overflow: 'hidden',
    ...Premium.shadow,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Premium.shadowSoft,
  },
  headerText: { flex: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(249,115,22,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#C2410C', letterSpacing: 0.3 },
  powered: { fontSize: 11, color: Premium.textMuted, marginTop: 4 },
  body: {
    fontSize: 17,
    fontWeight: '600',
    color: Premium.text,
    lineHeight: 26,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  meta: { fontSize: 13, color: Premium.textMuted, marginBottom: 18 },
  cta: { alignSelf: 'flex-start', borderRadius: 16, overflow: 'hidden', ...Premium.shadowSoft },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  deco1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.4)',
    top: -30,
    right: -20,
  },
  deco2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(37,99,235,0.06)',
    bottom: 24,
    right: 40,
  },
  decoLeaf: {
    position: 'absolute',
    bottom: -8,
    right: 12,
    transform: [{ rotate: '-15deg' }],
  },
});
