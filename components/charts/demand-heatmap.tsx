import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { PROVINCE_DEMAND } from '@/constants/market-stats';

function demandColor(index: number): string {
  if (index >= 85) return Colors.primary;
  if (index >= 70) return Colors.secondary;
  if (index >= 55) return Colors.accent;
  return Colors.gray[300];
}

interface DemandHeatmapProps {
  onProvincePress?: (province: string) => void;
}

export function DemandHeatmap({ onProvincePress }: DemandHeatmapProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View
      className="rounded-2xl bg-white p-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      <Text className="font-sans-bold text-dark">Regional Demand</Text>
      <Text className="mt-1 font-sans text-xs text-gray-500">Tap a province to filter market</Text>

      <View className="mt-3 gap-2">
        {PROVINCE_DEMAND.map((item) => {
          const active = selected === item.province;
          return (
            <Pressable
              key={item.province}
              onPress={() => {
                setSelected(active ? null : item.province);
                onProvincePress?.(item.province);
              }}
              className={`flex-row items-center gap-3 rounded-xl p-2 ${active ? 'bg-primary/10' : ''}`}
              accessibilityRole="button"
              accessibilityLabel={`${item.province} demand ${item.demandIndex} percent`}>
              <Text className="w-28 font-sans text-sm text-dark" numberOfLines={1}>
                {item.province}
              </Text>
              <View className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${item.demandIndex}%`,
                    backgroundColor: demandColor(item.demandIndex),
                  }}
                />
              </View>
              <Text className="w-8 text-right font-sans-semibold text-xs text-gray-500">
                {item.demandIndex}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
