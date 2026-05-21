import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { SUBSCRIPTION_PLANS } from '@/constants/zimbabwe-data';

export function SubscriptionBanner() {
  const farmerPlan = SUBSCRIPTION_PLANS.find((p) => p.id === 'farmer');

  return (
    <View className="overflow-hidden rounded-2xl">
      <View
        className="p-4"
        style={{
          backgroundColor: '#f59e0b',
        }}>
        <Text className="font-sans-bold text-lg text-white">🔒 Unlock Marketplace & More</Text>
        <Text className="mt-1 font-sans text-sm text-white/90">
          Subscribe from ${farmerPlan?.priceUSD}/month via EcoCash
        </Text>
        <Link href="/(tabs)/profile" asChild>
          <Pressable className="mt-3 self-start rounded-full bg-white px-5 py-2 active:opacity-90">
            <Text className="font-sans-semibold text-warning">Subscribe Now</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
