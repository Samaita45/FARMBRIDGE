/**
 * Standalone Toast component + useToast hook.
 * Wraps the existing ToastProvider API so both can coexist.
 * Usage: wrap your root with <ToastRoot />, call showToast() anywhere.
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import Typography from '@/constants/Typography';

// ─── Types ────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ─── Config ───────────────────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: { bg: '#f0fdf4', border: Colors.success,  icon: '✓', iconColor: Colors.success  },
  error:   { bg: '#fef2f2', border: Colors.error,    icon: '✕', iconColor: Colors.error    },
  warning: { bg: '#fffbeb', border: Colors.warning,  icon: '⚠', iconColor: Colors.warning  },
  info:    { bg: '#eff6ff', border: '#3b82f6',       icon: 'i', iconColor: '#3b82f6'       },
};

// ─── Context ──────────────────────────────────────────────────
const ToastCtx = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────
export function ToastRoot({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, 3000);
  }, []);

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <View
        pointerEvents="box-none"
        style={[styles.container, { top: insets.top + 8 }]}>
        {toasts.map((toast) => {
          const cfg = TOAST_CONFIG[toast.type];
          return (
            <Animated.View
              key={toast.id}
              entering={FadeInDown.springify().damping(14)}
              exiting={FadeOutUp.duration(200)}
              style={styles.toastWrap}>
              <Pressable
                onPress={() => dismiss(toast.id)}
                style={[
                  styles.toast,
                  { backgroundColor: cfg.bg, borderLeftColor: cfg.border },
                ]}>
                <View style={[styles.iconWrapper, { backgroundColor: cfg.border + '22' }]}>
                  <Text style={[styles.icon, { color: cfg.iconColor }]}>{cfg.icon}</Text>
                </View>
                <Text style={styles.message} numberOfLines={3}>
                  {toast.message}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </ToastCtx.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useToastNew() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToastNew must be used inside <ToastRoot>');
  return ctx;
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastWrap: {
    marginBottom: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  icon: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  message: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
});
