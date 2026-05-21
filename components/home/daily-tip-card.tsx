import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { getDailyTip } from '@/constants/tutorials-data';
import { asHref } from '@/lib/href';

export function DailyTipCard() {
  const tip = getDailyTip();

  return (
    <View className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
      <Text className="font-sans-semibold text-dark">💡 Did you know?</Text>
      <Text className="mt-1 font-sans text-sm text-gray-700">{tip}</Text>
      <Link href={asHref('/tutorials')} asChild>
        <Pressable className="mt-2">
          <Text className="font-sans-semibold text-sm text-primary">More tutorials →</Text>
        </Pressable>
      </Link>
    </View>
  );
}
