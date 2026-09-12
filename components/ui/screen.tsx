import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { DS } from '@/constants/design-system';
import { extraTopPad, SCREEN_EDGES } from '@/lib/platform-ui';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle' | 'style'>;
}

/**
 * Cross-platform screen shell: same background, safe areas, and padding on iOS and Android.
 */
export function Screen({
  children,
  scroll,
  edges = SCREEN_EDGES,
  style,
  contentContainerStyle,
  scrollProps,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const topGap = edges.includes('top') ? extraTopPad(insets.top) : 0;

  if (scroll) {
    return (
      <SafeAreaView style={[s.root, style]} edges={edges}>
        {topGap > 0 ? <View style={{ height: topGap }} /> : null}
        <ScrollView
          contentContainerStyle={[s.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.root, style]} edges={edges}>
      {topGap > 0 ? <View style={{ height: topGap }} /> : null}
      <View style={[s.inner, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  inner: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
});
