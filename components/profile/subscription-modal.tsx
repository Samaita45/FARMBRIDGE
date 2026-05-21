import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { PaymentMethodIcon } from '@/components/profile/payment-method-icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { PAYMENT_METHODS, SUBSCRIPTION_PLANS } from '@/constants/zimbabwe-data';
import { useAuthStore } from '@/stores/authStore';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SubscriptionModal({ visible, onClose }: SubscriptionModalProps) {
  const user = useAuthStore((s) => s.user);
  const updateSubscription = useAuthStore((s) => s.updateSubscription);
  const { showToast } = useToast();
  const currentPlanId = user?.subscription?.planId ?? 'basic';
  const isSubscribed = user?.subscription?.isActive ?? false;

  const subscribe = (planId: string) => {
    if (planId === 'basic') return;
    const expires = new Date(Date.now() + 30 * 86400000).toISOString();
    updateSubscription(planId, true, expires);
    showToast('Subscription activated (demo)', 'success');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-surface">
        <View className="flex-row items-center justify-between border-b border-gray-100 bg-white px-4 py-4">
          <Text className="font-display text-xl text-dark">Choose Your Plan</Text>
          <Pressable onPress={onClose}>
            <Text className="font-sans-semibold text-primary">Close</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 32 }}>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent = currentPlanId === plan.id && (plan.id === 'basic' || isSubscribed);
            const isPro = plan.id === 'farmer';
            const isBiz = plan.id === 'business';

            return (
              <View
                key={plan.id}
                className={`mb-4 rounded-2xl bg-white p-4 ${isPro ? 'border-2 border-primary' : ''}`}
                style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <Text className="font-display text-lg text-dark">
                  {plan.id === 'basic' ? '🌱' : isPro ? '🚜' : '🏢'} {plan.name}
                </Text>
                {plan.priceUSD > 0 ? (
                  <Text className="mt-1 font-sans-semibold text-primary">
                    ${plan.priceUSD}/month · ZWG {plan.priceZWG}/month
                  </Text>
                ) : (
                  <Text className="mt-1 font-sans text-gray-500">Free forever</Text>
                )}

                <View className="mt-3 gap-1">
                  {plan.features.map((f) => (
                    <Text key={f} className="font-sans text-sm text-gray-600">
                      ✓ {f}
                    </Text>
                  ))}
                </View>

                {plan.id !== 'basic' && plan.ecocashCode ? (
                  <View className="mt-3 rounded-xl bg-surface p-3">
                    <Text className="font-sans-semibold text-xs text-dark">Payment options</Text>
                    <View className="mt-2 flex-row flex-wrap gap-3">
                      {PAYMENT_METHODS.slice(0, 4).map((pm) => (
                        <View key={pm.id} className="items-center">
                          <PaymentMethodIcon icon={pm.icon} size={36} />
                          <Text className="mt-1 font-sans text-[10px] text-gray-500">{pm.name}</Text>
                        </View>
                      ))}
                    </View>
                    <Text className="mt-2 font-sans text-xs text-gray-500">
                      EcoCash: dial {plan.ecocashCode}
                    </Text>
                  </View>
                ) : null}

                <View className="mt-4">
                  {plan.id === 'basic' ? (
                    <PrimaryButton
                      title={isCurrent ? 'Current Plan' : 'Basic'}
                      variant="outline"
                      disabled
                    />
                  ) : isCurrent ? (
                    <PrimaryButton title="Current Plan" variant="outline" disabled />
                  ) : (
                    <PrimaryButton
                      title={isBiz ? 'Go Business' : 'Subscribe Now'}
                      onPress={() => subscribe(plan.id)}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
