import { Text, View } from 'react-native';

import { EXPENSE_CATEGORY_LABELS, type ExpenseEntry } from '@/types/financials';
import { expenseTotalUSD, toUSD } from '@/services/financialsDb';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

interface ExpensePieBreakdownProps {
  expenses: ExpenseEntry[];
}

export function ExpensePieBreakdown({ expenses }: ExpensePieBreakdownProps) {
  const total = expenseTotalUSD(expenses);
  if (total === 0) {
    return (
      <View className="rounded-2xl bg-white p-4">
        <Text className="font-sans text-gray-500">No expenses recorded yet</Text>
      </View>
    );
  }

  const byCat = new Map<string, number>();
  for (const e of expenses) {
    const usd = toUSD(e.amount, e.currency);
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + usd);
  }

  const items = [...byCat.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <View className="rounded-2xl bg-white p-4">
      <Text className="font-sans-semibold text-dark">Expense breakdown</Text>
      <View className="mt-3 gap-2">
        {items.map(([cat, amount], i) => {
          const pct = Math.round((amount / total) * 100);
          return (
            <View key={cat}>
              <View className="flex-row justify-between">
                <Text className="font-sans text-sm text-dark">
                  {EXPENSE_CATEGORY_LABELS[cat as keyof typeof EXPENSE_CATEGORY_LABELS]}
                </Text>
                <Text className="font-sans text-sm text-gray-500">{pct}%</Text>
              </View>
              <View className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
