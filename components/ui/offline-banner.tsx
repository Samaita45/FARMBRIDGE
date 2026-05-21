import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/ui/toast-provider';
import { flushSyncQueue } from '@/services/syncService';

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [offline, setOffline] = useState(false);
  const [flashOnline, setFlashOnline] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    let mounted = true;
    void NetInfo.fetch().then((s) => {
      if (!mounted) return;
      const ok = s.isConnected === true && s.isInternetReachable !== false;
      setOffline(!ok);
      wasOffline.current = !ok;
    });
    const sub = NetInfo.addEventListener((s) => {
      const ok = s.isConnected === true && s.isInternetReachable !== false;
      if (!ok) {
        setOffline(true);
        wasOffline.current = true;
        setFlashOnline(false);
        return;
      }
      setOffline(false);
      if (wasOffline.current) {
        wasOffline.current = false;
        void (async () => {
          const n = await flushSyncQueue();
          const msg =
            n > 0 ? `Back online — synced ${n} offline action(s)` : 'Back online';
          showToast(msg, 'success');
          setFlashOnline(true);
          setTimeout(() => setFlashOnline(false), 2200);
        })();
      }
    });
    return () => {
      mounted = false;
      sub();
    };
  }, [showToast]);

  if (flashOnline) {
    return (
      <View style={{ paddingTop: insets.top }} className="z-50 bg-primary px-4 py-2">
        <Text className="text-center font-sans-semibold text-white">Connected</Text>
      </View>
    );
  }
  if (!offline) return null;
  return (
    <View style={{ paddingTop: insets.top }} className="z-50 bg-amber-500 px-4 py-2">
      <Text className="text-center font-sans-semibold text-white">
        {"You're offline — showing cached data"}
      </Text>
    </View>
  );
}
