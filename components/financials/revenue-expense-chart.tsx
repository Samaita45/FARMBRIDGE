import { Text, View } from 'react-native';

import type { MonthlyFinanceSummary } from '@/types/financials';

interface RevenueExpenseChartProps {
  data: MonthlyFinanceSummary[];
  displayCurrency: 'USD' | 'ZWG';
}

const RATE = 280;

export function RevenueExpenseChart({ data, displayCurrency }: RevenueExpenseChartProps) {
  if (data.length === 0) {
    return (
      <View className="rounded-2xl bg-white p-4">
        <Text className="font-sans text-gray-500">Add income & expenses to see monthly chart</Text>
      </View>
    );
  }

  const max = Math.max(...data.flatMap((d) => [d.revenueUSD, d.expensesUSD]), 1);
  const fmt = (usd: number) =>
    displayCurrency === 'USD' ? `$${usd.toFixed(0)}` : `ZWG ${(usd * RATE).toFixed(0)}`;

  return (
    <View className="rounded-2xl bg-white p-4">
      <Text className="font-sans-semibold text-dark">Revenue vs Expenses</Text>
      <View className="mt-1 flex-row gap-4">
        <View className="flex-row items-center gap-1">
          <View className="h-2 w-2 rounded-full bg-primary" />
          <Text className="font-sans text-xs text-gray-500">Revenue</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="h-2 w-2 rounded-full bg-amber-500" />
          <Text className="font-sans text-xs text-gray-500">Expenses</Text>
        </View>
      </View>
      <View className="mt-4 flex-row items-end justify-between gap-2">
        {data.map((m) => {
          const label = m.month.slice(5);
          const revH = (m.revenueUSD / max) * 80;
          const expH = (m.expensesUSD / max) * 80;
          return (
            <View key={m.month} className="flex-1 items-center">
              <View className="h-20 w-full flex-row items-end justify-center gap-0.5">
                <View className="w-3 rounded-t bg-primary" style={{ height: Math.max(revH, 4) }} />
                <View className="w-3 rounded-t bg-amber-500" style={{ height: Math.max(expH, 4) }} />
              </View>
              <Text className="mt-1 font-sans text-[10px] text-gray-500">{label}</Text>
            </View>
          );
        })}
      </View>
      <Text className="mt-2 font-sans text-xs text-gray-400">
        Latest: {fmt(data[data.length - 1].revenueUSD)} rev · {fmt(data[data.length - 1].expensesUSD)} exp
      </Text>
    </View>
  );
}
