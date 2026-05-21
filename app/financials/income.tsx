import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import {
  deleteIncome,
  getIncome,
  incomeTotalUSD,
  insertIncome,
  toUSD,
} from '@/services/financialsDb';
import { enqueueSync, isOnline } from '@/services/syncService';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore, selectCurrency } from '@/stores/settingsStore';
import type { FinanceCurrency, IncomeEntry } from '@/types/financials';

const RATE = 280;

export default function IncomeScreen() {
  const user = useAuthStore((s) => s.user);
  const currency = useSettingsStore(selectCurrency);
  const { showToast } = useToast();
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [buyer, setBuyer] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    setEntries(await getIncome(user.id));
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!user?.id || !cropName || !quantity || !price) {
      showToast('Fill crop, quantity and price', 'error');
      return;
    }
    await insertIncome({
      id: `inc_${Date.now()}`,
      userId: user.id,
      cropName: cropName.trim(),
      quantity: parseFloat(quantity),
      unit: 'kg',
      pricePerUnit: parseFloat(price),
      currency: currency as FinanceCurrency,
      buyer: buyer.trim() || 'Local buyer',
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    });
    if (!(await isOnline())) {
      enqueueSync({ kind: 'income_add', payload: { at: Date.now() } });
    }
    setCropName('');
    setQuantity('');
    setPrice('');
    setBuyer('');
    showToast('Income added', 'success');
    void load();
  };

  const exportCsv = async () => {
    const header = 'Date,Crop,Qty,Price,Buyer,Total USD\n';
    const rows = filtered
      .map(
        (e) =>
          `${e.date},${e.cropName},${e.quantity},${e.pricePerUnit},${e.buyer},${toUSD(e.quantity * e.pricePerUnit, e.currency).toFixed(2)}`
      )
      .join('\n');
    await Share.share({ message: header + rows, title: 'ZimFarm Income Export' });
  };

  const filtered = entries.filter(
    (e) =>
      !filter ||
      e.cropName.toLowerCase().includes(filter.toLowerCase()) ||
      e.date.includes(filter)
  );

  const total = incomeTotalUSD(entries);
  const fmt = (usd: number) =>
    currency === 'USD' ? `$${usd.toFixed(2)}` : `ZWG ${(usd * RATE).toFixed(0)}`;

  return (
    <ScrollView className="flex-1 bg-surface p-4" keyboardShouldPersistTaps="handled">
      <View className="rounded-2xl bg-primary/10 p-4">
        <Text className="font-sans text-gray-600">Total income</Text>
        <Text className="font-display text-2xl text-primary">{fmt(total)}</Text>
      </View>

      <Text className="mt-4 font-sans-semibold text-dark">Add income</Text>
      <TextInput className="mt-2 rounded-xl bg-white px-4 py-3 font-sans" placeholder="Crop name" value={cropName} onChangeText={setCropName} />
      <TextInput className="mt-2 rounded-xl bg-white px-4 py-3 font-sans" placeholder="Quantity (kg)" keyboardType="decimal-pad" value={quantity} onChangeText={setQuantity} />
      <TextInput className="mt-2 rounded-xl bg-white px-4 py-3 font-sans" placeholder={`Price per kg (${currency})`} keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
      <TextInput className="mt-2 rounded-xl bg-white px-4 py-3 font-sans" placeholder="Buyer" value={buyer} onChangeText={setBuyer} />
      <View className="mt-3">
        <PrimaryButton title="Add Income" onPress={add} />
      </View>

      <View className="mt-4 flex-row gap-2">
        <TextInput className="flex-1 rounded-xl bg-white px-4 py-2 font-sans" placeholder="Filter crop/date" value={filter} onChangeText={setFilter} />
        <Pressable onPress={exportCsv} className="rounded-xl bg-white px-4 py-2 justify-center">
          <Text className="font-sans-semibold text-sm text-primary">Export</Text>
        </Pressable>
      </View>

      {filtered.map((e) => (
        <View key={e.id} className="mt-3 rounded-xl bg-white p-4">
          <View className="flex-row justify-between">
            <Text className="font-sans-semibold text-dark">{e.cropName}</Text>
            <Text className="font-sans-semibold text-primary">
              {fmt(toUSD(e.quantity * e.pricePerUnit, e.currency))}
            </Text>
          </View>
          <Text className="font-sans text-sm text-gray-500">
            {e.quantity} {e.unit} @ {e.pricePerUnit} · {e.buyer}
          </Text>
          <Text className="font-sans text-xs text-gray-400">{e.date}</Text>
          <Pressable
            onPress={() =>
              Alert.alert('Delete?', '', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteIncome(e.id);
                    void load();
                  },
                },
              ])
            }
            className="mt-2">
            <Text className="font-sans text-sm text-error">Remove</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
