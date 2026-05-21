import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ExpensePieBreakdown } from '@/components/financials/expense-pie-breakdown';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { expenseTotalUSD, getExpenses, insertExpense, toUSD } from '@/services/financialsDb';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore, selectCurrency } from '@/stores/settingsStore';
import type { ExpenseCategory, ExpenseEntry, FinanceCurrency } from '@/types/financials';
import { EXPENSE_CATEGORY_LABELS } from '@/types/financials';

const CATEGORIES: ExpenseCategory[] = ['seeds', 'fertilizer', 'labor', 'transport', 'equipment', 'other'];
const RATE = 280;

export default function ExpenseScreen() {
  const user = useAuthStore((s) => s.user);
  const currency = useSettingsStore(selectCurrency);
  const { showToast } = useToast();
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [category, setCategory] = useState<ExpenseCategory>('seeds');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    setEntries(await getExpenses(user.id));
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!user?.id || !amount) {
      showToast('Enter amount', 'error');
      return;
    }
    await insertExpense({
      id: `exp_${Date.now()}`,
      userId: user.id,
      category,
      amount: parseFloat(amount),
      currency: currency as FinanceCurrency,
      date: new Date().toISOString().slice(0, 10),
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setAmount('');
    setNotes('');
    showToast('Expense added', 'success');
    void load();
  };

  const total = expenseTotalUSD(entries);
  const fmt = (usd: number) =>
    currency === 'USD' ? `$${usd.toFixed(2)}` : `ZWG ${(usd * RATE).toFixed(0)}`;

  return (
    <ScrollView className="flex-1 bg-surface p-4" keyboardShouldPersistTaps="handled">
      <ExpensePieBreakdown expenses={entries} />
      <View className="mt-4 rounded-2xl bg-amber-50 p-4">
        <Text className="font-sans text-gray-600">Total expenses</Text>
        <Text className="font-display text-2xl text-amber-700">{fmt(total)}</Text>
      </View>

      <Text className="mt-4 font-sans-semibold text-dark">Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            className={`mr-2 rounded-full px-3 py-2 ${category === c ? 'bg-primary' : 'bg-white'}`}>
            <Text className={`font-sans text-xs ${category === c ? 'text-white' : 'text-gray-600'}`}>
              {EXPENSE_CATEGORY_LABELS[c]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <TextInput className="mt-3 rounded-xl bg-white px-4 py-3 font-sans" placeholder={`Amount (${currency})`} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
      <TextInput className="mt-2 rounded-xl bg-white px-4 py-3 font-sans" placeholder="Notes" value={notes} onChangeText={setNotes} />
      <View className="mt-3">
        <PrimaryButton title="Add Expense" onPress={add} />
      </View>

      <Text className="mt-6 font-sans-semibold text-dark">History</Text>
      {entries.map((e) => (
        <View key={e.id} className="mt-2 rounded-xl bg-white p-3">
          <View className="flex-row justify-between">
            <Text className="font-sans-semibold text-dark">{EXPENSE_CATEGORY_LABELS[e.category]}</Text>
            <Text className="font-sans text-primary">{fmt(toUSD(e.amount, e.currency))}</Text>
          </View>
          {e.notes ? <Text className="font-sans text-sm text-gray-500">{e.notes}</Text> : null}
          <Text className="font-sans text-xs text-gray-400">{e.date}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
