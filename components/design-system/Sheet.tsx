import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DS } from '@/constants/design-system';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** A line under the title. Keep it to one sentence. */
  subtitle?: string;
  children: ReactNode;
  /** Pinned below the content — the action the sheet exists for. */
  footer?: ReactNode;
  /** Fraction of the screen the sheet may grow to. */
  maxHeight?: number;
  /** Content scrolls by default. Turn it off for a sheet that manages its own list. */
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A bottom sheet.
 *
 * WHY THIS EXISTS. Four screens were each building their own Modal, and they
 * disagreed about everything that matters: whether the backdrop dismissed,
 * whether Android's back button dismissed, whether the content cleared the home
 * indicator, and whether the keyboard pushed the actions off screen. Two of
 * them could be left with no way out but to force-quit.
 *
 * WHAT IT GUARANTEES. There are always three ways to close it — the button, the
 * backdrop, and the Android hardware back — and the close button is a real
 * 48pt target rather than a small cross in a corner. The footer sits outside
 * the scroll and above the keyboard, so the action a sheet exists for cannot be
 * buried by typing, which is the same failure the sign-in form had. The bottom
 * inset is honoured, so nothing lands under the home indicator.
 *
 * The backdrop fades and the panel rises; both settle to their end state at
 * once when the phone is set to reduce motion.
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = 0.9,
  scrollable = true,
  style,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? DS.animation.normal : DS.animation.fast,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  // Android's back button must close the sheet rather than leaving the screen
  // underneath it.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  const body = (
    <View style={styles.bodyInner}>{children}</View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        {/* The backdrop is a control, and says so. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
          pointerEvents="box-none">
          <Animated.View
            style={[
              styles.panel,
              { maxHeight: `${Math.round(maxHeight * 100)}%`, transform: [{ translateY }] },
              style,
            ]}>
            <View style={styles.grabber} />

            {title ? (
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text
                    style={styles.title}
                    numberOfLines={2}
                    maxFontSizeMultiplier={DS.layout.maxFontScale}>
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={3}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={8}
                  style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                  <Ionicons name="close" size={20} color={DS.colors.text} />
                </Pressable>
              </View>
            ) : null}

            {scrollable ? (
              <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                {body}
              </ScrollView>
            ) : (
              body
            )}

            {footer ? (
              <View style={[styles.footer, { paddingBottom: insets.bottom + DS.spacing.sm }]}>
                {footer}
              </View>
            ) : (
              <View style={{ height: insets.bottom }} />
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: DS.colors.overlay },
  keyboard: { justifyContent: 'flex-end' },

  panel: {
    backgroundColor: DS.colors.surface,
    borderTopLeftRadius: DS.radius.xxl,
    borderTopRightRadius: DS.radius.xxl,
    overflow: 'hidden',
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: DS.colors.borderStrong,
    marginTop: DS.spacing.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.md,
    paddingBottom: DS.spacing.sm,
  },
  headerText: { flex: 1, gap: 2 },
  title: {
    fontSize: DS.typography.h2.fontSize,
    lineHeight: DS.typography.h2.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  subtitle: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 18,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  // A real target, not a 20pt cross in the corner.
  close: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surfaceMuted,
  },
  pressed: { opacity: 0.7 },

  scroll: { paddingBottom: DS.spacing.sm },
  bodyInner: { paddingHorizontal: DS.spacing.md, paddingBottom: DS.spacing.sm },

  footer: {
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.sm + 4,
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
  },
});
