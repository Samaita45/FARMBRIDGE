import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DS } from '@/constants/design-system';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const BG: Record<ToastType, string> = {
  success: DS.colors.accent,        // green
  error:   DS.semantic.danger.solid,         // red
  warning: DS.semantic.warning.solid,       // amber
  info:    DS.colors.primary,       // blue
};

const ICON: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'information-circle',
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  // Slide in
  Animated.parallel([
    Animated.spring(opacity, { toValue: 1, useNativeDriver: true, speed: 20 }),
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20 }),
  ]).start();

  return (
    <Animated.View style={[t.item, { opacity, transform: [{ translateY }] }]}>
      <Pressable
        onPress={onDismiss}
        style={[t.pill, { backgroundColor: BG[toast.type] }]}>
        <Ionicons name={ICON[toast.type]} size={18} color={DS.colors.textInverse} />
        <Text style={t.msg} numberOfLines={3}>{toast.message}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ── Toast container — absolute, always on top ── */}
      <View
        pointerEvents="box-none"
        style={[t.container, { top: insets.top + 12 }]}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const t = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
  },
  item: {
    marginBottom: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    shadowColor: DS.colors.text,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  icon: {
    fontSize: 16,
    color: DS.colors.surface,
    fontWeight: '700',
  },
  msg: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.surface,
    lineHeight: 20,
  },
});
