import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/ui/toast-provider';
import Colors from '@/constants/colors';
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
          const msg = n > 0 ? `Back online — synced ${n} offline action(s)` : 'Back online';
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
      <View style={[s.banner, s.online, { paddingTop: insets.top }]}>
        <Text style={s.text}>Connected</Text>
      </View>
    );
  }
  if (!offline) return null;
  return (
    <View style={[s.banner, s.offline, { paddingTop: insets.top }]}>
      <Text style={s.text}>{"You're offline — showing cached data"}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: { zIndex: 50, paddingHorizontal: 16, paddingBottom: 8 },
  online: { backgroundColor: Colors.primary },
  offline: { backgroundColor: Colors.warning },
  text: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: Colors.white },
});
