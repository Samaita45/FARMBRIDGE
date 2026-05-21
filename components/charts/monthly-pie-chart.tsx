import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { MONTHLY_CATEGORY_STATS, MARKET_SUMMARY } from '@/constants/market-stats';

function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

function CategoryBar({
  category,
  percentage,
  color,
  delay,
}: {
  category: string;
  percentage: number;
  color: string;
  delay: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: delay });
  }, [delay, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${percentage * progress.value}%`,
  }));

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          <Text className="font-sans text-sm text-dark">{category}</Text>
        </View>
        <Text className="font-sans-semibold text-sm text-gray-600">{percentage}%</Text>
      </View>
      <View className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
        <Animated.View className="h-full rounded-full" style={[{ backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
}

export function MonthlyPieChart() {
  const monthName = new Date().toLocaleString('en', { month: 'long' });

  return (
    <View
      className="rounded-2xl bg-white p-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      <Text className="font-sans-bold text-dark">
        📊 Zimbabwe Farm Market Stats — {monthName}
      </Text>

      <View className="mt-4 items-center">
        <View
          className="h-32 w-32 items-center justify-center rounded-full"
          style={{ borderWidth: 10, borderColor: '#22c55e33' }}>
          <Text className="font-sans-bold text-lg text-dark">
            {formatUSD(MARKET_SUMMARY.totalValueUSD)}
          </Text>
          <Text className="font-sans text-[10px] text-gray-500">Total volume</Text>
        </View>
      </View>

      <View className="mt-4 gap-2">
        {MONTHLY_CATEGORY_STATS.map((item, index) => (
          <CategoryBar
            key={item.category}
            category={item.category}
            percentage={item.percentage}
            color={item.color}
            delay={600 + index * 100}
          />
        ))}
      </View>
    </View>
  );
}
