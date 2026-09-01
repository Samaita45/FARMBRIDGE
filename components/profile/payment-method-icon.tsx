import { Text, View } from 'react-native';
import { DS } from '@/constants/design-system';

/**
 * BRAND COLOURS — deliberately not design tokens.
 *
 * These are the payment providers' own marks. EcoCash red and OneMoney orange
 * belong to those companies; recolouring them to fit our palette would make
 * them harder to recognise at the exact moment recognition matters, which is
 * someone choosing how to pay. Contrast is handled by pairing each with an
 * explicit foreground rather than assuming white works.
 *
 * Everything else in the app uses DS tokens. This is the one exemption.
 */
const ICONS: Record<string, { label: string; bg: string; text: string }> = {
  ecocash: { label: 'EC', bg: '#e30613', text: DS.colors.surface },
  onemoney: { label: 'OM', bg: '#ff6600', text: DS.colors.surface },
  innbucks: { label: 'IB', bg: '#00529b', text: DS.colors.surface },
  zipit: { label: 'ZIP', bg: '#1a237e', text: DS.colors.surface },
  zwg: { label: 'ZiG', bg: '#d4af37', text: '#1a1a1a' },
  dollar: { label: '$', bg: '#2e7d32', text: DS.colors.surface },
};

interface PaymentMethodIconProps {
  icon: string;
  size?: number;
}

export function PaymentMethodIcon({ icon, size = 40 }: PaymentMethodIconProps) {
  const config = ICONS[icon] ?? { label: '?', bg: '#9ca3af', text: DS.colors.surface };
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: config.bg }}>
      <Text className="font-sans-bold" style={{ color: config.text, fontSize: size * 0.28 }}>
        {config.label}
      </Text>
    </View>
  );
}
