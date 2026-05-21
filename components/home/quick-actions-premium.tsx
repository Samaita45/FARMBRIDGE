import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Premium } from '@/constants/premium-home';

const ACTIONS: {
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  colors: [string, string];
}[] = [
  {
    label: 'FarmBridge Market',
    sub: 'Buy & sell produce',
    icon: 'storefront',
    href: '/(tabs)/market',
    colors: ['#3B82F6', '#2563EB'],
  },
  {
    label: 'Book Transport',
    sub: 'Move your harvest',
    icon: 'bus',
    href: '/(tabs)/transport',
    colors: ['#22C55E', '#16A34A'],
  },
  {
    label: 'Find Buyers',
    sub: 'Connect instantly',
    icon: 'people',
    href: '/(tabs)/community',
    colors: ['#A78BFA', '#7C3AED'],
  },
  {
    label: 'Community Tips',
    sub: 'Learn from farmers',
    icon: 'chatbubbles',
    href: '/(tabs)/community',
    colors: ['#FB923C', '#F97316'],
  },
];

export function QuickActionsPremium() {
  return (
    <View style={styles.grid}>
      {ACTIONS.map((action) => (
        <Link key={action.label} href={action.href as Href} asChild>
          <Pressable
            style={({ pressed }) => [styles.wrap, pressed && styles.wrapPressed]}>
            <LinearGradient
              colors={action.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}>
              <View style={styles.glow} />
              <View style={styles.iconCircle}>
                <Ionicons name={action.icon} size={24} color="#fff" />
              </View>
              <Text style={styles.label}>{action.label}</Text>
              <Text style={styles.sub}>{action.sub}</Text>
              <View style={styles.arrowCircle}>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </LinearGradient>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  wrap: { width: '47.5%', flexGrow: 1, minWidth: 150 },
  wrapPressed: { transform: [{ scale: 0.97 }] },
  card: {
    borderRadius: Premium.radiusLg,
    padding: 20,
    minHeight: 148,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    ...Premium.shadowSoft,
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: '500' },
  arrowCircle: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
