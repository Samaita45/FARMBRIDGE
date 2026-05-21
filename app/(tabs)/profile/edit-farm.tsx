import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { useLocation } from '@/hooks/useLocation';
import { getCropPlans } from '@/services/database';
import { getFarmProfile, saveFarmProfile } from '@/services/profileService';
import { useAuthStore } from '@/stores/authStore';
import type { FarmProfile, FarmType } from '@/types/profile';

const FARM_TYPES: FarmType[] = ['smallholder', 'commercial', 'subsistence'];

export default function EditFarmScreen() {
  const user = useAuthStore((s) => s.user);
  const { location } = useLocation();
  const { showToast } = useToast();
  const [farm, setFarm] = useState<FarmProfile>({
    farmName: '',
    farmSizeHa: 0,
    farmType: 'smallholder',
  });
  const [activeCrops, setActiveCrops] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [profile, plans] = await Promise.all([
      getFarmProfile(user.id),
      getCropPlans(user.id, 'active'),
    ]);
    setFarm(profile);
    setActiveCrops(plans.map((p) => p.cropName));
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await saveFarmProfile(user.id, farm);
      showToast('Farm profile saved', 'success');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const useGps = () => {
    setFarm((f) => ({
      ...f,
      coordinates: { lat: location.latitude, lng: location.longitude },
    }));
    showToast('Location captured', 'success');
  };

  return (
    <ScrollView className="flex-1 bg-surface p-4" keyboardShouldPersistTaps="handled">
      <Text className="font-sans-semibold text-dark">Farm name</Text>
      <TextInput
        className="mt-2 rounded-xl bg-white px-4 py-3 font-sans"
        placeholder="e.g. Moyo Family Farm"
        value={farm.farmName}
        onChangeText={(farmName) => setFarm((f) => ({ ...f, farmName }))}
      />

      <Text className="mt-4 font-sans-semibold text-dark">Size (hectares)</Text>
      <TextInput
        className="mt-2 rounded-xl bg-white px-4 py-3 font-sans"
        placeholder="2.5"
        keyboardType="decimal-pad"
        value={farm.farmSizeHa ? String(farm.farmSizeHa) : ''}
        onChangeText={(v) => setFarm((f) => ({ ...f, farmSizeHa: parseFloat(v) || 0 }))}
      />

      <Text className="mt-4 font-sans-semibold text-dark">Farm type</Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {FARM_TYPES.map((type) => (
          <Pressable
            key={type}
            onPress={() => setFarm((f) => ({ ...f, farmType: type }))}
            className={`rounded-full px-4 py-2 ${farm.farmType === type ? 'bg-primary' : 'bg-white'}`}>
            <Text className={`font-sans text-sm capitalize ${farm.farmType === type ? 'text-white' : 'text-gray-600'}`}>
              {type}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="mt-4 font-sans-semibold text-dark">GPS coordinates</Text>
      <Pressable onPress={useGps} className="mt-2 rounded-xl bg-primary/10 px-4 py-3">
        <Text className="font-sans text-primary">Use current location ({location.label})</Text>
      </Pressable>
      {farm.coordinates ? (
        <Text className="mt-2 font-sans text-xs text-gray-500">
          {farm.coordinates.lat.toFixed(5)}, {farm.coordinates.lng.toFixed(5)}
        </Text>
      ) : null}

      {activeCrops.length > 0 ? (
        <View className="mt-4 rounded-xl bg-white p-4">
          <Text className="font-sans-semibold text-dark">Active crops (from planner)</Text>
          {activeCrops.map((c) => (
            <Text key={c} className="mt-1 font-sans text-gray-600">
              · {c}
            </Text>
          ))}
        </View>
      ) : null}

      <View className="mt-6">
        <PrimaryButton title="Save Farm Profile" loading={loading} onPress={save} />
      </View>
    </ScrollView>
  );
}
