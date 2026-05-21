import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useLocation } from '@/hooks/useLocation';
import { estimateDistanceKm } from '@/services/transportDb';
import { asHref } from '@/lib/href';
import { useTransportStore, type TransportState } from '@/stores/transportStore';
import {
  GOODS_CATEGORIES,
  SPECIAL_REQUIREMENTS,
  type GoodsCategory,
} from '@/types/transport';

export default function TransportRequestScreen() {
  const { location } = useLocation();
  const setRequest = useTransportStore((s: TransportState) => s.setRequest);

  const [pickup, setPickup] = useState(location.label);
  const [destination, setDestination] = useState('');
  const [goods, setGoods] = useState('');
  const [weight, setWeight] = useState('500');
  const [category, setCategory] = useState<GoodsCategory>('Fresh Produce');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('08:00');
  const [loads, setLoads] = useState('1');
  const [special, setSpecial] = useState<string[]>([]);

  const toggleSpecial = (req: string) => {
    setSpecial((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]
    );
  };

  const onContinue = () => {
    if (!destination.trim() || !goods.trim()) return;
    const weightKg = parseFloat(weight) || 500;
    const request = {
      pickup: pickup.trim(),
      destination: destination.trim(),
      goodsDescription: goods.trim(),
      weightKg,
      category,
      preferredDate: date,
      preferredTime: time,
      loads: parseInt(loads, 10) || 1,
      specialRequirements: special,
    };
    const distanceKm = estimateDistanceKm(request.pickup, request.destination);
    setRequest(request, distanceKm);
    router.push(asHref('/(tabs)/transport/providers'));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}>
        <Text className="font-sans text-sm text-gray-500">Step 1 of 3 — Trip details</Text>

        <Field label="Pickup location" value={pickup} onChangeText={setPickup} placeholder="Harare, Mbare Musika" />
        <Field label="Destination" value={destination} onChangeText={setDestination} placeholder="Bulawayo, Renkini" />
        <Field label="What are you transporting?" value={goods} onChangeText={setGoods} placeholder="Tomatoes, 20 crates" />

        <Text className="mb-2 font-sans text-sm text-gray-600">Goods category</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {GOODS_CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 ${category === c ? 'bg-primary' : 'bg-white'}`}>
              <Text className={`font-sans text-sm ${category === c ? 'text-white' : 'text-gray-600'}`}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

        <Field label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          </View>
          <View className="flex-1">
            <Field label="Time" value={time} onChangeText={setTime} placeholder="08:00" />
          </View>
        </View>
        <Field label="Number of loads" value={loads} onChangeText={setLoads} keyboardType="number-pad" />

        <Text className="mb-2 font-sans text-sm text-gray-600">Special requirements</Text>
        <View className="mb-6 flex-row flex-wrap gap-2">
          {SPECIAL_REQUIREMENTS.map((req) => (
            <Pressable
              key={req}
              onPress={() => toggleSpecial(req)}
              className={`rounded-full px-3 py-1.5 ${special.includes(req) ? 'bg-secondary' : 'bg-white border border-gray-200'}`}>
              <Text className={`font-sans text-sm ${special.includes(req) ? 'text-white' : 'text-gray-600'}`}>
                {req}
              </Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton title="Find Transporters" onPress={onContinue} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'number-pad';
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 font-sans text-sm text-gray-600">{label}</Text>
      <TextInput
        className="rounded-xl border border-gray-200 bg-white px-4 py-3 font-sans text-dark"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
      />
    </View>
  );
}
