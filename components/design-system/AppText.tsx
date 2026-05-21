import { Text, type TextProps, type TextStyle } from 'react-native';

import { DS } from '@/constants/design-system';

type Variant = keyof typeof DS.typography;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  bold?: boolean;
}

export function AppText({
  variant = 'body',
  color,
  muted,
  bold,
  style,
  ...props
}: AppTextProps) {
  const base = DS.typography[variant];
  const textStyle: TextStyle = {
    fontSize: base.fontSize,
    lineHeight: base.lineHeight,
    fontFamily: base.fontFamily,
    color: color ?? (muted ? DS.colors.textMuted : DS.colors.text),
    fontWeight: bold ? '700' : undefined,
  };

  return <Text style={[textStyle, style]} {...props} />;
}
