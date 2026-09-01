import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '@/components/design-system/Button';
import { DS } from '@/constants/design-system';

/**
 * The four states every feature owes the user.
 *
 * The brief's rule: no control may look functional and do nothing. These exist
 * so a screen has somewhere to put "still working", "nothing here yet",
 * "that failed, try again" and "you're offline" without inventing a layout.
 */

interface BaseStateProps {
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
}

function StateShell({
  icon,
  iconColor,
  iconBackground,
  title,
  description,
  children,
  style,
  busy,
}: BaseStateProps & {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  children?: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="summary"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      accessibilityState={{ busy }}>
      <View style={[styles.iconWrap, iconBackground ? { backgroundColor: iconBackground } : null]}>
        {busy ? (
          <ActivityIndicator color={iconColor ?? DS.colors.primary} />
        ) : icon ? (
          <Ionicons name={icon} size={26} color={iconColor ?? DS.colors.primary} />
        ) : null}
      </View>

      <Text style={styles.title} maxFontSizeMultiplier={DS.layout.maxFontScale}>
        {title}
      </Text>

      {description ? (
        <Text style={styles.description} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {description}
        </Text>
      ) : null}

      {children ? <View style={styles.action}>{children}</View> : null}
    </View>
  );
}

export function LoadingState({
  title = 'Loading',
  description,
  style,
}: Partial<BaseStateProps>) {
  return (
    <StateShell
      busy
      title={title}
      description={description}
      iconBackground={DS.colors.primaryBg}
      style={style}
    />
  );
}

export interface ErrorStateProps extends BaseStateProps {
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this. Check your connection and try again.',
  onRetry,
  retryLabel = 'Try again',
  style,
}: Partial<ErrorStateProps>) {
  return (
    <StateShell
      icon="alert-circle-outline"
      iconColor={DS.semantic.danger.solid}
      iconBackground={DS.semantic.danger.bg}
      title={title}
      description={description}
      style={style}>
      {onRetry ? (
        <Button title={retryLabel} variant="outline" size="sm" icon="refresh" onPress={onRetry} />
      ) : null}
    </StateShell>
  );
}

export interface OfflineStateProps extends BaseStateProps {
  onRetry?: () => void;
}

export function OfflineState({
  title = 'You’re offline',
  description = 'Your changes are saved on this device and will sync once you reconnect.',
  onRetry,
  style,
}: Partial<OfflineStateProps>) {
  return (
    <StateShell
      icon="cloud-offline-outline"
      iconColor={DS.semantic.warning.fg}
      iconBackground={DS.semantic.warning.bg}
      title={title}
      description={description}
      style={style}>
      {onRetry ? (
        <Button title="Retry" variant="outline" size="sm" icon="refresh" onPress={onRetry} />
      ) : null}
    </StateShell>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: DS.spacing.xl,
    paddingHorizontal: DS.spacing.lg,
    gap: DS.spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: DS.radius.xl,
    backgroundColor: DS.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DS.spacing.xs,
  },
  title: {
    fontSize: DS.typography.h3.fontSize,
    lineHeight: DS.typography.h3.lineHeight,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: DS.typography.bodySm.lineHeight,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  action: {
    marginTop: DS.spacing.sm,
  },
});
