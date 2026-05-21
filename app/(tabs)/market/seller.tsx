import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { MARKET_CATEGORIES } from '@/constants/zimbabwe-data';
import { useAuthStore, type AuthState } from '@/stores/authStore';

export default function SellerDashboardScreen() {
  const { showToast } = useToast();
  const user = useAuthStore((s: AuthState) => s.user);
  const [tab, setTab] = useState<'listings' | 'add' | 'sales'>('listings');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<(typeof MARKET_CATEGORIES)[number]>(MARKET_CATEGORIES[0]);

  const mockListings = [
    { id: '1', name: 'Fresh Tomatoes 10kg', price: 8, sold: 24 },
    { id: '2', name: 'Organic Honey 1kg', price: 11, sold: 12 },
  ];

  const onAddProduct = () => {
    if (!name || !price) {
      showToast('Fill product name and price', 'warning');
      return;
    }
    showToast('Product submitted for review (mock)', 'success');
    setName('');
    setPrice('');
    setTab('listings');
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row border-b border-gray-100 bg-white">
        {(['listings', 'add', 'sales'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className={`flex-1 py-3 ${tab === t ? 'border-b-2 border-primary' : ''}`}>
            <Text className={`text-center font-sans-semibold capitalize ${tab === t ? 'text-primary' : 'text-gray-500'}`}>
              {t === 'add' ? 'Add Product' : t}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 'listings' ? (
          <>
            <View className="mb-4 rounded-xl bg-primary/10 p-4">
              <Text className="font-sans text-sm text-gray-600">Earnings this month</Text>
              <Text className="font-sans-bold text-2xl text-primary">$248 USD</Text>
              <Text className="font-sans text-sm text-gray-500">ZWG 24,800</Text>
            </View>
            {mockListings.map((item) => (
              <View key={item.id} className="mb-3 rounded-xl bg-white p-4">
                <Text className="font-sans-semibold text-dark">{item.name}</Text>
                <Text className="font-sans text-primary">${item.price}</Text>
                <Text className="font-sans text-xs text-gray-500">{item.sold} sold</Text>
              </View>
            ))}
          </>
        ) : null}

        {tab === 'add' ? (
          <View>
            <Text className="mb-2 font-sans text-sm text-gray-600">Seller: {user?.name}</Text>
            <Field label="Product name" value={name} onChange={setName} />
            <Field label="Price USD" value={price} onChange={setPrice} keyboardType="decimal-pad" />
            <Text className="mb-2 font-sans text-sm text-gray-600">Category</Text>
            <ScrollView horizontal className="mb-4">
              {MARKET_CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  className={`mr-2 rounded-full px-3 py-2 ${category === c ? 'bg-primary' : 'bg-white'}`}>
                  <Text className={`font-sans text-xs ${category === c ? 'text-white' : 'text-gray-600'}`}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <PrimaryButton title="List Product" onPress={onAddProduct} />
          </View>
        ) : null}

        {tab === 'sales' ? (
          <View>
            <Text className="font-sans-bold text-dark">Sales history</Text>
            {[
              { id: 's1', buyer: 'Grace M.', amount: 24, date: '2026-05-15' },
              { id: 's2', buyer: 'Tendai K.', amount: 11, date: '2026-05-14' },
            ].map((s) => (
              <View key={s.id} className="mt-2 rounded-xl bg-white p-3 flex-row justify-between">
                <View>
                  <Text className="font-sans-semibold text-dark">{s.buyer}</Text>
                  <Text className="font-sans text-xs text-gray-500">{s.date}</Text>
                </View>
                <Text className="font-sans-bold text-primary">${s.amount}</Text>
              </View>
            ))}
            <Pressable className="mt-4 rounded-xl bg-primary py-3">
              <Text className="text-center font-sans-semibold text-white">
                Withdraw to EcoCash
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 font-sans text-sm text-gray-600">{label}</Text>
      <TextInput
        className="rounded-xl border border-gray-200 bg-white px-4 py-3 font-sans"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
      />
    </View>
  );
}
