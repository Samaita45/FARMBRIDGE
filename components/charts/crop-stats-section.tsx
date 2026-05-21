import { Text, View } from 'react-native';

import { MARKET_SUMMARY } from '@/constants/market-stats';
import { MonthlyPieChart } from './monthly-pie-chart';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl bg-primary/5 p-3">
      <Text className="font-sans text-xs text-gray-500">{label}</Text>
      <Text className="mt-1 font-sans-bold text-base text-dark">{value}</Text>
    </View>
  );
}

export function CropStatsSection() {
  return (
    <View className="gap-3">
      <MonthlyPieChart />
      <View className="flex-row gap-2">
        <StatCard
          label="Active farms"
          value={MARKET_SUMMARY.activeFarms.toLocaleString()}
        />
        <StatCard
          label="Transactions"
          value={MARKET_SUMMARY.totalTransactions.toLocaleString()}
        />
      </View>
      <View className="rounded-xl bg-white p-3" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
        <Text className="font-sans text-sm text-gray-500">Most sold crop this month</Text>
        <Text className="font-sans-bold text-lg text-primary">
          🍅 {MARKET_SUMMARY.mostSoldCrop}
        </Text>
      </View>
    </View>
  );
}
