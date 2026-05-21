import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpensePieBreakdown } from '@/components/financials/expense-pie-breakdown';
import { RevenueExpenseChart } from '@/components/financials/revenue-expense-chart';
import Colors from '@/constants/colors';
import { EXCHANGE_RATE } from '@/constants/market-stats';
import {
  getExpenses,
  getMonthlySummaries,
  getSeasonTotals,
  seedDemoFinancials,
} from '@/services/financialsDb';
import { asHref } from '@/lib/href';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useSettingsStore, selectCurrency } from '@/stores/settingsStore';
import type { ExpenseEntry, MonthlyFinanceSummary, SeasonTotals } from '@/types/financials';

const RATE = EXCHANGE_RATE.usdToZwg;

const LINKS: { label: string; icon: keyof typeof Ionicons.glyphMap; href: string; desc: string }[] = [
  { label: 'Income Tracker',    icon: 'trending-up',   href: '/financials/income',     desc: 'Log your farm sales' },
  { label: 'Expense Tracker',   icon: 'trending-down', href: '/financials/expense',    desc: 'Record all costs' },
  { label: 'Profit Calculator', icon: 'calculator',    href: '/financials/calculator', desc: 'See your net profit' },
  { label: 'Agri-Finance',      icon: 'business',      href: '/financials/loans',      desc: 'Loans &amp; funding options' },
  { label: 'Price Alerts',      icon: 'notifications', href: '/financials/alerts',     desc: 'Get market price alerts' },
];

export default function FinancialsHubScreen() {
  const user = useAuthStore((s: AuthState) => s.user);
  const currency = useSettingsStore(selectCurrency);
  const [totals, setTotals] = useState<SeasonTotals | null>(null);
  const [monthly, setMonthly] = useState<MonthlyFinanceSummary[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);

  const load = useCallback(async () => {
    const uid = user?.id ?? 'guest';
    await seedDemoFinancials(uid);
    const [t, m, e] = await Promise.all([
      getSeasonTotals(uid),
      getMonthlySummaries(uid),
      getExpenses(uid),
    ]);
    setTotals(t);
    setMonthly(m);
    setExpenses(e);
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  const fmt = (usd: number) =>
    currency === 'USD' ? `$${usd.toFixed(0)}` : `ZWG ${(usd * RATE).toLocaleString()}`;

  const net = totals?.netProfitUSD ?? 0;
  const netPositive = net >= 0;

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={s.headerText}>
          <View style={s.headerTitleRow}>
            <Ionicons name="wallet" size={22} color="#fff" />
            <Text style={s.headerTitle}>Financials</Text>
          </View>
          <Text style={s.headerSub}>Track income, costs &amp; profit</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Stat cards row ── */}
        <View style={s.statRow}>
          <StatCard
            label="Revenue"
            value={fmt(totals?.revenueUSD ?? 0)}
            icon="trending-up"
            color={Colors.accent}
          />
          <StatCard
            label="Expenses"
            value={fmt(totals?.expensesUSD ?? 0)}
            icon="trending-down"
            color={Colors.error}
          />
        </View>

        {/* ── Net profit card ── */}
        <View style={[s.netCard, { backgroundColor: netPositive ? Colors.accentLight : '#fff1f2' }]}>
          <View>
            <Text style={s.netLabel}>Net Profit (this season)</Text>
            <Text style={[s.netValue, { color: netPositive ? Colors.accent : Colors.error }]}>
              {netPositive ? '+' : ''}{fmt(net)}
            </Text>
          </View>
          <View style={[s.netIcon, { backgroundColor: netPositive ? Colors.accent : Colors.error }]}>
            <Ionicons name={netPositive ? 'trending-up' : 'trending-down'} size={22} color="#fff" />
          </View>
        </View>

        {/* ── Charts ── */}
        <View style={s.chartSection}>
          <RevenueExpenseChart data={monthly} displayCurrency={currency} />
        </View>
        <View style={s.chartSection}>
          <ExpensePieBreakdown expenses={expenses} />
        </View>

        {/* ── Module buttons ── */}
        <Text style={s.modulesTitle}>Finance Modules</Text>
        <View style={s.modulesList}>
          {LINKS.map((link, i) => (
            <Pressable
              key={link.href}
              onPress={() => router.push(asHref(link.href))}
              style={({ pressed }) => [
                s.moduleBtn,
                i < LINKS.length - 1 && s.moduleBtnBorder,
                pressed && { backgroundColor: Colors.primaryBg },
              ]}>
              {/* Icon circle */}
              <View style={s.moduleBtnIcon}>
                <Ionicons name={link.icon} size={20} color={Colors.primary} />
              </View>
              {/* Labels */}
              <View style={s.moduleBtnContent}>
                <Text style={s.moduleBtnLabel}>{link.label}</Text>
                <Text style={s.moduleBtnDesc}>{link.desc}</Text>
              </View>
              {/* Chevron */}
              <Ionicons name="chevron-forward" size={18} color={Colors.gray[400]} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string; value: string;
  icon: keyof typeof Ionicons.glyphMap; color: string;
}) {
  return (
    <View style={sc.card}>
      <View style={[sc.iconCircle, { backgroundColor: color + '1a' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={sc.label}>{label}</Text>
      <Text style={[sc.value, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },

  // Header
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Stat row
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },

  // Net card
  netCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  netLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  netValue: { fontSize: 26, fontWeight: '800' },
  netIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },

  // Charts
  chartSection: { marginBottom: 12 },

  // Modules
  modulesTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10, marginTop: 8 },
  modulesList: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  moduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: '#fff',
  },
  moduleBtnBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  moduleBtnIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  moduleBtnContent: { flex: 1 },
  moduleBtnLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  moduleBtnDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});

const sc = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    gap: 6,
  },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  value: { fontSize: 18, fontWeight: '800' },
});
