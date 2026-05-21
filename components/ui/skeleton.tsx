import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps extends ViewProps {
  className?: string;
  height?: number;
  width?: number | string;
}

export function Skeleton({ className, height = 16, width = '100%', style, ...props }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ height, width } as object, animatedStyle, style]}
      className={`rounded-lg bg-gray-200 ${className ?? ''}`}
      accessibilityLabel="Loading"
      {...props}
    />
  );
}

export function WidgetSkeleton() {
  return (
    <View className="mr-3 h-28 w-36 rounded-2xl bg-white p-3">
      <Skeleton height={24} width={24} />
      <Skeleton height={12} className="mt-2" />
      <Skeleton height={10} width="60%" className="mt-2" />
    </View>
  );
}

export function CropCardSkeleton() {
  return (
    <View className="mr-3 h-40 w-36 rounded-2xl bg-white p-3">
      <Skeleton height={32} width={32} />
      <Skeleton height={14} className="mt-2" />
      <Skeleton height={12} width="70%" className="mt-2" />
      <Skeleton height={10} width="50%" className="mt-2" />
    </View>
  );
}
