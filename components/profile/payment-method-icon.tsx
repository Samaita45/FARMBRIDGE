import { Text, View } from 'react-native';

const ICONS: Record<string, { label: string; bg: string; text: string }> = {
  ecocash: { label: 'EC', bg: '#e30613', text: '#fff' },
  onemoney: { label: 'OM', bg: '#ff6600', text: '#fff' },
  innbucks: { label: 'IB', bg: '#00529b', text: '#fff' },
  zipit: { label: 'ZIP', bg: '#1a237e', text: '#fff' },
  zwg: { label: 'ZiG', bg: '#d4af37', text: '#1a1a1a' },
  dollar: { label: '$', bg: '#2e7d32', text: '#fff' },
};

interface PaymentMethodIconProps {
  icon: string;
  size?: number;
}

export function PaymentMethodIcon({ icon, size = 40 }: PaymentMethodIconProps) {
  const config = ICONS[icon] ?? { label: '?', bg: '#9ca3af', text: '#fff' };
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
