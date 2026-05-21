import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/design-system/AppText';
import { Button } from '@/components/ui/Button';
import { DS } from '@/constants/design-system';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'leaf-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={32} color={DS.colors.primary} />
      </View>
      <AppText variant="h2" style={styles.title}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="bodySm" muted style={styles.desc}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: DS.spacing.xxl, paddingHorizontal: DS.spacing.lg },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DS.spacing.md,
  },
  title: { textAlign: 'center', marginBottom: DS.spacing.sm },
  desc: { textAlign: 'center', maxWidth: 280 },
  btn: { marginTop: DS.spacing.lg, maxWidth: 240 },
});
