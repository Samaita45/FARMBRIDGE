import { Pressable, Text, View } from 'react-native';

interface DashboardWidgetProps {
  emoji: string;
  title: string;
  value: string;
  subtitle?: string;
  onPress?: () => void;
  accent?: string;
}

export function DashboardWidget({
  emoji,
  title,
  value,
  subtitle,
  onPress,
  accent,
}: DashboardWidgetProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="mr-3 h-28 w-36 rounded-2xl bg-white p-3 active:opacity-90"
      style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${title}, ${value}`}>
      <Text className="text-xl">{emoji}</Text>
      <Text className="mt-1 font-sans text-[10px] text-gray-400" numberOfLines={1}>
        {title}
      </Text>
      <Text
        className="font-sans-bold text-base text-dark"
        style={accent ? { color: accent } : undefined}
        numberOfLines={2}>
        {value}
      </Text>
      {subtitle ? (
        <Text className="font-sans text-[10px] text-gray-500" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}
