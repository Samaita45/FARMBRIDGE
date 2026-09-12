import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { CROPS } from '@/constants/zimbabwe-data';
import { getPriceAlerts, insertPriceAlert } from '@/services/financialsDb';
import { useAuthStore } from '@/stores/authStore';
import type { PriceAlert } from '@/types/financials';

export default function PriceAlertsScreen() {
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [cropName, setCropName] = useState('Tomatoes');
  const [target, setTarget] = useState('0.80');

  /*
    Hoisted so the declared dependency and the one the compiler infers are the
    same value. With `user?.id` in the array the compiler infers `user` — a
    coarser dependency than the source claims — and refuses to optimise the
    component at all.
  */
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    setAlerts(await getPriceAlerts(userId));
  }, [userId]);

  /*
    The fetch runs in the effect rather than through `load`, with a cancellation
    guard. Two reasons: calling a state-setting callback straight from an effect
    is what the compiler flags, and without the guard a slow read that resolves
    after the screen has gone writes state to an unmounted component.
  */
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void getPriceAlerts(userId).then((rows) => {
      if (!cancelled) setAlerts(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const add = async () => {
    if (!user?.id) return;
    const price = parseFloat(target);
    if (!price) {
      showToast('Enter target price', 'error');
      return;
    }
    const crop = CROPS.find((c) => c.name.toLowerCase() === cropName.toLowerCase());
    const current = crop?.currentPriceUSD;
    const triggered = current != null && current >= price;

    await insertPriceAlert({
      id: `alert_${Date.now()}`,
      userId: user.id,
      cropName: cropName.trim(),
      targetPriceUSD: price,
      triggered,
      createdAt: new Date().toISOString(),
    });
    showToast(
      triggered ? 'Price already at or above target!' : 'Alert set — we will notify you (demo)',
      triggered ? 'info' : 'success'
    );
    void load();
  };

  return (
    <ScrollView className="flex-1 bg-surface p-4" keyboardShouldPersistTaps="handled">
      <Text className="font-sans text-gray-600">
        Get notified when a crop reaches your target price at market.
      </Text>

      <TextInput className="mt-4 rounded-xl bg-white px-4 py-3 font-sans" placeholder="Crop name" value={cropName} onChangeText={setCropName} />
      <TextInput className="mt-2 rounded-xl bg-white px-4 py-3 font-sans" placeholder="Target $/kg" keyboardType="decimal-pad" value={target} onChangeText={setTarget} />
      <View className="mt-3">
        <PrimaryButton title="Set Alert" onPress={add} />
      </View>

      <Text className="mt-6 font-sans-semibold text-dark">Active alerts</Text>
      {alerts.length === 0 ? (
        <Text className="mt-2 font-sans text-gray-500">No alerts yet</Text>
      ) : (
        alerts.map((a) => (
          <View key={a.id} className="mt-2 rounded-xl bg-white p-4">
            <Text className="font-sans-semibold text-dark">{a.cropName}</Text>
            <Text className="font-sans text-sm text-gray-600">Notify at ${a.targetPriceUSD.toFixed(2)}/kg</Text>
            <Text className={`mt-1 font-sans text-xs ${a.triggered ? 'text-primary' : 'text-gray-400'}`}>
              {a.triggered ? 'Triggered' : 'Watching…'}
            </Text>
            <Text className="font-sans text-[10px] text-gray-400">
              {new Date(a.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
