import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { AGRI_FINANCE_OPTIONS } from '@/constants/agri-finance';

export default function LoansScreen() {
  return (
    <ScrollView className="flex-1 bg-surface p-4 dark:bg-dSurface" contentContainerStyle={{ paddingBottom: 32 }}>
      <Text className="font-sans text-gray-600 dark:text-dMuted">
        Agri-finance options available to Zimbabwean farmers. Rates are indicative — confirm with the lender.
      </Text>
      {AGRI_FINANCE_OPTIONS.map((opt) => (
        <View key={opt.id} className="mt-4 rounded-2xl bg-white p-4 dark:bg-dCard" style={{ elevation: 2, shadowOpacity: 0.05, shadowRadius: 8 }}>
          <Text className="font-sans-semibold text-dark dark:text-dText">{opt.name}</Text>
          <Text className="mt-1 font-sans text-sm text-primary dark:text-dPrimary">
            {opt.interestRate} · up to ${opt.maxAmountUSD.toLocaleString()}
          </Text>
          <Text className="mt-2 font-sans-semibold text-xs text-gray-500 dark:text-dSoft">Requirements</Text>
          {opt.requirements.map((r) => (
            <Text key={r} className="font-sans text-sm text-gray-600 dark:text-dMuted">
              · {r}
            </Text>
          ))}
          <Pressable
            onPress={() => Linking.openURL(opt.applyUrl)}
            className="mt-3 rounded-xl bg-primary py-2 dark:bg-dPrimary">
            <Text className="text-center font-sans-semibold text-sm text-white dark:text-dOnPrimary">Apply / Learn more</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
