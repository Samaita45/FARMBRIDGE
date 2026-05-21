import { View } from 'react-native';

export function AuthBlobHeader() {
  return (
    <View className="absolute left-0 right-0 top-0 h-[32%] overflow-hidden">
      <View className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-primary/35" />
      <View className="absolute -right-8 top-8 h-40 w-40 rounded-full bg-secondary/25" />
      <View className="absolute left-1/3 top-24 h-24 w-24 rounded-full bg-accent/40" />
      <View className="absolute bottom-0 left-0 right-0 h-16 bg-surface" style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }} />
    </View>
  );
}
