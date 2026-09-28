import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { MOCK_EARNINGS } from '@/constants/profile-mock';

export default function EarningsScreen() {
  const { showToast } = useToast();

  const totals = useMemo(() => {
    const sales = MOCK_EARNINGS.filter((t) => t.type === 'sale');
    return {
      usd: sales.reduce((s, t) => s + t.amountUSD, 0),
      zwg: sales.reduce((s, t) => s + t.amountZWG, 0),
    };
  }, []);

  return (
    <ScrollView className="flex-1 bg-surface p-4 dark:bg-dSurface" contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="rounded-2xl bg-primary p-4 dark:bg-dPrimary">
        <Text className="font-sans text-white/80 dark:text-dOnPrimary/80">This month</Text>
        <Text className="font-display text-3xl text-white dark:text-dOnPrimary">${totals.usd.toLocaleString()}</Text>
        <Text className="font-sans text-white/90 dark:text-dOnPrimary/90">ZWG {totals.zwg.toLocaleString()}</Text>
      </View>

      <View className="mt-4">
        <PrimaryButton
          title="Withdraw to EcoCash"
          onPress={() => showToast('Withdrawal requested (demo)', 'success')}
        />
      </View>

      <Text className="mt-6 font-sans-semibold text-dark dark:text-dText">Transaction history</Text>
      {MOCK_EARNINGS.map((tx) => (
        <View key={tx.id} className="mt-3 flex-row justify-between rounded-xl bg-white p-4 dark:bg-dCard">
          <View className="flex-1 pr-2">
            <Text className="font-sans-semibold text-dark dark:text-dText">{tx.description}</Text>
            <Text className="font-sans text-xs text-gray-400 dark:text-dSoft">
              {new Date(tx.date).toLocaleDateString()}
            </Text>
          </View>
          <View className="items-end">
            <Text
              className={`font-sans-semibold ${tx.amountUSD < 0 ? 'text-error dark:text-dDanger' : 'text-primary dark:text-dPrimary'}`}>
              {tx.amountUSD < 0 ? '-' : '+'}${Math.abs(tx.amountUSD)}
            </Text>
            <Text className="font-sans text-xs text-gray-500 dark:text-dSoft">
              ZWG {Math.abs(tx.amountZWG).toLocaleString()}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
