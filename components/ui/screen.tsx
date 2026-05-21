import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { DS } from '@/constants/design-system';
import { SCREEN_EDGES } from '@/lib/platform-ui';

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
  if (scroll) {
    return (
      <SafeAreaView style={[s.root, style]} edges={edges}>
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
      <View style={[s.inner, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  inner: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
});
