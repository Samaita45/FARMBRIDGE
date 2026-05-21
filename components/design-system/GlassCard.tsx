import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { DS } from '@/constants/design-system';

interface GlassCardProps extends ViewProps {
  elevated?: boolean;
  blur?: boolean;
  padding?: number;
}

export function GlassCard({
  elevated,
  blur = false,
  padding = DS.spacing.md,
  style,
  children,
  ...props
}: GlassCardProps) {
  const cardStyle = [
    styles.card,
    elevated && DS.shadow.elevated,
    !elevated && DS.shadow.soft,
    { padding },
    style,
  ];

  if (blur && Platform.OS === 'ios') {
    return (
      <View style={[styles.wrap, elevated && DS.shadow.elevated, style]} {...props}>
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[styles.cardInner, { padding }]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DS.colors.surfaceGlassBorder,
  },
  card: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  cardInner: {
    backgroundColor: DS.colors.surfaceGlass,
  },
});
