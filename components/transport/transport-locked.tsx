import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { SUBSCRIPTION_PLANS, TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';

export function TransportLocked() {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === 'farmer');
  const providers = TRANSPORT_PROVIDERS.slice(0, 3);

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>🚛 Farm Transport</Text>
        <Text style={s.headerSub}>Move your harvest safely & affordably</Text>
      </View>

      {/* Preview providers (blurred) */}
      <View style={s.preview}>
        {providers.map((p) => (
          <View key={p.id} style={s.previewCard}>
            <View style={s.previewAvatar}>
              <Text style={s.previewInitial}>{p.name.charAt(0)}</Text>
            </View>
            <View style={s.previewInfo}>
              <Text style={s.previewName}>{p.name}</Text>
              <Text style={s.previewMeta}>{p.vehicleType} · {p.capacity}t</Text>
            </View>
            <Text style={s.previewRate}>${p.pricePerKm}/km</Text>
          </View>
        ))}
        <View style={s.previewOverlay} />
      </View>

      {/* Lock card */}
      <View style={s.lockCard}>
        <View style={s.lockIconWrap}>
          <Ionicons name="lock-closed" size={32} color={Colors.primary} />
        </View>

        <Text style={s.lockTitle}>Transport Booking Locked</Text>
        <Text style={s.lockSub}>
          Book farm transport like InDrive — subscribe to Farmer Pro
          (${plan?.priceUSD ?? 3}/mo) for access to 15+ verified transporters across Zimbabwe.
        </Text>

        {/* Feature list */}
        {[
          'Real-time GPS tracking',
          'Compare quotes from drivers',
          'Secure EcoCash payment',
          'Cold chain & refrigerated options',
        ].map((f) => (
          <View key={f} style={s.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
            <Text style={s.featureText}>{f}</Text>
          </View>
        ))}

        {plan?.ecocashCode && (
          <View style={s.codeBox}>
            <Text style={s.codeLabel}>EcoCash shortcode:</Text>
            <Text style={s.codeValue}>{plan.ecocashCode}</Text>
          </View>
        )}

        <Link href="/(tabs)/profile" asChild>
          <Pressable style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}>
            <Ionicons name="flash" size={18} color="#fff" />
            <Text style={s.btnText}>View Subscription Plans</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },

  header: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  preview: { position: 'relative', padding: 16, gap: 8 },
  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.gray[100],
    opacity: 0.5,
  },
  previewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryMid, alignItems: 'center', justifyContent: 'center' },
  previewInitial: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  previewInfo: { flex: 1 },
  previewName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  previewMeta: { fontSize: 11, color: Colors.textSecondary },
  previewRate: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  previewOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(240,253,244,0.5)',
  },

  lockCard: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 22,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 8,
  },
  lockIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.primaryBg, borderWidth: 1.5, borderColor: Colors.primaryMid,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 14,
  },
  lockTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  lockSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 },

  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },

  codeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accentLight, borderRadius: 12, padding: 12, marginVertical: 12,
  },
  codeLabel: { fontSize: 12, color: Colors.textSecondary },
  codeValue: { fontSize: 14, fontWeight: '800', color: Colors.accent },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 15, marginTop: 4,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
