import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { useToast } from '@/components/ui/toast-provider';
import { getBookings, updateBookingStatus } from '@/services/transportDb';
import { useAuthStore } from '@/stores/authStore';
import type { TransportBooking, BookingStatus } from '@/types/transport';
import { VEHICLE_ICONS } from '@/types/transport';

type TripTab = 'active' | 'history';

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#22c55e',
  in_transit: '#3b82f6',
  delivered: '#64748b',
  cancelled: '#ef4444',
};

export default function TripsScreen() {
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<TripTab>('active');
  const [trips, setTrips] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getBookings(user?.id ?? 'guest');
    setTrips(data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = trips.filter((t) => ['pending', 'confirmed', 'in_transit'].includes(t.status));
  const history = trips.filter((t) => ['delivered', 'cancelled'].includes(t.status));
  const shown = tab === 'active' ? active : history;

  const advanceStatus = async (trip: TransportBooking) => {
    const next: Record<string, BookingStatus> = {
      pending: 'confirmed',
      confirmed: 'in_transit',
      in_transit: 'delivered',
    };
    const n = next[trip.status];
    if (!n) return;
    await updateBookingStatus(trip.id, n);
    showToast(`Trip updated to ${n.replace('_', ' ')}`, 'success');
    await load();
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row border-b border-gray-100 bg-white">
        {(['active', 'history'] as TripTab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className={`flex-1 py-3 ${tab === t ? 'border-b-2 border-primary' : ''}`}>
            <Text
              className={`text-center font-sans-semibold capitalize ${tab === t ? 'text-primary' : 'text-gray-500'}`}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        {shown.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-4xl">🚛</Text>
            <Text className="mt-2 font-sans text-gray-500">No {tab} trips</Text>
          </View>
        ) : (
          shown.map((trip) => (
            <View
              key={trip.id}
              className="mb-3 rounded-2xl bg-white p-4"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
              <View className="flex-row items-center justify-between">
                <Text className="font-sans-bold text-dark">#{trip.id}</Text>
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: `${STATUS_COLORS[trip.status]}22` }}>
                  <Text className="font-sans text-xs capitalize" style={{ color: STATUS_COLORS[trip.status] }}>
                    {trip.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text className="mt-2 font-sans text-sm text-dark">
                {VEHICLE_ICONS[trip.vehicleType]} {trip.providerName}
              </Text>
              <Text className="font-sans text-sm text-gray-600">
                {trip.pickup} → {trip.destination}
              </Text>
              <Text className="mt-1 font-sans text-xs text-gray-400">
                {trip.preferredDate} · ${trip.agreedPriceUSD} · {trip.paymentMethod}
              </Text>

              {tab === 'active' && trip.status !== 'delivered' ? (
                <Pressable
                  onPress={() => void advanceStatus(trip)}
                  className="mt-3 rounded-xl bg-primary/10 py-2">
                  <Text className="text-center font-sans-semibold text-sm text-primary">
                    Update status →
                  </Text>
                </Pressable>
              ) : null}

              {trip.status === 'delivered' ? (
                <Pressable className="mt-3 rounded-xl border border-gray-200 py-2">
                  <Text className="text-center font-sans text-sm text-gray-600">
                    ⭐ Rate & Review (coming soon)
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
