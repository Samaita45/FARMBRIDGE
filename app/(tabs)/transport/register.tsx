import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { PROVINCES } from '@/constants/zimbabwe-data';
import { getTransporterByUser, insertTransporterProfile } from '@/services/transportDb';
import { useAuthStore } from '@/stores/authStore';
import type { TransporterProfile, VehicleType } from '@/types/transport';
import { VEHICLE_ICONS } from '@/types/transport';

const VEHICLE_TYPES: VehicleType[] = ['bakkie', 'truck', 'lorry', 'tractor'];

export default function RegisterTransporterScreen() {
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [existing, setExisting] = useState<TransporterProfile | null>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [nationalId, setNationalId] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('bakkie');
  const [regNumber, setRegNumber] = useState('');
  const [capacity, setCapacity] = useState('1.5');
  const [pricePerKm, setPricePerKm] = useState('0.45');
  const [coverage, setCoverage] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const profile = await getTransporterByUser(user?.id ?? 'guest');
      setExisting(profile);
    })();
  }, [user?.id]);

  const toggleCoverage = (area: string) => {
    setCoverage((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const onSubmit = async () => {
    if (!name.trim() || !phone.trim() || !nationalId.trim() || !regNumber.trim()) {
      showToast('Please fill all required fields', 'warning');
      return;
    }
    if (coverage.length === 0) {
      showToast('Select at least one coverage area', 'warning');
      return;
    }
    setLoading(true);
    try {
      const profile: TransporterProfile = {
        id: existing?.id ?? `tp_${Date.now()}`,
        userId: user?.id ?? 'guest',
        name: name.trim(),
        phone: phone.trim(),
        nationalId: nationalId.trim(),
        vehicleType,
        regNumber: regNumber.trim(),
        capacity: parseFloat(capacity) || 1,
        pricePerKm: parseFloat(pricePerKm) || 0.4,
        coverageAreas: coverage,
        verified: false,
        createdAt: new Date().toISOString(),
      };
      await insertTransporterProfile(profile);
      showToast('Registration submitted! Status: Unverified', 'success');
      router.back();
    } catch {
      showToast('Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface px-4" contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}>
      {existing ? (
        <View className="mb-4 rounded-xl bg-amber-50 p-3">
          <Text className="font-sans-semibold text-dark">Existing profile</Text>
          <Text className="font-sans text-sm text-gray-600">
            {existing.verified ? '✓ Verified' : '⏳ Unverified'} — update below
          </Text>
        </View>
      ) : (
        <View className="mb-4 rounded-xl bg-primary/10 p-3">
          <Text className="font-sans text-sm text-gray-600">
            Register your vehicle to receive transport requests from farmers.
          </Text>
        </View>
      )}

      <FormField label="Full name" value={name} onChangeText={setName} />
      <FormField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <FormField label="National ID" value={nationalId} onChangeText={setNationalId} />

      <Text className="mb-2 font-sans text-sm text-gray-600">Vehicle type</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {VEHICLE_TYPES.map((vt) => (
          <Pressable
            key={vt}
            onPress={() => setVehicleType(vt)}
            className={`rounded-xl px-3 py-2 ${vehicleType === vt ? 'bg-primary' : 'bg-white'}`}>
            <Text className={vehicleType === vt ? 'text-white' : 'text-dark'}>
              {VEHICLE_ICONS[vt]} {vt}
            </Text>
          </Pressable>
        ))}
      </View>

      <FormField label="Registration number" value={regNumber} onChangeText={setRegNumber} />
      <FormField label="Capacity (tons)" value={capacity} onChangeText={setCapacity} keyboardType="decimal-pad" />
      <FormField label="Rate per km (USD)" value={pricePerKm} onChangeText={setPricePerKm} keyboardType="decimal-pad" />

      <Text className="mb-2 font-sans text-sm text-gray-600">Coverage areas</Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {PROVINCES.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => toggleCoverage(p.name)}
            className={`rounded-full px-3 py-1.5 ${coverage.includes(p.name) ? 'bg-secondary' : 'bg-white border border-gray-200'}`}>
            <Text className={`font-sans text-xs ${coverage.includes(p.name) ? 'text-white' : 'text-gray-600'}`}>
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <PrimaryButton
        title={existing ? 'Update Profile' : 'Register as Transporter'}
        loading={loading}
        onPress={onSubmit}
      />
    </ScrollView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'decimal-pad';
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 font-sans text-sm text-gray-600">{label}</Text>
      <TextInput
        className="rounded-xl border border-gray-200 bg-white px-4 py-3 font-sans text-dark"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}
