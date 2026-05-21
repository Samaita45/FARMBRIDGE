import { MotiView } from 'moti';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/design-system/AppText';
import { DS } from '@/constants/design-system';

interface ScanOverlayProps {
  active: boolean;
  label?: string;
}

export function ScanOverlay({ active, label = 'Analyzing crop…' }: ScanOverlayProps) {
  if (!active) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.frame}>
        <MotiView
          from={{ translateY: -80 }}
          animate={{ translateY: 80 }}
          transition={{ type: 'timing', duration: 1.8, loop: true }}
          style={styles.scanLine}
        />
      </View>
      <AppText variant="bodySm" color={DS.colors.textInverse} style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '88%',
    aspectRatio: 1,
    borderRadius: DS.radius.lg,
    borderWidth: 2,
    borderColor: DS.colors.accent,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: DS.colors.accent,
    shadowColor: DS.colors.accent,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  label: { marginTop: DS.spacing.md, fontWeight: '600' },
});
